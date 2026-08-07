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

      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center pt-[10vh] px-6 overflow-y-auto">
        {/* Botao JOGAR no espaco entre a faixa laranja e as racoes */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate("/tablet-offline/cadastro?game=cesta")}
          className="absolute left-1/2 bottom-[20%] -translate-x-1/2 bg-transparent px-8 py-2 text-white text-[clamp(1.7rem,7vw,3rem)] font-black italic leading-none tracking-wide uppercase drop-shadow-[0_5px_0_rgba(0,0,0,0.35)] transition-all z-20"
          aria-label="Iniciar Jogo da Cesta"
        >
          JOGAR
        </motion.button>

        {/* Logo Admin Discreto no Rodape */}
        <div className="absolute bottom-8 right-8 z-50">
          <div
            onPointerDown={() => {
              const timer = setTimeout(() => navigate("/admin/relatorio-offline"), 2200);
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
