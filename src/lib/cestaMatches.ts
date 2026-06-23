// Armazenamento offline do Jogo da Cesta.
//
// Modelo (v3):
//   - Store `participants` (keyPath: phoneNormalized) — UMA pessoa por telefone.
//   - Store `plays`        (keyPath: playId)          — UMA linha por tentativa.
//
// Migração:
//   - v1/v2 tinha tudo na store `plays` (com nome/telefone/perfil duplicados).
//   - Ao subir para v3, agrupamos por telefone normalizado, criamos um
//     `participants` por telefone (mantendo o registro mais recente/completo)
//     e preservamos as partidas com playId. Partidas com mesmo playId são
//     naturalmente colapsadas pelo keyPath.

const DB_NAME = "robustus.cesta.matches.v1";
const DB_VERSION = 3;
const PLAYS = "plays";
const PARTICIPANTS = "participants";
const LEGACY_MATCHES = "matches"; // versões muito antigas

export const CURRENT_PLAY_ID_KEY = "robustus_current_play_id";

export type ParticipantType = "lojista" | "veterinario" | "outros" | "";
export type PetChoice = "cachorro" | "gato" | "";
export type PlayStatus = "registered" | "playing" | "finished";

export interface Participant {
  phoneNormalized: string; // chave única
  name: string;
  participantType: ParticipantType;
  participantTypeOther: string;
  createdAt: string;
  updatedAt: string;
}

export interface Play {
  playId: string;
  phoneNormalized: string;
  pet: PetChoice;
  score: number;
  playedAt: string;
  durationSeconds: number;
  status: PlayStatus;
  prizeCode: string | null;
  prize: string | null;
}

/** Tipo agregado para o relatório (uma linha por participante). */
export interface ParticipantReport {
  phoneNormalized: string;
  name: string;
  participantType: ParticipantType;
  participantTypeOther: string;
  attempts: number;
  lastPet: PetChoice;
  lastScore: number;
  lastPlayedAt: string;
  bestScore: number;
  lastPrize: string | null;
  lastPrizeCode: string | null;
}

// ----------------- utils -----------------
export function normalizePhone(phone: string): string {
  return (phone || "").replace(/\D/g, "");
}

export function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return (crypto as any).randomUUID();
  return "xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function createCurrentPlayId(): string {
  const playId = uuid();
  try { sessionStorage.setItem(CURRENT_PLAY_ID_KEY, playId); } catch {}
  return playId;
}
export function getCurrentPlayId(): string | null {
  try { return sessionStorage.getItem(CURRENT_PLAY_ID_KEY); } catch { return null; }
}
export function clearCurrentPlayId() {
  try { sessionStorage.removeItem(CURRENT_PLAY_ID_KEY); } catch {}
}

function normalizePet(value: unknown): PetChoice {
  if (value === "cat" || value === "gato") return "gato";
  if (value === "dog" || value === "cachorro") return "cachorro";
  return "";
}

function normalizeType(value: unknown): ParticipantType {
  return ["lojista", "veterinario", "outros"].includes(value as any) ? (value as ParticipantType) : "";
}

