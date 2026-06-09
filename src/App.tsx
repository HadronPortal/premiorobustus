import React, { useState, useEffect, useCallback } from 'react';
import { 
  Trophy, 
  RotateCcw, 
  Play, 
  CheckCircle2, 
  PawPrint,
  Clock,
  Zap,
  XCircle,
  Clock as ClockIcon,
  Timer
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from "@/integrations/supabase/client";
import { AuthScreen } from './components/auth/AuthScreen';
import { AdminScreen } from './components/admin/AdminScreen';
import { DogFoodGame } from './components/DogFoodGame';
import { BasketCatcherGame } from './components/BasketCatcherGame';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';

// Configuração da Marca RobustUS
const BRAND = {
  name: "RobustUS",
  primary: "#0047ab",
  orange: "#f7941d",
  white: "#ffffff",
  darkBlue: "#003380",
};

const ASSETS = {
  bgHero: "https://robustus.com.br/wp-content/uploads/2025/10/site-scaled.jpg",
  logo: "https://robustus.com.br/wp-content/uploads/2025/03/logo.png",
  paw: "https://robustus.com.br/wp-content/uploads/2025/03/patinha.png",
};

const PRODUCTS = [
  { id: 1, name: 'Life Special Filhote', line: 'Cão Filhote', img: 'https://robustus.com.br/wp-content/uploads/2025/10/DASDASDAS-768x633.png' },
  { id: 2, name: 'Adulto Mini e Pequeno', line: 'Cão Adulto', img: 'https://robustus.com.br/wp-content/uploads/2025/10/cao-mini-768x633.png' },
  { id: 3, name: 'Adulto Médio e Grande', line: 'Cão Adulto', img: 'https://robustus.com.br/wp-content/uploads/2025/10/cao-ADULTO-768x633.png' },
  { id: 4, name: 'Gato Castrado', line: 'Life Special', img: 'https://robustus.com.br/wp-content/uploads/2025/10/sdsadasdas-1-768x633.png' },
  { id: 5, name: 'Gato Adulto', line: 'Life Special', img: 'https://robustus.com.br/wp-content/uploads/2025/10/DASDASDAS-2-768x633.png' },
];

type GameState = 'START' | 'AUTH' | 'PLAYING' | 'VICTORY' | 'GAMEOVER' | 'ADMIN' | 'ERROR';

interface Card {
  instanceId: number;
  productId: number;
  name: string;
  line: string;
  img: string;
  isFlipped: boolean;
  isMatched: boolean;
}

interface PlaySession {
  play_id: string;
  play_token: string;
  max_attempts: number;
  max_seconds: number;
}

const GameContent = () => {
  const location = useLocation();
  const [gameState, setGameState] = useState<GameState>('START');
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [prizeCode, setPrizeCode] = useState('');
  const [lockBoard, setLockBoard] = useState(false);
  const [matches, setMatches] = useState(0);
  
  // Estados da Sessão
  const [session, setSession] = useState<PlaySession | null>(null);
  const [attemptsUsed, setAttemptsUsed] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [error, setError] = useState('');

  // Verificar rota de admin
  useEffect(() => {
    // Adiciona classe para o modo totem se não estiver no admin
    if (location.pathname !== '/validar-brinde') {
      document.documentElement.classList.add('totem-mode');
    } else {
      document.documentElement.classList.remove('totem-mode');
    }
  }, [location.pathname]);

  const initializeGame = (sessionData: any) => {
    const playSession: PlaySession = {
      play_id: sessionData.play_id,
      play_token: sessionData.play_token,
      max_attempts: sessionData.max_attempts || 20,
      max_seconds: sessionData.max_seconds || 60
    };

    const gameCards: Card[] = [...PRODUCTS, ...PRODUCTS].map((product, index) => ({
      ...product,
      instanceId: index,
      productId: product.id,
      isFlipped: false,
      isMatched: false,
    }));

    setSession(playSession);
    setCards(gameCards.sort(() => Math.random() - 0.5));
    setFlippedCards([]);
    setMatches(0);
    setAttemptsUsed(0);
    setTimeLeft(playSession.max_seconds);
    setStartTime(Date.now());
    setLockBoard(false);
    setGameState('PLAYING');
  };

  // Timer do jogo
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (gameState === 'PLAYING' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleGameOver('time');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft]);

  const handleGameOver = async (reason: 'time' | 'attempts' | 'won') => {
    if (gameState !== 'PLAYING') return;
    setLockBoard(true);
    
    const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
    const playId = session?.play_id;
    const playToken = session?.play_token;
    
    // Garantir que enviamos 5 se for vitória, mesmo que o estado 'matches' ainda não tenha atualizado
    const finalPairsFound = reason === 'won' ? 5 : matches;

    try {
      console.log("CALLING FINISH_PLAY WITH:", {
        p_play_id: playId,
        p_play_token: playToken,
        p_pairs_found: finalPairsFound,
        p_attempts_used: attemptsUsed,
        p_client_time_seconds: elapsedSeconds
      });

      const { data, error: rpcError } = await (supabase.rpc as any)("finish_play", {
        p_play_id: playId,
        p_play_token: playToken,
        p_pairs_found: finalPairsFound,
        p_attempts_used: attemptsUsed,
        p_client_time_seconds: elapsedSeconds
      });

      console.log("FINISH_PLAY_DATA:", data);
      console.error("FINISH_PLAY_ERROR:", rpcError);

      if (rpcError) {
        setError("Não foi possível finalizar a jogada. Chame a equipe do stand.");
        setGameState("ERROR");
        return;
      }

      if (!data?.ok) {
        setError(data?.message || "Não foi possível finalizar a jogada.");
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
        return;
      }

      if (data.result === "lost") {
        console.log("Motivo da derrota:", {
          pairs_found: data.pairs_found,
          attempts_used: data.attempts_used,
          time_seconds: data.time_seconds,
          max_attempts: data.max_attempts,
          max_seconds: data.max_seconds
        });
        setGameState("GAMEOVER");
        return;
      }

      setError("Não foi possível gerar seu código. Chame a equipe do stand.");
      setGameState("ERROR");
    } catch (err) {
      console.error("Erro crítico ao finalizar:", err);
      setError("Não foi possível gerar seu código. Chame a equipe do stand.");
      setGameState("ERROR");
    }
  };

  const handleCardClick = (instanceId: number) => {
    if (lockBoard || gameState !== 'PLAYING') return;
    const card = cards.find(c => c.instanceId === instanceId);
    if (!card || card.isFlipped || card.isMatched) return;

    const newCards = cards.map(c => 
      c.instanceId === instanceId ? { ...c, isFlipped: true } : c
    );
    setCards(newCards);

    const newFlipped = [...flippedCards, instanceId];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setLockBoard(true);
      
      const [firstId, secondId] = newFlipped;
      const firstCard = cards.find(c => c.instanceId === firstId)!;
      const secondCard = newCards.find(c => c.instanceId === secondId)!;
      
      const newAttempts = attemptsUsed + 1;
      setAttemptsUsed(newAttempts);

      if (firstCard.productId === secondCard.productId) {
        setTimeout(() => {
          const updatedCards = newCards.map(c => 
            c.productId === firstCard.productId ? { ...c, isMatched: true } : c
          );
          setCards(updatedCards);
          const newMatches = matches + 1;
          setMatches(newMatches);
          setFlippedCards([]);
          setLockBoard(false);
          
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.7 },
            colors: [BRAND.primary, BRAND.orange, BRAND.white]
          });

          if (newMatches === PRODUCTS.length) {
            handleGameOver('won');
          }
        }, 600);
      } else {
        setTimeout(() => {
          setCards(prev => prev.map(c => 
            c.instanceId === firstId || c.instanceId === secondId ? { ...c, isFlipped: false } : c
          ));
          setFlippedCards([]);
          setLockBoard(false);

          if (session && newAttempts >= session.max_attempts) {
            handleGameOver('attempts');
          }
        }, 1000);
      }
    }
  };

  // Auto-reset após vitória ou derrota
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (gameState === 'VICTORY' || gameState === 'GAMEOVER') {
      timer = setTimeout(() => {
        setGameState('START');
        setSession(null);
      }, gameState === 'VICTORY' ? 20000 : 15000);
    }
    return () => clearTimeout(timer);
  }, [gameState]);

  // A rota /validar-brinde agora é tratada diretamente no App.tsx
  // para evitar o container do totem e seus estilos restritivos.

  return (
    <div className="totem-wrapper">
      <div className="totem-container flex flex-col items-center justify-start relative select-none touch-none shadow-2xl overflow-hidden">
      
      {/* Background Container */}
      <div className="absolute inset-0 z-0">
        {(gameState === 'START' || gameState === 'AUTH') ? (
          <div className="w-full h-full relative overflow-hidden">
            <img src={ASSETS.bgHero} alt="Hero" className="absolute inset-0 w-full h-full object-cover object-[center_30%]" />
            <div className="absolute inset-0 bg-[#0047ab]/40"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-[#00348c]/35 via-transparent to-[#00348c]/90"></div>
            <div className="absolute inset-0 backdrop-blur-[1px]"></div>
          </div>
        ) : (
          <div className="absolute inset-0 bg-[#0047ab]">
            <div className="absolute inset-0 bg-gradient-to-b from-[#0056cf] via-[#0047ab] to-[#003380]"></div>
            <div className="absolute inset-0 bg-paw-pattern opacity-[0.06]"></div>
            <div className="absolute top-[-15%] left-[-25%] w-[150%] h-[50%] bg-blue-400/10 rounded-full blur-[100px] animate-pulse"></div>
            <div className="absolute bottom-[-20%] right-[-25%] w-[150%] h-[60%] bg-orange-400/5 rounded-full blur-[120px]"></div>
            <div className="absolute bottom-0 left-0 w-full h-[40%] bg-white/5 clip-path-ellipse"></div>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {gameState === 'START' && (
          <motion.div key="start" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 w-full flex flex-col items-center justify-between py-12 px-6 sm:py-24 sm:px-12 z-10">
            <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full flex justify-center mt-4 sm:mt-12">
              <div className="bg-white p-4 sm:p-8 rounded-[2rem] sm:rounded-[3.5rem] shadow-2xl border-4 border-[#f7941d] w-48 h-48 sm:w-80 sm:h-80 flex items-center justify-center">
                <img src={ASSETS.logo} alt="Logo" className="w-full h-auto object-contain" />
              </div>
            </motion.div>

            <div className="flex flex-col items-center text-center gap-6 sm:gap-12 mb-10 sm:mb-20">
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }} className="space-y-2">
                <h1 className="text-5xl sm:text-[10rem] font-black text-white italic tracking-tighter drop-shadow-[0_5px_5px_rgba(0,0,0,0.6)] leading-[1] sm:leading-[0.8] uppercase">
                  DESAFIO DA<br /><span className="text-[#f7941d]">MEMÓRIA</span>
                </h1>
              </motion.div>
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="bg-white/15 backdrop-blur-xl px-8 py-4 sm:px-16 sm:py-10 rounded-3xl sm:rounded-[4rem] border-2 border-white/30 shadow-2xl">
                <p className="text-xl sm:text-5xl font-black text-white uppercase tracking-wider leading-tight">
                  ENCONTRE OS 5 PARES<br /><span className="text-[#f7941d] text-2xl sm:text-6xl drop-shadow-md">E GANHE UM BRINDE!</span>
                </p>
              </motion.div>
            </div>

            <motion.button whileTap={{ scale: 0.94 }} onClick={() => setGameState('AUTH')} className="w-full max-w-[min(90%,480px)] bg-[#f7941d] py-6 sm:py-10 rounded-3xl sm:rounded-[5rem] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.6)] flex items-center justify-center gap-4 sm:gap-8 border-b-[8px] sm:border-b-[16px] border-[#d47a00] active:border-b-0 transition-all mb-4">
              <Play className="w-10 h-10 sm:w-16 sm:h-16 text-white fill-current" />
              <span className="text-3xl sm:text-6xl font-black text-white tracking-widest uppercase italic">JOGAR</span>
            </motion.button>

            <div className="flex flex-col gap-2 sm:gap-4 mb-8">
              <button 
                onClick={() => window.location.href = '/cachorro-racao'} 
                className="text-white/60 text-sm sm:text-2xl font-bold hover:text-white transition-colors"
              >
                Ir para o Desafio Pet RobustUS
              </button>
              <button 
                onClick={() => window.location.href = '/cesta-robustus'} 
                className="text-white/60 text-sm sm:text-2xl font-bold hover:text-white transition-colors"
              >
                Ir para a Cesta RobustUS
              </button>
            </div>
          </motion.div>
        )}

        {gameState === 'AUTH' && <AuthScreen key="auth" onStart={initializeGame} />}

        {gameState === 'PLAYING' && (
          <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 w-full flex flex-col items-center z-10 py-4 sm:py-8 px-4 sm:px-8">
            <div className="w-full max-w-[min(94vw,720px)] flex flex-col gap-4 sm:gap-6 mb-6 sm:mb-8">
              <div className="flex justify-between items-center gap-4">
                <div className="bg-white p-3 sm:p-4 rounded-2xl sm:rounded-[2rem] shadow-xl border-2 border-[#f7941d] w-32 sm:w-48">
                  <img src={ASSETS.logo} className="w-full h-auto object-contain" alt="Logo" />
                </div>
                <div className="flex gap-2 sm:gap-4">
                   <div className="bg-white/15 backdrop-blur-xl px-4 py-2 sm:p-4 rounded-2xl sm:rounded-[2rem] flex items-center gap-2 sm:gap-3 text-white border border-white/30">
                      <Timer className="w-5 h-5 sm:w-8 sm:h-8 text-[#f7941d]" />
                      <span className="text-xl sm:text-4xl font-black">{timeLeft}s</span>
                   </div>
                   <button onClick={() => setGameState('START')} className="p-3 sm:p-4 bg-white/15 backdrop-blur-xl rounded-2xl sm:rounded-[2rem] text-white border border-white/30 shadow-2xl">
                    <RotateCcw className="w-5 h-5 sm:w-8 sm:h-8" />
                  </button>
                </div>
              </div>

              <div className="bg-white/95 backdrop-blur-xl p-4 sm:p-6 rounded-3xl sm:rounded-[3rem] border-2 sm:border-4 border-[#f7941d] shadow-2xl w-full">
                <div className="grid grid-cols-2 gap-3 sm:gap-6 mb-3 sm:mb-4">
                  <div className="flex flex-col items-center bg-[#0047ab]/5 p-2 sm:p-4 rounded-2xl border border-[#0047ab]/10">
                    <span className="text-[10px] sm:text-sm font-bold text-slate-400 uppercase tracking-widest italic leading-tight">PARES</span>
                    <span className="text-2xl sm:text-4xl font-black text-[#0047ab]">{matches} / 5</span>
                  </div>
                  <div className="flex flex-col items-center bg-[#0047ab]/5 p-2 sm:p-4 rounded-2xl border border-[#0047ab]/10">
                    <span className="text-[10px] sm:text-sm font-bold text-slate-400 uppercase tracking-widest italic leading-tight">CHANCES</span>
                    <span className="text-2xl sm:text-4xl font-black text-[#f7941d]">{session ? session.max_attempts - attemptsUsed : 0}</span>
                  </div>
                </div>
                <div className="h-4 sm:h-6 bg-slate-100 rounded-full overflow-hidden p-0.5 sm:p-1 shadow-inner border border-slate-200">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(matches / 5) * 100}%` }} className="h-full bg-gradient-to-r from-[#f7941d] to-[#ffb85f] rounded-full shadow-lg" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-6 w-full max-w-[min(94vw,720px)] mx-auto flex-1 content-start sm:content-center overflow-y-auto pb-8">
              {cards.map((card) => (
                <div key={card.instanceId} onClick={() => handleCardClick(card.instanceId)} className="relative aspect-[3/4] w-full perspective-1000 cursor-pointer">
                  <motion.div animate={{ rotateY: card.isFlipped || card.isMatched ? 180 : 0, scale: card.isMatched ? 0.96 : 1 }} transition={{ type: "spring", stiffness: 180, damping: 22 }} className="w-full h-full preserve-3d relative">
                    <div className="absolute inset-0 backface-hidden bg-[#0047ab] rounded-xl sm:rounded-[2rem] shadow-lg border-[3px] sm:border-[6px] border-white/40 flex flex-col items-center justify-center overflow-hidden">
                       <div className="absolute inset-0 bg-paw-pattern opacity-10"></div>
                       <div className="w-12 h-12 sm:w-20 sm:h-20 bg-white/10 rounded-full flex items-center justify-center relative z-10 border sm:border-2 border-white/20">
                          <img src={ASSETS.paw} className="w-6 h-6 sm:w-12 sm:h-12 brightness-0 invert opacity-60" alt="" />
                       </div>
                    </div>
                    <div className={`absolute inset-0 backface-hidden bg-white rounded-xl sm:rounded-[2rem] shadow-lg border-[4px] sm:border-[6px] flex flex-col items-center justify-between p-2 sm:p-4 rotate-y-180 transition-all duration-300 overflow-visible ${card.isMatched ? 'border-[#f7941d] bg-orange-50' : 'border-white'}`} style={{ transform: 'rotateY(180deg)' }}>

                      {card.isMatched && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-[6px] right-[6px] sm:top-[10px] sm:right-[10px] bg-[#f7941d] text-white p-1 sm:p-1.5 rounded-full shadow-lg z-[2] border sm:border-2 border-white"><CheckCircle2 className="w-[12px] h-[12px] sm:w-[18px] sm:h-[18px]" /></motion.div>}
                      <div className="w-full h-[65%] flex items-center justify-center relative bg-slate-50 rounded-lg sm:rounded-2xl p-1 sm:p-2 overflow-hidden">
                        <img src={card.img} alt={card.name} className="max-w-full max-h-full object-contain drop-shadow-md" />
                      </div>
                      <div className="w-full text-center mt-1 sm:mt-2 px-0.5 sm:px-1 overflow-hidden">
                        <span className="inline-block px-2 sm:px-3 py-0.5 bg-[#0047ab] rounded-full text-[8px] sm:text-[10px] font-black text-white uppercase italic tracking-widest mb-0.5 sm:mb-1">{card.line}</span>
                        <h4 className="text-[0.8rem] sm:text-[1.1rem] font-black text-[#003380] leading-[1.1] uppercase italic truncate w-full max-w-full">{card.name}</h4>
                      </div>
                    </div>
                  </motion.div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {gameState === 'VICTORY' && (
          <motion.div key="victory" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 w-full flex flex-col items-center justify-center p-4 sm:p-8 z-20">
            <div className="relative w-full max-w-[min(92vw,480px)] bg-white/95 backdrop-blur-3xl p-8 sm:p-12 rounded-[2rem] sm:rounded-[3rem] shadow-[0_25px_50px_rgba(0,0,0,0.4)] border-t-[10px] sm:border-t-[15px] border-[#f7941d] flex flex-col items-center text-center overflow-hidden">
              <motion.div initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 12 }} transition={{ type: "spring", damping: 12, delay: 0.2 }} className="absolute -top-10 sm:-top-16 bg-[#f7941d] p-6 sm:p-10 rounded-2xl sm:rounded-[2.5rem] shadow-2xl border-4 sm:border-[8px] border-white">
                <Trophy className="w-12 h-12 sm:w-20 sm:h-20 text-white" />
              </motion.div>
              <div className="mt-8 sm:mt-12 space-y-4 sm:space-y-6 mb-8 sm:mb-10">
                <h2 className="text-5xl sm:text-7xl font-black text-[#0047ab] leading-none tracking-tighter uppercase italic drop-shadow-lg">PARABÉNS!</h2>
                <div className="bg-[#f7941d] inline-block px-6 py-2 sm:px-10 sm:py-3 rounded-full border-2 sm:border-4 border-white shadow-xl rotate-[-2deg]">
                   <p className="text-lg sm:text-2xl font-black text-white uppercase tracking-wider italic">VOCÊ GANHOU UM BRINDE!</p>
                </div>
              </div>
              <div className="bg-[#0047ab]/5 rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-8 w-full border-2 border-dashed border-[#0047ab]/20 mb-8 sm:mb-10 shadow-inner">
                <p className="text-sm sm:text-base font-bold text-slate-500 uppercase tracking-widest mb-4 px-2">Apresente este código para retirar seu brinde:</p>
                <div className="bg-white px-4 py-6 rounded-2xl sm:rounded-[2rem] shadow-xl border-2 sm:border-4 border-[#0047ab] flex items-center justify-center w-full min-h-[100px] sm:min-h-[140px]">
                  <span className="font-black text-[#0047ab] uppercase leading-[1.05] tracking-[0.04em] text-center w-full" style={{ 
                    fontSize: 'clamp(20px, 4vw, 40px)',
                    whiteSpace: 'pre-line',
                    overflowWrap: 'anywhere',
                    wordBreak: 'break-word'
                  }}>
                    {prizeCode?.replace("ROBUSTUS-", "ROBUSTUS\n")}
                  </span>
                </div>
              </div>
              <motion.button whileTap={{ scale: 0.94 }} onClick={() => setGameState('START')} className="w-full bg-[#f7941d] py-4 sm:py-6 rounded-2xl sm:rounded-3xl shadow-xl flex items-center justify-center gap-3 sm:gap-4 text-2xl sm:text-3xl font-black text-white uppercase italic tracking-widest border-b-[6px] sm:border-b-[10px] border-[#d47a00]">
                <RotateCcw className="w-8 h-8 sm:w-10 sm:h-10" /> JOGAR NOVAMENTE
              </motion.button>
            </div>
          </motion.div>
        )}

        {gameState === 'GAMEOVER' && (
          <motion.div key="gameover" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 w-full flex flex-col items-center justify-center p-4 sm:p-8 z-20">
            <div className="relative w-full max-w-[min(92vw,480px)] bg-white/95 backdrop-blur-3xl p-8 sm:p-12 rounded-[2rem] sm:rounded-[3rem] shadow-[0_25px_50px_rgba(0,0,0,0.4)] border-t-[10px] sm:border-t-[15px] border-red-500 flex flex-col items-center text-center overflow-hidden">
              <div className="space-y-4 sm:space-y-6 mb-8 sm:mb-10">
                <XCircle className="w-24 h-24 sm:w-32 sm:h-32 text-red-500 mx-auto" />
                <h2 className="text-6xl sm:text-7xl font-black text-[#0047ab] leading-none tracking-tighter uppercase italic">POXA!</h2>
                <p className="text-2xl sm:text-3xl font-bold text-slate-500 uppercase tracking-widest italic leading-tight">NÃO FOI DESSA VEZ...</p>
              </div>
              <p className="text-lg sm:text-xl text-slate-400 font-bold uppercase mb-8 sm:mb-10 italic">OBRIGADO POR PARTICIPAR!</p>
              <motion.button whileTap={{ scale: 0.94 }} onClick={() => setGameState('START')} className="w-full bg-slate-200 py-4 sm:py-6 rounded-2xl sm:rounded-3xl flex items-center justify-center gap-3 sm:gap-4 text-2xl sm:text-3xl font-black text-slate-500 uppercase italic tracking-widest border-b-[6px] sm:border-b-[10px] border-slate-300">
                <RotateCcw className="w-8 h-8 sm:w-10 sm:h-10" /> TENTAR DE NOVO
              </motion.button>
            </div>
          </motion.div>
        )}
        
        {gameState === 'ERROR' && (
          <motion.div key="error" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 w-full flex flex-col items-center justify-center p-4 sm:p-8 z-20">
            <div className="relative w-full max-w-[min(92vw,480px)] bg-white/95 backdrop-blur-3xl p-8 sm:p-12 rounded-[2rem] sm:rounded-[3rem] shadow-[0_25px_50px_rgba(0,0,0,0.4)] border-t-[10px] sm:border-t-[15px] border-red-500 flex flex-col items-center text-center overflow-hidden">
              <div className="space-y-4 sm:space-y-6 mb-8 sm:mb-10">
                <XCircle className="w-24 h-24 sm:w-32 sm:h-32 text-red-500 mx-auto" />
                <h2 className="text-4xl sm:text-5xl font-black text-[#0047ab] leading-none tracking-tighter uppercase italic">AVISO</h2>
                <p className="text-xl sm:text-2xl font-bold text-slate-500 uppercase tracking-widest leading-tight">{error}</p>
              </div>
              <motion.button whileTap={{ scale: 0.94 }} onClick={() => setGameState('START')} className="w-full bg-slate-200 py-4 sm:py-6 rounded-2xl sm:rounded-3xl flex items-center justify-center gap-3 sm:gap-4 text-2xl sm:text-3xl font-black text-slate-500 uppercase italic tracking-widest border-b-[6px] sm:border-b-[10px] border-slate-300">
                <RotateCcw className="w-8 h-8 sm:w-10 sm:h-10" /> VOLTAR AO INÍCIO
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-8 z-10 opacity-40 flex items-center gap-4 text-[#0047ab]">
        <PawPrint className="w-6 h-6" />
        <span className="text-xl font-black tracking-widest uppercase italic">RobustUS Nutrição Animal</span>
      </div>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <BrowserRouter>
        <Routes>
          <Route path="/" element={<GameContent />} />
          <Route path="/validar-brinde" element={<AdminScreen />} />
          <Route path="/cachorro-racao" element={<DogFoodGame />} />
          <Route path="/cesta-robustus" element={<BasketCatcherGame />} />
        </Routes>
      <Toaster position="top-center" richColors />
    </BrowserRouter>
  );
};

export default App;
