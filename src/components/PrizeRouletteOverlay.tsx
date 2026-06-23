import React, { useMemo, useRef, useState } from "react";

export const PRIZES = [
  "Copo",
  "Comedouro gato",
  "Comedouro cachorro",
  "Brinde surpresa",
  "Kit caneta",
  "Amostras gato e cachorro",
] as const;
export type Prize = (typeof PRIZES)[number];

/** Paleta Robustus: azul + laranja alternados, com tons. */
const SLICE_COLORS = [
  "#0047ab",
  "#ff9418",
  "#003a8a",
  "#ffa940",
  "#0e57c7",
  "#ff7a1a",
];

/** Quebra de texto em até 2 linhas + ícone por prêmio. */
const PRIZE_META: Record<Prize, { icon: string; lines: [string] | [string, string] }> = {
  "Copo": { icon: "🥤", lines: ["Copo"] },
  "Comedouro gato": { icon: "🐱", lines: ["Comedouro", "gato"] },
  "Comedouro cachorro": { icon: "🐶", lines: ["Comedouro", "cachorro"] },
  "Brinde surpresa": { icon: "🎁", lines: ["Brinde", "surpresa"] },
  "Kit caneta": { icon: "🖊️", lines: ["Kit", "caneta"] },
  "Amostras gato e cachorro": { icon: "📦", lines: ["Amostras", "gato e cachorro"] },
};

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
  const [phase, setPhase] = useState<Phase>(() => (existingPrize ? "result" : "score"));
  const [chosen, setChosen] = useState<Prize | null>(
    existingPrize && (PRIZES as readonly string[]).includes(existingPrize as string)
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
    // Pointer no topo (12h). Centro da fatia idx na rotação 0° está em (idx*slice + slice/2).
    // Para alinhar o centro da fatia ao topo, giramos no sentido horário até que
    // (idx*slice + slice/2 + rotation) ≡ 360 (mod 360). Mais 6 voltas para suspense.
    const target = 360 * 6 + (360 - (idx * sliceAngle + sliceAngle / 2));
    setRotation(target);
    setPhase("spinning");
    window.setTimeout(async () => {
      setChosen(prize);
      try {
        await onPrizeDecided(prize);
      } catch {}
      setPhase("result");
    }, 5200);
  };

  const slices = useMemo(
    () =>
      PRIZES.map((label, i) => {
        const start = i * sliceAngle;
        return {
          label,
          start,
          color: SLICE_COLORS[i % SLICE_COLORS.length],
          meta: PRIZE_META[label],
        };
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
          "radial-gradient(120% 70% at 50% 0%, #0a5fd8 0%, #003a8a 55%, #001f55 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        padding: "max(20px, env(safe-area-inset-top)) 18px 24px",
        textAlign: "center",
        color: "white",
        overflowY: "auto",
        fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
      }}
    >
      {/* Confetes decorativos sutis */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(circle at 12% 18%, rgba(255,148,24,.18) 0 6px, transparent 7px), radial-gradient(circle at 88% 22%, rgba(255,255,255,.12) 0 5px, transparent 6px), radial-gradient(circle at 78% 78%, rgba(255,148,24,.14) 0 4px, transparent 5px), radial-gradient(circle at 18% 82%, rgba(255,255,255,.1) 0 5px, transparent 6px)",
          pointerEvents: "none",
        }}
      />

      {/* Logo */}
      <div
        style={{
          background: "white",
          padding: "10px 18px",
          borderRadius: 16,
          boxShadow: "0 10px 26px rgba(0,0,0,.35), inset 0 0 0 3px #ff9418",
          marginBottom: 14,
          zIndex: 2,
        }}
      >
        <img
          src={LOGO_URL}
          alt="RobustUS"
          style={{ width: 140, display: "block", height: "auto" }}
        />
      </div>

      {phase === "score" && (
        <div style={{ zIndex: 2, width: "100%", maxWidth: 460 }}>
          <h2
            style={{
              fontSize: "clamp(28px, 6vw, 44px)",
              fontWeight: 900,
              fontStyle: "italic",
              textTransform: "uppercase",
              margin: "0 0 6px",
              letterSpacing: 1,
              textShadow: "0 3px 10px rgba(0,0,0,.4)",
            }}
          >
            Fim de jogo!
          </h2>
          <p
            style={{
              opacity: 0.9,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 2,
              fontSize: 12,
              margin: 0,
            }}
          >
            Sua pontuação final
          </p>
          <div
            style={{
              margin: "16px auto 24px",
              padding: "20px 28px",
              background: "rgba(255,255,255,.12)",
              border: "2px solid rgba(255,255,255,.28)",
              borderRadius: 24,
              backdropFilter: "blur(6px)",
              display: "inline-block",
            }}
          >
            <div
              style={{
                fontSize: "clamp(52px, 13vw, 96px)",
                fontWeight: 900,
                lineHeight: 1,
                color: "#ffb14a",
                textShadow: "0 4px 14px rgba(0,0,0,.35)",
              }}
            >
              {score}
            </div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 800,
                letterSpacing: 2,
                textTransform: "uppercase",
                marginTop: 4,
              }}
            >
              pontos
            </div>
          </div>
          <button
            onClick={startSpin}
            style={{
              background: "linear-gradient(180deg, #ffaa3a 0%, #ff8a00 100%)",
              color: "white",
              border: 0,
              borderBottom: "6px solid #b85d00",
              padding: "16px 32px",
              fontSize: 20,
              fontWeight: 900,
              textTransform: "uppercase",
              fontStyle: "italic",
              letterSpacing: 1,
              borderRadius: 20,
              cursor: "pointer",
              boxShadow: "0 14px 34px rgba(0,0,0,.4)",
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            🎁 Sortear brinde
          </button>
        </div>
      )}

      {(phase === "spinning" || phase === "result") && (
        <div style={{ zIndex: 2, width: "100%", maxWidth: 460, display: "flex", flexDirection: "column", alignItems: "center" }}>
          {phase === "spinning" && (
            <p
              style={{
                fontSize: 13,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 3,
                margin: "0 0 14px",
                opacity: 0.85,
              }}
            >
              Sorteando seu brinde
            </p>
          )}

          {/* WHEEL */}
          <div
            style={{
              position: "relative",
              width: "min(86vw, 360px)",
              aspectRatio: "1 / 1",
              filter: "drop-shadow(0 22px 30px rgba(0,0,0,.45))",
            }}
          >
            {/* Pointer premium */}
            <div
              style={{
                position: "absolute",
                top: -14,
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 6,
                filter: "drop-shadow(0 6px 6px rgba(0,0,0,.45))",
              }}
            >
              <svg width="46" height="58" viewBox="0 0 46 58">
                <defs>
                  <linearGradient id="ptr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ffb14a" />
                    <stop offset="100%" stopColor="#e8730a" />
                  </linearGradient>
                </defs>
                <path
                  d="M23 56 L4 22 A19 19 0 1 1 42 22 Z"
                  fill="url(#ptr)"
                  stroke="#ffffff"
                  strokeWidth="3"
                  strokeLinejoin="round"
                />
                <circle cx="23" cy="20" r="5" fill="#ffffff" />
              </svg>
            </div>

            {/* Anel externo branco */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                background: "white",
                boxShadow:
                  "0 0 0 4px #ff9418, 0 0 0 10px white, 0 0 0 12px rgba(255,148,24,.55), inset 0 -10px 20px rgba(0,0,0,.15)",
              }}
            />

            {/* Wheel rotating */}
            <div
              style={{
                position: "absolute",
                inset: 8,
                borderRadius: "50%",
                overflow: "hidden",
                transform: `rotate(${rotation}deg)`,
                transition:
                  phase === "spinning"
                    ? "transform 5s cubic-bezier(.12,.66,.16,1)"
                    : "none",
                background: "white",
                boxShadow: "inset 0 0 0 2px #ff9418",
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

                  // ângulo do centro da fatia, em graus, 0° = topo
                  const midDeg = s.start + sliceAngle / 2;
                  // Para o texto não ficar de cabeça pra baixo na metade inferior,
                  // viramos 180° quando o centro está entre 90° e 270°.
                  const flip = midDeg > 90 && midDeg < 270;
                  // Grupo rotacionado de forma que o eixo "para fora" do centro
                  // aponte para cima (y negativo). Texto fica horizontal nesse frame.
                  const groupRot = midDeg + (flip ? 180 : 0);

                  // posições (em coords -1..1) dentro do grupo rotacionado
                  const iconY = flip ? 0.48 : -0.48;
                  const line1Y = flip ? 0.7 : -0.7;
                  const line2Y = flip ? 0.84 : -0.84;

                  const hasTwoLines = s.meta.lines.length === 2;

                  return (
                    <g key={i}>
                      <path
                        d={path}
                        fill={s.color}
                        stroke="rgba(255,255,255,.9)"
                        strokeWidth={0.012}
                      />
                      <g transform={`rotate(${groupRot})`}>
                        <text
                          x={0}
                          y={iconY}
                          fontSize={0.16}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          style={{ fontFamily: "system-ui, sans-serif" }}
                        >
                          {s.meta.icon}
                        </text>
                        {hasTwoLines ? (
                          <>
                            <text
                              x={0}
                              y={line1Y}
                              fill="white"
                              fontSize={0.085}
                              fontWeight={900}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              style={{
                                fontFamily: "system-ui, sans-serif",
                                letterSpacing: "0.005px",
                                paintOrder: "stroke",
                                stroke: "rgba(0,0,0,.35)",
                                strokeWidth: 0.008,
                                textTransform: "uppercase",
                              } as any}
                            >
                              {s.meta.lines[0]}
                            </text>
                            <text
                              x={0}
                              y={line2Y}
                              fill="white"
                              fontSize={0.07}
                              fontWeight={800}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              style={{
                                fontFamily: "system-ui, sans-serif",
                                paintOrder: "stroke",
                                stroke: "rgba(0,0,0,.35)",
                                strokeWidth: 0.007,
                              } as any}
                            >
                              {s.meta.lines[1]}
                            </text>
                          </>
                        ) : (
                          <text
                            x={0}
                            y={(line1Y + line2Y) / 2}
                            fill="white"
                            fontSize={0.1}
                            fontWeight={900}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            style={{
                              fontFamily: "system-ui, sans-serif",
                              paintOrder: "stroke",
                              stroke: "rgba(0,0,0,.35)",
                              strokeWidth: 0.009,
                            } as any}
                          >
                            {s.meta.lines[0]}
                          </text>
                        )}
                      </g>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Hub central */}
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                width: "26%",
                height: "26%",
                transform: "translate(-50%, -50%)",
                borderRadius: "50%",
                background:
                  "radial-gradient(circle at 35% 30%, #ffffff 0%, #f4f7fb 70%)",
                boxShadow:
                  "0 0 0 5px #ff9418, 0 8px 18px rgba(0,0,0,.35), inset 0 -4px 10px rgba(0,71,171,.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "clamp(22px, 5.5vw, 34px)",
                zIndex: 5,
              }}
            >
              🎁
            </div>
          </div>

          {/* Mensagem abaixo da roleta */}
          <p
            style={{
              marginTop: 18,
              fontSize: 18,
              fontWeight: 900,
              fontStyle: "italic",
              letterSpacing: 2,
              textTransform: "uppercase",
              color: "#ffb14a",
              textShadow: "0 2px 8px rgba(0,0,0,.4)",
            }}
          >
            {phase === "spinning" ? "Boa sorte!" : "🎉 Parabéns!"}
          </p>

          {/* Card de resultado */}
          {phase === "result" && chosen && (
            <div
              style={{
                marginTop: 14,
                width: "100%",
                maxWidth: 380,
                background: "white",
                color: "#0047ab",
                borderRadius: 22,
                padding: "18px 20px 20px",
                boxShadow:
                  "0 18px 40px rgba(0,0,0,.4), inset 0 0 0 3px #ff9418",
                animation: "rouletteCardIn 380ms cubic-bezier(.2,.9,.3,1.2) both",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: 3,
                  textTransform: "uppercase",
                  color: "#6b7a99",
                }}
              >
                Você ganhou
              </div>
              <div
                style={{
                  marginTop: 6,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  fontWeight: 900,
                  fontSize: "clamp(20px, 4.6vw, 26px)",
                  textTransform: "uppercase",
                  fontStyle: "italic",
                  lineHeight: 1.15,
                }}
              >
                <span style={{ fontSize: "1.35em" }}>{PRIZE_META[chosen].icon}</span>
                <span>{chosen}</span>
              </div>

              <div
                style={{
                  marginTop: 14,
                  display: "flex",
                  gap: 8,
                  justifyContent: "center",
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    background: "#eaf1fb",
                    color: "#0047ab",
                    padding: "7px 14px",
                    borderRadius: 999,
                    fontWeight: 800,
                    fontSize: 13,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  {score} pts
                </span>
                {prizeCode && (
                  <span
                    style={{
                      background: "#ff9418",
                      color: "white",
                      padding: "7px 14px",
                      borderRadius: 999,
                      fontWeight: 900,
                      fontSize: 13,
                      letterSpacing: 1,
                    }}
                  >
                    Código: {prizeCode}
                  </span>
                )}
              </div>

              <p
                style={{
                  marginTop: 12,
                  fontSize: 12,
                  color: "#5b6b88",
                  fontWeight: 600,
                }}
              >
                Mostre esta tela para a equipe do stand para retirar o brinde.
              </p>

              <button
                onClick={onPlayAgain}
                style={{
                  marginTop: 16,
                  width: "100%",
                  background: "linear-gradient(180deg, #0a5fd8 0%, #003a8a 100%)",
                  color: "white",
                  border: 0,
                  borderBottom: "5px solid #001f55",
                  padding: "14px 22px",
                  fontSize: 17,
                  fontWeight: 900,
                  textTransform: "uppercase",
                  fontStyle: "italic",
                  letterSpacing: 1,
                  borderRadius: 16,
                  cursor: "pointer",
                  boxShadow: "0 10px 24px rgba(0,0,0,.3)",
                }}
              >
                Jogar novamente
              </button>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes rouletteCardIn {
          from { opacity: 0; transform: translateY(14px) scale(.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
