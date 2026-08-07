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

      <div className="relative z-10 w-full h-full flex flex-col items-center justify-start overflow-y-auto">
        {/* Área clicável sobre a faixa "JOGO DA CESTA" */}
        <motion.div
          whileTap={{ 
            scale: 0.98, 
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            boxShadow: "0 0 40px rgba(255, 148, 29, 0.4)"
          }}
          onClick={() => navigate("/tablet-offline/cadastro?game=cesta")}
          className="absolute top-[18%] left-[5%] w-[90%] h-[24%] cursor-pointer z-20 rounded-[2rem] transition-all duration-150"
          aria-label="Iniciar Jogo da Cesta"
        />

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
