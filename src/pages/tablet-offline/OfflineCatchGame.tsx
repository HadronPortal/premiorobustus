import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { OfflineLayout } from "./OfflineLayout";
import { OFFLINE_CATCH_GAME_URL } from "./offlineAssets";
import {
  readOfflineDraft,
  clearOfflineDraft,
} from "./OfflineRegister";
import { saveOfflinePlay, OfflineParticipant } from "@/lib/offlineStorage";

export default function OfflineCatchGame() {
  const navigate = useNavigate();
  const draft = useMemo(() => readOfflineDraft(), []);
  const [done, setDone] = useState<OfflineParticipant | null>(null);

  useEffect(() => {
    if (!draft) {
      navigate("/tablet-offline");
      return;
    }
    let saved = false;
    const handler = (event: MessageEvent) => {
      if (!event.data || typeof event.data !== "object") return;
      if (event.data.type === "ROBUSTUS_CATCH_STATE_CHANGE") {
        if (event.data.state === "finished" && !saved) {
          saved = true;
          const score = Number(event.data.score || 0);
          const elapsed = Number(event.data.elapsed || 0) || 30;
          const entry = saveOfflinePlay({
            name: draft.name,
            phone: draft.phone,
            game: "cesta",
            score,
            attempts: 1,
            timeSeconds: elapsed,
            won: score >= 200,
          });
          clearOfflineDraft();
          setDone(entry);
        }
      } else if (event.data.type === "ROBUSTUS_CATCH_NAVIGATE_HOME") {
        navigate("/tablet-offline");
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [draft, navigate]);

  return (
    <OfflineLayout hideBadge>
      <iframe
        title="Jogo da Cesta Offline"
        src={`${OFFLINE_CATCH_GAME_URL}?offline=1`}
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
    </OfflineLayout>
  );
}
