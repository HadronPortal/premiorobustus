import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Timer, Zap, Volume2, VolumeX, RotateCcw, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { OFFLINE_LOGO, OFFLINE_MEMORY_PRODUCTS } from "./offlineAssets";
import { readOfflineDraft, clearOfflineDraft } from "./OfflineRegister";
import { saveOfflinePlay, OfflineParticipant } from "@/lib/offlineStorage";
import { useOfflineAudio } from "./useOfflineAudio";

const MAX_ATTEMPTS = 20;
const MAX_SECONDS = 60;
const WINNING_PAIRS = OFFLINE_MEMORY_PRODUCTS.length;

interface Card {
  instanceId: number;
  productId: number;
  img: string;
  name: string;
  isFlipped: boolean;
  isMatched: boolean;
}

function buildDeck(): Card[] {
  const doubled = [...OFFLINE_MEMORY_PRODUCTS, ...OFFLINE_MEMORY_PRODUCTS];
  return doubled
    .map((p, idx) => ({
      instanceId: idx,
      productId: p.id,
      img: p.img,
      name: p.name,
      isFlipped: false,
      isMatched: false,
    }))
    .sort(() => Math.random() - 0.5);
}

export default function OfflineMemoryGame() {
  const navigate = useNavigate();
  const draft = useMemo(() => readOfflineDraft(), []);
  const [cards, setCards] = useState<Card[]>(() => buildDeck());
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matches, setMatches] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [timeLeft, setTimeLeft] = useState(MAX_SECONDS);
  const [startedAt] = useState(() => Date.now());
  const [lock, setLock] = useState(false);
  const { muted, toggleMute, playSound, startBackgroundMusic, stopBackgroundMusic, ensureCtx } = useOfflineAudio();
  const [done, setDone] = useState<OfflineParticipant | null>(null);

  useEffect(() => {
    if (!draft) navigate("/tablet-offline");
  }, [draft, navigate]);

  useEffect(() => {
    return () => stopBackgroundMusic();
  }, [stopBackgroundMusic]);

  useEffect(() => {
    if (done) return;
    if (timeLeft <= 0) {
      finish(false);
      return;
    }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, done]);

  function finish(won: boolean) {
    if (done || !draft) return;
    const elapsed = Math.min(MAX_SECONDS, Math.floor((Date.now() - startedAt) / 1000));
    const entry = saveOfflinePlay({
      name: draft.name,
      phone: draft.phone,
      game: "memoria",
      score: matches * 50,
      attempts,
      timeSeconds: elapsed,
      won,
    });
    clearOfflineDraft();
    setDone(entry);
  }

  function handleClick(id: number) {
    if (lock || done) return;
    const card = cards.find((c) => c.instanceId === id);
    if (!card || card.isFlipped || card.isMatched) return;
    ensureCtx();
    startBackgroundMusic();
    playSound("flip");
    const next = cards.map((c) =>
      c.instanceId === id ? { ...c, isFlipped: true } : c
    );
    setCards(next);
    const nf = [...flipped, id];
    setFlipped(nf);
    if (nf.length === 2) {
      setLock(true);
      const [a, b] = nf;
      const ca = next.find((c) => c.instanceId === a)!;
      const cb = next.find((c) => c.instanceId === b)!;
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (ca.productId === cb.productId) {
        playSound("match");
        setTimeout(() => {
          const updated = next.map((c) =>
            c.productId === ca.productId ? { ...c, isMatched: true } : c
          );
          setCards(updated);
          const nm = matches + 1;
          setMatches(nm);
          setFlipped([]);
          setLock(false);
          if (nm === WINNING_PAIRS) {
            playSound("victory");
            stopBackgroundMusic();
            finish(true);
          }
        }, 500);
      } else {
        playSound("error");
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              c.instanceId === a || c.instanceId === b
                ? { ...c, isFlipped: false }
                : c
            )
          );
          setFlipped([]);
          setLock(false);
          if (newAttempts >= MAX_ATTEMPTS) {
            playSound("lost");
            stopBackgroundMusic();
            finish(false);
          }
        }, 800);
      }
    }
  }

  const chancesLeft = MAX_ATTEMPTS - attempts;

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-gradient-to-b from-[#0056cf] via-[#0047ab] to-[#003380]">
      {/* HUD igual ao mobile */}
      <div className="w-full p-2 sm:p-4 flex flex-col gap-2 sm:gap-3 z-30">
        <div className="flex justify-between items-center gap-3">
          <div className="bg-white p-2 sm:p-3 rounded-2xl shadow-lg border border-[#f7941d] w-24 sm:w-40">
            <img src={OFFLINE_LOGO} className="w-full h-auto object-contain" alt="Logo" />
          </div>

          <div className="flex-1 flex justify-center items-center gap-2 sm:gap-4">
            <div className="bg-white/15 backdrop-blur-md px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl flex items-center gap-2 text-white border border-white/20">
              <Timer className="w-4 h-4 sm:w-6 sm:h-6 text-[#f7941d]" />
              <span className="text-base sm:text-2xl font-black">{timeLeft}s</span>
            </div>
            <div className="bg-white/15 backdrop-blur-md px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl flex items-center gap-2 text-white border border-white/20">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-[#f7941d]" />
              <span className="text-base sm:text-xl font-black">{chancesLeft}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={toggleMute}
              className="p-2 sm:p-3 bg-white/15 backdrop-blur-md rounded-xl text-white border border-white/20"
              aria-label={muted ? "Ativar som" : "Desativar som"}
            >
              {muted ? <VolumeX className="w-4 h-4 sm:w-6 sm:h-6" /> : <Volume2 className="w-4 h-4 sm:w-6 sm:h-6" />}
            </button>
            <button
              onClick={() => navigate("/tablet-offline")}
              className="p-2 sm:p-3 bg-white/15 backdrop-blur-md rounded-xl text-white border border-white/20"
              aria-label="Voltar"
            >
              <RotateCcw className="w-4 h-4 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>

        <div className="bg-white/95 backdrop-blur-md p-2 sm:p-4 rounded-2xl sm:rounded-3xl border-2 border-[#f7941d] shadow-xl w-full">
          <div className="flex justify-between items-center px-2 mb-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase italic">Pares:</span>
              <span className="text-sm sm:text-xl font-black text-[#0047ab]">
                {matches} / {WINNING_PAIRS}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase italic">Chances:</span>
              <span className="text-sm sm:text-xl font-black text-[#f7941d]">{chancesLeft}</span>
            </div>
          </div>
          <div className="h-2 sm:h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(matches / WINNING_PAIRS) * 100}%` }}
              className="h-full bg-gradient-to-r from-[#f7941d] to-[#ffb85f] rounded-full"
            />
          </div>
        </div>
      </div>

      {/* Tabuleiro */}
      <main className="flex-1 min-h-0 w-full flex items-start justify-center px-3 sm:px-6 pb-4 overflow-auto">
        <div
          className="grid gap-2 sm:gap-3 mt-2 w-full"
          style={{
            gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
            maxWidth: "min(900px, 100%)",
          }}
        >
          {cards.map((c) => (
            <button
              key={c.instanceId}
              onClick={() => handleClick(c.instanceId)}
              className="aspect-[3/4] rounded-2xl shadow-lg border-4 transition-all relative overflow-hidden"
              style={{
                background: c.isFlipped || c.isMatched ? "#fff" : "#0047ab",
                borderColor: c.isMatched
                  ? "#10b981"
                  : c.isFlipped
                  ? "#f7941d"
                  : "rgba(255,255,255,0.25)",
              }}
            >
              {c.isFlipped || c.isMatched ? (
                <>
                  {c.isMatched && (
                    <div className="absolute top-1 right-1 bg-[#f7941d] text-white p-1 rounded-full shadow border border-white z-10">
                      <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4" />
                    </div>
                  )}
                  <img src={c.img} alt={c.name} className="w-full h-full object-contain p-2" />
                </>
              ) : (
                <span className="text-white text-3xl sm:text-4xl font-black">?</span>
              )}
            </button>
          ))}
        </div>
      </main>

      {done && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-3xl border-t-[12px] border-[#f7941d] p-8 max-w-lg w-full text-center shadow-2xl">
            <h2 className="text-4xl font-black italic uppercase text-[#0047ab]">
              {done.won ? "Você ganhou!" : "Fim de jogo"}
            </h2>
            <p className="mt-3 font-bold text-slate-500 uppercase tracking-widest">
              Pares: {matches}/{WINNING_PAIRS} · Tentativas: {attempts} · {done.timeSeconds}s
            </p>
            {done.won && done.prizeCode && (
              <div className="mt-6 bg-[#f7941d]/10 border-2 border-[#f7941d] rounded-2xl p-4">
                <p className="text-xs uppercase font-bold text-slate-500 tracking-widest">
                  Código do brinde
                </p>
                <p className="text-3xl font-black text-[#0047ab] mt-1">{done.prizeCode}</p>
              </div>
            )}
            <button
              onClick={() => navigate("/tablet-offline")}
              className="mt-6 w-full bg-[#0047ab] py-4 rounded-2xl text-white text-xl font-black uppercase italic tracking-widest shadow-xl"
            >
              Voltar ao início
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
