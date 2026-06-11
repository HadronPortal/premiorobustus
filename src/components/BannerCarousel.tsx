import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const BANNERS = [
  "https://robustus.com.br/wp-content/uploads/2025/10/site-scaled.jpg",
  "https://robustus.com.br/wp-content/uploads/2025/10/DASDASDAS-768x633.png",
  "https://robustus.com.br/wp-content/uploads/2025/10/cao-mini-768x633.png",
  "https://robustus.com.br/wp-content/uploads/2025/10/cao-ADULTO-768x633.png"
];

export const BannerCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % BANNERS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full px-4 mt-auto mb-4 sm:mb-8">
      <div className="relative w-full h-[clamp(105px,14vh,125px)] sm:h-[clamp(120px,13vh,150px)] rounded-2xl overflow-hidden shadow-lg border-2 border-white/50 sm:border-[#f7941d]/30 group">
        <AnimatePresence mode="wait">
          <motion.img
            key={currentIndex}
            src={BANNERS[currentIndex]}
            alt={`Banner ${currentIndex + 1}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 w-full h-full object-cover"
          />
        </AnimatePresence>
        
        {/* Indicadores (dots) */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {BANNERS.map((_, idx) => (
            <div
              key={idx}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                idx === currentIndex ? 'bg-[#f7941d] w-3' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
