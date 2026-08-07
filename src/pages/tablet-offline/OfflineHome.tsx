import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { PawPrint } from "lucide-react";
import { ensureOfflineServiceWorker } from "./registerOfflineSW";
import { OfflineBannerCarousel } from "./OfflineBannerCarousel";
import bgHeroAsset from "@/assets/bg-home.jpg.asset.json";
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

      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center px-6 sm:px-12 py-8 gap-[clamp(14px,2.5vh,28px)] overflow-y-auto">
        {/* Logo */}
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="w-full flex justify-center"
        >
          <div className="bg-white p-3 sm:p-4 rounded-[2.5rem] shadow-xl border-[3px] border-[#f7941d] w-48 h-20 sm:w-72 sm:h-32 flex items-center justify-center overflow-hidden">
            <img
              src="/brand/robustus-laranja.png"
              alt="RobustUS"
              className="w-[90%] h-[90%] object-contain"
            />
          </div>
        </motion.div>

        {/* Título */}
        <motion.h1
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-2xl sm:text-4xl font-black text-white italic tracking-tighter drop-shadow-lg leading-none uppercase text-center"
        >
          DESAFIO <span className="text-[#f7941d]">RobustUS</span>
        </motion.h1>

        {/* Card do jogo */}
        <div className="w-full max-w-[min(94vw,520px)] grid grid-cols-1 gap-4 sm:gap-10 mt-1 place-items-center">
          <motion.button
            whileHover={{ scale: 1.05, y: -8 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/tablet-offline/cadastro?game=cesta")}
            className="group relative flex flex-col overflow-hidden rounded-[2.5rem] shadow-2xl transition-all border-2 border-white/80 hover:border-white aspect-[9/16] w-full max-w-[min(70vw,360px)] sm:max-w-[420px]"
          >
            <div className="absolute inset-0 w-full h-full overflow-hidden">
              <img 
                src={gameCardAsset.url} 
                className="w-full h-full object-cover pointer-events-none" 
                style={{ objectPosition: 'center 0%' }}
                alt="Jogo da Cesta" 
              />
            </div>
          </motion.button>
        </div>


        {/* Banner de Produtos 3D Agrupados */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 100 }}
          className="w-full flex justify-center items-end px-4 mt-2 mb-8 h-[clamp(140px,20vh,280px)]"
        >
          <div className="flex items-end justify-center -space-x-12 sm:-space-x-20 w-full max-w-4xl relative">
            {PRODUCT_ASSETS.map((asset, index) => (
              <motion.div
                key={asset.id}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 + (index * 0.1) }}
                className="relative"
                style={{ 
                  zIndex: index === 2 ? 20 : 10 - Math.abs(2 - index),
                  transform: `scale(${index === 2 ? 1.15 : 1}) translateY(${index === 2 ? '-5%' : '0'})`,
                }}
              >
                <img
                  src={asset.url}
                  alt="Produto RobustUS"
                  className="h-[clamp(120px,18vh,240px)] sm:h-[clamp(180px,25vh,350px)] w-auto object-contain drop-shadow-[0_25px_30px_rgba(0,0,0,0.8)]"
                  draggable={false}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
