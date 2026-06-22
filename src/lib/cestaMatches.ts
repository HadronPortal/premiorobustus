// Armazenamento offline das partidas do Jogo da Cesta.
// Cada partida cria um novo registro — nunca sobrescreve histórico.

const DB_NAME = "robustus.cesta.matches.v1";
const DB_VERSION = 1;
const STORE = "matches";

export type ParticipantType = "lojista" | "veterinario" | "outros";
export type PetChoice = "cachorro" | "gato" | "";

export interface CestaMatch {
  id: string;
  name: string;
  phone: string;
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

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto)
    return (crypto as any).randomUUID();
  return "xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function addMatch(
  input: Omit<CestaMatch, "id"> & { id?: string }
): Promise<CestaMatch> {
  const rec: CestaMatch = { id: input.id || uuid(), ...input };
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const t = db.transaction(STORE, "readwrite");
    t.objectStore(STORE).put(rec);
    t.oncomplete = () => resolve();
    t.onerror = () => reject(t.error);
  });
  return rec;
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
      store.put(r);
      count++;
    }
    t.oncomplete = () => resolve(count);
    t.onerror = () => reject(t.error);
  });
}
