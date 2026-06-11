import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, Gift, Dog, Cat, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { AuthScreen } from './auth/AuthScreen';
import confetti from 'canvas-confetti';

const BRAND = {
  primary: "#0047ab",
  orange: "#f7941d",
  white: "#ffffff",
};

const ASSETS = {
  logo: "https://robustus.com.br/wp-content/uploads/2025/03/logo.png",
  dog: "https://robustus.com.br/wp-content/uploads/2025/10/cao-mini-768x633.png",
  cat: "https://robustus.com.br/wp-content/uploads/2025/10/ojkfgosd-1024x696.png", // Using this as cat mascot
  basket: "https://pngimg.com/uploads/basket/basket_PNG15743.png",
};

const GAME_PRODUCTS = [
  { id: 1, name: 'Life Special Filhote', img: 'https://robustus.com.br/wp-content/uploads/2025/10/DASDASDAS-768x633.png', pet: 'DOG', type: 'LIFE_SPECIAL' },
  { id: 2, name: 'Adulto Mini', img: 'https://robustus.com.br/wp-content/uploads/2025/10/cao-mini-768x633.png', pet: 'DOG', type: 'NORMAL' },
  { id: 3, name: 'Adulto Grande', img: 'https://robustus.com.br/wp-content/uploads/2025/10/cao-ADULTO-768x633.png', pet: 'DOG', type: 'NORMAL' },
  { id: 4, name: 'Gato Castrado', img: 'https://robustus.com.br/wp-content/uploads/2025/10/sdsadasdas-1-768x633.png', pet: 'CAT', type: 'LIFE_SPECIAL' },
  { id: 5, name: 'Gato Adulto', img: 'https://robustus.com.br/wp-content/uploads/2025/10/DASDASDAS-2-768x633.png', pet: 'CAT', type: 'LIFE_SPECIAL' },
];

type GameState = 'START' | 'CHOICE' | 'AUTH' | 'PLAYING' | 'VICTORY' | 'GAMEOVER' | 'ERROR';
type PetType = 'DOG' | 'CAT';

