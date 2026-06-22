import React, { useEffect, useState } from "react";
import { Cloud, CloudOff, CheckCircle2 } from "lucide-react";
import { listUnsynced } from "@/lib/mobileOfflineDb";

export const OfflineStatusBadge: React.FC = () => {
  const [online, setOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [pending, setPending] = useState(0);
  const [justSynced, setJustSynced] = useState(false);

  const refresh = async () => {
    try {
      const list = await listUnsynced();
      setPending(list.length);
    } catch {
      setPending(0);
    }
  };

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    const synced = () => {
      setJustSynced(true);
      void refresh();
      setTimeout(() => setJustSynced(false), 3500);
    };
    window.addEventListener("robustus:synced", synced as EventListener);
    void refresh();
    const t = setInterval(refresh, 5000);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
      window.removeEventListener("robustus:synced", synced as EventListener);
      clearInterval(t);
    };
  }, []);

  if (online && pending === 0 && !justSynced) return null;

  const baseCls =
    "fixed bottom-3 left-1/2 -translate-x-1/2 z-[200] sm:hidden px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider shadow-lg flex items-center gap-1.5 max-w-[92vw] text-center";

  if (justSynced && pending === 0) {
    return (
      <div className={`${baseCls} bg-emerald-500 text-white`}>
        <CheckCircle2 className="w-4 h-4" />
        Dados sincronizados
      </div>
    );
  }

  if (!online) {
    return (
      <div className={`${baseCls} bg-slate-800/90 text-white`}>
        <CloudOff className="w-4 h-4" />
        Modo offline: seus dados serão enviados quando houver conexão
      </div>
    );
  }

  return (
    <div className={`${baseCls} bg-[#0047ab] text-white`}>
      <Cloud className="w-4 h-4" />
      Enviando seus dados...
    </div>
  );
};
