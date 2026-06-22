// Armazenamento offline das partidas do Jogo da Cesta.
// Cada partida é identificada por um playId único (UUID gerado no início).
// Finalizar a partida faz UPSERT no mesmo playId — nunca cria duplicata.

const DB_NAME = "robustus.cesta.matches.v1";
const DB_VERSION = 1;
const STORE = "matches";

export type ParticipantType = "lojista" | "veterinario" | "outros";
export type PetChoice = "cachorro" | "gato" | "";

export interface CestaMatch {
  id: string; // = playId
  name: string;
  phone: string; // normalizado: apenas dígitos
  participantType: ParticipantType | "";
  participantTypeOther: string;
  pet: PetChoice;
  score: number;
  playedAt: string; // ISO
  durationSeconds: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("playedAt", "playedAt");
        store.createIndex("phone", "phone");
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

export async function getMatch(id: string): Promise<CestaMatch | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, "readonly");
    const req = t.objectStore(STORE).get(id);
    req.onsuccess = () => resolve(req.result as CestaMatch | undefined);
    req.onerror = () => reject(req.error);
  });
}

/** Upsert por playId. Se já existir, atualiza; nunca cria duplicata. */
export async function upsertMatch(
  input: Omit<CestaMatch, "id"> & { id: string }
): Promise<CestaMatch> {
  const rec: CestaMatch = { ...input, phone: normalizePhone(input.phone) };
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const t = db.transaction(STORE, "readwrite");
    t.objectStore(STORE).put(rec);
    t.oncomplete = () => resolve();
    t.onerror = () => reject(t.error);
  });
  return rec;
}

/** Compat: insere uma partida (gera id se ausente). Prefira upsertMatch. */
export async function addMatch(
  input: Omit<CestaMatch, "id"> & { id?: string }
): Promise<CestaMatch> {
  return upsertMatch({ ...input, id: input.id || uuid() });
}

export async function listMatches(): Promise<CestaMatch[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, "readonly");
    const req = t.objectStore(STORE).getAll();
    req.onsuccess = () => {
      const arr = (req.result as CestaMatch[]) || [];
      arr.sort((a, b) => (a.playedAt < b.playedAt ? 1 : -1));
      resolve(arr);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function importMatches(records: CestaMatch[]): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, "readwrite");
    const store = t.objectStore(STORE);
    let count = 0;
    for (const r of records) {
      if (!r || !r.id) continue;
      store.put({ ...r, phone: normalizePhone(r.phone) });
      count++;
    }
    t.oncomplete = () => resolve(count);
    t.onerror = () => reject(t.error);
  });
}

export async function deleteMatch(id: string): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const t = db.transaction(STORE, "readwrite");
    t.objectStore(STORE).delete(id);
    t.oncomplete = () => resolve();
    t.onerror = () => reject(t.error);
  });
}

/**
 * Remove duplicatas EXATAS (mesmo telefone, pet, score, perfil e playedAt
 * dentro de uma janela de 15s). Preserva tentativas realmente diferentes.
 * Retorna o número de registros removidos.
 */
export async function dedupeExactMatches(): Promise<number> {
  const all = await listMatches();
  const keepers = new Map<string, CestaMatch>();
  const toDelete: string[] = [];
  // ordena por playedAt asc para manter a primeira ocorrência
  const ordered = [...all].sort((a, b) => (a.playedAt < b.playedAt ? -1 : 1));
  for (const m of ordered) {
    const bucket = Math.floor(new Date(m.playedAt).getTime() / 15000);
    const key = [
      normalizePhone(m.phone),
      m.pet || "",
      m.participantType || "",
      Number(m.score) || 0,
      Number(m.durationSeconds) || 0,
      bucket,
    ].join("|");
    if (keepers.has(key)) {
      toDelete.push(m.id);
    } else {
      keepers.set(key, m);
    }
  }
  for (const id of toDelete) await deleteMatch(id);
  return toDelete.length;
}