// ----------------- DB / migração -----------------
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      const tx = req.transaction!;

      // garante stores
      const playsStore = db.objectStoreNames.contains(PLAYS)
        ? tx.objectStore(PLAYS)
        : (() => {
            const s = db.createObjectStore(PLAYS, { keyPath: "playId" });
            s.createIndex("playedAt", "playedAt");
            s.createIndex("phoneNormalized", "phoneNormalized");
            return s;
          })();

      // índice phoneNormalized pode não existir em DBs v2 antigos
      if (!playsStore.indexNames.contains("phoneNormalized")) {
        try { playsStore.createIndex("phoneNormalized", "phoneNormalized"); } catch {}
      }

      const partsStore = db.objectStoreNames.contains(PARTICIPANTS)
        ? tx.objectStore(PARTICIPANTS)
        : db.createObjectStore(PARTICIPANTS, { keyPath: "phoneNormalized" });

      // 1) migra LEGACY_MATCHES -> PLAYS (se existir)
      if (db.objectStoreNames.contains(LEGACY_MATCHES)) {
        const legacy = tx.objectStore(LEGACY_MATCHES);
        const cur = legacy.openCursor();
        cur.onsuccess = () => {
          const c = cur.result;
          if (!c) return;
          const v: any = c.value;
          const phone = normalizePhone(v.phone || "");
          const playId = String(v.playId || v.id || uuid());
          if (phone) {
            playsStore.put({
              playId,
              phoneNormalized: phone,
              pet: normalizePet(v.pet || v.character),
              score: Number(v.score) || 0,
              playedAt: v.playedAt || new Date().toISOString(),
              durationSeconds: Number(v.durationSeconds) || 0,
              status: (v.status === "playing" || v.status === "finished") ? v.status : "registered",
              prizeCode: v.prizeCode || null,
            } as Play);
          }
          c.continue();
        };
      }

      // 2) varre PLAYS e (a) constrói participants, (b) reescreve plays no novo schema
      const allReq = playsStore.getAll();
      allReq.onsuccess = () => {
        const items: any[] = allReq.result || [];

        // agrupa por telefone p/ criar participantes
        const byPhone = new Map<string, any[]>();
        for (const v of items) {
          const phone = normalizePhone(v.phone || v.phoneNormalized || "");
          if (!phone) continue;
          const arr = byPhone.get(phone) || [];
          arr.push(v);
          byPhone.set(phone, arr);
        }

        for (const [phone, arr] of byPhone) {
          arr.sort((a, b) => String(b.playedAt || "").localeCompare(String(a.playedAt || "")));
          const newest = arr.find((x) => (x.name || "").trim()) || arr[0];
          const earliest = arr[arr.length - 1];
          const p: Participant = {
            phoneNormalized: phone,
            name: String(newest.name || "").trim(),
            participantType: normalizeType(newest.participantType),
            participantTypeOther: String(newest.participantTypeOther || "").trim(),
            createdAt: String(earliest.playedAt || new Date().toISOString()),
            updatedAt: String(newest.playedAt || new Date().toISOString()),
          };
          partsStore.put(p);
        }

        // reescreve cada play sem dados pessoais redundantes
        for (const v of items) {
          const phone = normalizePhone(v.phone || v.phoneNormalized || "");
          if (!phone || !v.playId) continue;
          const play: Play = {
            playId: String(v.playId),
            phoneNormalized: phone,
            pet: normalizePet(v.pet),
            score: Number(v.score) || 0,
            playedAt: String(v.playedAt || new Date().toISOString()),
            durationSeconds: Number(v.durationSeconds) || 0,
            status: (v.status === "playing" || v.status === "finished") ? v.status : "registered",
            prizeCode: v.prizeCode || null,
            prize: v.prize || null,
          };
          playsStore.put(play);
        }
      };
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// ----------------- participants -----------------
export async function upsertParticipant(input: {
  phone: string;
  name?: string;
  participantType?: ParticipantType;
  participantTypeOther?: string;
}): Promise<Participant> {
  const phoneNormalized = normalizePhone(input.phone);
  if (!phoneNormalized) throw new Error("phone vazio");
  const db = await openDB();
  const existing = await new Promise<Participant | undefined>((resolve, reject) => {
    const t = db.transaction(PARTICIPANTS, "readonly");
    const r = t.objectStore(PARTICIPANTS).get(phoneNormalized);
    r.onsuccess = () => resolve(r.result as Participant | undefined);
    r.onerror = () => reject(r.error);
  });
  const now = new Date().toISOString();
  const rec: Participant = {
    phoneNormalized,
    name: (input.name ?? existing?.name ?? "").trim(),
    participantType: normalizeType(input.participantType ?? existing?.participantType ?? ""),
    participantTypeOther: (input.participantTypeOther ?? existing?.participantTypeOther ?? "").trim(),
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };
  await new Promise<void>((resolve, reject) => {
    const t = db.transaction(PARTICIPANTS, "readwrite");
    t.objectStore(PARTICIPANTS).put(rec);
    t.oncomplete = () => resolve();
    t.onerror = () => reject(t.error);
  });
  return rec;
}

export async function listParticipants(): Promise<Participant[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction(PARTICIPANTS, "readonly");
    const r = t.objectStore(PARTICIPANTS).getAll();
    r.onsuccess = () => resolve((r.result as Participant[]) || []);
    r.onerror = () => reject(r.error);
  });
}

// ----------------- plays -----------------
export async function getPlay(playId: string): Promise<Play | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction(PLAYS, "readonly");
    const r = t.objectStore(PLAYS).get(playId);
    r.onsuccess = () => resolve(r.result as Play | undefined);
    r.onerror = () => reject(r.error);
  });
}

