import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Volume2, VolumeX, RotateCcw } from 'lucide-react';
import { useAudioManager } from '../hooks/useAudioManager';
import {
  getCurrentParticipantId,
  getParticipant,
  updateParticipant,
  clearCurrentParticipantId,
  syncAll,
} from '@/lib/mobileOfflineDb';
import { addMatch } from '@/lib/cestaMatches';

function generatePrizeCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = 'ROBUSTUS-';
  for (let i = 0; i < 4; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export default function JogoCesta() {
  const navigate = useNavigate();
  const { playSound, startBackgroundMusic, stopBackgroundMusic, isMuted: audioMuted, toggleMute: toggleAudioMute } = useAudioManager();
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameState, setGameState] = useState('start');
  const playStartRef = React.useRef<number | null>(null);

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
          playStartRef.current = Date.now();
        } else if (event.data.state === 'finished' || event.data.state === 'start') {
          stopBackgroundMusic();
          if (event.data.state === 'finished') {
            const finalScore = event.data.score || 0;
            const wonPrize = finalScore >= 200;
            const pet = (event.data.pet || '') as 'cachorro' | 'gato' | '';
            const durationSeconds = playStartRef.current
              ? Math.max(0, Math.round((Date.now() - playStartRef.current) / 1000))
              : 0;
            playStartRef.current = null;
            if (wonPrize) {
              playSound('victory-applause');
            } else {
              playSound('lost');
            }
            // Local-first: atualiza o participante atual no IndexedDB
            const pid = getCurrentParticipantId();
            const prizeCode = wonPrize ? generatePrizeCode() : null;
            (async () => {
              let participant: any = null;
              if (pid) {
                try {
                  await updateParticipant(pid, {
                    score: finalScore,
                    attempts: 1,
                    pet,
                    prizeCode,
                    prizeStatus: wonPrize ? 'pendente' : null,
                  });
                  participant = await getParticipant(pid);
                } catch {}
              }
              // Salva uma NOVA partida no relatório offline (sempre cria nova)
              try {
                await addMatch({
                  name: participant?.name || '',
                  phone: participant?.phone || '',
                  participantType: participant?.participantType || '',
                  participantTypeOther: participant?.participantTypeOther || '',
                  pet,
                  score: finalScore,
                  playedAt: new Date().toISOString(),
                  durationSeconds,
                });
              } catch {}
              try { await syncAll(); } catch {}
            })();
          }
        }
      } else if (event.data.type === 'ROBUSTUS_CATCH_PLAY_SOUND') {
        playSound(event.data.soundType);
      } else if (event.data.type === 'ROBUSTUS_CATCH_NAVIGATE_HOME') {
        clearCurrentParticipantId();
        navigate('/');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
      stopBackgroundMusic();
    };
  }, [playSound, startBackgroundMusic, stopBackgroundMusic, navigate]);

  useEffect(() => {
    // Sincronizar mute com o iframe quando o estado mudar
    const iframe = document.querySelector('iframe');
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({ type: 'ROBUSTUS_CATCH_MUTE', muted: audioMuted }, '*');
    }
  }, [audioMuted]);

  const handleToggleMute = () => {
    toggleAudioMute();
  };

  const scoreProgress = (score / 250) * 100;

  return (
    <main className="catch-game-screen" style={{ width: "100vw", height: "100dvh", overflow: "hidden", background: "#004fb6", position: "relative" }}>
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
                {audioMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              <button 
                onClick={() => {
                  stopBackgroundMusic();
                  navigate('/');
                }}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-md p-2 rounded-full text-white border-2 border-white/30 shadow-sm transition-all active:scale-95"
              >
                <ArrowLeft size={18} />
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
