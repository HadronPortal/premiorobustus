import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function JogoCesta() {
  const navigate = useNavigate();
  
  return (
    <main style={{ width: "100vw", height: "100dvh", overflow: "hidden", background: "#004fb6", position: "relative" }}>
      <button 
        onClick={() => navigate('/')}
        className="absolute top-4 left-4 z-50 bg-white/20 hover:bg-white/30 backdrop-blur-md p-3 rounded-full text-white border-2 border-white/30 shadow-lg transition-all active:scale-95"
        style={{ pointerEvents: 'auto' }}
      >
        <ArrowLeft className="w-8 h-8" />
      </button>

      <iframe
        title="Desafio Pet RobustUS"
        src="/robustus-catch-game/index.html?v=20260611-score-rules"
        style={{ width: "100%", height: "100%", border: 0, display: "block" }}
        allow="fullscreen"
      />
    </main>
  );
}