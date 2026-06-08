import React, { useState, useEffect, useCallback } from 'react';
import { Trophy, RotateCcw, Play, CheckCircle2, Star, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

// Configuração de Marca / Produtos
const BRAND = {
  name: "TECHNOVA",
  primary: "#0062ff",
  accent: "#00f2ff",
  bgGradient: "from-slate-950 via-blue-950 to-slate-950"
};

const PRODUCTS = [
  { id: 1, name: 'S24 ULTRA', img: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400&h=400&fit=crop' },
  { id: 2, name: 'PRO NOTEBOOK', img: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=400&fit=crop' },
  { id: 3, name: 'AUDIO ELITE', img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop' },
  { id: 4, name: 'SMART WATCH 5', img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop' },
  { id: 5, name: 'CINEMA CAM', img: 'https://images.unsplash.com/photo-1526170315870-3f3bd609703b?w=400&h=400&fit=crop' },
];

type GameState = 'START' | 'PLAYING' | 'VICTORY';

interface Card {
  instanceId: number;
  productId: number;
  name: string;
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
          // Feedback de acerto (Confeti pequeno na posição)
          confetti({
            particleCount: 40,
            spread: 70,
            origin: { y: 0.6 },
            colors: [BRAND.primary, BRAND.accent, '#ffffff']
          });
        }, 500);
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
    if (gameState === 'PLAYING' && matches === 5) {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      setVoucherCode(code);
      setTimeout(() => {
        setGameState('VICTORY');
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: [BRAND.primary, BRAND.accent, '#FFD700']
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
    <div className={`min-h-screen bg-gradient-to-br ${BRAND.bgGradient} text-white font-sans flex flex-col items-center justify-start p-8 select-none overflow-hidden relative`}>
      
      {/* Background Decorativo */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-400 rounded-full blur-[120px]" />
      </div>

      {/* Header Fixo no jogo */}
      {gameState === 'PLAYING' && (
        <div className="w-full flex flex-col items-center gap-6 mb-12 z-10 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Sparkles className="text-blue-600 w-6 h-6" />
            </div>
            <span className="text-2xl font-black tracking-widest">{BRAND.name}</span>
          </div>
          
          <div className="w-full bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20 shadow-2xl">
            <div className="flex justify-between items-end mb-4">
              <div>
                <p className="text-blue-300 text-sm font-bold uppercase tracking-tighter">Progresso do Desafio</p>
                <h2 className="text-3xl font-black">ENCONTRE OS PARES</h2>
              </div>
              <div className="text-right">
                <span className="text-4xl font-black text-white">{matches}</span>
                <span className="text-xl text-white/50 font-bold"> / 5</span>
              </div>
            </div>
            <div className="h-4 w-full bg-white/10 rounded-full overflow-hidden p-1">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                style={{ width: `${(matches / 5) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* TELA INICIAL */}
      {gameState === 'START' && (
        <div className="flex-1 flex flex-col items-center justify-center text-center animate-fade-in-up space-y-16 z-10">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500 blur-[80px] opacity-30 animate-pulse" />
            <div className="relative bg-white/10 backdrop-blur-xl p-12 rounded-[4rem] border border-white/20 shadow-2xl inline-block mb-8">
              <div className="w-40 h-40 bg-gradient-to-tr from-blue-600 to-cyan-400 rounded-3xl flex items-center justify-center shadow-2xl mb-8 mx-auto rotate-12 transition-transform hover:rotate-0 duration-500">
                <Sparkles className="text-white w-20 h-20" />
              </div>
              <h2 className="text-2xl font-medium tracking-[0.3em] text-blue-300 mb-2">{BRAND.name}</h2>
              <h1 className="text-7xl font-black tracking-tight leading-none mb-6">
                GRAND<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">CHALLENGE</span>
              </h1>
              <p className="text-xl text-white/60 max-w-sm mx-auto font-medium">
                Teste sua agilidade e memória para ganhar brindes exclusivos da nossa nova coleção.
              </p>
            </div>
          </div>
          
          <button 
            onClick={initializeGame}
            className="group relative flex flex-col items-center gap-4 animate-bounce"
          >
            <div className="bg-white text-blue-600 w-32 h-32 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(255,255,255,0.3)] group-active:scale-90 transition-all duration-300">
              <Play className="w-16 h-16 fill-current ml-2" />
            </div>
            <span className="text-2xl font-black tracking-widest text-white">TOQUE PARA COMEÇAR</span>
          </button>
        </div>
      )}

      {/* TABULEIRO DO JOGO */}
      {gameState === 'PLAYING' && (
        <div className="flex-1 w-full max-w-lg z-10 animate-fade-in flex flex-col items-center justify-center">
          <div className="grid grid-cols-2 gap-6 w-full">
            {cards.map((card) => (
              <div 
                key={card.instanceId}
                onClick={() => handleCardClick(card.instanceId)}
                className={`
                  relative h-64 w-full cursor-pointer perspective-1000
                  transition-all duration-500 transform-style-3d
                  ${card.isFlipped || card.isMatched ? 'rotate-y-180 scale-100' : 'hover:scale-105'}
                  ${card.isMatched ? 'opacity-90' : ''}
                `}
              >
                {/* Verso (Fechado) */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-800 rounded-[2.5rem] shadow-2xl border-4 border-white/20 flex items-center justify-center backface-hidden overflow-hidden">
                  <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
                  <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center">
                    <Star className="text-white/40 w-12 h-12" />
                  </div>
                </div>
                
                {/* Frente (Aberto) */}
                <div className={`
                  absolute inset-0 bg-white rounded-[2.5rem] shadow-2xl border-8 flex flex-col items-center justify-center p-4 rotate-y-180 backface-hidden overflow-hidden
                  ${card.isMatched ? 'border-green-400' : 'border-blue-100'}
                `}>
                  {card.isMatched && (
                    <div className="absolute top-4 right-4 animate-fade-in">
                      <CheckCircle2 className="text-green-500 w-10 h-10" />
                    </div>
                  )}
                  <div className="flex-1 flex items-center justify-center p-4">
                    <img src={card.img} alt={card.name} className="max-w-full max-h-40 object-contain drop-shadow-2xl" />
                  </div>
                  <div className="bg-slate-900 w-full py-4 px-2 rounded-2xl">
                    <span className="text-sm font-black text-white text-center uppercase block tracking-widest">{card.name}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button onClick={initializeGame} className="mt-12 flex items-center gap-2 text-white/40 font-bold uppercase tracking-widest hover:text-white transition-colors py-4 px-8 bg-white/5 rounded-full border border-white/10">
            <RotateCcw className="w-5 h-5" /> Reiniciar Jogo
          </button>
        </div>
      )}

      {/* TELA DE VITÓRIA */}
      {gameState === 'VICTORY' && (
        <div className="flex-1 flex flex-col items-center justify-center z-20 w-full max-w-md animate-fade-in-up">
          <div className="relative bg-white text-slate-900 p-12 rounded-[4rem] shadow-[0_0_100px_rgba(59,130,246,0.4)] border-4 border-white text-center w-full">
            <div className="absolute top-[-50px] left-1/2 -translate-x-1/2">
              <div className="w-32 h-32 bg-yellow-400 rounded-[2rem] flex items-center justify-center rotate-12 shadow-2xl border-8 border-white">
                <Trophy className="w-16 h-16 text-white" />
              </div>
            </div>
            
            <div className="mt-12 space-y-4 mb-10">
              <h2 className="text-6xl font-black tracking-tight text-blue-600 leading-none">EXCELENTE TRABALHO!</h2>
              <p className="text-2xl text-slate-500 font-medium leading-tight">Você venceu o desafio e ganhou um presente especial.</p>
            </div>

            <div className="bg-slate-100 w-full p-8 rounded-[2.5rem] border-4 border-dashed border-blue-200 mb-10 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-2 opacity-5">
                 <Sparkles className="w-20 h-20 text-blue-600" />
               </div>
               <p className="text-xs text-slate-400 uppercase font-black tracking-[0.3em] mb-4">Apresente este código no balcão:</p>
               <p className="text-6xl font-mono font-black text-slate-900 tracking-tighter">{voucherCode}</p>
            </div>

            <div className="space-y-6">
              <button 
                onClick={initializeGame}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-8 rounded-[2rem] text-3xl font-black shadow-2xl shadow-blue-500/40 active:scale-95 transition-all"
              >
                NOVO JOGO
              </button>
              <div className="flex flex-col items-center gap-2">
                <p className="text-slate-400 text-sm font-bold animate-pulse">REINICIANDO EM 20S...</p>
                <div className="h-1 w-32 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-200 animate-[progress_20s_linear]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
        
        @keyframes progress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};

export default App;
