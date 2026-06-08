import React, { useState, useEffect, useCallback } from 'react';
import { Trophy, RefreshCw, Play } from 'lucide-react';

// Array de produtos fácil de editar
const PRODUCTS = [
  { id: 1, name: 'Smartphone Pro', img: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&h=300&fit=crop' },
  { id: 2, name: 'Notebook Slim', img: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=300&h=300&fit=crop' },
  { id: 3, name: 'Headset Gamer', img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop' },
  { id: 4, name: 'Smartwatch', img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop' },
  { id: 5, name: 'Câmera 4K', img: 'https://images.unsplash.com/photo-1526170315870-3f3bd609703b?w=300&h=300&fit=crop' },
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

  const initializeGame = useCallback(() => {
    const gameCards: Card[] = [...PRODUCTS, ...PRODUCTS].map((product, index) => ({
      ...product,
      instanceId: index,
      productId: product.id,
      isFlipped: false,
      isMatched: false,
    }));

    // Embaralhar
    const shuffled = gameCards.sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setFlippedCards([]);
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
        // Match!
        setTimeout(() => {
          setCards(prev => prev.map(c => 
            c.productId === firstCard.productId ? { ...c, isMatched: true } : c
          ));
          setFlippedCards([]);
          setLockBoard(false);
        }, 600);
      } else {
        // No match
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
    if (gameState === 'PLAYING' && cards.length > 0 && cards.every(c => c.isMatched)) {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      setVoucherCode(code);
      setGameState('VICTORY');
    }
  }, [cards, gameState]);

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
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col items-center justify-center p-6 select-none overflow-hidden">
      {gameState === 'START' && (
        <div className="flex flex-col items-center text-center animate-fade-in-up space-y-12">
          <div className="w-32 h-32 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl">
            <span className="text-white font-black text-4xl">LOGO</span>
          </div>
          <div className="space-y-4">
            <h1 className="text-5xl font-extrabold tracking-tight text-slate-800">
              Jogo da Memória
            </h1>
            <p className="text-xl text-slate-500 max-w-xs mx-auto">
              Encontre os pares de produtos e ganhe um brinde exclusivo!
            </p>
          </div>
          <button 
            onClick={initializeGame}
            className="group relative flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-12 py-6 rounded-full text-2xl font-bold transition-all shadow-lg active:scale-95"
          >
            <Play className="w-8 h-8 fill-current" />
            COMEÇAR
          </button>
        </div>
      )}

      {gameState === 'PLAYING' && (
        <div className="w-full max-w-md h-full flex flex-col items-center gap-8 animate-fade-in">
          <div className="w-full flex justify-between items-center px-4">
            <div className="bg-white px-6 py-2 rounded-full shadow-sm border border-slate-200">
              <span className="font-bold text-blue-600">Pares: {cards.filter(c => c.isMatched).length / 2} / 5</span>
            </div>
            <button onClick={initializeGame} className="p-3 bg-white rounded-full shadow-sm border border-slate-200 active:rotate-180 transition-transform">
              <RefreshCw className="w-6 h-6 text-slate-600" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full">
            {cards.map((card) => (
              <div 
                key={card.instanceId}
                onClick={() => handleCardClick(card.instanceId)}
                className={`
                  relative h-48 w-full cursor-pointer perspective-1000
                  transition-transform duration-500 transform-style-3d
                  ${card.isFlipped || card.isMatched ? 'rotate-y-180' : ''}
                `}
              >
                {/* Front (Hidden) */}
                <div className="absolute inset-0 bg-blue-600 rounded-2xl shadow-md border-4 border-white flex items-center justify-center backface-hidden">
                  <div className="w-12 h-12 border-2 border-white/30 rounded-full flex items-center justify-center">
                    <span className="text-white/50 font-bold">?</span>
                  </div>
                </div>
                
                {/* Back (Revealed) */}
                <div className="absolute inset-0 bg-white rounded-2xl shadow-md border-4 border-blue-100 flex flex-col items-center justify-center p-2 rotate-y-180 backface-hidden">
                  <img src={card.img} alt={card.name} className="w-24 h-24 object-contain mb-2" />
                  <span className="text-xs font-bold text-slate-700 text-center uppercase tracking-tighter">{card.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {gameState === 'VICTORY' && (
        <div className="flex flex-col items-center text-center space-y-8 animate-fade-in-up bg-white p-10 rounded-[3rem] shadow-2xl border-2 border-blue-50 max-w-sm">
          <div className="w-24 h-24 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce shadow-lg">
            <Trophy className="w-12 h-12 text-white" />
          </div>
          
          <div className="space-y-4">
            <h2 className="text-4xl font-black text-slate-800">Parabéns!</h2>
            <p className="text-xl text-slate-600">Você encontrou todos os pares e ganhou um brinde.</p>
          </div>

          <div className="bg-slate-50 w-full p-6 rounded-2xl border-2 border-dashed border-blue-200">
            <p className="text-sm text-slate-400 uppercase font-bold mb-2">Seu código para retirada:</p>
            <p className="text-5xl font-mono font-black text-blue-600 tracking-widest">{voucherCode}</p>
          </div>

          <div className="space-y-4 w-full">
            <button 
              onClick={initializeGame}
              className="w-full bg-blue-600 text-white py-5 rounded-2xl text-xl font-bold shadow-lg active:scale-95 transition-transform"
            >
              JOGAR NOVAMENTE
            </button>
            <p className="text-slate-400 text-sm italic">O jogo reiniciará automaticamente em alguns segundos...</p>
          </div>
        </div>
      )}

      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  );
};

export default App;
