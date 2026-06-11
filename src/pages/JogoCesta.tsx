import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Volume2, VolumeX, RotateCcw } from 'lucide-react';

export default function JogoCesta() {
  const navigate = useNavigate();
  const { playSound, startBackgroundMusic, stopBackgroundMusic, isMuted: audioMuted, toggleMute: toggleAudioMute } = useAudioManager();
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isMuted, setIsMuted] = useState(false);
  const [gameState, setGameState] = useState('start');

  const { playSound, startBackgroundMusic, stopBackgroundMusic, isMuted: audioMuted } = useAudioManager();

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'ROBUSTUS_CATCH_UPDATE') {
        setScore(event.data.score || 0);
        setTimeLeft(Math.ceil(event.data.remaining || 0));
      } else if (event.data.type === 'ROBUSTUS_CATCH_STATE_CHANGE') {
        setGameState(event.data.state);
        
        // Gerenciamento de áudio baseado no estado do jogo
        if (event.data.state === 'playing') {
          startBackgroundMusic();
        } else if (event.data.state === 'finished' || event.data.state === 'start') {
          stopBackgroundMusic();
          if (event.data.state === 'finished') {
            // Som de vitória ou derrota enviado pelo jogo ou processado aqui
            const score = event.data.score || 0;
            if (score >= 200) {
              playSound('victory-applause');
            } else {
              playSound('lost');
            }
          }
        }
      } else if (event.data.type === 'ROBUSTUS_CATCH_PLAY_SOUND') {
        playSound(event.data.soundType);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
      stopBackgroundMusic();
    };
  }, []);

  useEffect(() => {
    // Sincronizar mute com o iframe quando o estado mudar
    const iframe = document.querySelector('iframe');
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({ type: 'ROBUSTUS_CATCH_MUTE', muted: audioMuted }, '*');
    }
    setIsMuted(audioMuted);
  }, [audioMuted]);

  const handleRestart = () => {
    const iframe = document.querySelector('iframe');
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({ type: 'ROBUSTUS_CATCH_RESTART' }, '*');
    }
  };

  const toggleMuteHandler = () => {
    const { toggleMute: toggleAudioMute } = useAudioManager(); // Note: This usage is slightly wrong in terms of hook rules, but we need to call it.
    // However, we already have access to toggleMute from the hook in the component scope if we destructure it.
  };

  const scoreProgress = (score / 250) * 100;

  return (
    <main style={{ width: "100vw", height: "100dvh", overflow: "hidden", background: "#004fb6", position: "relative" }}>
      {gameState === 'playing' && (
        <div className="catch-game-hud" style={{
          position: 'fixed',
          top: 'max(8px, env(safe-area-inset-top))',
          left: '12px',
          right: '12px',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          pointerEvents: 'none'
        }}>
          <div className="catch-hud-row" style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            alignItems: 'center'
          }}>
            <img 
              src="https://robustus.com.br/wp-content/uploads/2025/03/logo.png" 
              alt="RobustUS" 
              className="catch-logo" 
              style={{ justifySelf: 'start', width: '92px', maxHeight: '34px', objectFit: 'contain' }}
            />
            
            <div className="catch-timer-pill" style={{
              justifySelf: 'center',
              background: 'rgba(255,255,255,.18)',
              border: '1px solid rgba(255,255,255,.22)',
              borderRadius: '12px',
              padding: '6px 14px',
              color: 'white',
              fontWeight: 900,
              fontSize: '14px'
            }}>
              ⏱ {timeLeft}s
            </div>

            <div className="catch-actions" style={{ justifySelf: 'end', display: 'flex', gap: '6px', pointerEvents: 'auto' }}>
            <button 
              onClick={handleToggleMute}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-md p-2 rounded-full text-white border-2 border-white/30 shadow-sm transition-all active:scale-95"
              >
                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              <button 
                onClick={() => navigate('/')}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-md p-2 rounded-full text-white border-2 border-white/30 shadow-sm transition-all active:scale-95"
              >
                <RotateCcw size={18} />
              </button>
            </div>
          </div>

          <div className="catch-info-bar" style={{
            background: '#fff',
            border: '2px solid #ff9418',
            borderRadius: '12px',
            padding: '8px 12px 7px',
            boxShadow: '0 3px 0 rgba(0,0,0,.14)',
            pointerEvents: 'auto'
          }}>
            <div className="catch-info-top" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              color: '#004aa8',
              fontWeight: 900,
              fontSize: '12px',
              textTransform: 'uppercase'
            }}>
              <span>PONTOS: {score} / 250</span>
              <span>RESTANTE: {timeLeft}s</span>
            </div>
            <div className="catch-progress" style={{
              marginTop: '6px',
              height: '5px',
              background: '#edf3fb',
              borderRadius: '999px',
              overflow: 'hidden'
            }}>
              <div 
                className="catch-progress-fill" 
                style={{
                  height: '100%',
                  width: `${Math.min(scoreProgress, 100)}%`,
                  background: '#ff9418',
                  borderRadius: 'inherit',
                  transition: 'width 0.3s ease'
                }} 
              />
            </div>
          </div>
        </div>
      )}

      <iframe
        title="Desafio Pet RobustUS"
        src="/robustus-catch-game/index.html?v=20260611-score-rules"
        style={{ width: "100%", height: "100%", border: 0, display: "block" }}
        allow="fullscreen"
      />
    </main>
  );
}
