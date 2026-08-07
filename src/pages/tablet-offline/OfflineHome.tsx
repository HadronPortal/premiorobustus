import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { PawPrint } from "lucide-react";
import { ensureOfflineServiceWorker } from "./registerOfflineSW";
import { OfflineBannerCarousel } from "./OfflineBannerCarousel";
import bgHeroAsset from "@/assets/bg-home-v2.jpg.asset.json";
import fixedBannerAsset from "@/assets/banner-promo.png.asset.json";
import gameCardAsset from "@/assets/game-card-v3.png.asset.json";
import { PRODUCT_ASSETS } from "@/lib/productAssets";

export default function OfflineHome() {
  const navigate = useNavigate();

  React.useEffect(() => {
    ensureOfflineServiceWorker();
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden select-none">
      {/* Background igual ao mobile */}
      <div className="absolute inset-0 z-0">
        <div className="w-full h-full relative overflow-hidden">
          <img
            src={bgHeroAsset.url}
            alt=""
            className="absolute inset-0 w-full h-full object-cover object-center"
            draggable={false}
          />
          <div className="absolute inset-0 bg-[#0047ab]/20" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#00348c]/25 via-transparent to-[#00348c]/80" />
          <div className="absolute inset-0 backdrop-blur-[0.5px]" />
        </div>
      </div>

      {/* Selo discreto */}
      <div className="absolute top-3 right-3 z-50 text-[10px] font-black uppercase tracking-widest text-white/80 bg-black/30 px-3 py-1 rounded-full">
        Modo Tablet Offline
      </div>

      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center px-6 sm:px-12 py-8 overflow-y-auto">
        {/* Botão Jogar Principal */}
        <motion.button
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate("/tablet-offline/cadastro?game=cesta")}
          className="px-16 py-6 bg-[#f7941d] text-white text-3xl font-black rounded-full shadow-[0_12px_24px_rgba(247,148,29,0.4)] border-b-8 border-[#c96f00] uppercase tracking-wider transition-all"
        >
          JOGAR
        </motion.button>

        {/* Logo Admin Discreto no Rodapé */}
        <div className="absolute bottom-8 right-8 z-50">
          <div
            onMouseDown={() => {
              const timer = setTimeout(() => navigate('/admin/relatorio-offline'), 2200);
              (window as any).adminTimer = timer;
            }}
            onMouseUp={() => clearTimeout((window as any).adminTimer)}
            onMouseLeave={() => clearTimeout((window as any).adminTimer)}
            onTouchStart={() => {
              const timer = setTimeout(() => navigate('/admin/relatorio-offline'), 2200);
              (window as any).adminTimer = timer;
            }}
            onTouchEnd={() => clearTimeout((window as any).adminTimer)}
            className="w-24 sm:w-32 opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
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
    </div>
  );
}
