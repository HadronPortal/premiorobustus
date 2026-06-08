import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Trophy, 
  RotateCcw, 
  Play, 
  CheckCircle2, 
  Sparkles, 
  PawPrint, 
  Heart,
  Dog,
  Cat,
  Zap
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';

// Configuração da Marca RobustUS
const BRAND = {
  name: "RobustUS",
  primary: "#0047ab", // Azul RobustUS
  orange: "#f7941d",  // Laranja RobustUS (selo NOVO)
  white: "#ffffff",
  lightBlue: "#e6effb",
};

// Lista de Produtos RobustUS
const PRODUCTS = [
  { 
    id: 1, 
    name: 'Life Special Cão Filhote', 
    line: 'Life Special', 
    category: 'Cães', 
    color: BRAND.orange,
    img: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400&h=400&fit=crop' 
  },
  { 
    id: 2, 
    name: 'Life Special Cão Adulto', 
    line: 'Life Special', 
    category: 'Cães',
    color: BRAND.primary,
    img: 'https://images.unsplash.com/photo-1591768793355-74d7c836038c?w=400&h=400&fit=crop' 
  },
  { 
    id: 3, 
    name: 'Life Special Gato Adulto', 
    line: 'Life Special', 
    category: 'Gatos',
    color: BRAND.primary,
    img: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=400&fit=crop' 
  },
  { 
    id: 4, 
    name: 'Linha +Mais Gato Castrado', 
    line: '+Mais', 
    category: 'Gatos',
    color: '#4caf50',
    img: 'https://images.unsplash.com/photo-1573865668131-9740307300bd?w=400&h=400&fit=crop' 
  },
  { 
    id: 5, 
    name: 'Bifinho RobustUS', 
    line: 'Petiscos', 
    category: 'Cães',
    color: '#e91e63',
    img: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&h=400&fit=crop' 
  },
];

type GameState = 'START' | 'PLAYING' | 'VICTORY';

interface Card {
  instanceId: number;
  productId: number;
  name: string;
  line: string;
  img: string;
  color: string;
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

    // Som de toque (feedback visual)
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
          
          // Feedback de acerto
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
      
