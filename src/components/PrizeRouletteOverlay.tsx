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

type Phase = "score" | "spinning" | "result";

interface Props {
  score: number;
  prizeCode: string | null;
  existingPrize: Prize | string | null;
  onPrizeDecided: (prize: Prize) => Promise<void> | void;
  onPlayAgain: () => void;
}

type PrizeMeta = {
  icon: string;
  lines: [string] | [string, string];
  colorA: string;
  colorB: string;
};

const LOGO_URL = "/robustus-catch-game/robustus-logo.png";

const PRIZE_META: Record<Prize, PrizeMeta> = {
  Copo: {
    icon: "🥤",
    lines: ["Copo"],
    colorA: "#0a62d9",
    colorB: "#003f9b",
  },
  "Comedouro gato": {
    icon: "🐱",
    lines: ["Comedouro", "gato"],
    colorA: "#ffad35",
    colorB: "#ff8514",
  },
  "Comedouro cachorro": {
    icon: "🐶",
    lines: ["Comedouro", "cachorro"],
    colorA: "#0754bd",
    colorB: "#003783",
  },
  "Brinde surpresa": {
    icon: "🎁",
    lines: ["Brinde", "surpresa"],
    colorA: "#ff9c20",
    colorB: "#f07800",
  },
  "Kit caneta": {
    icon: "✒️",
    lines: ["Kit", "caneta"],
    colorA: "#0f6ee6",
    colorB: "#004cae",
  },
  "Amostras gato e cachorro": {
    icon: "📦",
    lines: ["Amostras", "pet"],
    colorA: "#ffbd55",
    colorB: "#ff9118",
  },
};

const WHEEL_RADIUS = 112;
const SLICE_ANGLE = 360 / PRIZES.length;
const FULL_SPINS = 7;
const SPIN_MS = 5200;

let rouletteAudioCtx: AudioContext | null = null;

function normalizePrize(value: Prize | string | null): Prize | null {
  return value && (PRIZES as readonly string[]).includes(value)
    ? (value as Prize)
    : null;
}

function pointAt(degreesFromTop: number, radius: number) {
  const radians = ((degreesFromTop - 90) * Math.PI) / 180;
  return {
    x: Math.cos(radians) * radius,
    y: Math.sin(radians) * radius,
  };
}

function slicePath(start: number, end: number) {
  const a = pointAt(start, WHEEL_RADIUS);
  const b = pointAt(end, WHEEL_RADIUS);
  return [
    "M 0 0",
    `L ${a.x.toFixed(3)} ${a.y.toFixed(3)}`,
    `A ${WHEEL_RADIUS} ${WHEEL_RADIUS} 0 0 1 ${b.x.toFixed(3)} ${b.y.toFixed(3)}`,
    "Z",
  ].join(" ");
}

function formatPrizeCode(code: string | null) {
  if (!code) return "";
  return code.replace("ROBUSTUS-", "ROBUSTUS ");
}

function isSoundMuted() {
  try {
    return JSON.parse(localStorage.getItem("robustus-sound-muted") || "false") === true;
  } catch {
    return false;
  }
}

function getRouletteAudioContext() {
  if (typeof window === "undefined") return null;
  if (!rouletteAudioCtx) {
    const AudioCtor = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtor) return null;
    rouletteAudioCtx = new AudioCtor();
  }
  if (rouletteAudioCtx.state === "suspended") {
    void rouletteAudioCtx.resume();
  }
  return rouletteAudioCtx;
}

function scheduleRouletteTick(ctx: AudioContext, at: number, progress: number, tick: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(880 - progress * 360 + (tick % 2) * 42, at);
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(0.11 - progress * 0.045, at + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.045);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(at);
  osc.stop(at + 0.055);
}

function playRouletteSpinSound() {
  if (isSoundMuted()) return;
  const ctx = getRouletteAudioContext();
  if (!ctx) return;

  const duration = SPIN_MS / 1000;
  const startAt = ctx.currentTime + 0.02;
  let elapsed = 0;
  let tick = 0;

  while (elapsed < duration - 0.18) {
    const progress = elapsed / duration;
    const interval = 0.034 + progress * progress * 0.125;
    scheduleRouletteTick(ctx, startAt + elapsed, progress, tick);
    elapsed += interval;
    tick += 1;
  }
}

