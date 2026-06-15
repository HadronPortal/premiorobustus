import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { OfflineLayout } from "./OfflineLayout";
import { OFFLINE_MEMORY_PRODUCTS } from "./offlineAssets";
import {
  readOfflineDraft,
  clearOfflineDraft,
} from "./OfflineRegister";
import { saveOfflinePlay, OfflineParticipant } from "@/lib/offlineStorage";

const MAX_ATTEMPTS = 20;
const MAX_SECONDS = 60;
const WINNING_PAIRS = OFFLINE_MEMORY_PRODUCTS.length;

interface Card {
  instanceId: number;
  productId: number;
  img: string;
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
  const [done, setDone] = useState<OfflineParticipant | null>(null);

  useEffect(() => {
    if (!draft) navigate("/tablet-offline");
  }, [draft, navigate]);

  // timer
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
    const elapsed = Math.min(
      MAX_SECONDS,
      Math.floor((Date.now() - startedAt) / 1000)
    );
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
        setTimeout(() => {
          const updated = next.map((c) =>
            c.productId === ca.productId ? { ...c, isMatched: true } : c
          );
          setCards(updated);
          const nm = matches + 1;
          setMatches(nm);
          setFlipped([]);
          setLock(false);
          if (nm === WINNING_PAIRS) finish(true);
        }, 500);
      } else {
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
          if (newAttempts >= MAX_ATTEMPTS) finish(false);
        }, 800);
      }
    }
  }

  return (
    <OfflineLayout>
      <main className="flex-1 w-full flex flex-col items-center justify-start pt-12 px-6 gap-4">
        <div className="flex items-center gap-4 text-white font-black text-xl">
          <div className="bg-white/15 px-4 py-2 rounded-xl">⏱ {timeLeft}s</div>
          <div className="bg-white/15 px-4 py-2 rounded-xl">
            Pares: {matches}/{WINNING_PAIRS}
          </div>
          <div className="bg-white/15 px-4 py-2 rounded-xl">
            Tentativas: {attempts}/{MAX_ATTEMPTS}
          </div>
        </div>

        <div
          className="grid gap-3 mt-2"
          style={{
            gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
            width: "min(900px, 95vw)",
          }}
        >
          {cards.map((c) => (
            <button
              key={c.instanceId}
              onClick={() => handleClick(c.instanceId)}
              className="aspect-[3/4] rounded-2xl shadow-lg border-4 transition-all"
              style={{
                background: c.isFlipped || c.isMatched ? "#fff" : "#0047ab",
                borderColor:
                  c.isMatched ? "#10b981" : c.isFlipped ? "#f7941d" : "transparent",
              }}
            >
              {(c.isFlipped || c.isMatched) ? (
                <img
                  src={c.img}
                  alt=""
                  className="w-full h-full object-contain p-2"
                />
              ) : (
                <span className="text-white text-4xl font-black">?</span>
              )}
            </button>
          ))}
        </div>

        {done && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 p-8">
            <div className="bg-white rounded-3xl border-t-[12px] border-[#f7941d] p-8 max-w-lg w-full text-center shadow-2xl">
              <h2 className="text-4xl font-black italic uppercase text-[#0047ab]">
                {done.won ? "Você ganhou!" : "Fim de jogo"}
              </h2>
              <p className="mt-3 font-bold text-slate-500 uppercase tracking-widest">
                Pares: {matches}/{WINNING_PAIRS} · Tentativas: {attempts} ·{" "}
                {done.timeSeconds}s
              </p>
              {done.won && done.prizeCode && (
                <div className="mt-6 bg-[#f7941d]/10 border-2 border-[#f7941d] rounded-2xl p-4">
                  <p className="text-xs uppercase font-bold text-slate-500 tracking-widest">
                    Código do brinde
                  </p>
                  <p className="text-3xl font-black text-[#0047ab] mt-1">
                    {done.prizeCode}
                  </p>
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
      </main>
    </OfflineLayout>
  );
}
