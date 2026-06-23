import React, { useEffect, useMemo, useRef, useState } from "react";

export const PRIZES = [
  "Copo",
  "Comedouro gato",
  "Comedouro cachorro",
  "Brinde surpresa",
  "Kit caneta",
  "Amostras gato e cachorro",
] as const;
export type Prize = (typeof PRIZES)[number];

const COLORS = ["#0047ab", "#ff9418", "#1665d8", "#f7941d", "#003a8a", "#ffb14a"];

type Phase = "score" | "spinning" | "result";

interface Props {
  score: number;
  prizeCode: string | null;
  /** Se já houver brinde sorteado, pulamos direto para a tela final. */
  existingPrize: Prize | string | null;
  onPrizeDecided: (prize: Prize) => Promise<void> | void;
  onPlayAgain: () => void;
}

const LOGO_URL = "https://robustus.com.br/wp-content/uploads/2025/03/logo.png";

export default function PrizeRouletteOverlay({
  score,
  prizeCode,
  existingPrize,
  onPrizeDecided,
  onPlayAgain,
}: Props) {
  const [phase, setPhase] = useState<Phase>(() =>
    existingPrize ? "result" : "score"
  );
  const [chosen, setChosen] = useState<Prize | null>(
    existingPrize && (PRIZES as readonly string[]).includes(existingPrize)
      ? (existingPrize as Prize)
      : existingPrize
      ? (existingPrize as Prize)
      : null
  );
  const [rotation, setRotation] = useState(0);
  const decidedRef = useRef(false);

  const sliceAngle = 360 / PRIZES.length;

  const startSpin = () => {
    if (phase !== "score" || decidedRef.current) return;
    decidedRef.current = true;
    const idx = Math.floor(Math.random() * PRIZES.length);
    const prize = PRIZES[idx];
    // Pointer no topo (12h). A roleta gira no sentido horário.
    // Centro da fatia idx no estado inicial está em angle: idx*slice + slice/2 (a partir do topo).
    // Para alinhar com o pointer (0°), giramos -centro, mais N voltas.
    const target =
      360 * 6 + (360 - (idx * sliceAngle + sliceAngle / 2));
    setRotation(target);
    setPhase("spinning");
    // Duração da animação CSS abaixo é 4.8s
    window.setTimeout(async () => {
      setChosen(prize);
      try {
        await onPrizeDecided(prize);
      } catch {}
      setPhase("result");
    }, 4900);
  };

  const slices = useMemo(
    () =>
      PRIZES.map((label, i) => {
        const start = i * sliceAngle;
        return { label, start, color: COLORS[i % COLORS.length] };
      }),
    [sliceAngle]
  );

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 1000,
        background:
          "linear-gradient(160deg, #003a8a 0%, #0047ab 45%, #0070f3 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        textAlign: "center",
        color: "white",
        overflowY: "auto",
      }}
    >
      <img
        src={LOGO_URL}
        alt="RobustUS"
        style={{ width: 160, marginBottom: 16, filter: "drop-shadow(0 4px 10px rgba(0,0,0,.3))" }}
      />

      {phase === "score" && (
        <>
          <h2
            style={{
              fontSize: "clamp(28px, 6vw, 48px)",
              fontWeight: 900,
              fontStyle: "italic",
              textTransform: "uppercase",
              margin: "0 0 8px",
              letterSpacing: 1,
            }}
          >
            Fim de jogo!
          </h2>
          <p style={{ opacity: 0.85, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, fontSize: 13, margin: 0 }}>
            Sua pontuação final
          </p>
          <div
            style={{
              margin: "18px 0 26px",
              padding: "22px 36px",
              background: "rgba(255,255,255,.12)",
              border: "2px solid rgba(255,255,255,.25)",
              borderRadius: 28,
              backdropFilter: "blur(6px)",
            }}
          >
            <div style={{ fontSize: "clamp(56px, 14vw, 110px)", fontWeight: 900, lineHeight: 1, color: "#ffb14a" }}>
              {score}
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginTop: 6 }}>
              pontos
            </div>
          </div>
          <button
            onClick={startSpin}
            style={{
              background: "#ff9418",
              color: "white",
              border: 0,
              borderBottom: "6px solid #c66b00",
              padding: "18px 36px",
              fontSize: 22,
              fontWeight: 900,
              textTransform: "uppercase",
              fontStyle: "italic",
              letterSpacing: 1,
              borderRadius: 22,
              cursor: "pointer",
              boxShadow: "0 10px 30px rgba(0,0,0,.35)",
            }}
          >
            🎁 Sortear brinde
          </button>
        </>
      )}

      {(phase === "spinning" || phase === "result") && (
        <>
          {phase === "spinning" && (
            <p style={{ fontSize: 18, fontWeight: 800, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 12px" }}>
              Sorteando seu brinde…
            </p>
          )}

          <div
            style={{
              position: "relative",
              width: "min(90vw, 360px)",
              aspectRatio: "1 / 1",
              marginBottom: 24,
            }}
          >
            {/* Pointer */}
            <div
              style={{
                position: "absolute",
                top: -8,
                left: "50%",
                transform: "translateX(-50%)",
                width: 0,
                height: 0,
                borderLeft: "16px solid transparent",
                borderRight: "16px solid transparent",
                borderTop: "28px solid #ff9418",
                filter: "drop-shadow(0 3px 4px rgba(0,0,0,.35))",
                zIndex: 5,
              }}
            />
            {/* Wheel */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                overflow: "hidden",
                border: "8px solid white",
                boxShadow: "0 20px 50px rgba(0,0,0,.45), inset 0 0 0 4px #ff9418",
                transform: `rotate(${rotation}deg)`,
                transition:
                  phase === "spinning"
                    ? "transform 4.8s cubic-bezier(.17,.67,.27,1)"
                    : "none",
                background: "white",
              }}
            >
              <svg viewBox="-1 -1 2 2" style={{ width: "100%", height: "100%", display: "block" }}>
                {slices.map((s, i) => {
                  const a1 = (s.start - 90) * (Math.PI / 180);
                  const a2 = (s.start + sliceAngle - 90) * (Math.PI / 180);
                  const x1 = Math.cos(a1);
                  const y1 = Math.sin(a1);
                  const x2 = Math.cos(a2);
                  const y2 = Math.sin(a2);
                  const largeArc = sliceAngle > 180 ? 1 : 0;
                  const path = `M0,0 L${x1},${y1} A1,1 0 ${largeArc} 1 ${x2},${y2} Z`;
                  const mid = (s.start + sliceAngle / 2 - 90) * (Math.PI / 180);
                  const tx = Math.cos(mid) * 0.62;
                  const ty = Math.sin(mid) * 0.62;
                  const rot = s.start + sliceAngle / 2;
                  return (
                    <g key={i}>
                      <path d={path} fill={s.color} stroke="white" strokeWidth={0.01} />
                      <text
                        x={tx}
                        y={ty}
                        fill="white"
                        fontSize={0.085}
                        fontWeight={900}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        transform={`rotate(${rot} ${tx} ${ty})`}
                        style={{ fontFamily: "system-ui, sans-serif", paintOrder: "stroke", stroke: "rgba(0,0,0,.35)", strokeWidth: 0.01 }}
                      >
                        {s.label}
                      </text>
                    </g>
                  );
                })}
                <circle cx={0} cy={0} r={0.16} fill="white" stroke="#ff9418" strokeWidth={0.03} />
                <text
                  x={0}
                  y={0.02}
                  fill="#0047ab"
                  fontSize={0.14}
                  fontWeight={900}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  style={{ fontFamily: "system-ui, sans-serif" }}
                >
                  🎁
                </text>
              </svg>
            </div>
          </div>

          {phase === "result" && chosen && (
            <div style={{ maxWidth: 420, width: "100%" }}>
              <h2
                style={{
                  fontSize: "clamp(32px, 7vw, 56px)",
                  fontWeight: 900,
                  fontStyle: "italic",
                  textTransform: "uppercase",
                  margin: "0 0 8px",
                  color: "#ffb14a",
                  letterSpacing: 1,
                }}
              >
                Parabéns!
              </h2>
              <p style={{ fontSize: 16, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 14px", opacity: 0.9 }}>
                Você ganhou
              </p>
              <div
                style={{
                  background: "white",
                  color: "#0047ab",
                  padding: "16px 18px",
                  borderRadius: 18,
                  fontWeight: 900,
                  fontSize: "clamp(20px, 4.5vw, 28px)",
                  textTransform: "uppercase",
                  boxShadow: "0 10px 25px rgba(0,0,0,.3)",
                  border: "3px solid #ff9418",
                }}
              >
                {chosen}
              </div>

              <div
                style={{
                  marginTop: 14,
                  display: "flex",
                  gap: 10,
                  justifyContent: "center",
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    background: "rgba(255,255,255,.15)",
                    padding: "8px 14px",
                    borderRadius: 999,
                    fontWeight: 800,
                    fontSize: 14,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    border: "1px solid rgba(255,255,255,.25)",
                  }}
                >
                  {score} pts
                </span>
                {prizeCode && (
                  <span
                    style={{
                      background: "#ff9418",
                      padding: "8px 14px",
                      borderRadius: 999,
                      fontWeight: 900,
                      fontSize: 14,
                      letterSpacing: 1,
                    }}
                  >
                    Código: {prizeCode}
                  </span>
                )}
              </div>

              <p style={{ marginTop: 14, fontSize: 13, opacity: 0.85, fontWeight: 600 }}>
                Mostre esta tela para a equipe do stand para retirar o brinde.
              </p>

              <button
                onClick={onPlayAgain}
                style={{
                  marginTop: 22,
                  background: "white",
                  color: "#0047ab",
                  border: 0,
                  padding: "16px 28px",
                  fontSize: 18,
                  fontWeight: 900,
                  textTransform: "uppercase",
                  fontStyle: "italic",
                  letterSpacing: 1,
                  borderRadius: 18,
                  cursor: "pointer",
                  boxShadow: "0 10px 25px rgba(0,0,0,.35)",
                  width: "100%",
                  maxWidth: 320,
                }}
              >
                Jogar novamente
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
