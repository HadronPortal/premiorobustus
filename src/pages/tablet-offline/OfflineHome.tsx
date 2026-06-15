import React from "react";
import { useNavigate } from "react-router-dom";
import { OfflineLayout, OfflineLogo } from "./OfflineLayout";
import { LayoutGrid, ShoppingBasket, Gift } from "lucide-react";

export default function OfflineHome() {
  const navigate = useNavigate();

  const cards = [
    {
      label: "Jogo da Memória",
      icon: <LayoutGrid className="w-14 h-14" />,
      onClick: () => navigate("/tablet-offline/cadastro?game=memoria"),
      color: "#0047ab",
    },
    {
      label: "Jogo da Cesta",
      icon: <ShoppingBasket className="w-14 h-14" />,
      onClick: () => navigate("/tablet-offline/cadastro?game=cesta"),
      color: "#f7941d",
    },
    {
      label: "Validar Brinde",
      icon: <Gift className="w-14 h-14" />,
      onClick: () => navigate("/tablet-offline/validar-brinde"),
      color: "#10b981",
    },
  ];

  return (
    <OfflineLayout>
      <main className="flex-1 w-full flex flex-col items-center justify-center px-10 gap-10">
        <OfflineLogo />
        <h1 className="text-5xl font-black italic uppercase text-white tracking-tighter text-center">
          Desafio <span className="text-[#f7941d]">RobustUS</span>
        </h1>
        <div className="grid grid-cols-3 gap-8 w-full max-w-5xl">
          {cards.map((c) => (
            <button
              key={c.label}
              onClick={c.onClick}
              className="group bg-white rounded-[2rem] shadow-2xl border-4 border-transparent hover:border-[#f7941d] active:scale-95 transition-all aspect-square flex flex-col items-center justify-center gap-6 p-6"
            >
              <div
                className="w-28 h-28 rounded-full flex items-center justify-center text-white"
                style={{ background: c.color }}
              >
                {c.icon}
              </div>
              <span className="text-2xl font-black italic uppercase text-[#0047ab] text-center tracking-tight">
                {c.label}
              </span>
            </button>
          ))}
        </div>
        <p className="text-white/60 text-xs uppercase tracking-widest">
          Dados salvos somente neste tablet
        </p>
      </main>
    </OfflineLayout>
  );
}
