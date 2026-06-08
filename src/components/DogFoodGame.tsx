import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, CheckCircle2, XCircle, Timer, Award } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { AuthScreen } from './auth/AuthScreen';
import confetti from 'canvas-confetti';

const BRAND = {
  primary: "#0047ab",
  orange: "#f7941d",
  white: "#ffffff",
  grass: "#4ade80",
};

const ASSETS = {
  logo: "https://robustus.com.br/wp-content/uploads/2025/03/logo.png",
  dog: "https://robustus.com.br/wp-content/uploads/2025/10/cao-mini-768x633.png",
  basket: "https://pngimg.com/uploads/basket/basket_PNG15743.png",
};

const GAME_PRODUCTS = [
  { id: 1, name: 'Life Special Filhote', img: 'https://robustus.com.br/wp-content/uploads/2025/10/DASDASDAS-768x633.png', points: 10, special: false },
  { id: 2, name: 'Adulto Mini e Pequeno', img: 'https://robustus.com.br/wp-content/uploads/2025/10/cao-mini-768x633.png', points: 10, special: false },
  { id: 3, name: 'Adulto Médio e Grande', img: 'https://robustus.com.br/wp-content/uploads/2025/10/cao-ADULTO-768x633.png', points: 10, special: false },
  { id: 4, name: 'Especial Laranja', img: 'https://robustus.com.br/wp-content/uploads/2025/10/sdsadasdas-1-768x633.png', points: 25, special: true },
];

type GameState = 'START' | 'AUTH' | 'PLAYING' | 'VICTORY' | 'GAMEOVER' | 'ERROR';

interface FallingItem {
  id: number;
  x: number;
  y: number;
  speed: number;
  product: typeof GAME_PRODUCTS[0];
}

interface Feedback {
  id: number;
  x: number;
  y: number;
  points: number;
}

