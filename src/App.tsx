import React, { useState, useEffect, useCallback } from 'react';
import { 
  Trophy, 
  RotateCcw, 
  Play, 
  CheckCircle2, 
  PawPrint,
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
  bgHero: "https://robustus.com.br/wp-content/uploads/2025/10/site-scaled.jpg",
  logo: "https://robustus.com.br/wp-content/uploads/2025/03/logo.png",
  paw: "https://robustus.com.br/wp-content/uploads/2025/03/patinha.png",
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
    name: 'Gato Adulto', 
    line: 'Life Special', 
    img: 'https://robustus.com.br/wp-content/uploads/2025/10/DASDASDAS-2-768x633.png' 
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
  const [voucherCode] = useState('ROBUSTUS-4827');
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
    <div className="totem-container flex flex-col items-center justify-start relative select-none touch-none shadow-2xl overflow-hidden">
      
      {/* Background Container */}
      <div className="absolute inset-0 z-0">
        {gameState === 'START' ? (
          <div className="w-full h-full relative">
            <img 
              src={ASSETS.bgHero} 
              alt="Hero Background" 
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Overlay to improve readability and hide existing text on the banner */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#0047ab]/80 via-transparent to-[#0047ab]/90"></div>
            <div className="absolute inset-0 backdrop-blur-[2px]"></div>
          </div>
        ) : (
          <div className="absolute inset-0 robustus-gradient">
            <div className="absolute inset-0 bg-paw-pattern opacity-5"></div>
            {/* Rounded shapes for visual richness */}
            <div className="absolute top-[-10%] left-[-20%] w-[140%] h-[40%] bg-white/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-[-10%] right-[-20%] w-[140%] h-[40%] bg-white/5 rounded-full blur-3xl"></div>
            <div className="robustus-waves opacity-20"></div>
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
            className="flex-1 w-full flex flex-col items-center justify-between py-24 px-12 z-10"
          >
            {/* Top Logo */}
            <motion.div 
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="w-full flex justify-center"
            >
              <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl border-4 border-[#f7941d] w-64 h-64 flex items-center justify-center">
                <img src={ASSETS.logo} alt="RobustUS Logo" className="w-full h-auto object-contain" />
              </div>
            </motion.div>

            {/* Middle Content */}
            <div className="flex flex-col items-center text-center gap-10">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="space-y-6"
              >
                <div className="flex justify-center mb-4">
                   <div className="bg-[#f7941d] px-8 py-3 rounded-full border-2 border-white shadow-lg">
                      <span className="text-3xl font-black text-white uppercase italic tracking-widest">DESAFIO</span>
                   </div>
                </div>
                <h1 className="text-8xl font-black text-white italic tracking-tighter drop-shadow-2xl leading-[0.9] uppercase">
                  JOGO DA<br />
                  <span className="text-[#f7941d]">MEMÓRIA</span>
                </h1>
              </motion.div>

              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-white/10 backdrop-blur-md px-12 py-8 rounded-[3rem] border border-white/20 shadow-xl"
              >
                <p className="text-4xl font-bold text-white uppercase tracking-wider leading-tight">
                  Encontre os 5 pares<br />
                  <span className="text-[#f7941d] text-5xl">e ganhe um brinde!</span>
                </p>
              </motion.div>
            </div>

            {/* Bottom Button */}
            <motion.button 
              whileTap={{ scale: 0.95 }}
              onClick={initializeGame}
              className="w-full bg-[#f7941d] py-12 rounded-[4rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] flex items-center justify-center gap-6 relative overflow-hidden border-b-[16px] border-[#d47a00] active:border-b-0 transition-all"
            >
              <Play className="w-16 h-16 text-white fill-current" />
              <span className="text-6xl font-black text-white tracking-widest uppercase italic">COMEÇAR</span>
            </motion.button>
          </motion.div>
        )}

        {/* TABULEIRO DO JOGO */}
        {gameState === 'PLAYING' && (
          <motion.div 
            key="playing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 w-full flex flex-col items-center z-10 py-16 px-8"
          >
            {/* Header Jogo */}
            <div className="w-full max-w-[85%] flex flex-col gap-8 mb-12">
              <div className="flex justify-between items-center">
                <div className="bg-white p-4 rounded-3xl shadow-lg border-2 border-[#f7941d] w-48">
                  <img src={ASSETS.logo} className="w-full h-auto object-contain" alt="Logo" />
                </div>
                <button 
                  onClick={() => setGameState('START')}
                  className="p-6 bg-white/10 backdrop-blur-md rounded-3xl text-white hover:bg-white/20 transition-all border border-white/20 shadow-xl"
                >
                  <RotateCcw className="w-10 h-10" />
                </button>
              </div>

              {/* Progress Panel - Compact and centered */}
              <div className="bg-white/95 backdrop-blur-md p-8 rounded-[3.5rem] border-4 border-[#f7941d] shadow-2xl mx-auto w-full">
                <div className="flex justify-between items-center mb-6 px-2">
                  <h3 className="text-3xl font-black text-[#003380] uppercase tracking-tighter">
                    {matches === 5 ? "CONCLUÍDO!" : `FALTAM ${5 - matches} PARES`}
                  </h3>
                  <div className="bg-[#0047ab] text-white px-6 py-2 rounded-full border-2 border-[#f7941d]/30">
                    <span className="text-4xl font-black">{matches} / 5</span>
                  </div>
                </div>
                <div className="h-8 bg-slate-100 rounded-full overflow-hidden p-1.5 shadow-inner border-2 border-slate-200">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(matches / 5) * 100}%` }}
                    className="h-full bg-gradient-to-r from-[#f7941d] to-[#ffb85f] rounded-full shadow-lg"
                  />
                </div>
              </div>
            </div>

            {/* Grid de Cartas: 2 colunas x 5 linhas - taking 70% width */}
            <div className="grid grid-cols-2 gap-6 w-full max-w-[85%] mx-auto flex-1 content-center">
              {cards.map((card) => (
                <div 
                  key={card.instanceId}
                  onClick={() => handleCardClick(card.instanceId)}
                  className="relative h-[240px] w-full perspective-1000 cursor-pointer"
                >
                  <motion.div
                    animate={{ 
                      rotateY: card.isFlipped || card.isMatched ? 180 : 0,
                      scale: card.isMatched ? 0.96 : 1
                    }}
                    transition={{ type: "spring", stiffness: 180, damping: 22 }}
                    className="w-full h-full preserve-3d relative"
                  >
                    {/* Verso da Carta */}
                    <div className="absolute inset-0 backface-hidden bg-[#0047ab] rounded-[2.5rem] shadow-xl border-[6px] border-white/40 flex flex-col items-center justify-center overflow-hidden">
                       <div className="absolute inset-0 bg-paw-pattern opacity-10"></div>
                       <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center relative z-10 border-2 border-white/20">
                          <img src={ASSETS.paw} className="w-14 h-14 brightness-0 invert opacity-60" alt="" />
                       </div>
                    </div>

                    {/* Frente da Carta */}
                    <div 
                      className={`absolute inset-0 backface-hidden bg-white rounded-[2.5rem] shadow-xl border-[8px] flex flex-col items-center justify-between p-4 rotate-y-180 transition-all duration-300
                        ${card.isMatched ? 'border-[#f7941d] bg-orange-50' : 'border-white'}
                      `}
                      style={{ transform: 'rotateY(180deg)' }}
                    >
                      {card.isMatched && (
                        <motion.div 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-4 -right-4 bg-[#f7941d] text-white p-2.5 rounded-full shadow-lg z-20 border-4 border-white"
                        >
                          <CheckCircle2 className="w-8 h-8" />
                        </motion.div>
                      )}

                      <div className="w-full h-[65%] flex items-center justify-center relative bg-slate-50 rounded-2xl p-2 overflow-hidden">
                        <img 
                          src={card.img} 
                          alt={card.name} 
                          className="max-w-full max-h-full object-contain drop-shadow-md" 
                        />
                      </div>

                      <div className="w-full text-center mt-2 px-1">
                        <span className="inline-block px-3 py-0.5 bg-[#0047ab] rounded-full text-[10px] font-black text-white uppercase italic tracking-widest mb-1">
                          {card.line}
                        </span>
                        <h4 className="text-[1.1rem] font-black text-[#003380] leading-[1.1] uppercase italic truncate w-full">
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
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 w-full flex flex-col items-center justify-center p-12 z-20"
          >
            <div className="relative w-full max-w-2xl bg-white/95 backdrop-blur-2xl p-16 rounded-[5rem] shadow-[0_50px_100px_rgba(0,0,0,0.5)] border-t-[16px] border-[#f7941d] flex flex-col items-center text-center">
              
              <motion.div 
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 12 }}
                transition={{ type: "spring", damping: 12, delay: 0.2 }}
                className="absolute -top-20 bg-[#f7941d] p-10 rounded-[3rem] shadow-2xl border-[8px] border-white"
              >
                <Trophy className="w-24 h-24 text-white" />
              </motion.div>

              <div className="mt-16 space-y-6 mb-12">
                <h2 className="text-9xl font-black text-[#0047ab] leading-none tracking-tighter uppercase italic drop-shadow-lg">UHUUUL!</h2>
                <div className="bg-[#f7941d] inline-block px-8 py-2 rounded-full border-2 border-white shadow-lg rotate-[-2deg]">
                   <p className="text-3xl font-black text-white uppercase tracking-widest italic">VOCÊ GANHOU UM BRINDE!</p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-[3rem] p-10 w-full border-4 border-dashed border-[#0047ab]/20 mb-12 shadow-inner">
                <p className="text-2xl font-bold text-slate-500 uppercase tracking-widest mb-4">Código de retirada:</p>
                <div className="bg-white px-8 py-8 rounded-[2.5rem] shadow-xl border-4 border-[#0047ab]">
                  <span className="text-7xl font-black text-[#0047ab] tracking-widest">{voucherCode}</span>
                </div>
              </div>

              <motion.button 
                whileTap={{ scale: 0.95 }}
                onClick={() => setGameState('START')}
                className="w-full bg-[#f7941d] py-10 rounded-[3.5rem] shadow-2xl flex items-center justify-center gap-5 text-4xl font-black text-white uppercase italic tracking-widest border-b-[10px] border-[#d47a00]"
              >
                <RotateCcw className="w-12 h-12" />
                JOGAR NOVAMENTE
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Branding */}
      <div className="absolute bottom-8 z-10 opacity-40 flex items-center gap-4 text-[#0047ab]">
        <PawPrint className="w-6 h-6" />
        <span className="text-xl font-black tracking-widest uppercase italic">RobustUS Nutrição Animal</span>
      </div>
    </div>
  );
};

export default App;
