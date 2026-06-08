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
  bgHero: "https://robustus.com.br/wp-content/uploads/2025/10/sdfgsgsdf-scaled.png",
  patinha: "https://robustus.com.br/wp-content/uploads/2025/03/patinha.png",
  logo: "https://robustus.com.br/wp-content/uploads/2025/03/logo-robustus-site.png"
};

// Lista de Produtos RobustUS
const PRODUCTS = [
  { 
    id: 1, 
    name: 'Life Special Filhote', 
    line: 'Cão Filhote', 
    img: 'https://robustus.com.br/wp-content/uploads/2025/10/DASDASDAS-768x633.png' 
  },
  { 
    id: 2, 
    name: 'Adulto Mini e Pequeno', 
    line: 'Cão Adulto', 
    img: 'https://robustus.com.br/wp-content/uploads/2025/10/cao-mini-768x633.png' 
  },
  { 
    id: 3, 
    name: 'Adulto Médio e Grande', 
    line: 'Cão Adulto', 
    img: 'https://robustus.com.br/wp-content/uploads/2025/10/cao-ADULTO-768x633.png' 
  },
  { 
    id: 4, 
    name: 'Gato Castrado', 
    line: 'Life Special', 
    img: 'https://robustus.com.br/wp-content/uploads/2025/10/sdsadasdas-1-768x633.png' 
  },
  { 
    id: 5, 
    name: 'Bifinho Premium', 
    line: 'Petiscos', 
    img: 'https://robustus.com.br/wp-content/uploads/2026/06/banner-3.png' 
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
      setVoucherCode(`ROBUSTUS-4827`);
      
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
    <div className="min-h-screen bg-white text-slate-900 font-sans flex flex-col items-center justify-start overflow-hidden relative select-none touch-none mx-auto shadow-2xl">
      
      {/* Background Container */}
      <div className="absolute inset-0 z-0">
        {gameState === 'START' ? (
          <div className="w-full h-full relative">
            <img 
              src={ASSETS.bgHero} 
              alt="Hero Background" 
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0047ab] via-transparent to-black/20"></div>
          </div>
        ) : (
          <div className="absolute inset-0 bg-[#0047ab]">
            <div className="absolute inset-0 bg-paw-pattern opacity-10"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-[#0047ab] via-[#003380] to-[#0047ab]"></div>
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
            exit={{ opacity: 0 }}
            className="flex-1 w-full flex flex-col items-center justify-between p-20 z-10"
          >
            {/* Top Logo */}
            <motion.div 
              initial={{ y: -50 }}
              animate={{ y: 0 }}
              className="mt-10"
            >
              <div className="bg-white/90 backdrop-blur-sm p-8 rounded-full shadow-2xl border-4 border-[#f7941d]">
                <img src={ASSETS.patinha} alt="Logo" className="w-24 h-24" />
              </div>
            </motion.div>

            {/* Middle Content */}
            <div className="flex flex-col items-center text-center gap-8">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="space-y-4"
              >
                <h1 className="text-9xl font-black text-white italic tracking-tighter drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] leading-none uppercase">
                  DESAFIO DA<br />MEMÓRIA
                </h1>
                <div className="bg-[#f7941d] inline-block px-10 py-4 rounded-full shadow-2xl transform -rotate-2 border-4 border-white">
                  <span className="text-4xl font-black text-white uppercase italic tracking-widest">ROBUSTUS</span>
                </div>
              </motion.div>

              <motion.p 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-4xl font-bold text-white uppercase tracking-widest bg-black/20 backdrop-blur-sm px-10 py-4 rounded-3xl"
              >
                Encontre os 5 pares e ganhe um brinde!
              </motion.p>
            </div>

            {/* Bottom Button */}
            <motion.button 
              whileTap={{ scale: 0.9 }}
              onClick={initializeGame}
              className="w-full max-w-2xl bg-[#f7941d] py-14 rounded-[4rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] flex items-center justify-center gap-8 group relative overflow-hidden border-b-[16px] border-[#d47a00] active:border-b-0 transition-all mb-20"
            >
              <Play className="w-20 h-20 text-white fill-current" />
              <span className="text-7xl font-black text-white tracking-widest uppercase italic">COMEÇAR</span>
            </motion.button>
          </motion.div>
        )}

        {/* TABULEIRO DO JOGO */}
        {gameState === 'PLAYING' && (
          <motion.div 
            key="playing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 w-full flex flex-col items-center z-10 p-16"
          >
            {/* Header Jogo */}
            <div className="w-full flex flex-col gap-10 mb-16">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-6">
                  <img src={ASSETS.patinha} className="w-20 h-20 bg-white p-3 rounded-full border-4 border-[#f7941d] shadow-lg" alt="" />
                  <span className="text-6xl font-black text-white uppercase italic tracking-tighter drop-shadow-xl">ROBUSTUS</span>
                </div>
                <button 
                  onClick={() => setGameState('START')}
                  className="p-8 bg-white/10 backdrop-blur-md rounded-3xl text-white hover:bg-white/20 transition-all border border-white/20 shadow-xl"
                >
                  <RotateCcw className="w-12 h-12" />
                </button>
              </div>

              {/* Progress Panel */}
              <div className="bg-white/95 backdrop-blur-md p-12 rounded-[4rem] border-4 border-[#f7941d] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)]">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-4xl font-black text-[#003380] uppercase tracking-tighter">
                    {matches === 5 ? "CONCLUÍDO!" : `ENCONTRE OS PARES`}
                  </h3>
                  <div className="bg-[#0047ab] text-white px-8 py-3 rounded-full">
                    <span className="text-5xl font-black">{matches}</span>
                    <span className="text-3xl font-bold opacity-50"> / 5</span>
                  </div>
                </div>
                <div className="h-10 bg-slate-100 rounded-full overflow-hidden p-2 shadow-inner border-2 border-slate-200">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(matches / 5) * 100}%` }}
                    className="h-full bg-gradient-to-r from-[#f7941d] to-[#ffb85f] rounded-full shadow-lg"
                  />
                </div>
              </div>
            </div>

            {/* Grid de Cartas: 2 colunas x 5 linhas */}
            <div className="grid grid-cols-2 gap-10 w-full max-w-4xl mx-auto flex-1 content-center">
              {cards.map((card) => (
                <div 
                  key={card.instanceId}
                  onClick={() => handleCardClick(card.instanceId)}
                  className="relative h-[300px] w-full perspective-1000 cursor-pointer"
                >
                  <motion.div
                    animate={{ 
                      rotateY: card.isFlipped || card.isMatched ? 180 : 0,
                      scale: card.isMatched ? 0.95 : 1
                    }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    className="w-full h-full preserve-3d relative"
                  >
                    {/* Verso da Carta */}
                    <div className="absolute inset-0 backface-hidden bg-[#0047ab] rounded-[3rem] shadow-2xl border-8 border-white/30 flex flex-col items-center justify-center overflow-hidden">
                       <div className="absolute inset-0 bg-paw-pattern opacity-10 scale-150"></div>
                       <motion.div
                        animate={{ scale: [1, 1.05, 1], rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 4, repeat: Infinity }}
                        className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center relative z-10 border-4 border-white/20"
                      >
                         <img src={ASSETS.patinha} className="w-20 h-20 brightness-0 invert opacity-80" alt="" />
                      </motion.div>
                    </div>

                    {/* Frente da Carta */}
                    <div 
                      className={`absolute inset-0 backface-hidden bg-white rounded-[3rem] shadow-2xl border-[12px] flex flex-col items-center justify-between p-6 rotate-y-180 transition-colors duration-500
                        ${card.isMatched ? 'border-[#f7941d]' : 'border-white'}
                      `}
                      style={{ transform: 'rotateY(180deg)' }}
                    >
                      {card.isMatched && (
                        <motion.div 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-6 -right-6 bg-[#f7941d] text-white p-4 rounded-full shadow-2xl z-20 border-4 border-white"
                        >
                          <CheckCircle2 className="w-12 h-12" />
                        </motion.div>
                      )}

                      <div className="w-full h-2/3 flex items-center justify-center relative bg-blue-50/50 rounded-3xl p-4">
                        <img 
                          src={card.img} 
                          alt={card.name} 
                          className="max-w-full max-h-full object-contain drop-shadow-xl relative z-10" 
                        />
                      </div>

                      <div className="w-full text-center mt-2">
                        <span className="inline-block px-4 py-1 bg-[#0047ab] rounded-full text-[14px] font-black text-white uppercase italic tracking-widest mb-1">
                          {card.line}
                        </span>
                        <h4 className="text-2xl font-black text-[#003380] leading-tight uppercase italic truncate w-full">
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
            className="flex-1 w-full flex flex-col items-center justify-center p-20 z-20"
          >
            <div className="relative w-full max-w-4xl bg-white/95 backdrop-blur-xl p-20 rounded-[6rem] shadow-[0_50px_100px_rgba(0,0,0,0.5)] border-t-[20px] border-[#f7941d] flex flex-col items-center text-center">
              
              <motion.div 
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 12 }}
                transition={{ type: "spring", damping: 10, delay: 0.2 }}
                className="absolute -top-24 bg-[#f7941d] p-12 rounded-[3.5rem] shadow-2xl border-[12px] border-white"
              >
                <Trophy className="w-32 h-32 text-white" />
              </motion.div>

              <div className="mt-24 space-y-8 mb-16">
                <h2 className="text-[12rem] font-black text-[#0047ab] leading-[0.8] tracking-tighter uppercase italic drop-shadow-lg">UHUUUL!</h2>
                <div className="flex items-center justify-center gap-6">
                   <div className="h-2 w-20 bg-[#f7941d] rounded-full"></div>
                   <p className="text-5xl font-black text-[#f7941d] uppercase tracking-[0.3em] italic">VOCÊ GANHOU!</p>
                   <div className="h-2 w-20 bg-[#f7941d] rounded-full"></div>
                </div>
              </div>

              <div className="bg-[#0047ab]/5 rounded-[4rem] p-12 w-full border-4 border-dashed border-[#0047ab]/20 mb-16">
                <p className="text-3xl font-bold text-slate-500 uppercase tracking-widest mb-6">Apresente este código para retirar seu brinde:</p>
                <div className="bg-white px-12 py-10 rounded-3xl shadow-xl border-4 border-[#0047ab]">
                  <span className="text-8xl font-black text-[#0047ab] tracking-widest">{voucherCode}</span>
                </div>
              </div>

              <motion.button 
                whileTap={{ scale: 0.9 }}
                onClick={() => setGameState('START')}
                className="w-full bg-[#f7941d] py-12 rounded-[3.5rem] shadow-2xl flex items-center justify-center gap-6 text-5xl font-black text-white uppercase italic tracking-widest border-b-[12px] border-[#d47a00]"
              >
                <RotateCcw className="w-16 h-16" />
                JOGAR NOVAMENTE
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Branding */}
      <div className="absolute bottom-10 z-10 opacity-30">
        <div className="flex items-center gap-4 grayscale brightness-0">
          <Dog className="w-8 h-8" />
          <span className="text-2xl font-black tracking-widest uppercase italic">RobustUS Nutrição Animal</span>
        </div>
      </div>
    </div>
  );
};

export default App;
