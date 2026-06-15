import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Timer, Volume2, VolumeX, RotateCcw } from "lucide-react";
import { OFFLINE_LOGO, OFFLINE_CATCH_GAME_URL } from "./offlineAssets";
import { readOfflineDraft, clearOfflineDraft } from "./OfflineRegister";
import { saveOfflinePlay, OfflineParticipant } from "@/lib/offlineStorage";
import { useOfflineAudio } from "./useOfflineAudio";

export default function OfflineCatchGame() {
  const navigate = useNavigate();
  const draft = useMemo(() => readOfflineDraft(), []);
  const [done, setDone] = useState<OfflineParticipant | null>(null);
  const [score, setScore] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const { muted, toggleMute: toggleAudioMute, playSound, startBackgroundMusic, stopBackgroundMusic, ensureCtx } = useOfflineAudio();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const lastScoreRef = useRef(0);

  useEffect(() => {
    if (!draft) {
      navigate("/tablet-offline");
      return;
    }
    let saved = false;
    ensureCtx();
    startBackgroundMusic();
    const handler = (event: MessageEvent) => {
      if (!event.data || typeof event.data !== "object") return;
      const d = event.data;
      if (d.type === "ROBUSTUS_CATCH_STATE_CHANGE") {
        if (typeof d.score === "number") {
          const newScore = d.score;
          if (newScore > lastScoreRef.current) playSound("match");
          else if (newScore < lastScoreRef.current) playSound("error");
          lastScoreRef.current = newScore;
          setScore(newScore);
        }
        if (typeof d.elapsed === "number") setElapsed(d.elapsed);
        if (d.state === "finished" && !saved) {
          saved = true;
          const finalScore = Number(d.score || 0);
          const finalElapsed = Number(d.elapsed || 0) || 30;
          const won = finalScore >= 200;
          stopBackgroundMusic();
          playSound(won ? "victory" : "lost");
          const entry = saveOfflinePlay({
            name: draft.name,
            phone: draft.phone,
            game: "cesta",
            score: finalScore,
            attempts: 1,
            timeSeconds: finalElapsed,
            won,
          });
          clearOfflineDraft();
          setDone(entry);
        }
      } else if (d.type === "ROBUSTUS_CATCH_NAVIGATE_HOME") {
        navigate("/tablet-offline");
      }
    };
    window.addEventListener("message", handler);
    return () => {
      window.removeEventListener("message", handler);
      stopBackgroundMusic();
    };
  }, [draft, navigate, ensureCtx, startBackgroundMusic, stopBackgroundMusic, playSound]);

  const toggleMute = () => {
    toggleAudioMute();
    iframeRef.current?.contentWindow?.postMessage(
      { type: "ROBUSTUS_CATCH_MUTE", muted: !muted },
      "*"
    );
  };

  const timeLeft = Math.max(0, 30 - elapsed);

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-black">
      {/* HUD por cima do jogo */}
      <div className="absolute top-0 left-0 right-0 z-40 p-2 sm:p-3 flex items-center gap-2 sm:gap-3 pointer-events-none">
        <div className="bg-white p-1.5 sm:p-2 rounded-2xl shadow-lg border border-[#f7941d] w-20 sm:w-32 pointer-events-auto">
          <img src={OFFLINE_LOGO} className="w-full h-auto object-contain" alt="Logo" />
        </div>

        <div className="flex-1 flex justify-center items-center gap-2 sm:gap-3 pointer-events-auto">
          <div className="bg-black/55 backdrop-blur-md px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl flex items-center gap-2 text-white border border-white/20">
            <Timer className="w-4 h-4 sm:w-6 sm:h-6 text-[#f7941d]" />
            <span className="text-base sm:text-2xl font-black">{timeLeft}s</span>
          </div>
          <div className="bg-[#f7941d] px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-white font-black text-base sm:text-2xl shadow">
            {score} pts
          </div>
        </div>

        <div className="flex gap-2 pointer-events-auto">
          <button
            onClick={toggleMute}
            className="p-2 sm:p-3 bg-black/55 backdrop-blur-md rounded-xl text-white border border-white/20"
            aria-label={muted ? "Ativar som" : "Desativar som"}
          >
            {muted ? <VolumeX className="w-4 h-4 sm:w-6 sm:h-6" /> : <Volume2 className="w-4 h-4 sm:w-6 sm:h-6" />}
          </button>
          <button
            onClick={() => navigate("/tablet-offline")}
            className="p-2 sm:p-3 bg-black/55 backdrop-blur-md rounded-xl text-white border border-white/20"
            aria-label="Voltar"
          >
            <RotateCcw className="w-4 h-4 sm:w-6 sm:h-6" />
          </button>
        </div>
      </div>

      <iframe
        ref={iframeRef}
        title="Jogo da Cesta Offline"
        src={`${OFFLINE_CATCH_GAME_URL}?offline=1&hideHud=1`}
        style={{ width: "100%", height: "100%", border: 0, display: "block" }}
        allow="fullscreen"
      />

      {done && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50 p-8">
          <div className="bg-white rounded-3xl border-t-[12px] border-[#f7941d] p-8 max-w-lg w-full text-center shadow-2xl">
            <h2 className="text-4xl font-black italic uppercase text-[#0047ab]">
              {done.won ? "Você ganhou!" : "Fim de jogo"}
            </h2>
            <p className="mt-3 font-bold text-slate-500 uppercase tracking-widest">
              Pontuação: {done.score} · {done.timeSeconds}s
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
