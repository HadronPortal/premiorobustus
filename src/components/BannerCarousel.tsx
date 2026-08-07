import React from "react";
import { motion } from "framer-motion";

const PACKS = [
  {
    src: "/brand/product-banner/filhote.png",
    alt: "RobustUS Filhotes",
    className: "z-[2] -rotate-[5deg] translate-x-[22%] translate-y-[8%]",
  },
  {
    src: "/brand/product-banner/pequenas-racas.png",
    alt: "RobustUS Pequenas Raças",
    className: "z-[3] -rotate-[2deg] translate-x-[10%] translate-y-[1%]",
  },
  {
    src: "/brand/product-banner/gato-adulto.png",
    alt: "RobustUS Gato Adulto",
    className: "z-[5] scale-[1.08]",
  },
  {
    src: "/brand/product-banner/gato-castrado.png",
    alt: "RobustUS Gato Castrado",
    className: "z-[4] rotate-[2deg] -translate-x-[10%] translate-y-[1%]",
  },
  {
    src: "/brand/product-banner/gato-castrado-salmao.png",
    alt: "RobustUS Gato Castrado Salmão",
    className: "z-[2] rotate-[5deg] -translate-x-[22%] translate-y-[8%]",
  },
];

export const BannerCarousel = () => {
  return (
    <div className="w-full mt-[clamp(10px,1.4vh,18px)] mb-1 flex justify-center overflow-visible pointer-events-none">
      <motion.div
        initial={{ opacity: 0, y: 22, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative flex items-end justify-center w-[min(98vw,760px)] h-[clamp(105px,17vh,185px)] overflow-visible"
      >
        <div className="absolute bottom-[4%] left-1/2 -translate-x-1/2 w-[82%] h-[18%] bg-black/35 blur-xl rounded-full opacity-60" />
        {PACKS.map((pack) => (
          <img
            key={pack.src}
            src={pack.src}
            alt={pack.alt}
            draggable={false}
            className={`relative h-[clamp(118px,20vh,220px)] w-auto object-contain drop-shadow-[0_18px_18px_rgba(0,0,0,0.45)] ${pack.className}`}
          />
        ))}
      </motion.div>
    </div>
  );
};
