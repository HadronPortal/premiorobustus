import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  ArrowLeft, 
  Timer, 
  Trophy, 
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Dog as DogIcon
} from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { AuthScreen } from './auth/AuthScreen';
import confetti from 'canvas-confetti';

const BRAND = {
  primary: "#0047ab",
  orange: "#f7941d",
  white: "#ffffff",
  darkBlue: "#003380",
};

const ASSETS = {
  logo: "https://robustus.com.br/wp-content/uploads/2025/03/logo.png",
  paw: "https://robustus.com.br/wp-content/uploads/2025/03/patinha.png",
  dog: "https://robustus.com.br/wp-content/uploads/2025/10/DOG-ROBUSTUS.png",
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
  width: number;
  height: number;
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
  const requestRef = useRef<number>();
  const lastItemTimeRef = useRef<number>(0);
  const scoreRef = useRef(0);
  const timeLeftRef = useRef(45);

  const DOG_WIDTH = 180;
  const ITEM_SIZE = 120;
  const WINNING_SCORE = 200;

  const initializeGame = (sessionData: any) => {
    setSession({
      play_id: sessionData.play_id,
      play_token: sessionData.play_token
    });
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
    const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);

    try {
      const { data, error: rpcError } = await (supabase.rpc as any)("finish_play", {
        p_play_id: session?.play_id,
        p_play_token: session?.play_token,
        p_pairs_found: won ? 5 : 0,
        p_attempts_used: 1,
        p_client_time_seconds: elapsedSeconds
      });

      if (rpcError || !data?.ok) {
        setError(data?.message || "Erro ao finalizar jogada.");
        setGameState("ERROR");
        return;
      }

      if (data.result === "won" && data.prize_code) {
        setPrizeCode(data.prize_code);
        setGameState("VICTORY");
        confetti({
          particleCount: 200,
          spread: 80,
          origin: { y: 0.5 },
          colors: [BRAND.primary, BRAND.orange, BRAND.white]
        });
      } else {
        setGameState("GAMEOVER");
      }
    } catch (err) {
      setError("Erro crítico ao finalizar.");
      setGameState("ERROR");
    }
  };

  const update = (time: number) => {
    if (gameState !== 'PLAYING') return;

    if (!lastItemTimeRef.current) lastItemTimeRef.current = time;
    const deltaTime = time - lastItemTimeRef.current;

    if (deltaTime > 800) {
      const product = GAME_PRODUCTS[Math.floor(Math.random() * GAME_PRODUCTS.length)];
      const newItem: FallingItem = {
        id: Date.now(),
        x: Math.random() * 80 + 10,
        y: -10,
        speed: 0.3 + Math.random() * 0.4,
        product,
        width: ITEM_SIZE,
        height: ITEM_SIZE
      };
      setItems(prev => [...prev, newItem]);
      lastItemTimeRef.current = time;
    }

    setItems(prev => {
      const containerHeight = containerRef.current?.clientHeight || 0;
      const containerWidth = containerRef.current?.clientWidth || 0;
      const dogXPixels = (dogX / 100) * containerWidth;
      
      return prev.map(item => ({
        ...item,
        y: item.y + item.speed * 0.8
      })).filter(item => {
        const itemYPixels = (item.y / 100) * containerHeight;
        const itemXPixels = (item.x / 100) * containerWidth;

        const dogYStart = containerHeight - 250;
        const hit = itemYPixels + ITEM_SIZE > dogYStart && 
                    itemYPixels < containerHeight - 100 &&
                    Math.abs(itemXPixels - dogXPixels) < (DOG_WIDTH / 2 + ITEM_SIZE / 2 - 20);

        if (hit) {
          scoreRef.current += item.product.points;
          setScore(scoreRef.current);
          return false;
        }

        return item.y < 110;
      });
    });

    requestRef.current = requestAnimationFrame(update);
  };

  useEffect(() => {
    if (gameState === 'PLAYING') {
      requestRef.current = requestAnimationFrame(update);
      const timer = setInterval(() => {
        timeLeftRef.current -= 1;
        setTimeLeft(timeLeftRef.current);
        if (timeLeftRef.current <= 0) {
          clearInterval(timer);
          handleGameOver(scoreRef.current);
        }
      }, 1000);
      return () => {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        clearInterval(timer);
      };
    }
  }, [gameState]);

  const handleMouseMove = (e: any) => {
    if (gameState !== 'PLAYING' || !containerRef.current) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    setDogX(Math.max(10, Math.min(90, x)));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'PLAYING') return;
      if (e.key === 'ArrowLeft') setDogX(prev => Math.max(10, prev - 5));
      if (e.key === 'ArrowRight') setDogX(prev => Math.min(90, prev + 5));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  return (
    <div className="totem-wrapper font-sans">
      <div className="totem-container flex flex-col items-center justify-start relative select-none touch-none shadow-2xl overflow-hidden bg-[#0047ab]">
        <div className="absolute inset-0 z-0">
           <div className="absolute inset-0 bg-gradient-to-b from-[#0056cf] via-[#0047ab] to-[#003380]"></div>
           <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: `url(${ASSETS.paw})`, backgroundSize: '100px' }}></div>
        </div>

        <AnimatePresence mode="wait">
          {gameState === 'START' && (
            <motion.div key="start" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 w-full flex flex-col items-center justify-between py-24 px-12 z-10">
              <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full flex justify-center mt-12">
                <div className="bg-white p-8 rounded-[3.5rem] shadow-2xl border-4 border-[#f7941d] w-80 h-80 flex items-center justify-center">
                  <img src={ASSETS.logo} alt="Logo" className="w-full h-auto object-contain" />
                </div>
              </motion.div>

              <div className="flex flex-col items-center text-center gap-12 mb-20">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-4">
                  <h1 className="text-[10rem] font-black text-white italic tracking-tighter drop-shadow-2xl leading-[0.8] uppercase">
                    DESAFIO PET<br /><span className="text-[#f7941d]">ROBUSTUS</span>
                  </h1>
                </motion.div>
                <motion.div className="bg-white/15 backdrop-blur-xl px-16 py-10 rounded-[4rem] border-2 border-white/30 shadow-2xl">
                  <p className="text-5xl font-black text-white uppercase tracking-wider leading-tight">
                    PEGUE AS RAÇÕES E FAÇA PONTOS<br /><span className="text-[#f7941d] text-6xl">PARA GANHAR UM BRINDE!</span>
                  </p>
                </motion.div>
              </div>

              <div className="w-full flex flex-col gap-6">
                <motion.button whileTap={{ scale: 0.94 }} onClick={() => setGameState('AUTH')} className="w-full bg-[#f7941d] py-14 rounded-[5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)] flex items-center justify-center gap-8 border-b-[20px] border-[#d47a00] active:border-b-0 transition-all">
                  <Play className="w-20 h-20 text-white fill-current" />
                  <span className="text-7xl font-black text-white tracking-widest uppercase italic">COMEÇAR</span>
                </motion.button>
                
                <button onClick={() => window.location.href = '/'} className="text-white/60 text-4xl font-bold hover:text-white transition-colors py-4">
                  Voltar ao jogo da memória
                </button>
              </div>
            </motion.div>
          )}

          {gameState === 'AUTH' && <AuthScreen key="auth" onStart={initializeGame} />}

          {gameState === 'PLAYING' && (
            <div 
              ref={containerRef}
              className="flex-1 w-full relative overflow-hidden z-10"
              onMouseMove={handleMouseMove}
              onTouchMove={handleMouseMove}
            >
              <div className="absolute top-10 left-0 w-full px-12 flex justify-between items-center z-20">
                <div className="bg-white p-4 rounded-3xl shadow-xl border-2 border-[#f7941d] w-48">
                  <img src={ASSETS.logo} className="w-full h-auto object-contain" alt="Logo" />
                </div>
                
                <div className="flex gap-6">
                  <div className="bg-white/95 backdrop-blur-xl px-8 py-4 rounded-[2rem] border-4 border-[#f7941d] flex flex-col items-center">
                    <span className="text-xl font-bold text-slate-400 uppercase">PONTOS</span>
                    <span className="text-5xl font-black text-[#0047ab]">{score}</span>
                  </div>
                  <div className="bg-white/95 backdrop-blur-xl px-8 py-4 rounded-[2rem] border-4 border-[#0047ab] flex flex-col items-center">
                    <span className="text-xl font-bold text-slate-400 uppercase">TEMPO</span>
                    <span className="text-5xl font-black text-[#f7941d]">{timeLeft}s</span>
                  </div>
                </div>
              </div>

              <div className="absolute top-48 left-12 right-12 z-20">
                 <div className="bg-white/20 backdrop-blur-sm h-8 rounded-full border-2 border-white/30 overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-[#f7941d] to-[#ffb85f]"
                      animate={{ width: `${Math.min(100, (score / WINNING_SCORE) * 100)}%` }}
                    />
                 </div>
                 <div className="flex justify-between mt-2">
                    <span className="text-white/70 text-2xl font-bold uppercase tracking-widest">Meta: {WINNING_SCORE} pts</span>
                    {score >= WINNING_SCORE && (
                      <span className="text-[#4ade80] text-2xl font-bold uppercase animate-pulse">Meta Atingida!</span>
                    )}
                 </div>
              </div>

              {items.map(item => (
                <div 
                  key={item.id}
                  className="absolute pointer-events-none"
                  style={{ 
                    left: `${item.x}%`, 
                    top: `${item.y}%`,
                    transform: 'translateX(-50%)',
                    width: `${ITEM_SIZE}px`,
                    height: `${ITEM_SIZE}px`
                  }}
                >
                  <div className={`w-full h-full rounded-2xl p-2 bg-white shadow-xl flex items-center justify-center border-4 ${item.product.special ? 'border-[#f7941d]' : 'border-white'}`}>
                    <img src={item.product.img} alt="" className="max-w-full max-h-full object-contain" />
                    <div className={`absolute -top-4 -right-4 w-12 h-12 rounded-full flex items-center justify-center text-white font-black text-2xl border-2 border-white shadow-lg ${item.product.special ? 'bg-[#f7941d]' : 'bg-[#0047ab]'}`}>
                      +{item.product.points}
                    </div>
                  </div>
                </div>
              ))}

              <motion.div 
                className="absolute bottom-10 pointer-events-none"
                animate={{ left: `${dogX}%` }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                style={{ 
                  width: `${DOG_WIDTH}px`,
                  transform: 'translateX(-50%)'
                }}
              >
                <img 
                  src={ASSETS.dog} 
                  alt="Cachorro" 
                  className="w-full h-auto drop-shadow-[0_20px_20px_rgba(0,0,0,0.4)]"
                  onError={(e: any) => {
                    e.target.src = "https://cdn-icons-png.flaticon.com/512/616/616408.png";
                  }}
                />
              </motion.div>
            </div>
          )}

          {gameState === 'VICTORY' && (
            <motion.div key="victory" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex-1 w-full flex flex-col items-center justify-center p-12 z-10 text-center gap-12">
              <div className="bg-white rounded-[5rem] p-16 shadow-2xl border-[12px] border-[#4ade80] flex flex-col items-center gap-10 w-full max-w-[900px]">
                <div className="bg-[#4ade80]/10 p-10 rounded-full">
                  <CheckCircle2 className="w-40 h-40 text-[#4ade80]" />
                </div>
                <div className="space-y-4">
                  <h2 className="text-9xl font-black text-[#0047ab] italic uppercase tracking-tighter">PARABÉNS!</h2>
                  <p className="text-5xl font-bold text-slate-500 uppercase">VOCÊ GANHOU UM BRINDE!</p>
                </div>
                
                <div className="w-full bg-[#0047ab]/5 rounded-[3rem] p-12 border-4 border-dashed border-[#0047ab]/20">
                  <p className="text-3xl font-bold text-[#0047ab] mb-6 uppercase tracking-widest">CÓDIGO DE RESGATE:</p>
                  <div className="text-8xl font-black text-[#f7941d] tracking-[0.2em] bg-white py-8 rounded-3xl shadow-inner border-2 border-[#0047ab]/10">
                    {prizeCode}
                  </div>
                </div>
                
                <p className="text-4xl font-bold text-slate-400 max-w-[80%] uppercase">
                  Mostre este código para retirar seu presente.
                </p>
              </div>
              <button onClick={() => setGameState('START')} className="bg-white/20 backdrop-blur-xl px-16 py-8 rounded-full text-white text-4xl font-black uppercase border-2 border-white/30">
                VOLTAR AO INÍCIO
              </button>
            </motion.div>
          )}

          {gameState === 'GAMEOVER' && (
            <motion.div key="gameover" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex-1 w-full flex flex-col items-center justify-center p-12 z-10 text-center gap-12">
              <div className="bg-white rounded-[5rem] p-16 shadow-2xl border-[12px] border-[#f7941d] flex flex-col items-center gap-10 w-full max-w-[900px]">
                <div className="bg-[#f7941d]/10 p-10 rounded-full">
                  <XCircle className="w-40 h-40 text-[#f7941d]" />
                </div>
                <div className="space-y-4">
                  <h2 className="text-8xl font-black text-[#0047ab] italic uppercase tracking-tighter">NÃO FOI DESSA VEZ!</h2>
                  <p className="text-5xl font-bold text-slate-500 uppercase">VOCÊ FEZ <span className="text-[#f7941d]">{score}</span> PONTOS</p>
                </div>
                <p className="text-4xl font-medium text-slate-400 max-w-[80%] uppercase">
                  Continue participando e conheça nossos produtos!
                </p>
              </div>
              <button onClick={() => setGameState('START')} className="bg-[#f7941d] px-20 py-10 rounded-full text-white text-5xl font-black uppercase shadow-2xl">
                TENTAR NOVAMENTE
              </button>
            </motion.div>
          )}

          {gameState === 'ERROR' && (
            <div className="flex-1 w-full flex flex-col items-center justify-center p-12 z-10 text-center gap-8">
               <div className="bg-red-50 p-12 rounded-[3rem] border-4 border-red-200">
                  <h2 className="text-5xl font-black text-red-600 mb-4">OPS!</h2>
                  <p className="text-3xl text-red-800 font-bold">{error || "Ocorreu um erro inesperado."}</p>
               </div>
               <button onClick={() => setGameState('START')} className="text-white font-bold text-3xl underline">Voltar ao início</button>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
