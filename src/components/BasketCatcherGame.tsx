import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, Timer, Gift, Award } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { AuthScreen } from './auth/AuthScreen';
import confetti from 'canvas-confetti';

// Base técnica inspirada/adaptada de Basketcatcher, MIT License, Ankit Warbhe.

const BRAND = {
  primary: "#0047ab",
  orange: "#f7941d",
  white: "#ffffff",
};

const ASSETS = {
  logo: "https://robustus.com.br/wp-content/uploads/2025/03/logo.png",
  dog: "https://robustus.com.br/wp-content/uploads/2025/10/cao-mini-768x633.png",
  basket: "https://pngimg.com/uploads/basket/basket_PNG15743.png",
};

const GAME_PRODUCTS = [
  { id: 1, name: 'Life Special Filhote', img: 'https://robustus.com.br/wp-content/uploads/2025/10/DASDASDAS-768x633.png', points: 10, special: false },
  { id: 2, name: 'Adulto Mini', img: 'https://robustus.com.br/wp-content/uploads/2025/10/cao-mini-768x633.png', points: 10, special: false },
  { id: 3, name: 'Adulto Grande', img: 'https://robustus.com.br/wp-content/uploads/2025/10/cao-ADULTO-768x633.png', points: 10, special: false },
  { id: 4, name: 'Especial Laranja', img: 'https://robustus.com.br/wp-content/uploads/2025/10/sdsadasdas-1-768x633.png', points: 25, special: true },
];

type GameState = 'START' | 'AUTH' | 'PLAYING' | 'VICTORY' | 'GAMEOVER' | 'ERROR';

export const BasketCatcherGame = () => {
  const [gameState, setGameState] = useState<GameState>('START');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(45);
  const [session, setSession] = useState<{play_id: string, play_token: string} | null>(null);
  const [dogX, setDogX] = useState(50);
  const [items, setItems] = useState<{id: number, x: number, y: number, speed: number, product: any}[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const scoreRef = useRef(0);
  const startTimeRef = useRef(0);

  const initializeGame = (sessionData: any) => {
    setSession({ play_id: sessionData.play_id, play_token: sessionData.play_token });
    setScore(0);
    scoreRef.current = 0;
    setTimeLeft(45);
    setItems([]);
    startTimeRef.current = Date.now();
    setGameState('PLAYING');
  };

  const handleGameOver = async (won: boolean) => {
    setGameState('ERROR');
    try {
      const { data, error } = await (supabase.rpc as any)("finish_play", {
        p_play_id: session?.play_id,
        p_play_token: session?.play_token,
        p_pairs_found: won ? 5 : 0,
        p_attempts_used: 1,
        p_client_time_seconds: Math.floor((Date.now() - startTimeRef.current) / 1000)
      });
      if (error || !data?.ok) { setGameState("ERROR"); return; }
      if (data.result === "won") { 
        setGameState("VICTORY"); 
        confetti({ particleCount: 200, spread: 80, colors: [BRAND.primary, BRAND.orange] });
      } else { setGameState("GAMEOVER"); }
    } catch { setGameState("ERROR"); }
  };

  useEffect(() => {
    if (gameState !== 'PLAYING') return;
    const interval = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { handleGameOver(scoreRef.current >= 200); return 0; }
        return t - 1;
      });
      setItems(prev => [...prev, { id: Date.now(), x: Math.random() * 80 + 10, y: -10, speed: 0.6, product: GAME_PRODUCTS[Math.floor(Math.random() * GAME_PRODUCTS.length)] }]);
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState]);

  useEffect(() => {
    if (gameState !== 'PLAYING') return;
    const update = () => {
      setItems(prev => prev.map(i => ({...i, y: i.y + i.speed })).filter(i => {
        const dogXPixels = (dogX / 100) * 1080;
        const itemXPixels = (i.x / 100) * 1080;
        if (i.y > 80 && i.y < 90 && Math.abs(itemXPixels - dogXPixels) < 150) {
          scoreRef.current += i.product.points;
          setScore(scoreRef.current);
          return false;
        }
        return i.y < 100;
      }));
      requestAnimationFrame(update);
    };
    const anim = requestAnimationFrame(update);
    return () => cancelAnimationFrame(anim);
  }, [gameState, dogX]);

  return (
    <div className="fixed inset-0 bg-[#0047ab] flex items-center justify-center font-sans overflow-hidden">
      <div className="w-[1080px] h-[1920px] relative bg-gradient-to-b from-blue-500 to-[#003380] shadow-2xl overflow-hidden">
        {gameState === 'START' && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#0047ab]/90 p-12 text-center">
            <img src={ASSETS.logo} className=\"w-64 mb-10\" />
            <h1 className=\"text-9xl font-black text-white italic mb-10 uppercase\">Cesta<br/><span className=\"text-[#f7941d]\">RobustUS</span></h1>
            <p className=\"text-4xl text-white mb-20\">Pegue as rações e alcance 200 pontos!</p>
            <button onClick={() => setGameState('AUTH')} className=\"bg-[#f7941d] px-20 py-10 rounded-full text-white text-6xl font-black uppercase italic\">Jogar</button>
          </div>
        )}
        {gameState === 'AUTH' && <AuthScreen onStart={initializeGame} />}
        {gameState === 'PLAYING' && (
          <>
            <div className=\"absolute top-10 w-full px-10 flex justify-between text-white font-black text-5xl\">
              <div className=\"bg-white/20 p-6 rounded-3xl\">{timeLeft}s</div>
              <div className=\"bg-[#f7941d] p-6 rounded-3xl\">{score} PTS</div>
            </div>
            {items.map(i => <img key={i.id} src={i.product.img} className=\"absolute w-24\" style={{ left: `${i.x}%`, top: `${i.y}%` }} />)}
            <motion.div className=\"absolute bottom-20 flex flex-col items-center\" style={{ left: `${dogX}%` }}>
              <img src={ASSETS.dog} className=\"w-48\" />
              <img src={ASSETS.basket} className=\"w-40 -mt-10\" />
            </motion.div>
            <div className=\"absolute bottom-10 w-full px-20 flex justify-between\">
              <button className=\"bg-white/30 p-16 rounded-full text-white text-6xl\" onTouchStart={() => setDogX(d => Math.max(10, d-10))}>←</button>
              <button className=\"bg-white/30 p-16 rounded-full text-white text-6xl\" onTouchStart={() => setDogX(d => Math.min(90, d+10))}>→</button>
            </div>
          </>
        )}
        {(gameState === 'VICTORY' || gameState === 'GAMEOVER') && (
           <div className=\"absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 text-white p-12 text-center\">
             <h2 className=\"text-8xl font-black mb-10\">{gameState === 'VICTORY' ? 'VENCEU!' : 'FIM DE JOGO'}</h2>
             <button onClick={() => window.location.reload()} className=\"bg-[#f7941d] px-16 py-8 rounded-full text-5xl font-black uppercase\">Jogar Novamente</button>
           </div>
        )}
      </div>
    </div>
  );
};