/** Upsert por playId. Aceita campos parciais e mescla com o existente. */
export async function upsertPlay(input: Partial<Play> & { playId: string; phone?: string }): Promise<Play> {
  const db = await openDB();
  const existing = await getPlay(input.playId);
  const phoneNormalized = normalizePhone(input.phone || (input as any).phoneNormalized || existing?.phoneNormalized || "");
  const merged: Play = {
    playId: input.playId,
    phoneNormalized,
    pet: normalizePet(input.pet ?? existing?.pet ?? ""),
    score: Number(input.score ?? existing?.score ?? 0) || 0,
    playedAt: input.playedAt || existing?.playedAt || new Date().toISOString(),
    durationSeconds: Number(input.durationSeconds ?? existing?.durationSeconds ?? 0) || 0,
    status: (input.status ?? existing?.status ?? "registered") as PlayStatus,
    prizeCode: input.prizeCode ?? existing?.prizeCode ?? null,
    prize: (input as any).prize ?? (existing as any)?.prize ?? null,
  };
  await new Promise<void>((resolve, reject) => {
    const t = db.transaction(PLAYS, "readwrite");
    t.objectStore(PLAYS).put(merged);
    t.oncomplete = () => resolve();
    t.onerror = () => reject(t.error);
  });
  return merged;
}

export async function listPlays(): Promise<Play[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction(PLAYS, "readonly");
    const r = t.objectStore(PLAYS).getAll();
    r.onsuccess = () => {
      const arr = (r.result as Play[]) || [];
      arr.sort((a, b) => (a.playedAt < b.playedAt ? 1 : -1));
      resolve(arr);
    };
    r.onerror = () => reject(r.error);
  });
}

export async function deletePlay(playId: string): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const t = db.transaction(PLAYS, "readwrite");
    t.objectStore(PLAYS).delete(playId);
    t.oncomplete = () => resolve();
    t.onerror = () => reject(t.error);
  });
}

// ----------------- compat: API antiga usada em outros arquivos -----------------
/** @deprecated — use upsertPlay/upsertParticipant. Mantido para compatibilidade. */
export async function upsertMatch(input: any): Promise<Play> {
  if (input.name || input.participantType) {
    // bloco de cadastro vindo de telas antigas
    if (input.phone) {
      await upsertParticipant({
        phone: input.phone,
        name: input.name,
        participantType: input.participantType,
        participantTypeOther: input.participantTypeOther,
      });
    }
  }
  return upsertPlay({
    playId: String(input.playId || uuid()),
    phone: input.phone,
    pet: input.pet,
    score: input.score,
    playedAt: input.playedAt,
    durationSeconds: input.durationSeconds,
    status: input.status,
    prizeCode: input.prizeCode,
  });
}

// ----------------- relatório agregado -----------------
export async function getReport(): Promise<ParticipantReport[]> {
  const [participants, plays] = await Promise.all([listParticipants(), listPlays()]);
  const playsByPhone = new Map<string, Play[]>();
  for (const p of plays) {
    if (!p.phoneNormalized) continue;
    const arr = playsByPhone.get(p.phoneNormalized) || [];
    arr.push(p);
    playsByPhone.set(p.phoneNormalized, arr);
  }
  // garante que telefones que só existem em plays também apareçam
  const allPhones = new Set<string>([
    ...participants.map((p) => p.phoneNormalized),
    ...playsByPhone.keys(),
  ]);
  const partByPhone = new Map(participants.map((p) => [p.phoneNormalized, p]));

  const out: ParticipantReport[] = [];
  for (const phone of allPhones) {
    const part = partByPhone.get(phone);
    const arr = (playsByPhone.get(phone) || []).slice()
      .sort((a, b) => (a.playedAt < b.playedAt ? 1 : -1));
    const last = arr[0];
    out.push({
      phoneNormalized: phone,
      name: part?.name || "",
      participantType: part?.participantType || "",
      participantTypeOther: part?.participantTypeOther || "",
      attempts: arr.length,
      lastPet: last?.pet || "",
      lastScore: last?.score || 0,
      lastPlayedAt: last?.playedAt || part?.updatedAt || "",
      bestScore: arr.reduce((m, p) => Math.max(m, p.score || 0), 0),
      lastPrize: last?.prize ?? null,
      lastPrizeCode: last?.prizeCode ?? null,
    });
  }
  out.sort((a, b) => (a.lastPlayedAt < b.lastPlayedAt ? 1 : -1));
  return out;
}

export interface ReportStats {
  totalPlays: number;
  totalParticipants: number;
  cachorro: number;
  gato: number;
  topPet: "CACHORRO" | "GATO" | "Empate" | "—";
  pctCachorro: number;
  pctGato: number;
  lojista: number;
  vet: number;
  outros: number;
  topProfile: "Lojista" | "Veterinário" | "Outros" | "—";
  avgScore: number;
  bestScore: number;
}

