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
  Timer
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from "@/integrations/supabase/client";
import { AuthScreen } from './components/auth/AuthScreen';
import { AdminScreen } from './components/admin/AdminScreen';

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

type GameState = 'START' | 'AUTH' | 'PLAYING' | 'VICTORY' | 'GAMEOVER' | 'ADMIN';

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

const App = () => {
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

  // Verificar rota de admin
  useEffect(() => {
    if (window.location.pathname === '/validar-brinde') {
      setGameState('ADMIN');
    }
  }, []);

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
    
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    
    try {
      const { data, error } = await (supabase.rpc as any)("finish_play", {
        p_play_id: session?.play_id,
        p_play_token: session?.play_token,
        p_pairs_found: matches,
        p_attempts_used: attemptsUsed,
        p_client_time_seconds: elapsed
      });

      if (error) throw error;

      if (data?.result === 'won' || reason === 'won') {
        setPrizeCode(data?.prize_code || 'ERRO-CODE');
        setGameState('VICTORY');
        confetti({
          particleCount: 200,
          spread: 80,
          origin: { y: 0.5 },
          colors: [BRAND.primary, BRAND.orange, BRAND.white]
        });
      } else {
        setGameState('GAMEOVER');
      }
    } catch (err) {
      console.error("Erro ao finalizar:", err);
      setGameState(reason === 'won' ? 'VICTORY' : 'GAMEOVER');
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
      setAttemptsUsed(prev => prev + 1);
      
      const [firstId, secondId] = newFlipped;
      const firstCard = cards.find(c => c.instanceId === firstId)!;
      const secondCard = newCards.find(c => c.instanceId === secondId)!;

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

          if (session && attemptsUsed + 1 >= session.max_attempts) {
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

  if (gameState === 'ADMIN') return <AdminScreen />;

  return (
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
          <motion.div key="start" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 w-full flex flex-col items-center justify-between py-24 px-12 z-10">
            <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full flex justify-center mt-12">
              <div className="bg-white p-8 rounded-[3.5rem] shadow-2xl border-4 border-[#f7941d] w-80 h-80 flex items-center justify-center">
                <img src={ASSETS.logo} alt="Logo" className="w-full h-auto object-contain" />
              </div>
            </motion.div>

            <div className="flex flex-col items-center text-center gap-12 mb-20">
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }} className="space-y-4">
                <h1 className="text-[12rem] font-black text-white italic tracking-tighter drop-shadow-[0_15px_15px_rgba(0,0,0,0.6)] leading-[0.8] uppercase">
                  DESAFIO DA<br /><span className="text-[#f7941d]">MEMÓRIA</span>
                </h1>
              </motion.div>
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="bg-white/15 backdrop-blur-xl px-16 py-10 rounded-[4rem] border-2 border-white/30 shadow-2xl">
                <p className="text-5xl font-black text-white uppercase tracking-wider leading-tight">
                  ENCONTRE OS 5 PARES<br /><span className="text-[#f7941d] text-6xl drop-shadow-md">E GANHE UM BRINDE!</span>
                </p>
              </motion.div>
            </div>

            <motion.button whileTap={{ scale: 0.94 }} onClick={() => setGameState('AUTH')} className="w-full max-w-[90%] bg-[#f7941d] py-14 rounded-[5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)] flex items-center justify-center gap-8 border-b-[20px] border-[#d47a00] active:border-b-0 transition-all mb-12">
              <Play className="w-20 h-20 text-white fill-current" />
              <span className="text-7xl font-black text-white tracking-widest uppercase italic">JOGAR</span>
            </motion.button>
          </motion.div>
        )}

        {gameState === 'AUTH' && <AuthScreen key="auth" onStart={initializeGame} />}

        {gameState === 'PLAYING' && (
          <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 w-full flex flex-col items-center z-10 py-16 px-8">
            <div className="w-full max-w-[90%] flex flex-col gap-10 mb-12">
              <div className="flex justify-between items-center">
                <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border-2 border-[#f7941d] w-64">
                  <img src={ASSETS.logo} className="w-full h-auto object-contain" alt="Logo" />
                </div>
                <div className="flex gap-4">
                   <div className="bg-white/15 backdrop-blur-xl p-6 rounded-[2.5rem] flex items-center gap-4 text-white border border-white/30">
                      <Timer className="w-10 h-10 text-[#f7941d]" />
                      <span className="text-5xl font-black">{timeLeft}s</span>
                   </div>
                   <button onClick={() => setGameState('START')} className="p-8 bg-white/15 backdrop-blur-xl rounded-[2.5rem] text-white border border-white/30 shadow-2xl">
                    <RotateCcw className="w-12 h-12" />
                  </button>
                </div>
              </div>

              <div className="bg-white/95 backdrop-blur-xl p-10 rounded-[4rem] border-4 border-[#f7941d] shadow-2xl w-full">
                <div className="grid grid-cols-2 gap-8 mb-6">
                  <div className="flex flex-col items-center bg-[#0047ab]/5 p-6 rounded-3xl border-2 border-[#0047ab]/10">
                    <span className="text-2xl font-bold text-slate-400 uppercase tracking-widest italic">PARES</span>
                    <span className="text-6xl font-black text-[#0047ab]">{matches} / 5</span>
                  </div>
                  <div className="flex flex-col items-center bg-[#0047ab]/5 p-6 rounded-3xl border-2 border-[#0047ab]/10">
                    <span className="text-2xl font-bold text-slate-400 uppercase tracking-widest italic">CHANCES</span>
                    <span className="text-6xl font-black text-[#f7941d]">{session ? session.max_attempts - attemptsUsed : 0}</span>
                  </div>
                </div>
                <div className="h-10 bg-slate-100 rounded-full overflow-hidden p-2 shadow-inner border-2 border-slate-200">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(matches / 5) * 100}%` }} className="h-full bg-gradient-to-r from-[#f7941d] to-[#ffb85f] rounded-full shadow-lg" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 w-full max-w-[90%] mx-auto flex-1 content-center">
              {cards.map((card) => (
                <div key={card.instanceId} onClick={() => handleCardClick(card.instanceId)} className="relative h-[280px] w-full perspective-1000 cursor-pointer">
                  <motion.div animate={{ rotateY: card.isFlipped || card.isMatched ? 180 : 0, scale: card.isMatched ? 0.96 : 1 }} transition={{ type: "spring", stiffness: 180, damping: 22 }} className="w-full h-full preserve-3d relative">
                    <div className="absolute inset-0 backface-hidden bg-[#0047ab] rounded-[2.5rem] shadow-xl border-[6px] border-white/40 flex flex-col items-center justify-center overflow-hidden">
                       <div className="absolute inset-0 bg-paw-pattern opacity-10"></div>
                       <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center relative z-10 border-2 border-white/20">
                          <img src={ASSETS.paw} className="w-14 h-14 brightness-0 invert opacity-60" alt="" />
                       </div>
                    </div>
                    <div className={`absolute inset-0 backface-hidden bg-white rounded-[2.5rem] shadow-xl border-[8px] flex flex-col items-center justify-between p-4 rotate-y-180 transition-all duration-300 overflow-hidden ${card.isMatched ? 'border-[#f7941d] bg-orange-50' : 'border-white'}`} style={{ transform: 'rotateY(180deg)' }}>
                      {card.isMatched && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-4 -right-4 bg-[#f7941d] text-white p-2.5 rounded-full shadow-lg z-20 border-4 border-white"><CheckCircle2 className="w-8 h-8" /></motion.div>}
                      <div className="w-full h-[65%] flex items-center justify-center relative bg-slate-50 rounded-2xl p-2 overflow-hidden">
                        <img src={card.img} alt={card.name} className="max-w-full max-h-full object-contain drop-shadow-md" />
                      </div>
                      <div className="w-full text-center mt-2 px-1 overflow-hidden">
                        <span className="inline-block px-3 py-0.5 bg-[#0047ab] rounded-full text-[10px] font-black text-white uppercase italic tracking-widest mb-1">{card.line}</span>
                        <h4 className="text-[1.1rem] font-black text-[#003380] leading-[1.1] uppercase italic truncate w-full max-w-full">{card.name}</h4>
                      </div>
                    </div>
                  </motion.div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {gameState === 'VICTORY' && (
          <motion.div key="victory" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 w-full flex flex-col items-center justify-center p-8 z-20">
            <div className="relative w-full max-w-[950px] bg-white/95 backdrop-blur-3xl p-20 rounded-[6rem] shadow-[0_50px_100px_rgba(0,0,0,0.6)] border-t-[24px] border-[#f7941d] flex flex-col items-center text-center overflow-hidden">
              <motion.div initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 12 }} transition={{ type: "spring", damping: 12, delay: 0.2 }} className="absolute -top-20 bg-[#f7941d] p-12 rounded-[3.5rem] shadow-2xl border-[10px] border-white">
                <Trophy className="w-28 h-28 text-white" />
              </motion.div>
              <div className="mt-20 space-y-8 mb-16">
                <h2 className="text-[10rem] font-black text-[#0047ab] leading-none tracking-tighter uppercase italic drop-shadow-xl">PARABÉNS!</h2>
                <div className="bg-[#f7941d] inline-block px-12 py-4 rounded-full border-4 border-white shadow-2xl rotate-[-2deg]">
                   <p className="text-4xl font-black text-white uppercase tracking-[0.2em] italic">VOCÊ GANHOU UM BRINDE!</p>
                </div>
              </div>
              <div className="bg-[#0047ab]/5 rounded-[4rem] p-12 w-full border-4 border-dashed border-[#0047ab]/20 mb-16 shadow-inner">
                <p className="text-3xl font-bold text-slate-500 uppercase tracking-widest mb-6 px-4">Apresente este código para retirar seu brinde:</p>
                <div className="bg-white px-8 py-10 rounded-[3rem] shadow-2xl border-4 border-[#0047ab] flex items-center justify-center w-full">
                  <span className="text-7xl sm:text-8xl font-black text-[#0047ab] tracking-tight uppercase leading-none truncate max-w-full inline-block">
                    {prizeCode}
                  </span>
                </div>
              </div>
              <motion.button whileTap={{ scale: 0.94 }} onClick={() => setGameState('START')} className="w-full bg-[#f7941d] py-12 rounded-[4rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.4)] flex items-center justify-center gap-6 text-5xl font-black text-white uppercase italic tracking-widest border-b-[15px] border-[#d47a00]">
                <RotateCcw className="w-16 h-16" /> JOGAR NOVAMENTE
              </motion.button>
            </div>
          </motion.div>
        )}

        {gameState === 'GAMEOVER' && (
          <motion.div key="gameover" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 w-full flex flex-col items-center justify-center p-8 z-20">
            <div className="relative w-full max-w-[900px] bg-white/95 backdrop-blur-3xl p-20 rounded-[6rem] shadow-[0_50px_100px_rgba(0,0,0,0.6)] border-t-[24px] border-red-500 flex flex-col items-center text-center overflow-hidden">
              <div className="space-y-8 mb-16">
                <XCircle className="w-48 h-48 text-red-500 mx-auto" />
                <h2 className="text-9xl font-black text-[#0047ab] leading-none tracking-tighter uppercase italic">POXA!</h2>
                <p className="text-5xl font-bold text-slate-500 uppercase tracking-widest italic">NÃO FOI DESSA VEZ...</p>
              </div>
              <p className="text-3xl text-slate-400 font-bold uppercase mb-16 italic">OBRIGADO POR PARTICIPAR!</p>
              <motion.button whileTap={{ scale: 0.94 }} onClick={() => setGameState('START')} className="w-full bg-slate-200 py-12 rounded-[4rem] flex items-center justify-center gap-6 text-5xl font-black text-slate-500 uppercase italic tracking-widest border-b-[15px] border-slate-300">
                <RotateCcw className="w-16 h-16" /> TENTAR DE NOVO
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
  );
};

export default App;
