import { useEffect, useRef, useState } from 'react';

type SoundType = 'flip' | 'match' | 'error' | 'victory' | 'lost' | 'applause' | 'crowd-ahh' | 'victory-applause' | 'bark' | 'meow';

export const useAudioManager = () => {
  const [isMuted, setIsMuted] = useState(() => {
    const saved = localStorage.getItem('robustus-sound-muted');
    return saved ? JSON.parse(saved) : false;
  });

  const audioCtx = useRef<AudioContext | null>(null);
  const bgMusic = useRef<HTMLAudioElement | null>(null);
  const mascotSounds = useRef<Record<string, HTMLAudioElement>>({});

  useEffect(() => {
    localStorage.setItem('robustus-sound-muted', JSON.stringify(isMuted));
    if (bgMusic.current) {
      bgMusic.current.muted = isMuted;
    }
  }, [isMuted]);

  const initAudio = () => {
    if (!audioCtx.current) {
      audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    if (!bgMusic.current) {
      // Usaremos um oscilador simples para a música de fundo se o arquivo não existir, 
      // mas aqui deixamos preparado para o arquivo mp3
      bgMusic.current = new Audio('/audio/background.mp3');
      bgMusic.current.loop = true;
      bgMusic.current.volume = 0.2;
      bgMusic.current.muted = isMuted;
    }

    if (audioCtx.current.state === 'suspended') {
      audioCtx.current.resume();
    }
  };

  const playOscillator = (freqs: number[], duration: number, type: OscillatorType = 'sine', volume = 0.3) => {
    if (isMuted || !audioCtx.current) return;

    const ctx = audioCtx.current;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    
    // Envelope de volume
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    // Sequência de frequências (para sons complexos)
    freqs.forEach((freq, i) => {
      osc.frequency.setValueAtTime(freq, now + (i * duration / freqs.length));
    });

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration);
  };

  const playSound = (type: SoundType) => {
    if (isMuted) return;
    initAudio();

    switch (type) {
      case 'flip':
        playOscillator([440, 880], 0.1, 'sine', 0.2);
        break;
      case 'match':
      case 'applause':
        playOscillator([523.25, 659.25, 783.99, 880], 0.4, 'triangle', 0.4);
        break;
      case 'error':
      case 'crowd-ahh':
        playOscillator([220, 165, 110], 0.3, 'sawtooth', 0.2);
        break;
      case 'victory':
      case 'victory-applause':
        playOscillator([523.25, 659.25, 783.99, 1046.50, 1318.51], 0.8, 'sine', 0.5);
        break;
      case 'lost':
        playOscillator([110, 82, 55], 0.6, 'square', 0.3);
        break;
      case 'bark':
      case 'meow': {
        // Sons especificos dos mascotes: arquivo local com reuso e currentTime=0,
        // para tocar imediatamente na colisao sem acumular.
        const file = type === 'bark' ? '/sounds/dog-bark.mp3' : '/sounds/cat-meow.mp3';
        let el = mascotSounds.current[type];
        if (!el) {
          el = new Audio(file);
          el.preload = 'auto';
          el.volume = 0.6;
          mascotSounds.current[type] = el;
        }
        el.muted = isMuted;
        try { el.pause(); el.currentTime = 0; } catch {}
        el.play().catch(() => {
          // Fallback simples se o arquivo nao existir
          playOscillator(
            type === 'bark' ? [320, 220, 180] : [780, 920, 760],
            0.22,
            type === 'bark' ? 'square' : 'sine',
            0.35
          );
        });
        return;
      }
    }

    // Tentar tocar arquivo se existir (fallback para Web Audio)
    const audioFile = new Audio(`/audio/${type}.mp3`);
    audioFile.volume = 0.45;
    audioFile.play().catch(() => {
      // Silenciosamente falha se o arquivo não existir, o oscilador já tocou
    });
  };

  const startBackgroundMusic = () => {
    initAudio();
    if (bgMusic.current) {
      bgMusic.current.play().catch(e => console.log("Erro ao tocar música de fundo:", e));
    }
  };

  const stopBackgroundMusic = () => {
    if (bgMusic.current) {
      bgMusic.current.pause();
      bgMusic.current.currentTime = 0;
    }
  };

  const toggleMute = () => setIsMuted(!isMuted);

  return {
    isMuted,
    toggleMute,
    playSound,
    startBackgroundMusic,
    stopBackgroundMusic,
    initAudio
  };
};
