import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function JogoCesta() {
  const navigate = useNavigate();

  return (
    <main style={{ width: "100vw", height: "100dvh", overflow: "hidden", background: "#004fb6", position: "relative" }}>
      <button 
        onClick={() => navigate('/')}
        style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          zIndex: 100,
          background: "rgba(255, 255, 255, 0.2)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255, 255, 255, 0.3)",
          color: "white",
          padding: "10px 20px",
          borderRadius: "12px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontWeight: "bold",
          cursor: "pointer",
          fontSize: "14px",
          textTransform: "uppercase",
          letterSpacing: "1px"
        }}
      >
        <ArrowLeft size={18} />
        Voltar
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