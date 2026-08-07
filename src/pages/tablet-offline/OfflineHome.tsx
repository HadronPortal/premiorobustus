import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ensureOfflineServiceWorker } from "./registerOfflineSW";
import bgHeroAsset from "@/assets/bg-home-v2.jpg.asset.json";

export default function OfflineHome() {
  const navigate = useNavigate();

  React.useEffect(() => {
    ensureOfflineServiceWorker();
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden select-none">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <div className="w-full h-full relative overflow-hidden">
          <img
            src={bgHeroAsset.url}
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

      <div className="relative z-10 w-full h-full flex flex-col items-center justify-end px-6 pb-32 overflow-y-auto">
        {/* Ícone de Jogar */}
        <motion.button
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate("/tablet-offline/cadastro?game=cesta")}
          className="group flex flex-col items-center gap-2 mb-8"
        >
          <div className="w-24 h-24 bg-[#f7941d] rounded-full flex items-center justify-center shadow-[0_12px_24px_rgba(247,148,29,0.4)] border-b-8 border-[#c96f00] group-active:border-b-0 group-active:translate-y-1 transition-all">
            <svg 
              viewBox="0 0 24 24" 
              className="w-12 h-12 text-white fill-current ml-2"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <span className="text-white font-black text-xl uppercase tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
            JOGAR
          </span>
        </motion.button>

        {/* Logo Admin Discreto no Rodapé */}
        <div className="absolute bottom-8 right-8 z-50">
          <div
            onPointerDown={() => {
              const timer = setTimeout(() => navigate('/admin/relatorio-offline'), 2200);
              (window as any).adminTimer = timer;
            }}
            onPointerUp={() => clearTimeout((window as any).adminTimer)}
            onPointerCancel={() => clearTimeout((window as any).adminTimer)}
            onPointerLeave={() => clearTimeout((window as any).adminTimer)}
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
