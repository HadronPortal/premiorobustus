// Registra o service worker apenas em produção, fora de iframes e fora de
// previews internos do Lovable. Em dev/preview, qualquer SW antigo é removido.

const LOVABLE_PREVIEW_HOSTS = [
  "lovableproject.com",
  "lovableproject-dev.com",
  "beta.lovable.dev",
];

function isPreviewHost(hostname: string) {
  if (
    hostname.startsWith("id-preview--") ||
    hostname.startsWith("preview--")
  ) {
    return true;
  }
  return LOVABLE_PREVIEW_HOSTS.some(
    (h) => hostname === h || hostname.endsWith(`.${h}`)
  );
}

function shouldRegister() {
  if (typeof window === "undefined") return false;
  if (!("serviceWorker" in navigator)) return false;
  if (!import.meta.env.PROD) return false;
  try {
    if (window.top !== window.self) return false;
  } catch {
    return false;
  }
  if (isPreviewHost(window.location.hostname)) return false;
  if (new URL(window.location.href).searchParams.get("sw") === "off") return false;
  return true;
}

async function unregisterMatching() {
  if (!("serviceWorker" in navigator)) return;
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    for (const r of regs) {
      const url = r.active?.scriptURL || "";
      if (url.includes("/offline-sw.js")) await r.unregister();
    }
  } catch {}
}

export function ensureOfflineServiceWorker() {
  if (!shouldRegister()) {
    void unregisterMatching();
    return;
  }
  navigator.serviceWorker
    .register("/offline-sw.js", { scope: "/" })
    .catch((err) => console.warn("[offline-sw] registro falhou", err));
}
