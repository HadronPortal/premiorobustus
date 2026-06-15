import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { OfflineLayout, OfflineLogo } from "./OfflineLayout";
import type { OfflineGame } from "@/lib/offlineStorage";

const PARTICIPANT_DRAFT_KEY = "robustus.tabletOffline.draft.v1";

function formatPhone(value: string) {
  const raw = value.replace(/\D/g, "").slice(0, 11);
  if (raw.length <= 2) return raw;
  if (raw.length <= 6) return `(${raw.slice(0, 2)}) ${raw.slice(2)}`;
  if (raw.length <= 10)
    return `(${raw.slice(0, 2)}) ${raw.slice(2, 6)}-${raw.slice(6)}`;
  return `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7)}`;
}

export default function OfflineRegister() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const game = (params.get("game") as OfflineGame) || "memoria";

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedPhone = phone.replace(/\D/g, "");
    if (name.trim().length < 3) {
      setError("Informe o nome completo.");
      return;
    }
    if (cleanedPhone.length < 10) {
      setError("Informe um telefone válido.");
      return;
    }
    // guarda rascunho para a tela do jogo recuperar
    sessionStorage.setItem(
      PARTICIPANT_DRAFT_KEY,
      JSON.stringify({ name: name.trim(), phone: cleanedPhone, game })
    );
    if (game === "cesta") navigate("/tablet-offline/jogo-cesta");
    else navigate("/tablet-offline/jogo-memoria");
  };

  return (
    <OfflineLayout>
      <main className="flex-1 w-full flex flex-col items-center justify-center px-10 gap-8">
        <OfflineLogo />
        <div className="bg-white rounded-3xl shadow-2xl border-t-[12px] border-[#f7941d] p-10 w-full max-w-2xl">
          <h2 className="text-4xl font-black italic uppercase text-[#0047ab] text-center mb-1">
            Cadastro
          </h2>
          <p className="text-center font-bold text-slate-500 uppercase tracking-widest mb-6">
            {game === "cesta" ? "Jogo da Cesta" : "Jogo da Memória"} · Offline
          </p>
          <form onSubmit={submit} className="flex flex-col gap-5">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value.toUpperCase())}
              placeholder="NOME COMPLETO"
              className="w-full bg-slate-100 p-5 rounded-2xl text-2xl font-bold text-[#003380] border-2 border-transparent focus:border-[#f7941d] outline-none placeholder:text-slate-400"
            />
            <input
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              placeholder="TELEFONE"
              className="w-full bg-slate-100 p-5 rounded-2xl text-2xl font-bold text-[#003380] border-2 border-transparent focus:border-[#f7941d] outline-none placeholder:text-slate-400"
            />
            {error && (
              <div className="bg-red-50 border-2 border-red-200 p-3 rounded-xl text-red-600 font-black text-center uppercase">
                {error}
              </div>
            )}
            <button
              type="submit"
              className="w-full bg-[#f7941d] hover:brightness-110 active:scale-[0.99] py-5 rounded-2xl text-white text-2xl font-black uppercase italic tracking-widest shadow-xl border-b-[6px] border-[#d47a00]"
            >
              Começar
            </button>
          </form>
        </div>
      </main>
    </OfflineLayout>
  );
}

export function readOfflineDraft(): {
  name: string;
  phone: string;
  game: OfflineGame;
} | null {
  try {
    const raw = sessionStorage.getItem(PARTICIPANT_DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearOfflineDraft() {
  sessionStorage.removeItem(PARTICIPANT_DRAFT_KEY);
}
