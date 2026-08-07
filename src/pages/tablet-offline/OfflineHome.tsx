import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ensureOfflineServiceWorker } from "./registerOfflineSW";

export default function OfflineHome() {
  const navigate = useNavigate();
  const startGame = () => navigate("/tablet-offline/cadastro?game=cesta");

  React.useEffect(() => {
    ensureOfflineServiceWorker();
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden select-none">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <div className="w-full h-full relative overflow-hidden">
          <img
            src="/brand/bg-home-v2.jpg"
            alt=""
            className="absolute inset-0 w-full h-full object-cover object-center"
            draggable={false}
          />
        </div>
      </div>

      {/* Selo discreto */}
      <div className="absolute top-3 right-3 z-50 text-[10px] font-black uppercase tracking-widest text-white/80 bg-black/30 px-3 py-1 rounded-full">
        Modo Tablet Offline
      </div>

      <div
        className="relative z-10 w-full h-full flex flex-col items-center justify-center pt-[10vh] px-6 overflow-hidden cursor-pointer"
        onClick={startGame}
        onPointerUp={startGame}
        aria-label="Iniciar Jogo da Cesta"
      >

        {/* Logo RobustUS inferior (Admin) */}
        <div className="absolute bottom-[4px] right-8 z-50">
          <div
            onPointerDown={() => {
              const timer = setTimeout(() => navigate("/admin/relatorio-offline"), 2200);
              (window as any).adminTimer = timer;
            }}
            onPointerUp={(event) => {
              event.stopPropagation();
              clearTimeout((window as any).adminTimer);
            }}
            onPointerCancel={() => clearTimeout((window as any).adminTimer)}
            onPointerLeave={() => clearTimeout((window as any).adminTimer)}
            onClick={(event) => event.stopPropagation()}
            className="w-24 sm:w-32 hover:scale-105 transition-transform cursor-pointer"
          >
            <img
              src="/brand/robustus-laranja.png"
              alt="Admin"
              className="w-full h-auto object-contain pointer-events-none"
              draggable={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
