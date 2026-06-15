import React, { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { OFFLINE_LOGO } from "./offlineAssets";
import { ensureOfflineServiceWorker } from "./registerOfflineSW";

interface Props {
  children: React.ReactNode;
  hideBadge?: boolean;
}

export const OfflineLayout: React.FC<Props> = ({ children, hideBadge }) => {
  const location = useLocation();
  const isHome = location.pathname === "/tablet-offline";
  useEffect(() => {
    ensureOfflineServiceWorker();
  }, []);
  return (
    <div
      className="fixed inset-0 flex flex-col overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg,#0056cf 0%,#0047ab 55%,#003380 100%)",
      }}
    >
      {!hideBadge && (
        <div className="absolute top-2 right-3 z-50 text-[10px] font-black uppercase tracking-widest text-white/70 bg-black/20 px-2 py-1 rounded-full">
          Modo Tablet Offline
        </div>
      )}
      {!isHome && (
        <Link
          to="/tablet-offline"
          className="absolute top-2 left-3 z-50 text-xs font-black uppercase tracking-widest text-white bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-full"
        >
          ← Início
        </Link>
      )}
      {children}
    </div>
  );
};

export const OfflineLogo: React.FC<{ className?: string }> = ({
  className = "",
}) => (
  <div
    className={`bg-white rounded-3xl shadow-xl border-4 border-[#f7941d] p-4 flex items-center justify-center ${className}`}
    style={{ width: 220, height: 96 }}
  >
    <img
      src={OFFLINE_LOGO}
      alt="RobustUS"
      className="w-full h-full object-contain"
    />
  </div>
);