export const DogFoodGame = () => {
  const [gameState, setGameState] = useState<GameState>('START');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(45);
  const [prizeCode, setPrizeCode] = useState('');
  const [error, setError] = useState('');
  const [session, setSession] = useState<{play_id: string, play_token: string} | null>(null);
  const [startTime, setStartTime] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const [dogX, setDogX] = useState(50); 
  const [items, setItems] = useState<FallingItem[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  
  const scoreRef = useRef(0);
  const timeLeftRef = useRef(45);
  const lastItemTimeRef = useRef(0);

  const DOG_WIDTH = 200;
  const WINNING_SCORE = 200;

  const initializeGame = (sessionData: any) => {
    setSession({ play_id: sessionData.play_id, play_token: sessionData.play_token });
    setScore(0);
    scoreRef.current = 0;
    setTimeLeft(45);
    timeLeftRef.current = 45;
    setItems([]);
    setStartTime(Date.now());
    setGameState('PLAYING');
  };

  const handleGameOver = async (finalScore: number) => {
    setGameState('ERROR'); 
    const won = finalScore >= WINNING_SCORE;
    try {
      const { data, error: rpcError } = await (supabase.rpc as any)("finish_play", {
        p_play_id: session?.play_id,
        p_play_token: session?.play_token,
        p_pairs_found: won ? 5 : 0,
        p_attempts_used: 1,
        p_client_time_seconds: Math.floor((Date.now() - startTime) / 1000)
      });
      if (rpcError || !data?.ok) { setGameState("ERROR"); setError(data?.message || "Erro"); return; }
      if (data.result === "won") { setPrizeCode(data.prize_code); setGameState("VICTORY"); confetti({ particleCount: 200, spread: 80, colors: [BRAND.primary, BRAND.orange] }); }
      else { setGameState("GAMEOVER"); }
    } catch { setGameState("ERROR"); }
  };

  const update = useCallback((time: number) => {
    if (gameState !== 'PLAYING') return;
    
    if (time - lastItemTimeRef.current > 800) {
      const product = GAME_PRODUCTS[Math.floor(Math.random() * GAME_PRODUCTS.length)];
      setItems(prev => [...prev, { id: Date.now(), x: Math.random() * 80 + 10, y: -10, speed: 0.4 + Math.random() * 0.3, product }]);
      lastItemTimeRef.current = time;
    }

    setItems(prev => {
      const containerWidth = containerRef.current?.clientWidth || 1000;
      const dogXPixels = (dogX / 100) * containerWidth;
      
      const newItems = prev.map(item => ({ ...item, y: item.y + item.speed }));
      
      return newItems.filter(item => {
        const itemXPixels = (item.x / 100) * containerWidth;
        const itemYPixels = (item.y / 100) * 1920; 

        if (itemYPixels > 1650 && itemYPixels < 1750 && Math.abs(itemXPixels - dogXPixels) < 120) {
          scoreRef.current += item.product.points;
          setScore(scoreRef.current);
          setFeedbacks(f => [...f, { id: Date.now(), x: item.x, y: 1650, points: item.product.points }]);
          return false;
        }
        return item.y < 110;
      });
    });
    requestAnimationFrame(update);
  }, [gameState, dogX]);

  useEffect(() => {
    if (gameState === 'PLAYING') {
      const anim = requestAnimationFrame(update);
      const timer = setInterval(() => {
        timeLeftRef.current -= 1;
        setTimeLeft(timeLeftRef.current);
        if (timeLeftRef.current <= 0) { clearInterval(timer); handleGameOver(scoreRef.current); }
      }, 1000);
      return () => { cancelAnimationFrame(anim); clearInterval(timer); };
    }
  }, [gameState, update]);

  return (
    <div className="fixed inset-0 bg-[#0047ab] overflow-hidden flex items-center justify-center">
      <div className="w-[1080px] h-[1920px] relative bg-gradient-to-b from-[#0056cf] to-[#003380] overflow-hidden shadow-2xl">
        {/* Environment */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/pawprints.png')] opacity-10"></div>
        <div className="absolute bottom-0 w-full h-[20%] bg-gradient-to-t from-green-800 to-transparent"></div>
        <div className="absolute left-10 top-20 w-40 h-[60%] border-l-4 border-white/20"></div>
        
        {/* Header */}
        <div className="absolute top-0 w-full p-8 flex justify-between items-center z-20">
          <img src={ASSETS.logo} className="w-48" />
          <div className="flex gap-4">
             <div className="bg-white/10 p-6 rounded-3xl text-white font-black text-4xl flex items-center gap-4">
               <Timer /> {timeLeft}s
             </div>
             <div className="bg-[#f7941d] p-6 rounded-3xl text-white font-black text-4xl">
               {score} Pts
             </div>
          </div>
        </div>

        {/* Game Area */}
        <div ref={containerRef} className="absolute inset-0 z-10" onMouseMove={(e) => setDogX(Math.min(90, Math.max(10, ((e.clientX - 0) / 1080) * 100)))}>
          {items.map(item => (
            <motion.img key={item.id} src={item.product.img} className="absolute w-24" style={{ left: `${item.x}%`, top: `${item.y}%` }} />
          ))}

          {feedbacks.map(f => (
            <motion.div key={f.id} initial={{ opacity: 1, y: f.y }} animate={{ opacity: 0, y: f.y - 100 }} className="absolute text-[#f7941d] font-black text-6xl">+{f.points}</motion.div>
          ))}

          {/* Dog Player */}
          <motion.div className="absolute bottom-24 flex flex-col items-center" style={{ left: `${dogX}%`, width: `${DOG_WIDTH}px`, x: '-50%' }}>
            <motion.div animate={{ y: [0, -20, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
              <img src={ASSETS.dog} className="w-48 h-auto drop-shadow-2xl" />
              <img src={ASSETS.basket} className="w-32 -mt-16 mx-auto drop-shadow-lg" />
            </motion.div>
            <div className="w-32 h-6 bg-black/30 rounded-full blur-md mt-4"></div>
          </motion.div>
        </div>

        {/* Controls */}
        <div className="absolute bottom-10 w-full px-10 flex justify-between z-30">
          <button className="bg-white/20 p-12 rounded-full text-white font-black text-6xl active:bg-white/40" onTouchStart={() => setDogX(d => Math.max(10, d-10))}>←</button>
          <button className="bg-white/20 p-12 rounded-full text-white font-black text-6xl active:bg-white/40" onTouchStart={() => setDogX(d => Math.min(90, d+10))}>→</button>
        </div>

        {gameState === 'START' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-40 bg-[#0047ab]/90">
             <h1 className="text-9xl font-black text-white italic uppercase text-center mb-20">Desafio Pet<br/><span className="text-[#f7941d]">RobustUS</span></h1>
             <button onClick={() => setGameState('AUTH')} className="bg-[#f7941d] px-20 py-10 rounded-full text-white text-6xl font-black italic shadow-2xl">JOGAR</button>
          </div>
        )}
      </div>
    </div>
  );
};
