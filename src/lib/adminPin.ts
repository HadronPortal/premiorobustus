// Armazena somente o hash do PIN administrativo (offline, IndexedDB).
const DB_NAME = "robustus.admin.v1";
const DB_VERSION = 1;
const STORE = "settings";
const KEY = "adminPin";

interface PinRecord {
  key: string;
  salt: string;   // hex
  hash: string;   // hex (SHA-256 de salt+pin, 100k iterações via PBKDF2)
  createdAt: string;
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

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}
function fromHex(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
  return out;
}

async function derive(pin: string, saltHex: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(pin), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: fromHex(saltHex), iterations: 100_000, hash: "SHA-256" },
    key,
    256
  );
  return toHex(bits);
}

export async function hasAdminPin(): Promise<boolean> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, "readonly").objectStore(STORE).get(KEY);
    req.onsuccess = () => resolve(!!req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function setAdminPin(pin: string): Promise<void> {
  if (!/^\d{4,6}$/.test(pin)) throw new Error("PIN deve ter de 4 a 6 dígitos.");
  const saltBytes = crypto.getRandomValues(new Uint8Array(16));
  const salt = toHex(saltBytes.buffer);
  const hash = await derive(pin, salt);
  const rec: PinRecord = { key: KEY, salt, hash, createdAt: new Date().toISOString() };
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const t = db.transaction(STORE, "readwrite");
    t.objectStore(STORE).put(rec);
    t.oncomplete = () => resolve();
    t.onerror = () => reject(t.error);
  });
}

export async function verifyAdminPin(pin: string): Promise<boolean> {
  const db = await openDB();
  const rec = await new Promise<PinRecord | undefined>((resolve, reject) => {
    const req = db.transaction(STORE, "readonly").objectStore(STORE).get(KEY);
    req.onsuccess = () => resolve(req.result as PinRecord | undefined);
    req.onerror = () => reject(req.error);
  });
  if (!rec) return false;
  const hash = await derive(pin, rec.salt);
  // comparação constante
  if (hash.length !== rec.hash.length) return false;
  let diff = 0;
  for (let i = 0; i < hash.length; i++) diff |= hash.charCodeAt(i) ^ rec.hash.charCodeAt(i);
  return diff === 0;
}
