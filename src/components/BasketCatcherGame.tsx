import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer } from 'lucide-react';
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
      if (error || !data?.ok) { 
        console.error("Error finishing play:", error || data?.message);
        setGameState("ERROR"); 
        return; 
      }
      if (data.result === "won") { 
        setGameState("VICTORY"); 
        confetti({ particleCount: 200, spread: 80, colors: [BRAND.primary, BRAND.orange] });
      } else { 
        setGameState("GAMEOVER"); 
      }
    } catch (err) { 
      console.error("Critical error:", err);
      setGameState("ERROR"); 
    }
  };

  useEffect(() => {
    if (gameState !== 'PLAYING') return;
    const interval = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { 
          handleGameOver(scoreRef.current >= 200); 
          return 0; 
        }
        return t - 1;
      });
      setItems(prev => [...prev, { 
        id: Date.now(), 
        x: Math.random() * 80 + 10, 
        y: -10, 
        speed: 0.6 + Math.random() * 0.4, 
        product: GAME_PRODUCTS[Math.floor(Math.random() * GAME_PRODUCTS.length)] 
      }]);
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState, session]);

  useEffect(() => {
    if (gameState !== 'PLAYING') return;
    let animId: number;
    const update = () => {
      setItems(prev => prev.map(i => ({...i, y: i.y + i.speed })).filter(i => {
        const dogXPercent = dogX;
        const itemXPercent = i.x;
        // Collision detection
        if (i.y > 80 && i.y < 90 && Math.abs(itemXPercent - dogXPercent) < 15) {
          scoreRef.current += i.product.points;
          setScore(scoreRef.current);
          return false;
        }
        return i.y < 105;
      }));
      animId = requestAnimationFrame(update);
    };
    animId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animId);
  }, [gameState, dogX]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'PLAYING') return;
      if (e.key === 'ArrowLeft') setDogX(d => Math.max(10, d - 5));
      if (e.key === 'ArrowRight') setDogX(d => Math.min(90, d + 5));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  return (
    <div className="fixed inset-0 bg-[#0047ab] flex items-center justify-center font-sans overflow-hidden">
      <div className="w-[1080px] h-[1920px] relative bg-gradient-to-b from-blue-500 to-[#003380] shadow-2xl overflow-hidden">
        <AnimatePresence>
          {gameState === 'START' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#0047ab]/95 p-12 text-center"
            >
              <img src={ASSETS.logo} className="w-80 mb-16" alt="Logo" />
              <h1 className="text-[10rem] font-black text-white italic mb-10 leading-none uppercase tracking-tighter">
                CESTA<br/><span className="text-[#f7941d]">ROBUSTUS</span>
              </h1>
              <div className="bg-white/10 backdrop-blur-md p-12 rounded-[4rem] border-2 border-white/20 mb-20">
                <p className="text-5xl font-bold text-white uppercase tracking-widest">
                  PEGUE AS RAÇÕES E ALCANCE<br/>
                  <span className="text-7xl text-[#f7941d] font-black">200 PONTOS</span>
                </p>
              </div>
              <motion.button 
                whileTap={{ scale: 0.95 }}
                onClick={() => setGameState('AUTH')} 
                className="bg-[#f7941d] border-b-[20px] border-[#d47a00] active:border-b-0 px-24 py-12 rounded-[5rem] text-white text-7xl font-black uppercase italic shadow-2xl transition-all"
              >
                COMEÇAR
              </motion.button>
            </motion.div>
          )}

          {gameState === 'AUTH' && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#0047ab]">
              <AuthScreen onStart={initializeGame} />
            </div>
          )}

          {gameState === 'PLAYING' && (
            <div className="w-full h-full relative">
              {/* Patterns */}
              <div className="absolute inset-0 bg-[url('https://robustus.com.br/wp-content/uploads/2025/03/patinha.png')] opacity-5 bg-repeat scale-50"></div>
              
              {/* Header */}
              <div className="absolute top-16 w-full px-16 flex justify-between items-center z-20">
                <div className="bg-white/20 backdrop-blur-xl p-8 rounded-[3rem] flex items-center gap-6 text-white border border-white/30">
                  <Timer className="w-16 h-16 text-[#f7941d]" />
                  <span className="text-7xl font-black">{timeLeft}s</span>
                </div>
                <div className="bg-[#f7941d] p-8 rounded-[3rem] text-white border-b-8 border-[#d47a00] shadow-xl">
                  <span className="text-7xl font-black">{score} PTS</span>
                </div>
              </div>

              {/* Items */}
              {items.map(i => (
                <img 
                  key={i.id} 
                  src={i.product.img} 
                  className="absolute w-32 drop-shadow-2xl" 
                  style={{ left: `${i.x}%`, top: `${i.y}%`, transform: 'translateX(-50%)' }} 
                  alt="Item"
                />
              ))}

              {/* Dog Player */}
              <motion.div 
                className="absolute bottom-40 flex flex-col items-center z-30" 
                style={{ left: `${dogX}%`, transform: 'translateX(-50%)' }}
                animate={{ x: '-50%' }}
              >
                <div className="relative flex flex-col items-center">
                   <img src={ASSETS.dog} className="w-64 drop-shadow-2xl" alt="Dog" />
                   <img src={ASSETS.basket} className="w-56 -mt-20 drop-shadow-xl relative z-10" alt="Basket" />
                </div>
                <div className="w-48 h-8 bg-black/30 rounded-full blur-lg mt-4"></div>
              </motion.div>

              {/* Controls */}
              <div className="absolute bottom-16 w-full px-20 flex justify-between z-40">
                <motion.button 
                  whileTap={{ scale: 0.9 }}
                  className="bg-white/20 backdrop-blur-xl p-16 rounded-full text-white text-8xl border-4 border-white/30 shadow-2xl active:bg-[#f7941d]/50 transition-colors" 
                  onTouchStart={(e) => { e.preventDefault(); setDogX(d => Math.max(10, d - 10)); }}
                >
                  ←
                </motion.button>
                <motion.button 
                  whileTap={{ scale: 0.9 }}
                  className="bg-white/20 backdrop-blur-xl p-16 rounded-full text-white text-8xl border-4 border-white/30 shadow-2xl active:bg-[#f7941d]/50 transition-colors" 
                  onTouchStart={(e) => { e.preventDefault(); setDogX(d => Math.min(90, d + 10)); }}
                >
                  →
                </motion.button>
              </div>
            </div>
          )}

          {(gameState === 'VICTORY' || gameState === 'GAMEOVER' || gameState === 'ERROR') && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-[#0047ab]/95 p-12 text-center"
            >
              {gameState === 'VICTORY' ? (
                <>
                  <div className="bg-white p-12 rounded-full mb-12 shadow-2xl border-8 border-[#4ade80]">
                    <Gift className="w-40 h-40 text-[#4ade80]" />
                  </div>
                  <h2 className="text-[12rem] font-black text-white italic mb-6 leading-none uppercase">VENCEU!</h2>
                  <div className="bg-white/10 backdrop-blur-md p-12 rounded-[4rem] border-2 border-white/20 mb-20 max-w-4xl">
                    <p className="text-4xl font-bold text-white uppercase tracking-widest mb-6">PARABÉNS! VOCÊ ALCANÇOU A META!</p>
                    <div className="bg-white p-8 rounded-3xl border-4 border-[#f7941d]">
                      <p className="text-2xl font-bold text-slate-400 uppercase mb-2">Seu código de brinde:</p>
                      <p className="text-8xl font-black text-[#0047ab] tracking-tighter italic">ROBUSTUS-GANHOU</p>
                      <p className="text-xl font-bold text-slate-500 mt-4 uppercase">Mostre esta tela para a equipe no stand</p>
                    </div>
                  </div>
                </>
              ) : gameState === 'GAMEOVER' ? (
                <>
                  <div className="bg-white p-12 rounded-full mb-12 shadow-2xl border-8 border-red-500">
                    <Timer className="w-40 h-40 text-red-500" />
                  </div>
                  <h2 className="text-[10rem] font-black text-white italic mb-6 leading-none uppercase">FIM DE TEMPO</h2>
                  <div className="bg-white/10 backdrop-blur-md p-12 rounded-[4rem] border-2 border-white/20 mb-20">
                    <p className="text-5xl font-bold text-white uppercase tracking-widest mb-4">VOCÊ FEZ {score} PONTOS</p>
                    <p className="text-3xl text-white/70 uppercase font-bold tracking-widest">A META ERA 200 PONTOS</p>
                  </div>
                </>
              ) : (
                <>
                   <h2 className="text-8xl font-black text-white italic mb-10">OPS! ALGO DEU ERRADO</h2>
                   <p className="text-4xl text-white mb-20 uppercase font-bold">OCORREU UM ERRO AO PROCESSAR SUA VITÓRIA.<br/>FALE COM A EQUIPE DO STAND.</p>
                </>
              )}
              
              <motion.button 
                whileTap={{ scale: 0.95 }}
                onClick={() => window.location.reload()} 
                className="bg-white px-24 py-12 rounded-[5rem] text-[#0047ab] text-6xl font-black uppercase italic shadow-2xl"
              >
                VOLTAR AO INÍCIO
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};