      {/* Background patterns */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className={`absolute inset-0 bg-paw-pattern opacity-[0.03]`}></div>
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[40%] bg-blue-50 rounded-full blur-[100px] opacity-50"></div>
        <div className="absolute bottom-[-5%] left-[-5%] w-[40%] h-[30%] bg-orange-50 rounded-full blur-[80px] opacity-50"></div>
      </div>

      <AnimatePresence mode="wait">
        {/* TELA INICIAL */}
        {gameState === 'START' && (
          <motion.div 
            key="start"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-1 w-full flex flex-col items-center justify-between p-12 z-10"
          >
            <div className="flex flex-col items-center gap-8 mt-12 w-full">
              {/* Logo e Icons */}
              <motion.div 
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 12 }}
                className="flex items-center gap-4"
              >
                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-200">
                  <PawPrint className="text-white w-10 h-10" />
                </div>
                <h1 className="text-5xl font-black text-blue-900 tracking-tighter uppercase italic">{BRAND.name}</h1>
              </motion.div>

              <div className="relative w-full max-w-lg mt-8">
                <motion.div 
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="bg-white p-4 rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden"
                >
                  <img 
                    src="https://images.unsplash.com/photo-1548191265-cc70d3d45ba1?w=800&h=1000&fit=crop" 
                    alt="Pet Happy" 
                    className="w-full h-[500px] object-cover rounded-[2.5rem]"
                  />
                  <div className="absolute top-10 right-10 bg-orange-500 text-white p-6 rounded-full shadow-2xl rotate-12 flex flex-col items-center justify-center border-4 border-white">
                    <span className="text-xs font-black uppercase">Prêmio</span>
                    <Sparkles className="w-6 h-6" />
                  </div>
                </motion.div>
              </div>

              <div className="text-center space-y-4 max-w-md">
                <h2 className="text-6xl font-black text-slate-900 leading-[0.9]">DESAFIO DA MEMÓRIA</h2>
                <div className="flex items-center justify-center gap-2 text-orange-600 font-black text-2xl">
                  <Heart className="w-6 h-6 fill-current" />
                  <span>CUIDADO COM AMOR</span>
                  <Heart className="w-6 h-6 fill-current" />
                </div>
                <p className="text-xl text-slate-500 font-medium px-4">
                  Encontre os 5 pares de produtos RobustUS e ganhe um brinde exclusivo!
                </p>
              </div>
            </div>

            <motion.button 
              whileTap={{ scale: 0.95 }}
              onClick={initializeGame}
              className="w-full max-w-lg bg-blue-600 p-10 rounded-[2.5rem] shadow-2xl shadow-blue-200 flex items-center justify-center gap-6 group relative overflow-hidden mb-12"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <Play className="w-12 h-12 text-white fill-current relative z-10" />
              <span className="text-4xl font-black text-white tracking-widest relative z-10">COMEÇAR</span>
            </motion.button>
          </motion.div>
        )}

        {/* TABULEIRO DO JOGO */}
        {gameState === 'PLAYING' && (
          <motion.div 
            key="playing"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 w-full flex flex-col items-center z-10 pt-16 pb-12 px-8"
          >
            {/* Header Jogo */}
            <div className="w-full max-w-lg flex flex-col gap-8 mb-12">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                    <PawPrint className="text-white w-7 h-7" />
                  </div>
                  <span className="text-3xl font-black text-blue-900 uppercase italic tracking-tighter">{BRAND.name}</span>
                </div>
                <button 
                  onClick={() => setGameState('START')}
                  className="p-4 bg-slate-100 rounded-2xl text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <RotateCcw className="w-8 h-8" />
                </button>
              </div>

              <div className="bg-blue-50/80 backdrop-blur-sm p-8 rounded-[2.5rem] border border-blue-100/50 shadow-xl relative overflow-hidden">
                <div className="absolute top-[-20%] right-[-10%] opacity-5">
                   <Dog className="w-40 h-40" />
                </div>
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <p className="text-blue-600 font-black text-sm uppercase tracking-widest mb-1">Status do Jogo</p>
                    <h3 className="text-3xl font-black text-slate-900 uppercase">
                      {matches === 5 ? "Tudo encontrado!" : `Faltam ${5 - matches} pares`}
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-5xl font-black text-blue-600">{matches}</span>
                    <span className="text-2xl font-black text-slate-300"> / 5</span>
                  </div>
                </div>
                <div className="h-4 bg-white rounded-full overflow-hidden p-1 shadow-inner">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(matches / 5) * 100}%` }}
                    className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full shadow-lg"
                  />
                </div>
              </div>
            </div>

            {/* Grid de Cartas */}
            <div className="w-full max-w-lg grid grid-cols-2 gap-6 flex-1 content-center">
              {cards.map((card) => (
                <div 
                  key={card.instanceId}
                  onClick={() => handleCardClick(card.instanceId)}
                  className="relative h-[280px] w-full perspective-1000 cursor-pointer"
                >
                  <motion.div
                    animate={{ 
                      rotateY: card.isFlipped || card.isMatched ? 180 : 0,
                      scale: card.isMatched ? 0.98 : 1
                    }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    className="w-full h-full preserve-3d relative"
                  >
                    {/* Verso da Carta */}
                    <div className="absolute inset-0 backface-hidden bg-blue-600 rounded-[2.5rem] shadow-2xl border-4 border-white flex flex-col items-center justify-center overflow-hidden">
                      <div className="absolute inset-0 bg-paw-pattern opacity-10 scale-150"></div>
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center relative z-10"
                      >
                         <PawPrint className="text-white w-12 h-12" />
                      </motion.div>
                      <div className="absolute bottom-6 flex gap-2">
                         <div className="w-2 h-2 rounded-full bg-white/20"></div>
                         <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                         <div className="w-2 h-2 rounded-full bg-white/20"></div>
                      </div>
                    </div>

                    {/* Frente da Carta */}
                    <div 
                      className={`absolute inset-0 backface-hidden bg-white rounded-[2.5rem] shadow-2xl border-8 flex flex-col items-center justify-between p-6 rotate-y-180 transition-colors duration-500
                        ${card.isMatched ? 'border-blue-500 bg-blue-50/30' : 'border-slate-50'}
                      `}
                      style={{ transform: 'rotateY(180deg)' }}
                    >
                      {card.isMatched && (
                        <motion.div 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-4 -right-4 bg-blue-600 text-white p-3 rounded-full shadow-xl z-20"
                        >
                          <CheckCircle2 className="w-8 h-8" />
                        </motion.div>
                      )}

                      <div className="w-full h-2/3 flex items-center justify-center p-2">
                        <img 
                          src={card.img} 
                          alt={card.name} 
                          className="max-w-full max-h-full object-contain rounded-2xl drop-shadow-xl" 
                        />
                      </div>

                      <div className="w-full text-center space-y-1">
                        <span className="inline-block px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-widest">
                          {card.line}
                        </span>
                        <h4 className="text-base font-black text-slate-800 leading-tight uppercase">
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 w-full flex flex-col items-center justify-center p-12 z-20"
          >
            <div className="relative w-full max-w-lg bg-white p-12 rounded-[4rem] shadow-[0_40px_100px_rgba(0,0,0,0.1)] border-t-8 border-orange-500 flex flex-col items-center text-center">
              
              <motion.div 
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 12 }}
                transition={{ type: "spring", damping: 10, delay: 0.2 }}
                className="absolute -top-16 bg-orange-500 p-8 rounded-[2rem] shadow-2xl border-8 border-white"
              >
                <Trophy className="w-20 h-20 text-white" />
              </motion.div>

              <div className="mt-16 space-y-4 mb-12">
                <h2 className="text-7xl font-black text-blue-900 leading-none tracking-tighter">PARABÉNS!</h2>
                <p className="text-3xl font-black text-orange-600 uppercase tracking-widest">VOCÊ É UM EXPERT!</p>
                <p className="text-xl text-slate-500 font-medium px-4">
                  Encontrou todos os pares dos nossos produtos premium.
                </p>
              </div>

              <div className="w-full bg-slate-50 p-10 rounded-[3rem] border-4 border-dashed border-slate-200 mb-12 relative overflow-hidden group">
                <div className="absolute inset-0 bg-paw-pattern opacity-5 pointer-events-none"></div>
                <p className="text-sm font-black text-slate-400 uppercase tracking-[0.4em] mb-4 relative z-10">Código do Brinde</p>
                <div className="flex items-center justify-center gap-4 relative z-10">
                   <Zap className="w-8 h-8 text-orange-400 fill-current" />
                   <p className="text-5xl font-mono font-black text-slate-900 tracking-tighter">{voucherCode}</p>
                   <Zap className="w-8 h-8 text-orange-400 fill-current" />
                </div>
                <div className="mt-4 text-xs font-bold text-slate-400 relative z-10">
                  MOSTRRE ESTE CÓDIGO NO BALCÃO
                </div>
              </div>

              <div className="w-full space-y-8">
                <motion.button 
                  whileTap={{ scale: 0.95 }}
                  onClick={initializeGame}
                  className="w-full bg-blue-600 p-10 rounded-[2.5rem] shadow-2xl shadow-blue-200 text-3xl font-black text-white uppercase tracking-widest"
                >
                  NOVO JOGO
                </motion.button>
                
                <div className="flex flex-col items-center gap-3">
                  <div className="flex items-center gap-2 text-slate-300 font-black uppercase text-sm">
                    <RotateCcw className="w-4 h-4" />
                    Reiniciando em 20s
                  </div>
                  <div className="h-2 w-48 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: "100%" }}
                      animate={{ width: "0%" }}
                      transition={{ duration: 20, ease: "linear" }}
                      className="h-full bg-orange-300"
                    />
                  </div>
                </div>
              </div>

              {/* Decorative Icons */}
              <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center rotate-[-12deg] border border-slate-100">
                 <Cat className="w-12 h-12 text-blue-400" />
              </div>
              <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-white rounded-[2rem] shadow-2xl flex items-center justify-center rotate-[15deg] border border-slate-100">
                 <Dog className="w-16 h-16 text-orange-400" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Branding */}
      <div className="absolute bottom-6 z-10 opacity-20 flex items-center gap-2 font-black text-slate-400 uppercase tracking-widest text-xs">
         <PawPrint className="w-4 h-4" /> RobustUS Pet Food - Event Activation
      </div>

      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  );
};

export default App;
