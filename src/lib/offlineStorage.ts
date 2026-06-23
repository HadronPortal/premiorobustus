// Armazenamento 100% local para a versão TABLET OFFLINE.
// Não importa nem usa Supabase. Tudo fica em localStorage do tablet.

export type OfflineGame = "memoria" | "cesta";
export type OfflinePrizeStatus = "pendente" | "retirado";

export interface OfflineParticipant {
  id: string;
  name: string;
  phone: string;
  game: OfflineGame;
  playedAt: string; // ISO
  score: number;
  attempts: number;
  timeSeconds: number;
  won: boolean;
  prizeCode?: string;
  prizeStatus?: OfflinePrizeStatus;
  prizeDeliveredAt?: string;
  prize?: string;
}

export function setOfflinePrize(id: string, prize: string): void {
  try {
    const raw = localStorage.getItem(KEY);
    const list: OfflineParticipant[] = raw ? JSON.parse(raw) : [];
    const idx = list.findIndex((p) => p.id === id);
    if (idx === -1) return;
    list[idx] = { ...list[idx], prize };
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {}
}

const KEY = "robustus.tabletOffline.participants.v1";

function read(): OfflineParticipant[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function write(list: OfflineParticipant[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch (err) {
    console.error("[offlineStorage] erro ao gravar", err);
  }
}

export function listOfflineParticipants(): OfflineParticipant[] {
  return read().sort(
    (a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime()
  );
}

export function generateOfflinePrizeCode(): string {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `ROBUSTUS-${n}`;
}

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function saveOfflinePlay(input: {
  name: string;
  phone: string;
  game: OfflineGame;
  score: number;
  attempts: number;
  timeSeconds: number;
  won: boolean;
}): OfflineParticipant {
  const list = read();
  let prizeCode: string | undefined;
  if (input.won) {
    // garante código único entre os participantes locais
    do {
      prizeCode = generateOfflinePrizeCode();
    } while (list.some((p) => p.prizeCode === prizeCode));
  }
  const entry: OfflineParticipant = {
    id: uid(),
    name: input.name.trim(),
    phone: input.phone.replace(/\D/g, ""),
    game: input.game,
    playedAt: new Date().toISOString(),
    score: input.score,
    attempts: input.attempts,
    timeSeconds: input.timeSeconds,
    won: input.won,
    prizeCode,
    prizeStatus: input.won ? "pendente" : undefined,
  };
  list.push(entry);
  write(list);
  return entry;
}

export function findOfflineByPrizeCode(
  code: string
): OfflineParticipant | undefined {
  const norm = code.trim().toUpperCase();
  return read().find((p) => p.prizeCode?.toUpperCase() === norm);
}

export function markOfflinePrizeDelivered(
  code: string
): OfflineParticipant | undefined {
  const list = read();
  const norm = code.trim().toUpperCase();
  const idx = list.findIndex((p) => p.prizeCode?.toUpperCase() === norm);
  if (idx === -1) return undefined;
  list[idx] = {
    ...list[idx],
    prizeStatus: "retirado",
    prizeDeliveredAt: new Date().toISOString(),
  };
  write(list);
  return list[idx];
}
