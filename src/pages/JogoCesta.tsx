import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function JogoCesta() {
  const navigate = useNavigate();
  
  return (
    <main style={{ width: "100vw", height: "100dvh", overflow: "hidden", background: "#004fb6", position: "relative" }}>
      <div className="game-hud" style={{
        position: 'fixed',
        top: 'max(12px, env(safe-area-inset-top))',
        left: '10px',
        right: '10px',
        zIndex: 100,
        display: 'grid',
        gridTemplateColumns: 'auto 1fr auto',
        alignItems: 'center',
        gap: '8px',
        pointerEvents: 'none'
      }}>
        <div className="hud-left" style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, pointerEvents: 'auto' }}>
          <button 
            onClick={() => navigate('/')}
            className="back-button bg-white/20 hover:bg-white/30 backdrop-blur-md p-2 sm:p-3 rounded-full text-white border-2 border-white/30 shadow-lg transition-all active:scale-95"
            style={{ width: 'clamp(42px, 8vw, 56px)', height: 'clamp(42px, 8vw, 56px)', display: 'flex', alignItems: 'center', justifySelf: 'center' }}
          >
            <ArrowLeft className="w-full h-full" />
          </button>
        </div>
        
        {/* Espaço central reservado para o Logo que será desenhado pelo Canvas ou podemos colocar aqui se preferir sobrepor */}
        <div /> 

        <div />
      </div>

      <iframe
        title="Desafio Pet RobustUS"
        src="/robustus-catch-game/index.html?v=20260611-score-rules"
        style={{ width: "100%", height: "100%", border: 0, display: "block" }}
        allow="fullscreen"
      />
    </main>
  );
}