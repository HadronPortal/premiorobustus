import React, { useState, useEffect, useCallback } from 'react';
import { 
  Trophy, 
  RotateCcw, 
  Play, 
  CheckCircle2, 
  Sparkles, 
  PawPrint, 
  Heart,
  Dog,
  Zap,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';

// Configuração da Marca RobustUS
const BRAND = {
  name: "RobustUS",
  primary: "#0047ab", // Azul RobustUS
  orange: "#f7941d",  // Laranja RobustUS
  white: "#ffffff",
  darkBlue: "#003380",
};

// Imagens reais do site RobustUS
const ASSETS = {
  bgStart: "https://robustus.com.br/wp-content/uploads/2026/06/banner.jpg",
  bgOverlay: "https://robustus.com.br/wp-content/uploads/2025/10/sdfgsgsdf-scaled.png",
  logoSection: "https://robustus.com.br/wp-content/uploads/2026/06/banner-1.png",
  patinha: "https://robustus.com.br/wp-content/uploads/2025/03/patinha.png",
  bannerHero: "https://robustus.com.br/wp-content/uploads/2026/06/banner-2.png",
};

// Lista de Produtos RobustUS
const PRODUCTS = [
  { 
    id: 1, 
    name: 'Life Special Cão Filhote', 
    line: 'Life Special', 
    img: 'https://robustus.com.br/wp-content/uploads/2025/10/cao-mini-768x633.png' 
  },
  { 
    id: 2, 
    name: 'Life Special Cão Adulto Mini', 
    line: 'Life Special', 
    img: 'https://robustus.com.br/wp-content/uploads/2025/10/DASDASDAS-768x633.png' 
  },
  { 
    id: 3, 
    name: 'Life Special Cão Adulto M&G', 
    line: 'Life Special', 
    img: 'https://robustus.com.br/wp-content/uploads/2025/10/cao-ADULTO-768x633.png' 
  },
  { 
    id: 4, 
    name: 'Life Special Gato Castrado', 
    line: 'Life Special', 
    img: 'https://robustus.com.br/wp-content/uploads/2025/03/gatossscastrados-1024x576.png' 
  },
  { 
    id: 5, 
    name: 'Bifinho Premium', 
    line: 'Petiscos', 
    img: 'https://robustus.com.br/wp-content/uploads/2025/10/sdsadasdas-1-768x633.png' 
  },
];

type GameState = 'START' | 'PLAYING' | 'VICTORY';

interface Card {
  instanceId: number;
  productId: number;
  name: string;
  line: string;
  img: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const App = () => {
  const [gameState, setGameState] = useState<GameState>('START');
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [voucherCode, setVoucherCode] = useState('');
  const [lockBoard, setLockBoard] = useState(false);
  const [matches, setMatches] = useState(0);

  const initializeGame = useCallback(() => {
    const gameCards: Card[] = [...PRODUCTS, ...PRODUCTS].map((product, index) => ({
      ...product,
      instanceId: index,
      productId: product.id,
      isFlipped: false,
      isMatched: false,
    }));

    const shuffled = gameCards.sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setFlippedCards([]);
    setMatches(0);
    setLockBoard(false);
    setGameState('PLAYING');
  }, []);

  const handleCardClick = (instanceId: number) => {
    if (lockBoard) return;
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

      if (firstCard.productId === secondCard.productId) {
        setTimeout(() => {
          setCards(prev => prev.map(c => 
            c.productId === firstCard.productId ? { ...c, isMatched: true } : c
          ));
          setMatches(m => m + 1);
          setFlippedCards([]);
          setLockBoard(false);
          
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.7 },
            colors: [BRAND.primary, BRAND.orange, BRAND.white]
          });
        }, 600);
      } else {
        setTimeout(() => {
          setCards(prev => prev.map(c => 
            c.instanceId === firstId || c.instanceId === secondId ? { ...c, isFlipped: false } : c
          ));
          setFlippedCards([]);
          setLockBoard(false);
        }, 1000);
      }
    }
  };

  useEffect(() => {
    if (gameState === 'PLAYING' && matches === PRODUCTS.length) {
      const randomId = Math.floor(1000 + Math.random() * 9000);
      setVoucherCode(`ROBUSTUS-${randomId}`);
      
      setTimeout(() => {
        setGameState('VICTORY');
        confetti({
          particleCount: 200,
          spread: 80,
          origin: { y: 0.5 },
          colors: [BRAND.primary, BRAND.orange, BRAND.white]
        });
      }, 800);
    }
  }, [matches, gameState]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (gameState === 'VICTORY') {
      timer = setTimeout(() => {
        setGameState('START');
      }, 20000);
    }
    return () => clearTimeout(timer);
  }, [gameState]);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans flex flex-col items-center justify-start overflow-hidden relative select-none touch-none">
      
      {/* Background Container */}
      <div className="absolute inset-0 z-0">
        {gameState === 'START' ? (
          <>
            <img 
              src={ASSETS.bgStart} 
              alt="Background" 
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#0047ab]/80 via-[#0047ab]/60 to-[#0047ab]/90"></div>
          </>
        ) : (
          <div className="absolute inset-0 bg-[#0047ab]">
            <div className="absolute inset-0 bg-paw-pattern opacity-10"></div>
            {/* Overlay sutil de imagens RobustUS em marca d'água */}
            <div className="absolute inset-0 flex flex-wrap gap-40 justify-center items-center opacity-[0.05] grayscale rotate-12 scale-150">
              {PRODUCTS.map((p, i) => (
                <img key={i} src={p.img} className="w-64 h-64 object-contain" alt="" />
              ))}
            </div>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {/* TELA INICIAL */}
        {gameState === 'START' && (
          <motion.div 
            key="start"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="flex-1 w-full flex flex-col items-center justify-between p-12 z-10"
          >
            <div className="flex flex-col items-center gap-6 mt-20 w-full">
              {/* Logo e Icons */}
              <motion.div 
                initial={{ y: -50 }}
                animate={{ y: 0 }}
                className="flex flex-col items-center gap-4"
              >
                <img src={ASSETS.patinha} alt="RobustUS" className="w-24 h-24 drop-shadow-lg" />
                <h1 className="text-7xl font-black text-white tracking-tighter uppercase italic drop-shadow-2xl">{BRAND.name}</h1>
              </motion.div>

              <div className="relative w-full max-w-lg mt-12">
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white/95 backdrop-blur-md p-6 rounded-[3.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] border border-white/50 overflow-hidden"
                >
                  <img 
                    src={ASSETS.bgOverlay} 
                    alt="RobustUS Products" 
                    className="w-full h-[550px] object-cover rounded-[2.5rem]"
                  />
                  <div className="absolute top-10 right-10 bg-[#f7941d] text-white p-8 rounded-full shadow-2xl rotate-12 flex flex-col items-center justify-center border-4 border-white">
                    <span className="text-sm font-black uppercase">BRINDE</span>
                    <Sparkles className="w-8 h-8" />
                  </div>
                </motion.div>
              </div>

              <div className="text-center space-y-6 max-w-md mt-8">
                <h2 className="text-7xl font-black text-white leading-[0.85] drop-shadow-lg">DESAFIO DA MEMÓRIA</h2>
                <div className="flex items-center justify-center gap-3 text-[#f7941d] font-black text-3xl drop-shadow-md">
                  <Heart className="w-8 h-8 fill-current" />
                  <span>SABER NUTRIR É AMAR</span>
                  <Heart className="w-8 h-8 fill-current" />
                </div>
              </div>
            </div>

            <motion.button 
              whileTap={{ scale: 0.95 }}
              onClick={initializeGame}
              className="w-full max-w-lg bg-[#f7941d] p-12 rounded-[3rem] shadow-2xl flex items-center justify-center gap-6 group relative overflow-hidden mb-16 border-b-8 border-[#d47a00]"
            >
              <Play className="w-14 h-14 text-white fill-current relative z-10" />
              <span className="text-5xl font-black text-white tracking-widest relative z-10 uppercase italic">JOGAR</span>
            </motion.button>
          </motion.div>
        )}

        {/* TABULEIRO DO JOGO */}
        {gameState === 'PLAYING' && (
          <motion.div 
            key="playing"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 w-full flex flex-col items-center z-10 pt-16 pb-12 px-8"
          >
            {/* Header Jogo */}
            <div className="w-full max-w-lg flex flex-col gap-8 mb-10">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <img src={ASSETS.patinha} className="w-14 h-14" alt="" />
                  <span className="text-4xl font-black text-white uppercase italic tracking-tighter drop-shadow-lg">{BRAND.name}</span>
                </div>
                <button 
                  onClick={() => setGameState('START')}
                  className="p-5 bg-white/10 backdrop-blur-md rounded-2xl text-white/80 hover:bg-white/20 transition-colors border border-white/20"
                >
                  <RotateCcw className="w-10 h-10" />
                </button>
              </div>

              <div className="bg-white/95 backdrop-blur-md p-10 rounded-[3rem] border border-white/50 shadow-2xl relative overflow-hidden">
                <div className="absolute top-[-20%] right-[-10%] opacity-5 text-[#0047ab]">
                   <Dog className="w-48 h-48" />
                </div>
                <div className="flex justify-between items-end mb-5">
                  <div>
                    <p className="text-[#0047ab] font-black text-base uppercase tracking-widest mb-1">PROCESSO DE NUTRIÇÃO</p>
                    <h3 className="text-4xl font-black text-[#003380] uppercase">
                      {matches === 5 ? "CONCLUÍDO!" : `FALTAM ${5 - matches} PARES`}
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-6xl font-black text-[#0047ab]">{matches}</span>
                    <span className="text-3xl font-black text-slate-300"> / 5</span>
                  </div>
                </div>
                <div className="h-6 bg-slate-100 rounded-full overflow-hidden p-1.5 shadow-inner">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(matches / 5) * 100}%` }}
                    className="h-full bg-gradient-to-r from-[#0047ab] to-[#00b2ff] rounded-full shadow-lg"
                  />
                </div>
              </div>
            </div>

            {/* Grid de Cartas */}
            <div className="w-full max-w-lg grid grid-cols-2 gap-8 flex-1 content-center">
              {cards.map((card) => (
                <div 
                  key={card.instanceId}
                  onClick={() => handleCardClick(card.instanceId)}
                  className="relative h-[300px] w-full perspective-1000 cursor-pointer"
                >
                  <motion.div
                    animate={{ 
                      rotateY: card.isFlipped || card.isMatched ? 180 : 0,
                      scale: card.isMatched ? 0.98 : 1
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="w-full h-full preserve-3d relative"
                  >
                    {/* Verso da Carta */}
                    <div className="absolute inset-0 backface-hidden bg-white rounded-[3rem] shadow-2xl border-4 border-white/20 flex flex-col items-center justify-center overflow-hidden">
                       <div className="absolute inset-0 bg-[#0047ab]">
                         <div className="absolute inset-0 bg-paw-pattern opacity-10 scale-150"></div>
                       </div>
                       <motion.div
                        animate={{ scale: [1, 1.05, 1], rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 4, repeat: Infinity }}
                        className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center relative z-10 border-4 border-white/20"
                      >
                         <img src={ASSETS.patinha} className="w-20 h-20 brightness-0 invert opacity-80" alt="" />
                      </motion.div>
                      <div className="absolute bottom-10 flex gap-3">
                         <div className="w-3 h-3 rounded-full bg-white/20"></div>
                         <div className="w-3 h-3 rounded-full bg-[#f7941d]"></div>
                         <div className="w-3 h-3 rounded-full bg-white/20"></div>
                      </div>
                    </div>

                    {/* Frente da Carta */}
                    <div 
                      className={`absolute inset-0 backface-hidden bg-white rounded-[3rem] shadow-2xl border-8 flex flex-col items-center justify-between p-8 rotate-y-180 transition-colors duration-500
                        ${card.isMatched ? 'border-[#f7941d] bg-orange-50/50' : 'border-slate-50'}
                      `}
                      style={{ transform: 'rotateY(180deg)' }}
                    >
                      {card.isMatched && (
                        <motion.div 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-5 -right-5 bg-[#0047ab] text-white p-4 rounded-full shadow-2xl z-20 border-4 border-white"
                        >
                          <CheckCircle2 className="w-10 h-10" />
                        </motion.div>
                      )}

                      <div className="w-full h-2/3 flex items-center justify-center p-2 relative">
                        <img 
                          src={card.img} 
                          alt={card.name} 
                          className="max-w-full max-h-full object-contain rounded-3xl drop-shadow-2xl relative z-10" 
                        />
                        <div className="absolute inset-0 bg-blue-50/30 rounded-full blur-3xl opacity-50 scale-75"></div>
                      </div>

                      <div className="w-full text-center space-y-2">
                        <span className="inline-block px-4 py-1.5 bg-[#0047ab]/10 rounded-full text-[12px] font-black text-[#0047ab] uppercase tracking-widest italic">
                          {card.line}
                        </span>
                        <h4 className="text-xl font-black text-[#003380] leading-tight uppercase italic">
                          {card.name}
                        </h4>
                      </div>
                    </div>
                  </motion.div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* TELA DE VITÓRIA */}
        {gameState === 'VICTORY' && (
          <motion.div 
            key="victory"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 w-full flex flex-col items-center justify-center p-12 z-20"
          >
            <div className="relative w-full max-w-lg bg-white/95 backdrop-blur-xl p-12 rounded-[4.5rem] shadow-[0_50px_100px_rgba(0,0,0,0.3)] border-t-8 border-[#f7941d] flex flex-col items-center text-center">
              
              <div className="absolute -top-10 -left-10 w-32 h-32 opacity-10 grayscale brightness-0">
                <PawPrint className="w-full h-full" />
              </div>
              <div className="absolute -bottom-10 -right-10 w-32 h-32 opacity-10 grayscale brightness-0 rotate-180">
                <PawPrint className="w-full h-full" />
              </div>

              <motion.div 
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 12 }}
                transition={{ type: "spring", damping: 10, delay: 0.2 }}
                className="absolute -top-20 bg-[#f7941d] p-10 rounded-[2.5rem] shadow-2xl border-8 border-white"
              >
                <Trophy className="w-24 h-24 text-white" />
              </motion.div>

              <div className="mt-20 space-y-6 mb-12">
                <h2 className="text-8xl font-black text-[#0047ab] leading-none tracking-tighter uppercase italic">UHUUUL!</h2>
                <p className="text-3xl font-black text-[#f7941d] uppercase tracking-[0.2em] italic">VOCÊ É ROBUSTUS!</p>
                <p className="text-2xl text-slate-500 font-bold px-4 leading-snug">
                  Parabéns por conhecer nossos produtos de alta nutrição!
                </p>
              </div>

              <div className="w-full bg-[#0047ab] p-12 rounded-[3.5rem] border-4 border-dashed border-white/30 mb-12 relative overflow-hidden">
                <div className="absolute inset-0 bg-paw-pattern opacity-10 pointer-events-none"></div>
                <p className="text-base font-black text-white/70 uppercase tracking-[0.4em] mb-6 relative z-10">CÓDIGO DE RETIRADA</p>
                <div className="flex items-center justify-center gap-5 relative z-10">
                   <Zap className="w-10 h-10 text-[#f7941d] fill-current" />
                   <p className="text-6xl font-mono font-black text-white tracking-tighter drop-shadow-lg">{voucherCode}</p>
                   <Zap className="w-10 h-10 text-[#f7941d] fill-current" />
                </div>
              </div>

              <motion.button 
                whileTap={{ scale: 0.95 }}
                onClick={() => setGameState('START')}
                className="w-full bg-[#f7941d] p-10 rounded-[2.5rem] shadow-2xl flex items-center justify-center gap-5 group border-b-8 border-[#d47a00]"
              >
                <span className="text-4xl font-black text-white uppercase italic tracking-widest">NOVO JOGO</span>
                <ArrowRight className="w-10 h-10 text-white" />
              </motion.button>

              <div className="mt-12 flex items-center gap-4 text-slate-400 font-bold uppercase tracking-widest text-sm">
                <div className="w-3 h-3 rounded-full bg-slate-200 animate-pulse"></div>
                <span>Reiniciando em 20s</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Branding */}
      <div className="absolute bottom-10 z-10 opacity-30 pointer-events-none flex items-center gap-2">
        <PawPrint className="w-6 h-6" />
        <span className="text-sm font-black uppercase tracking-[0.5em] italic">{BRAND.name} PREMIUM PET FOOD</span>
      </div>
    </div>
  );
};

export default App;
