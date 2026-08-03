export function isNativeOfflineApp(): boolean {
  if (typeof window === "undefined") return false;
  const cap = (window as any).Capacitor;
  if (!cap) return false;
  try {
    if (typeof cap.isNativePlatform === "function") return Boolean(cap.isNativePlatform());
    if (typeof cap.getPlatform === "function") return cap.getPlatform() !== "web";
  } catch {}
  return true;
}
