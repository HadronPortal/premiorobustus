export function normalizePhoneBR(value: string) {
  return String(value || "").replace(/\D/g, "");
}

export function formatPhoneBR(value: string) {
  const raw = normalizePhoneBR(value);
  if (raw.length <= 11) {
    if (raw.length <= 2) return raw;
    if (raw.length <= 6) return `(${raw.slice(0, 2)}) ${raw.slice(2)}`;
    if (raw.length <= 10) {
      return `(${raw.slice(0, 2)}) ${raw.slice(2, 6)}-${raw.slice(6)}`;
    }
    return `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7)}`;
  }
  return raw;
}

export function isValidPhoneBR(value: string) {
  return normalizePhoneBR(value).length >= 11;
}
