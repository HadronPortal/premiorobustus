import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { PawPrint, Gift } from "lucide-react";
import { OFFLINE_LOGO } from "./offlineAssets";
import { ensureOfflineServiceWorker } from "./registerOfflineSW";

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
            src="https://robustus.com.br/wp-content/uploads/2025/10/site-scaled.jpg"
            alt=""
            className="absolute inset-0 w-full h-full object-cover object-[center_30%]"
          />
          <div className="absolute inset-0 bg-[#0047ab]/40" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#00348c]/35 via-transparent to-[#00348c]/90" />
          <div className="absolute inset-0 backdrop-blur-[1px]" />
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
          <div className="bg-white p-3 sm:p-4 rounded-3xl shadow-xl border-[3px] border-[#f7941d] w-40 h-16 sm:w-56 sm:h-24 flex items-center justify-center">
            <img
              src={OFFLINE_LOGO}
              alt="RobustUS"
              className="w-full h-full object-contain"
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

        {/* Cards dos jogos */}
        <div className="w-full max-w-[min(94vw,900px)] grid grid-cols-2 gap-4 sm:gap-10 mt-1">
          <motion.button
            whileHover={{ scale: 1.05, y: -8 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/tablet-offline/cadastro?game=memoria")}
            className="group relative flex flex-col overflow-hidden rounded-[2.5rem] bg-white shadow-2xl transition-all border-4 border-transparent hover:border-[#f7941d] aspect-[3/4]"
          >
            <div className="flex-1 w-full overflow-hidden relative bg-white">
              <div className="absolute inset-0 flex items-center justify-center">
                <img
                  src="/memoria-final.png"
                  alt="Jogo da Memória"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05, y: -8 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/tablet-offline/cadastro?game=cesta")}
            className="group relative flex flex-col overflow-hidden rounded-[2.5rem] bg-white shadow-2xl transition-all border-4 border-transparent hover:border-[#0047ab] aspect-[3/4]"
          >
            <div className="flex-1 w-full overflow-hidden relative bg-white">
              <div className="absolute inset-0 flex items-center justify-center">
                <img
                  src="/cesta-final.png"
                  alt="Jogo da Cesta"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          </motion.button>
        </div>

        {/* Validar brinde discreto */}
        <button
          onClick={() => navigate("/tablet-offline/validar-brinde")}
          className="mt-2 inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white px-5 py-2.5 rounded-full font-black uppercase italic tracking-widest text-xs sm:text-sm border border-white/25 backdrop-blur-md"
        >
          <Gift className="w-4 h-4" /> Validar Brinde
        </button>

        <div className="opacity-40 flex items-center gap-2 text-white">
          <PawPrint className="w-4 h-4" />
          <span className="text-[10px] sm:text-xs font-black tracking-widest uppercase italic">
            RobustUS Nutrição Animal
          </span>
        </div>
      </div>
    </div>
  );
}
