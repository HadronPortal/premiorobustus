import { useEffect, useRef, useState, useCallback } from "react";

// Áudio 100% offline: usa Web Audio API (osciladores) — não depende de
// arquivos externos nem rede. Mesma lógica de tipos da versão online.

export type OfflineSound =
  | "click"
  | "flip"
  | "match"
  | "error"
  | "victory"
  | "applause"
  | "lost";

const STORAGE_KEY = "robustus-offline-sound-muted";

export function useOfflineAudio() {
  const [muted, setMuted] = useState<boolean>(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "false");
    } catch {
      return false;
    }
  });
  const ctxRef = useRef<AudioContext | null>(null);
  const bgRef = useRef<{ osc: OscillatorNode; gain: GainNode } | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(muted));
    if (bgRef.current) {
      bgRef.current.gain.gain.value = muted ? 0 : 0.04;
    }
  }, [muted]);

  const ensureCtx = useCallback(() => {
    if (!ctxRef.current) {
      const Ctor =
        (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!Ctor) return null;
      ctxRef.current = new Ctor();
    }
    if (ctxRef.current!.state === "suspended") {
      ctxRef.current!.resume().catch(() => {});
    }
    return ctxRef.current;
  }, []);

  const tone = useCallback(
    (
      freqs: number[],
      duration: number,
      type: OscillatorType = "sine",
      volume = 0.25
    ) => {
      if (muted) return;
      const ctx = ensureCtx();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(volume, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      freqs.forEach((f, i) => {
        osc.frequency.setValueAtTime(f, now + (i * duration) / freqs.length);
      });
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + duration + 0.02);
    },
    [muted, ensureCtx]
  );

  const playSound = useCallback(
    (kind: OfflineSound) => {
      switch (kind) {
        case "click":
          tone([600], 0.06, "square", 0.15);
          break;
        case "flip":
          tone([440, 880], 0.1, "sine", 0.2);
          break;
        case "match":
          tone([523.25, 659.25, 783.99, 880], 0.35, "triangle", 0.35);
          break;
        case "error":
          tone([220, 165, 110], 0.3, "sawtooth", 0.22);
          break;
        case "victory":
        case "applause":
          tone(
            [523.25, 659.25, 783.99, 1046.5, 1318.51],
            0.8,
            "sine",
            0.45
          );
          break;
        case "lost":
          tone([196, 165, 130, 98], 0.7, "square", 0.25);
          break;
      }
    },
    [tone]
  );

  const startBackgroundMusic = useCallback(() => {
    if (startedRef.current) return;
    const ctx = ensureCtx();
    if (!ctx) return;
    startedRef.current = true;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 220;
    gain.gain.value = muted ? 0 : 0.04;
    // LFO leve para dar vida
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.15;
    lfoGain.gain.value = 12;
    lfo.connect(lfoGain).connect(osc.frequency);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    lfo.start();
    bgRef.current = { osc, gain };
  }, [muted, ensureCtx]);

  const stopBackgroundMusic = useCallback(() => {
    if (bgRef.current) {
      try {
        bgRef.current.gain.gain.value = 0;
        bgRef.current.osc.stop();
      } catch {}
      bgRef.current = null;
    }
    startedRef.current = false;
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((m) => !m);
    // garante contexto após interação
    ensureCtx();
  }, [ensureCtx]);

  // limpa ao desmontar
  useEffect(() => {
    return () => {
      stopBackgroundMusic();
      if (ctxRef.current) {
        try {
          ctxRef.current.close();
        } catch {}
        ctxRef.current = null;
      }
    };
  }, [stopBackgroundMusic]);

  return {
    muted,
    toggleMute,
    playSound,
    startBackgroundMusic,
    stopBackgroundMusic,
    ensureCtx,
  };
}