export const BasketCatcherGame = () => {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<GameState>('START');
  const [petChoice, setPetChoice] = useState<PetType | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(45);
  const [prizeCode, setPrizeCode] = useState('');
  const [session, setSession] = useState<{play_id: string, play_token: string} | null>(null);
  const [playerX, setPlayerX] = useState(50);
  const [items, setItems] = useState<{id: number, x: number, y: number, speed: number, product: any}[]>([]);
  const [feedbacks, setFeedbacks] = useState<{id: number, x: number, y: number, points: number}[]>([]);
  
  const scoreRef = useRef(0);
  const startTimeRef = useRef(0);
  const MAX_SCORE = 250;

  const initializeGame = (sessionData: any) => {
    setSession({ play_id: sessionData.play_id, play_token: sessionData.play_token });
    setScore(0);
    scoreRef.current = 0;
    setTimeLeft(45);
    setItems([]);
    setFeedbacks([]);
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
        setPrizeCode(data.prize_code || "ERRO-CODIGO");
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
        const playerXPercent = playerX;
        const itemXPercent = i.x;
        // Collision detection
        if (i.y > 80 && i.y < 90 && Math.abs(itemXPercent - playerXPercent) < 15) {
          const isCorrectPet = i.product.pet === petChoice;
          const pointValue = i.product.type === 'LIFE_SPECIAL' ? 10 : 5;
          const finalPoints = isCorrectPet ? pointValue : -pointValue;
          
          scoreRef.current = Math.max(0, Math.min(MAX_SCORE, scoreRef.current + finalPoints));
          setScore(scoreRef.current);
          
          setFeedbacks(f => [...f, { id: Date.now(), x: i.x, y: i.y, points: finalPoints }]);
          
          return false;
        }
        return i.y < 105;
      }));
      animId = requestAnimationFrame(update);
    };
    animId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animId);
  }, [gameState, playerX, petChoice]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'PLAYING') return;
      if (e.key === 'ArrowLeft') setPlayerX(d => Math.max(10, d - 5));
      if (e.key === 'ArrowRight') setPlayerX(d => Math.min(90, d + 5));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  const handlePlayAgain = () => {
    setGameState('CHOICE');
    setPetChoice(null);
    setScore(0);
    scoreRef.current = 0;
    setPrizeCode('');
  };

  return (
    <div className="fixed inset-0 bg-[#0047ab] flex items-center justify-center font-sans overflow-hidden">
      <div className="w-[1080px] h-[1920px] relative bg-gradient-to-b from-blue-500 to-[#003380] shadow-2xl overflow-hidden">
        <AnimatePresence mode="wait">
          {gameState === 'START' && (
            <motion.div 
              key="start"
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
                <p className="text-4xl font-bold text-white uppercase tracking-widest leading-tight">
                  PEGUE AS RAÇÕES DO SEU PET!<br/>
                  <span className="text-2xl text-white/80 block mt-4">Normal: 5 pontos. Life Special: 10 pontos. Máximo: 250 pontos.</span>
                </p>
              </div>
              <div className="flex flex-col gap-6">
                <motion.button 
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setGameState('CHOICE')} 
                  className="bg-[#f7941d] border-b-[20px] border-[#d47a00] active:border-b-0 px-24 py-12 rounded-[5rem] text-white text-7xl font-black uppercase italic shadow-2xl transition-all"
                >
                  COMEÇAR
                </motion.button>
                <button 
                  onClick={() => window.location.href = '/'}
                  className="text-white/60 text-4xl font-bold uppercase italic mt-10 hover:text-white transition-colors flex items-center justify-center gap-4"
                >
                  <ArrowLeft className="w-10 h-10" /> Voltar ao Memória
                </button>
              </div>
            </motion.div>
          )}

          {gameState === 'CHOICE' && (
            <motion.div 
              key="choice"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#0047ab] p-12 text-center"
            >
              <h2 className="text-8xl font-black text-white italic mb-20 uppercase">Escolha seu Pet</h2>
              <div className="flex gap-12">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { setPetChoice('DOG'); setGameState('AUTH'); }}
                  className={`flex flex-col items-center gap-6 p-12 rounded-[4rem] border-8 transition-all ${petChoice === 'DOG' ? 'bg-[#f7941d] border-white' : 'bg-white/10 border-white/20'}`}
                >
                  <div className="bg-white p-8 rounded-full">
                    <Dog className="w-32 h-32 text-[#0047ab]" />
                  </div>
                  <span className="text-6xl font-black text-white uppercase italic">Cachorro</span>
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { setPetChoice('CAT'); setGameState('AUTH'); }}
                  className={`flex flex-col items-center gap-6 p-12 rounded-[4rem] border-8 transition-all ${petChoice === 'CAT' ? 'bg-[#f7941d] border-white' : 'bg-white/10 border-white/20'}`}
                >
                  <div className="bg-white p-8 rounded-full">
                    <Cat className="w-32 h-32 text-[#0047ab]" />
                  </div>
                  <span className="text-6xl font-black text-white uppercase italic">Gato</span>
                </motion.button>
              </div>
            </motion.div>
          )}

          {gameState === 'AUTH' && (
            <motion.div key="auth" className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#0047ab]">
              <AuthScreen onStart={initializeGame} onClose={() => setGameState('CHOICE')} />
            </motion.div>
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
                <div className="bg-[#f7941d] p-8 rounded-[3rem] text-white border-b-8 border-[#d47a00] shadow-xl min-w-[300px] text-center">
                  <span className="text-7xl font-black">{score} / {MAX_SCORE}</span>
                </div>
              </div>

              {/* Feedbacks */}
              <div className="absolute inset-0 pointer-events-none z-50">
                <AnimatePresence>
                  {feedbacks.map(f => (
                    <motion.div 
                      key={f.id} 
                      initial={{ opacity: 1, y: f.y + '%' }} 
                      animate={{ opacity: 0, y: (f.y - 10) + '%' }} 
                      exit={{ opacity: 0 }}
                      className={`absolute text-8xl font-black ${f.points > 0 ? 'text-green-400' : 'text-red-500'}`}
                      style={{ left: f.x + '%', transform: 'translateX(-50%)' }}
                    >
                      {f.points > 0 ? `+${f.points}` : f.points}
                    </motion.div>
                  ))}
                </AnimatePresence>
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

              {/* Player */}
              <motion.div 
                className="absolute bottom-40 flex flex-col items-center z-30" 
                style={{ left: `${playerX}%`, transform: 'translateX(-50%)' }}
                animate={{ x: '-50%' }}
              >
                <div className="relative flex flex-col items-center">
                   <img src={petChoice === 'DOG' ? ASSETS.dog : ASSETS.cat} className="w-64 drop-shadow-2xl object-contain h-64" alt="Player" />
                   <img src={ASSETS.basket} className="w-56 -mt-16 drop-shadow-xl relative z-10" alt="Basket" />
                </div>
                <div className="w-48 h-8 bg-black/30 rounded-full blur-lg mt-4"></div>
              </motion.div>

              {/* Controls */}
              <div className="absolute bottom-16 w-full px-20 flex justify-between z-40">
                <motion.button 
                  whileTap={{ scale: 0.9 }}
                  className="bg-white/20 backdrop-blur-xl p-16 rounded-full text-white text-8xl border-4 border-white/30 shadow-2xl active:bg-[#f7941d]/50 transition-colors" 
                  onTouchStart={(e) => { e.preventDefault(); setPlayerX(d => Math.max(10, d - 10)); }}
                  onMouseDown={(e) => { e.preventDefault(); setPlayerX(d => Math.max(10, d - 10)); }}
                >
                  ←
                </motion.button>
                <motion.button 
                  whileTap={{ scale: 0.9 }}
                  className="bg-white/20 backdrop-blur-xl p-16 rounded-full text-white text-8xl border-4 border-white/30 shadow-2xl active:bg-[#f7941d]/50 transition-colors" 
                  onTouchStart={(e) => { e.preventDefault(); setPlayerX(d => Math.min(90, d + 10)); }}
                  onMouseDown={(e) => { e.preventDefault(); setPlayerX(d => Math.min(90, d + 10)); }}
                >
                  →
                </motion.button>
              </div>
            </div>
          )}

          {(gameState === 'VICTORY' || gameState === 'GAMEOVER' || gameState === 'ERROR') && (
            <motion.div 
              key="result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-[#0047ab]/95 p-12 text-center"
            >
              <img src={ASSETS.logo} className="w-64 mb-12" alt="RobustUS Logo" />
              
              {gameState === 'VICTORY' ? (
                <>
                  <div className="bg-white p-12 rounded-full mb-12 shadow-2xl border-8 border-[#4ade80]">
                    <Gift className="w-40 h-40 text-[#4ade80]" />
                  </div>
                  <h2 className="text-[10rem] font-black text-white italic mb-6 leading-none uppercase">VENCEU!</h2>
                  <div className="bg-white/10 backdrop-blur-md p-12 rounded-[4rem] border-2 border-white/20 mb-20 max-w-4xl w-full">
                    <p className="text-4xl font-bold text-white uppercase tracking-widest mb-6">PONTUAÇÃO FINAL: {score}</p>
                    <div className="bg-white p-8 rounded-3xl border-4 border-[#f7941d]">
                      <p className="text-2xl font-bold text-slate-400 uppercase mb-2">Seu código de brinde:</p>
                      <p className="text-8xl font-black text-[#0047ab] tracking-tighter italic">{prizeCode}</p>
                      <p className="text-xl font-bold text-slate-500 mt-4 uppercase">Mostre esta tela para a equipe no stand</p>
                    </div>
                  </div>
                </>
              ) : gameState === 'GAMEOVER' ? (
                <>
                  <div className="bg-white p-12 rounded-full mb-12 shadow-2xl border-8 border-red-500">
                    <Timer className="w-40 h-40 text-red-500" />
                  </div>
                  <h2 className="text-[10rem] font-black text-white italic mb-6 leading-none uppercase">FIM DE JOGO</h2>
                  <div className="bg-white/10 backdrop-blur-md p-12 rounded-[4rem] border-2 border-white/20 mb-20 w-full">
                    <p className="text-6xl font-black text-white uppercase tracking-widest mb-4">PONTUAÇÃO FINAL: {score}</p>
                    <p className="text-3xl text-white/70 uppercase font-bold tracking-widest">OBRIGADO POR PARTICIPAR!</p>
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
                onClick={handlePlayAgain} 
                className="bg-[#f7941d] px-24 py-12 rounded-[5rem] text-white text-6xl font-black uppercase italic shadow-2xl"
              >
                JOGAR NOVAMENTE
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};