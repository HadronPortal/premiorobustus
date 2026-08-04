const VALID_BR_DDDS = new Set([
  "11", "12", "13", "14", "15", "16", "17", "18", "19",
  "21", "22", "24", "27", "28",
  "31", "32", "33", "34", "35", "37", "38",
  "41", "42", "43", "44", "45", "46", "47", "48", "49",
  "51", "53", "54", "55",
  "61", "62", "63", "64", "65", "66", "67", "68", "69",
  "71", "73", "74", "75", "77", "79",
  "81", "82", "83", "84", "85", "86", "87", "88", "89",
  "91", "92", "93", "94", "95", "96", "97", "98", "99",
]);

function hasFakePattern(phone: string) {
  const subscriber = phone.slice(2);
  if (/^(\d)\1+$/.test(phone)) return true;
  if (/^(\d)\1+$/.test(subscriber)) return true;
  if ("01234567890".includes(phone) || "98765432100".includes(phone)) return true;
  return false;
}

export function normalizePhoneBR(value: string) {
  return String(value || "").replace(/\D/g, "").slice(0, 11);
}

export function formatPhoneBR(value: string) {
  const raw = normalizePhoneBR(value);
  if (raw.length <= 2) return raw;
  if (raw.length <= 6) return `(${raw.slice(0, 2)}) ${raw.slice(2)}`;
  if (raw.length <= 10) {
    return `(${raw.slice(0, 2)}) ${raw.slice(2, 6)}-${raw.slice(6)}`;
  }
  return `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7)}`;
}

export function isValidPhoneBR(value: string) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length > 11) return false;

  const phone = normalizePhoneBR(value);
  if (phone.length !== 10 && phone.length !== 11) return false;
  if (!VALID_BR_DDDS.has(phone.slice(0, 2))) return false;
  if (hasFakePattern(phone)) return false;

  const firstSubscriberDigit = phone[2];
  if (phone.length === 11) {
    return firstSubscriberDigit === "9";
  }

  return /^[2-5]$/.test(firstSubscriberDigit);
}
