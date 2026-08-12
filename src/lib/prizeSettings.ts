const DB_NAME = "robustus.prize.settings.v1";
const DB_VERSION = 1;
const STORE = "prizes";
const KEY = "prizeSettings";

export interface PrizeConfig {
  name: string;
  chance: number; // 0-100
  enabled: boolean;
}

export const DEFAULT_PRIZES: PrizeConfig[] = [
  { name: "Caneta", chance: 25, enabled: true },
  { name: "Comedouro", chance: 25, enabled: true },
  { name: "Surpresa", chance: 25, enabled: true },
  { name: "Amostra", chance: 25, enabled: true },
];

const DEFAULT_PRIZE_NAMES = DEFAULT_PRIZES.map((p) => p.name).join("|");

function shouldUseDefaultPrizes(prizes: unknown): prizes is PrizeConfig[] {
  if (!Array.isArray(prizes) || prizes.length !== DEFAULT_PRIZES.length) return true;
  const names = prizes.map((p) => String((p as PrizeConfig).name || "")).join("|");
  const hasDefaultChances = prizes.every((p, index) => {
    const prize = p as PrizeConfig;
    return Number(prize.chance) === DEFAULT_PRIZES[index].chance && prize.enabled === true;
  });
  return names !== DEFAULT_PRIZE_NAMES || !hasDefaultChances;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "key" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getPrizeSettings(): Promise<PrizeConfig[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, "readonly").objectStore(STORE).get(KEY);
    req.onsuccess = () => {
        if (!req.result) resolve(DEFAULT_PRIZES);
        else if (shouldUseDefaultPrizes(req.result.prizes)) resolve(DEFAULT_PRIZES);
        else resolve(req.result.prizes);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function savePrizeSettings(prizes: PrizeConfig[]): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const t = db.transaction(STORE, "readwrite");
    t.objectStore(STORE).put({ key: KEY, prizes });
    t.oncomplete = () => resolve();
    t.onerror = () => reject(t.error);
  });
}