export async function getReportStats(): Promise<ReportStats> {
  const [participants, plays] = await Promise.all([listParticipants(), listPlays()]);
  const cachorro = plays.filter((p) => p.pet === "cachorro").length;
  const gato = plays.filter((p) => p.pet === "gato").length;
  const petTotal = cachorro + gato;
  const scores = plays.map((p) => p.score || 0);
  const lojista = participants.filter((p) => p.participantType === "lojista").length;
  const vet = participants.filter((p) => p.participantType === "veterinario").length;
  const outros = participants.filter((p) => p.participantType === "outros").length;
  const profilePairs: Array<["Lojista" | "Veterinário" | "Outros", number]> = [
    ["Lojista", lojista], ["Veterinário", vet], ["Outros", outros],
  ];
  profilePairs.sort((a, b) => b[1] - a[1]);
  const topProfile = profilePairs[0][1] === 0 ? "—" : profilePairs[0][0];
  return {
    totalPlays: plays.length,
    totalParticipants: participants.length,
    cachorro, gato,
    topPet: petTotal === 0 ? "—" : cachorro === gato ? "Empate" : cachorro > gato ? "CACHORRO" : "GATO",
    pctCachorro: petTotal ? (cachorro * 100) / petTotal : 0,
    pctGato: petTotal ? (gato * 100) / petTotal : 0,
    lojista, vet, outros,
    topProfile,
    avgScore: scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
    bestScore: scores.length ? Math.max(...scores) : 0,
  };
}

// ----------------- backup / import -----------------
export interface BackupPayload {
  app: "robustus-cesta";
  version: 3;
  exportedAt: string;
  participants: Participant[];
  plays: Play[];
}

export async function exportBackup(): Promise<BackupPayload> {
  const [participants, plays] = await Promise.all([listParticipants(), listPlays()]);
  return { app: "robustus-cesta", version: 3, exportedAt: new Date().toISOString(), participants, plays };
}

export async function importBackup(raw: any): Promise<{ participants: number; plays: number }> {
  const db = await openDB();
  // Aceita: { participants, plays }  OU  { matches: [...] }  OU  [matches]
  const participants: Participant[] = Array.isArray(raw?.participants) ? raw.participants : [];
  let plays: any[] = Array.isArray(raw?.plays) ? raw.plays : [];
  if (!plays.length) {
    const legacy = Array.isArray(raw) ? raw : (Array.isArray(raw?.matches) ? raw.matches : []);
    plays = legacy;
  }

  let pCount = 0, plCount = 0;
  await new Promise<void>((resolve, reject) => {
    const t = db.transaction([PARTICIPANTS, PLAYS], "readwrite");
    const ps = t.objectStore(PARTICIPANTS);
    const ls = t.objectStore(PLAYS);

    for (const p of participants) {
      const phone = normalizePhone(p.phoneNormalized || (p as any).phone || "");
      if (!phone) continue;
      ps.put({
        phoneNormalized: phone,
        name: String(p.name || "").trim(),
        participantType: normalizeType(p.participantType),
        participantTypeOther: String(p.participantTypeOther || "").trim(),
        createdAt: p.createdAt || new Date().toISOString(),
        updatedAt: p.updatedAt || new Date().toISOString(),
      });
      pCount++;
    }

    for (const v of plays) {
      const phone = normalizePhone(v.phoneNormalized || v.phone || "");
      const playId = String(v.playId || v.id || "");
      if (!phone || !playId) continue;
      // se vier no formato legado, também cria participant
      if (v.name || v.participantType) {
        ps.put({
          phoneNormalized: phone,
          name: String(v.name || "").trim(),
          participantType: normalizeType(v.participantType),
          participantTypeOther: String(v.participantTypeOther || "").trim(),
          createdAt: v.playedAt || new Date().toISOString(),
          updatedAt: v.playedAt || new Date().toISOString(),
        });
      }
      ls.put({
        playId,
        phoneNormalized: phone,
        pet: normalizePet(v.pet),
        score: Number(v.score) || 0,
        playedAt: v.playedAt || new Date().toISOString(),
        durationSeconds: Number(v.durationSeconds) || 0,
        status: (v.status === "playing" || v.status === "finished") ? v.status : "registered",
        prizeCode: v.prizeCode || null,
        prize: v.prize || null,
      } as Play);
      plCount++;
    }

    t.oncomplete = () => resolve();
    t.onerror = () => reject(t.error);
  });
  return { participants: pCount, plays: plCount };
}