export default function PrizeRouletteOverlay({
  score,
  prizeCode,
  existingPrize,
  onPrizeDecided,
  onPlayAgain,
}: Props) {
  const initialPrize = normalizePrize(existingPrize);
  const [phase, setPhase] = useState<Phase>(() => (initialPrize ? "result" : "score"));
  const [chosen, setChosen] = useState<Prize | null>(initialPrize);
  const [rotation, setRotation] = useState(0);
  const decidedRef = useRef(Boolean(initialPrize));

  const segments = useMemo(
    () =>
      PRIZES.map((prize, index) => {
        const start = index * SLICE_ANGLE;
        const end = start + SLICE_ANGLE;
        const mid = start + SLICE_ANGLE / 2;
        const label = pointAt(mid, 70);
        const icon = pointAt(mid, 39);
        return {
          prize,
          index,
          mid,
          label,
          icon,
          path: slicePath(start, end),
          meta: PRIZE_META[prize],
        };
      }),
    []
  );

  const startSpin = () => {
    if (phase !== "score" || decidedRef.current) return;
    decidedRef.current = true;

    const index = Math.floor(Math.random() * PRIZES.length);
    const prize = PRIZES[index];
    const centerAngle = index * SLICE_ANGLE + SLICE_ANGLE / 2;
    const targetRotation = FULL_SPINS * 360 + (360 - centerAngle);

    setChosen(null);
    setRotation(targetRotation);
    setPhase("spinning");
    playRouletteSpinSound();

    window.setTimeout(async () => {
      setChosen(prize);
      try {
        await onPrizeDecided(prize);
      } catch {
        // Mantem a experiencia do usuario mesmo se a persistencia falhar.
      }
      setPhase("result");
    }, SPIN_MS);
  };

  const resultMeta = chosen ? PRIZE_META[chosen] : null;

  return (
    <div className="prize-roulette-overlay">
      <div className="roulette-light roulette-light-a" />
      <div className="roulette-light roulette-light-b" />
      <div className="roulette-pattern" />

      <div className="roulette-logo-card" aria-label="RobustUS">
        <img src={LOGO_URL} alt="RobustUS" />
      </div>

      {(phase === "score" || phase === "spinning" || phase === "result") && (
        <section className={`roulette-stage roulette-stage-${phase}`}>
          <div className="roulette-title-block">
            <span>
              {phase === "score"
                ? `${score} pontos`
                : phase === "spinning"
                  ? "Boa sorte"
                  : "Premio sorteado"}
            </span>
            <h2>
              {phase === "score"
                ? "Gire a roleta"
                : phase === "spinning"
                  ? "Girando a roleta"
                  : "Parabens!"}
            </h2>
          </div>

          <div className="wheel-frame">
            <div className="wheel-pointer">
              <span />
            </div>

            <div
              className="wheel-disc"
              style={{
                transform: `rotate(${rotation}deg)`,
                transition:
                  phase === "spinning"
                    ? `transform ${SPIN_MS}ms cubic-bezier(.08,.78,.15,1)`
                    : "none",
              }}
            >
              <svg className="wheel-svg" viewBox="-126 -126 252 252" role="img">
                <defs>
                  {segments.map((segment) => (
                    <linearGradient
                      id={`slice-gradient-${segment.index}`}
                      key={segment.prize}
                      x1="-90"
                      y1="-90"
                      x2="90"
                      y2="90"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop offset="0%" stopColor={segment.meta.colorA} />
                      <stop offset="100%" stopColor={segment.meta.colorB} />
                    </linearGradient>
                  ))}
                  <filter id="slice-shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#00245d" floodOpacity="0.22" />
                  </filter>
                </defs>

                <circle r="122" fill="#ffffff" />
                <circle r="116" fill="#ff9418" />
                <circle r="112" fill="#ffffff" />

                {segments.map((segment) => {
                  const hasTwoLines = segment.meta.lines.length === 2;
                  const labelY = hasTwoLines ? segment.label.y - 5 : segment.label.y + 2;
                  return (
                    <g key={segment.prize}>
                      <path
                        d={segment.path}
                        fill={`url(#slice-gradient-${segment.index})`}
                        stroke="#ffffff"
                        strokeWidth="2.4"
                        filter="url(#slice-shadow)"
                      />
                      <circle
                        cx={segment.icon.x}
                        cy={segment.icon.y}
                        r="17"
                        fill="rgba(255,255,255,.9)"
                        stroke="rgba(255,148,24,.8)"
                        strokeWidth="1.8"
                      />
                      <text
                        x={segment.icon.x}
                        y={segment.icon.y + 1}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize="15"
                      >
                        {segment.meta.icon}
                      </text>
                      <text
                        x={segment.label.x}
                        y={labelY}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontFamily="Arial, Helvetica, sans-serif"
                        fontWeight="900"
                        fontSize={hasTwoLines ? "8.4" : "10.6"}
                        letterSpacing=".35"
                        fill="#ffffff"
                        stroke="rgba(0,31,85,.72)"
                        strokeWidth="2.2"
                        paintOrder="stroke"
                      >
                        {segment.meta.lines[0].toUpperCase()}
                      </text>
                      {hasTwoLines && (
                        <text
                          x={segment.label.x}
                          y={segment.label.y + 7}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fontFamily="Arial, Helvetica, sans-serif"
                          fontWeight="900"
                          fontSize="7.4"
                          letterSpacing=".2"
                          fill="#ffffff"
                          stroke="rgba(0,31,85,.72)"
                          strokeWidth="1.9"
                          paintOrder="stroke"
                        >
                          {segment.meta.lines[1].toUpperCase()}
                        </text>
                      )}
                    </g>
                  );
                })}

                <circle r="29" fill="#ffffff" stroke="#ff9418" strokeWidth="6" />
                <circle r="20" fill="#f4f8ff" stroke="#d7e6fb" strokeWidth="2" />
                <text x="0" y="1" textAnchor="middle" dominantBaseline="middle" fontSize="21">
                  🎁
                </text>
              </svg>
            </div>
          </div>

          {phase === "score" && (
            <div className="roulette-ready-card">
              <p>Toque no botão para sortear seu brinde.</p>
              <button className="roulette-primary-button" type="button" onClick={startSpin}>
                <span>🎁</span>
                Girar roleta
              </button>
            </div>
          )}

          {phase === "spinning" && (
            <div className="roulette-waiting">
              <span />
              <strong>Sorteando seu brinde...</strong>
            </div>
          )}

          {phase === "result" && chosen && resultMeta && (
            <div className="prize-result-card">
              <div className="prize-result-icon">{resultMeta.icon}</div>
              <div>
                <span>Voce ganhou</span>
                <strong>{chosen}</strong>
              </div>
              <div className="prize-result-details">
                <span>{score} pontos</span>
                {prizeCode && <span>{formatPrizeCode(prizeCode)}</span>}
              </div>
              <p>Mostre esta tela para a equipe do stand retirar o brinde.</p>
              <button className="roulette-secondary-button" type="button" onClick={onPlayAgain}>
                Jogar novamente
              </button>
            </div>
          )}
        </section>
      )}

      <style>{`
        .prize-roulette-overlay {
          position: absolute;
          inset: 0;
          z-index: 1000;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: clamp(10px, 1.9vh, 18px);
          padding: max(16px, env(safe-area-inset-top)) 16px max(18px, env(safe-area-inset-bottom));
          overflow-y: auto;
          overflow-x: hidden;
          color: #fff;
          text-align: center;
          font-family: Arial, Helvetica, sans-serif;
          background:
            radial-gradient(circle at 18% 12%, rgba(255, 179, 63, .36), transparent 23%),
            radial-gradient(circle at 88% 18%, rgba(255, 255, 255, .22), transparent 18%),
            linear-gradient(180deg, #0879df 0%, #004fb6 48%, #002e76 100%);
        }

        .roulette-pattern {
          position: absolute;
          inset: 0;
          opacity: .12;
          pointer-events: none;
          background-image:
            radial-gradient(circle, #fff 0 9%, transparent 11%),
            radial-gradient(circle, #fff 0 9%, transparent 11%);
          background-size: 46px 46px;
          background-position: 0 0, 18px 17px;
        }

        .roulette-light {
          position: absolute;
          width: 46vmin;
          aspect-ratio: 1;
          border-radius: 50%;
          pointer-events: none;
          filter: blur(4px);
        }

        .roulette-light-a {
          top: -18vmin;
          left: -14vmin;
          background: rgba(255, 148, 24, .22);
        }

        .roulette-light-b {
          right: -20vmin;
          bottom: -18vmin;
          background: rgba(255, 255, 255, .13);
        }

        .roulette-logo-card,
        .score-stage,
        .roulette-stage {
          position: relative;
          z-index: 2;
        }

        .roulette-logo-card {
          width: min(46vw, 180px);
          min-height: 56px;
          display: grid;
          place-items: center;
          padding: 9px 18px;
          border: 3px solid #ff9418;
          border-radius: 20px;
          background: rgba(255,255,255,.97);
          box-shadow: 0 14px 30px rgba(0, 25, 80, .32), inset 0 -4px 10px rgba(0, 79, 182, .08);
        }

        .roulette-logo-card img {
          width: 100%;
          max-height: 42px;
          object-fit: contain;
          display: block;
        }

        .score-stage {
          width: min(92vw, 460px);
          display: grid;
          justify-items: center;
          align-content: center;
          min-height: 0;
          margin: auto 0;
        }

        .score-kicker,
        .roulette-title-block span {
          color: #ffbf64;
          font-size: clamp(11px, 2.7vw, 13px);
          font-weight: 900;
          letter-spacing: 3px;
          text-transform: uppercase;
          text-shadow: 0 2px 8px rgba(0,0,0,.3);
        }

        .score-stage h2,
        .roulette-title-block h2 {
          margin: 5px 0 0;
          color: #fff;
          font-size: clamp(34px, 9vw, 54px);
          font-style: italic;
          font-weight: 900;
          line-height: .9;
          text-transform: uppercase;
          text-shadow: 0 6px 0 rgba(0,31,85,.28), 0 14px 22px rgba(0,0,0,.24);
        }

        .score-medal {
          position: relative;
          width: min(58vw, 250px);
          aspect-ratio: 1;
          display: grid;
          place-items: center;
          margin: clamp(18px, 3vh, 28px) auto;
          border: 8px solid #fff;
          border-radius: 50%;
          background:
            radial-gradient(circle at 35% 26%, #ffe1a7 0 14%, transparent 15%),
            linear-gradient(180deg, #ffb84c 0%, #ff9012 58%, #d86d00 100%);
          box-shadow:
            0 24px 46px rgba(0, 22, 70, .42),
            inset 0 -12px 18px rgba(118, 56, 0, .24),
            inset 0 12px 18px rgba(255,255,255,.24);
        }

        .score-medal::before {
          content: "";
          position: absolute;
          inset: 16px;
          border: 2px dashed rgba(255,255,255,.74);
          border-radius: inherit;
        }

        .score-medal span {
          position: relative;
          display: block;
          color: #fff;
          font-size: clamp(70px, 19vw, 116px);
          font-weight: 900;
          line-height: .78;
          text-shadow: 0 6px 0 rgba(0,79,182,.24);
        }

        .score-medal small {
          position: absolute;
          bottom: 23%;
          color: #fff;
          font-size: clamp(12px, 3vw, 16px);
          font-weight: 900;
          letter-spacing: 2px;
          text-transform: uppercase;
        }

        .score-stage p {
          width: min(86%, 360px);
          margin: 0 0 18px;
          color: rgba(255,255,255,.92);
          font-size: clamp(15px, 3.7vw, 18px);
          font-weight: 800;
          line-height: 1.25;
        }

        .roulette-primary-button,
        .roulette-secondary-button {
          border: 0;
          cursor: pointer;
          color: #fff;
          font-family: Arial, Helvetica, sans-serif;
          font-style: italic;
          font-weight: 900;
          letter-spacing: 1px;
          text-transform: uppercase;
          transition: transform .15s ease, filter .15s ease;
        }

        .roulette-primary-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: min(84vw, 380px);
          min-height: 68px;
          padding: 16px 26px;
          border-radius: 22px;
          background: linear-gradient(180deg, #ffad35 0%, #ff8d0d 100%);
          box-shadow: 0 9px 0 #b85d00, 0 20px 34px rgba(0,0,0,.34);
          font-size: clamp(18px, 4.7vw, 24px);
        }

        .roulette-primary-button:active,
        .roulette-secondary-button:active {
          transform: translateY(4px) scale(.99);
          filter: brightness(.98);
        }

        .roulette-stage {
          width: min(94vw, 520px);
          display: flex;
          flex: 1;
          min-height: 0;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: clamp(10px, 1.7vh, 18px);
          padding-bottom: 4px;
        }

        .roulette-stage-result {
          justify-content: flex-start;
          gap: clamp(8px, 1.05vh, 12px);
        }

        .roulette-stage-result .roulette-title-block {
          margin-bottom: clamp(8px, 1.2vh, 14px);
        }

        .roulette-title-block h2 {
          font-size: clamp(26px, 7vw, 42px);
        }

        .wheel-frame {
          position: relative;
          width: min(86vw, 410px, 45vh);
          aspect-ratio: 1;
          display: grid;
          place-items: center;
          border-radius: 50%;
          filter: drop-shadow(0 24px 28px rgba(0, 21, 68, .48));
        }

        .roulette-stage-result .wheel-frame {
          width: min(82vw, 360px, 39vh);
          margin-top: clamp(8px, 1.2vh, 14px);
          filter: drop-shadow(0 18px 22px rgba(0, 21, 68, .42));
        }

        .roulette-stage-result .wheel-pointer {
          top: -18px;
          width: 52px;
          height: 64px;
        }

        .roulette-stage-result .prize-result-card {
          margin-top: clamp(6px, 1vh, 10px);
        }

        .wheel-frame::before {
          content: "";
          position: absolute;
          inset: -9px;
          border-radius: inherit;
          background: linear-gradient(180deg, #fff 0%, #dcecff 100%);
          box-shadow:
            0 0 0 5px #ff9418,
            0 0 0 11px rgba(255,255,255,.95),
            inset 0 -10px 18px rgba(0,79,182,.2);
        }

        .wheel-disc {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          transform-origin: center;
          will-change: transform;
        }

        .wheel-svg {
          width: 100%;
          height: 100%;
          display: block;
          overflow: visible;
        }

        .wheel-pointer {
          position: absolute;
          top: -22px;
          left: 50%;
          z-index: 6;
          width: 58px;
          height: 70px;
          transform: translateX(-50%);
          filter: drop-shadow(0 7px 7px rgba(0,0,0,.42));
        }

        .wheel-pointer span {
          display: block;
          width: 100%;
          height: 100%;
          background: linear-gradient(180deg, #ffbd55 0%, #ff8d0d 100%);
          clip-path: polygon(50% 100%, 6% 24%, 26% 9%, 50% 0, 74% 9%, 94% 24%);
        }

        .wheel-pointer::after {
          content: "";
          position: absolute;
          top: 15px;
          left: 50%;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #fff;
          transform: translateX(-50%);
          box-shadow: inset 0 -2px 0 rgba(0,79,182,.18);
        }

        .roulette-ready-card {
          width: min(88vw, 380px);
          display: grid;
          justify-items: center;
          gap: 12px;
          padding: 13px;
          border: 1px solid rgba(255,255,255,.28);
          border-radius: 24px;
          background: rgba(0, 31, 85, .24);
          box-shadow: inset 0 0 0 1px rgba(255,255,255,.08), 0 14px 24px rgba(0, 31, 85, .16);
          backdrop-filter: blur(8px);
        }

        .roulette-ready-card p {
          margin: 0;
          color: rgba(255,255,255,.94);
          font-size: clamp(13px, 3.3vw, 16px);
          font-weight: 900;
          letter-spacing: .5px;
        }

        .roulette-ready-card .roulette-primary-button {
          width: 100%;
          min-height: 62px;
          box-shadow: 0 8px 0 #b85d00, 0 16px 28px rgba(0,0,0,.28);
        }

        .roulette-waiting {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          min-height: 38px;
          padding: 8px 15px;
          border: 1px solid rgba(255,255,255,.28);
          border-radius: 999px;
          background: rgba(0, 31, 85, .25);
          box-shadow: inset 0 0 0 1px rgba(255,255,255,.08);
        }

        .roulette-waiting span {
          width: 13px;
          height: 13px;
          border-radius: 50%;
          background: #ff9418;
          box-shadow: 0 0 0 0 rgba(255,148,24,.55);
          animation: prizePulse 900ms ease-in-out infinite;
        }

        .roulette-waiting strong {
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 2px;
          text-transform: uppercase;
        }

        .prize-result-card {
          width: min(90vw, 400px);
          display: grid;
          justify-items: center;
          gap: 10px;
          padding: clamp(18px, 3vh, 24px);
          border-top: 8px solid #ff9418;
          border-radius: 28px;
          background:
            linear-gradient(180deg, rgba(255,255,255,.98) 0%, rgba(238,246,255,.98) 100%);
          color: #0047ab;
          box-shadow: 0 22px 48px rgba(0,22,70,.42), inset 0 0 0 2px rgba(255,255,255,.8);
          animation: prizeCardIn 420ms cubic-bezier(.2,.9,.3,1.18) both;
        }

        .prize-result-icon {
          display: grid;
          place-items: center;
          width: 62px;
          height: 62px;
          margin-top: -36px;
          border: 5px solid #fff;
          border-radius: 50%;
          background: linear-gradient(180deg, #ffbd55 0%, #ff8d0d 100%);
          box-shadow: 0 12px 22px rgba(255, 148, 24, .35);
          font-size: 32px;
        }

        .prize-result-card span {
          display: block;
          color: #65758d;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 2.5px;
          text-transform: uppercase;
        }

        .prize-result-card strong {
          display: block;
          max-width: 320px;
          margin-top: 4px;
          color: #0047ab;
          font-size: clamp(23px, 6vw, 32px);
          font-style: italic;
          font-weight: 900;
          line-height: 1.04;
          text-transform: uppercase;
        }

        .prize-result-details {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 8px;
          margin-top: 2px;
        }

        .prize-result-details span {
          padding: 8px 12px;
          border-radius: 999px;
          color: #0047ab;
          background: #e7f1ff;
          letter-spacing: 1px;
          font-size: 12px;
        }

        .prize-result-details span:last-child {
          color: #fff;
          background: #ff9418;
        }

        .prize-result-card p {
          max-width: 310px;
          margin: 2px 0 0;
          color: #5b6b88;
          font-size: 12px;
          font-weight: 800;
          line-height: 1.25;
        }

        .roulette-secondary-button {
          width: 100%;
          min-height: 56px;
          margin-top: 4px;
          border-radius: 18px;
          background: linear-gradient(180deg, #075fd3 0%, #003b8f 100%);
          box-shadow: 0 7px 0 #00245d, 0 16px 24px rgba(0,31,85,.24);
          font-size: 17px;
        }

        @keyframes prizePulse {
          0%, 100% { transform: scale(.88); box-shadow: 0 0 0 0 rgba(255,148,24,.55); }
          50% { transform: scale(1.05); box-shadow: 0 0 0 8px rgba(255,148,24,0); }
        }

        @keyframes prizeCardIn {
          from { opacity: 0; transform: translateY(14px) scale(.94); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @media (max-height: 690px) {
          .prize-roulette-overlay {
            gap: 8px;
            padding-top: max(10px, env(safe-area-inset-top));
            padding-bottom: max(10px, env(safe-area-inset-bottom));
          }

          .roulette-logo-card {
            width: min(38vw, 142px);
            min-height: 45px;
            padding: 7px 14px;
            border-radius: 16px;
          }

          .score-medal {
            width: min(48vw, 190px);
            margin: 12px auto 16px;
          }

          .roulette-primary-button {
            min-height: 58px;
          }

          .wheel-frame {
            width: min(76vw, 320px, 38vh);
          }

          .roulette-stage-result .wheel-frame {
            width: min(74vw, 300px, 34vh);
            margin-top: 8px;
          }

          .roulette-stage-result .roulette-title-block {
            margin-bottom: 8px;
          }

          .prize-result-card {
            padding: 16px;
            border-radius: 23px;
          }
        }
      `}</style>
    </div>
  );
}
