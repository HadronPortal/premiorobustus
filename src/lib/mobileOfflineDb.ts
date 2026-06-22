// IndexedDB local-first para a versão MOBILE.
// Salva participantes antes de qualquer chamada ao Supabase e sincroniza
// automaticamente quando há conexão. Nunca apaga dados não sincronizados.

import { supabase } from "@/integrations/supabase/client";

const DB_NAME = "robustus.mobile.v1";
const DB_VERSION = 1;
const STORE = "participants";

export type ParticipantType = "lojista" | "veterinario" | "outros";

export interface MobileParticipant {
  id: string; // UUID local
  name: string;
  phone: string;
  participantType: ParticipantType;
  participantTypeOther: string; // texto quando participantType === 'outros'
  playedAt: string;
  attempts: number;
  pet: string;
  score: number;
  prizeCode: string | null;
  prizeStatus: "pendente" | "retirado" | null;
  game: "cesta" | "memoria";
  synced: boolean;
  remotePlayId?: string;
  remotePlayToken?: string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("synced", "synced");
        store.createIndex("phone", "phone");
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T> | Promise<T>
): Promise<T> {
  const db = await openDB();
  return new Promise<T>((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const store = t.objectStore(STORE);
    const out = fn(store);
    if (out instanceof IDBRequest) {
      out.onsuccess = () => resolve(out.result as T);
      out.onerror = () => reject(out.error);
    } else {
      out.then(resolve, reject);
    }
  });
}

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return (crypto as any).randomUUID();
  }
  return "xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function createParticipant(input: {
  name: string;
  phone: string;
  game: "cesta" | "memoria";
  pet?: string;
}): Promise<MobileParticipant> {
  const rec: MobileParticipant = {
    id: uuid(),
    name: input.name.trim(),
    phone: input.phone.replace(/\D/g, ""),
    playedAt: new Date().toISOString(),
    attempts: 0,
    pet: input.pet || "",
    score: 0,
    prizeCode: null,
    prizeStatus: null,
    game: input.game,
    synced: false,
  };
  await tx("readwrite", (s) => s.put(rec));
  setCurrentParticipantId(rec.id);
  // tenta sincronizar em background, sem bloquear
  void trySyncNew(rec);
  return rec;
}

export async function updateParticipant(
  id: string,
  patch: Partial<MobileParticipant>
): Promise<MobileParticipant | null> {
  const current = await tx<MobileParticipant | undefined>("readonly", (s) =>
    s.get(id)
  );
  if (!current) return null;
  const merged: MobileParticipant = { ...current, ...patch };
  await tx("readwrite", (s) => s.put(merged));
  return merged;
}

export async function getParticipant(id: string) {
  return tx<MobileParticipant | undefined>("readonly", (s) => s.get(id));
}

export async function listUnsynced(): Promise<MobileParticipant[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, "readonly");
    const store = t.objectStore(STORE);
    const req = store.getAll();
    req.onsuccess = () =>
      resolve(((req.result as MobileParticipant[]) || []).filter((p) => !p.synced));
    req.onerror = () => reject(req.error);
  });
}

const CURRENT_KEY = "robustus.mobile.currentParticipantId";
export function setCurrentParticipantId(id: string) {
  try {
    localStorage.setItem(CURRENT_KEY, id);
  } catch {}
}
export function getCurrentParticipantId(): string | null {
  try {
    return localStorage.getItem(CURRENT_KEY);
  } catch {
    return null;
  }
}
export function clearCurrentParticipantId() {
  try {
    localStorage.removeItem(CURRENT_KEY);
  } catch {}
}

// --------- Sincronização com Supabase ---------

async function trySyncNew(rec: MobileParticipant) {
  if (!navigator.onLine) return;
  try {
    const { data, error } = await (supabase.rpc as any)(
      "register_and_start_play_phone",
      {
        p_phone: rec.phone,
        p_event_slug: "robustus-expo-2026",
        p_name: rec.name,
      }
    );
    if (error || !data?.ok) return;
    await updateParticipant(rec.id, {
      remotePlayId: data.play_id,
      remotePlayToken: data.play_token,
      // só marca como synced quando o jogo terminou; aqui é início.
      synced: rec.score > 0 || !!rec.prizeCode ? true : false,
    });
  } catch {
    // silencioso — fica para próxima tentativa
  }
}

export async function syncAll(): Promise<void> {
  if (!navigator.onLine) return;
  const pending = await listUnsynced();
  for (const rec of pending) {
    try {
      let playId = rec.remotePlayId;
      let playToken = rec.remotePlayToken;
      if (!playId || !playToken) {
        const { data, error } = await (supabase.rpc as any)(
          "register_and_start_play_phone",
          {
            p_phone: rec.phone,
            p_event_slug: "robustus-expo-2026",
            p_name: rec.name,
          }
        );
        if (error || !data?.ok) continue;
        playId = data.play_id;
        playToken = data.play_token;
        await updateParticipant(rec.id, {
          remotePlayId: playId,
          remotePlayToken: playToken,
        });
      }
      // Se o jogo já terminou localmente, fecha a jogada no Supabase
      if (rec.score > 0 || rec.attempts > 0) {
        const { error: finErr } = await (supabase.rpc as any)("finish_play", {
          p_play_id: playId,
          p_play_token: playToken,
          p_pairs_found: rec.score,
          p_attempts_used: rec.attempts,
          p_client_time_seconds: 0,
        });
        if (finErr) continue;
      } else {
        // ainda não jogou: não marca synced
        continue;
      }
      await updateParticipant(rec.id, { synced: true });
      window.dispatchEvent(new CustomEvent("robustus:synced", { detail: rec.id }));
    } catch {
      // silencioso
    }
  }
}

let installed = false;
export function installMobileSync() {
  if (installed) return;
  installed = true;
  const run = () => void syncAll();
  window.addEventListener("online", run);
  // tenta no boot e periodicamente
  run();
  setInterval(run, 30_000);
}
