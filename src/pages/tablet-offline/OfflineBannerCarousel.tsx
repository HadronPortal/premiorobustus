import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Banners locais (cacheados pelo service worker offline)
const BANNERS = [
  "/offline-banners/banner1.jpg",
  "/offline-banners/banner2.png",
  "/offline-banners/banner3.png",
  "/offline-banners/banner4.png",
];

export const OfflineBannerCarousel: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % BANNERS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full px-4 mt-[clamp(20px,3vh,36px)] mb-2 flex justify-center">
      <div className="relative w-[min(94vw,760px)] sm:w-[min(94vw,900px)] h-[clamp(190px,25vh,240px)] sm:h-[clamp(220px,24vh,280px)] rounded-[18px] overflow-hidden shadow-lg border-2 border-white/50 sm:border-[#f7941d]/30 group bg-gradient-to-b from-[#0057b8] to-[#003f95]">
        <AnimatePresence mode="wait">
          <motion.img
            key={currentIndex}
            src={BANNERS[currentIndex]}
            alt={`Banner ${currentIndex + 1}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 w-full h-full object-contain object-center"
          />
        </AnimatePresence>

        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {BANNERS.map((_, idx) => (
            <div
              key={idx}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                idx === currentIndex ? "bg-[#f7941d] w-3" : "bg-white/50"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
