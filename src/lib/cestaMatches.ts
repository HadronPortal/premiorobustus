// Armazenamento offline das partidas do Jogo da Cesta.
// A store oficial é `plays`, com `playId` como keyPath.
// Cadastro cria o registro uma única vez; início/personagem/final apenas fazem put() no mesmo playId.

const DB_NAME = "robustus.cesta.matches.v1";
const DB_VERSION = 2;
const STORE = "plays";
const LEGACY_STORE = "matches";

export const CURRENT_PLAY_ID_KEY = "robustus_current_play_id";

export type ParticipantType = "lojista" | "veterinario" | "outros";
export type PetChoice = "cachorro" | "gato" | "";
export type PlayStatus = "registered" | "playing" | "finished";

export interface CestaMatch {
  playId: string;
  name: string;
  phone: string; // normalizado: apenas dígitos
  participantType: ParticipantType | "";
  participantTypeOther: string;
  pet: PetChoice;
  score: number;
  playedAt: string; // ISO
  durationSeconds: number;
  status: PlayStatus;
  prizeCode: string | null;
}

function createStore(db: IDBDatabase) {
  const store = db.createObjectStore(STORE, { keyPath: "playId" });
  store.createIndex("playedAt", "playedAt");
  store.createIndex("phone", "phone");
  return store;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      const tx = req.transaction;
      const plays = db.objectStoreNames.contains(STORE)
        ? tx!.objectStore(STORE)
        : createStore(db);

      if (db.objectStoreNames.contains(LEGACY_STORE)) {
        const legacy = tx!.objectStore(LEGACY_STORE);
        const cursorReq = legacy.openCursor();
        cursorReq.onsuccess = () => {
          const cursor = cursorReq.result;
          if (!cursor) return;
          const play = normalizePlay(cursor.value);
          if (play) plays.put(play);
          cursor.continue();
        };
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export function normalizePhone(phone: string): string {
  return (phone || "").replace(/\D/g, "");
}

export function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto)
    return (crypto as any).randomUUID();
  return "xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function createCurrentPlayId(): string {
  const playId = uuid();
  try {
    sessionStorage.setItem(CURRENT_PLAY_ID_KEY, playId);
  } catch {}
  return playId;
}

export function getCurrentPlayId(): string | null {
  try {
    return sessionStorage.getItem(CURRENT_PLAY_ID_KEY);
  } catch {
    return null;
  }
}

export function clearCurrentPlayId() {
  try {
    sessionStorage.removeItem(CURRENT_PLAY_ID_KEY);
  } catch {}
}

function normalizePet(value: unknown): PetChoice {
  if (value === "cat" || value === "gato") return "gato";
  if (value === "dog" || value === "cachorro") return "cachorro";
  return "";
}

function normalizePlay(raw: any): CestaMatch | null {
  if (!raw) return null;
  const playId = String(raw.playId || raw.id || "").trim();
  if (!playId) return null;
  const participantType = ["lojista", "veterinario", "outros"].includes(raw.participantType)
    ? raw.participantType
    : "";
  const status: PlayStatus = raw.status === "playing" || raw.status === "finished"
    ? raw.status
    : "registered";
  return {
    playId,
    name: String(raw.name || "").trim(),
    phone: normalizePhone(raw.phone || ""),
    participantType,
    participantTypeOther: String(raw.participantTypeOther || "").trim(),
    pet: normalizePet(raw.pet || raw.character),
    score: Number(raw.score) || 0,
    playedAt: raw.playedAt || new Date().toISOString(),
    durationSeconds: Number(raw.durationSeconds) || 0,
    status,
    prizeCode: raw.prizeCode || null,
  };
}

function mergePlay(existing: CestaMatch | undefined, patch: Partial<CestaMatch> & { playId: string }): CestaMatch {
  const normalizedPatch = normalizePlay({
    ...(existing || {}),
    ...patch,
    playId: patch.playId,
  })!;
  return {
    ...(existing || normalizedPatch),
    ...normalizedPatch,
    phone: normalizePhone(normalizedPatch.phone),
    playId: patch.playId,
  };
}

export async function getMatch(playId: string): Promise<CestaMatch | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, "readonly");
    const req = t.objectStore(STORE).get(playId);
    req.onsuccess = () => resolve(req.result as CestaMatch | undefined);
    req.onerror = () => reject(req.error);
  });
}

/** Upsert por playId. Usa put(); nunca add(). */
export async function upsertMatch(
  input: Partial<CestaMatch> & { playId: string }
): Promise<CestaMatch> {
  const db = await openDB();
  const existing = await getMatch(input.playId);
  const rec = mergePlay(existing, input);
  await new Promise<void>((resolve, reject) => {
    const t = db.transaction(STORE, "readwrite");
    t.objectStore(STORE).put(rec);
    t.oncomplete = () => resolve();
    t.onerror = () => reject(t.error);
  });
  return rec;
}

/** Compat: mantém a API antiga, mas grava por playId com put(). */
export async function addMatch(
  input: Partial<CestaMatch> & { playId?: string; id?: string }
): Promise<CestaMatch> {
  return upsertMatch({ ...input, playId: input.playId || input.id || uuid() });
}

export async function listMatches(): Promise<CestaMatch[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, "readonly");
    const req = t.objectStore(STORE).getAll();
    req.onsuccess = () => {
      const arr = ((req.result as CestaMatch[]) || []).map(normalizePlay).filter(Boolean) as CestaMatch[];
      arr.sort((a, b) => (a.playedAt < b.playedAt ? 1 : -1));
      resolve(arr);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function importMatches(records: any[]): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, "readwrite");
    const store = t.objectStore(STORE);
    let count = 0;
    for (const r of records) {
      const play = normalizePlay(r);
      if (!play) continue;
      store.put(play);
      count++;
    }
    t.oncomplete = () => resolve(count);
    t.onerror = () => reject(t.error);
  });
}

export async function deleteMatch(playId: string): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const t = db.transaction(STORE, "readwrite");
    t.objectStore(STORE).delete(playId);
    t.oncomplete = () => resolve();
    t.onerror = () => reject(t.error);
  });
}

function completeness(m: CestaMatch) {
  return [m.name, m.phone, m.participantType, m.pet, m.status === "finished", m.score > 0, m.durationSeconds > 0, m.prizeCode]
    .filter(Boolean).length;
}

/**
 * Remove duplicatas reais da store `plays`.
 * Registros com mesmo playId já são colapsados pelo keyPath; legados sem playId
 * são tratados como duplicata apenas quando nome, telefone, perfil, personagem,
 * pontuação e horário são exatamente iguais. Horários diferentes são preservados.
 */
export async function dedupeExactMatches(): Promise<number> {
  const all = await listMatches();
  const keepers = new Map<string, CestaMatch>();
  const toDelete: string[] = [];

  for (const m of all) {
    const key = [
      normalizePhone(m.phone),
      (m.name || "").trim().toUpperCase(),
      m.participantType || "",
      m.participantTypeOther || "",
      m.pet || "",
      Number(m.score) || 0,
      new Date(m.playedAt).getTime() || m.playedAt,
    ].join("|");
    const current = keepers.get(key);
    if (!current) {
      keepers.set(key, m);
      continue;
    }
    if (completeness(m) > completeness(current)) {
      toDelete.push(current.playId);
      keepers.set(key, m);
    } else {
      toDelete.push(m.playId);
    }
  }

  for (const playId of toDelete) await deleteMatch(playId);
  return toDelete.length;
}
