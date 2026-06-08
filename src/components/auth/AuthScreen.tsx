import React, { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { User, FileText, CheckCircle2, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  onStart: (data: any) => void;
}

export const AuthScreen: React.FC<Props> = ({ onStart }) => {
  const [formData, setFormData] = useState({
    cpf: '',
    name: '',
    acceptedTerms: false
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const formatCPF = (value: string) => {
    const raw = value.replace(/\D/g, '').slice(0, 11);
    if (raw.length <= 3) return raw;
    if (raw.length <= 6) return `${raw.slice(0, 3)}.${raw.slice(3)}`;
    if (raw.length <= 9) return `${raw.slice(0, 3)}.${raw.slice(3, 6)}.${raw.slice(6)}`;
    return `${raw.slice(0, 3)}.${raw.slice(3, 6)}.${raw.slice(6, 9)}-${raw.slice(9)}`;
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, cpf: formatCPF(e.target.value) });
  };

  const isFormValid = formData.cpf.replace(/\D/g, '').length === 11 && 
                      formData.name.trim().length >= 3 && 
                      formData.acceptedTerms;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    console.log("Supabase URL usada:", import.meta.env.VITE_SUPABASE_URL);

    const { cpf, name, acceptedTerms } = formData;
    const cleanedCpf = String(cpf || "").replace(/\D/g, "");
    const cleanedName = String(name || "").trim();

    const rpcPayload = {
      p_cpf: cleanedCpf,
      p_event_slug: "robustus-expo-2026",
      p_name: cleanedName
    };

    console.log("RPC PAYLOAD REAL:", JSON.stringify(rpcPayload));

    if (cleanedCpf.length !== 11) {
      setError("Informe um CPF válido.");
      return;
    }

    if (!cleanedName) {
      setError("Informe seu nome.");
      return;
    }

    if (!acceptedTerms) {
      setError("Aceite as regras para participar.");
      return;
    }

    setLoading(true);

    try {
      const { data, error: rpcError } = await (supabase.rpc as any)(
        "start_participation_simple",
        rpcPayload
      );

      console.log("START DATA:", data);
      console.error("START ERROR:", rpcError);

      if (rpcError) {
        setError(rpcError.message || "Não foi possível iniciar agora.");
        return;
      }

      if (!data?.ok) {
        if (data?.status === "invalid_cpf") {
          setError("CPF inválido.");
        } else if (data?.status === "already_played") {
          setError("Este CPF já participou desta ação.");
        } else {
          setError(data?.message || "Não foi possível iniciar agora.");
        }
        return;
      }

      onStart(data);
    } catch (err: any) {
      console.error("Critical Error:", err);
      setError(err.message || 'Não foi possível iniciar agora. Chame a equipe do stand.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-1 w-full flex flex-col items-center justify-center p-8 z-10"
    >
      <div className="w-full max-w-[850px] bg-white/95 backdrop-blur-3xl p-16 rounded-[4rem] shadow-[0_50px_100px_rgba(0,0,0,0.6)] border-t-[20px] border-[#f7941d] flex flex-col gap-10 overflow-hidden">
        
        <div className="text-center space-y-4">
          <h2 className="text-7xl font-black text-[#0047ab] uppercase italic tracking-tighter">CADASTRO</h2>
          <p className="text-3xl font-bold text-slate-500 uppercase tracking-widest leading-tight">Preencha para começar o desafio!</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-10 w-full">
          
          <div className="flex flex-col gap-8">
            <div className="relative">
              <div className="absolute left-8 top-1/2 -translate-y-1/2 text-[#0047ab]">
                <FileText className="w-12 h-12" />
              </div>
              <input 
                type="text"
                inputMode="numeric"
                placeholder="CPF"
                value={formData.cpf}
                onChange={handleCPFChange}
                required
                className="w-full bg-slate-100 p-12 pl-24 rounded-3xl text-5xl font-bold text-[#003380] border-4 border-transparent focus:border-[#f7941d] outline-none transition-all placeholder:text-slate-400 uppercase"
              />
            </div>

            <div className="relative">
              <div className="absolute left-8 top-1/2 -translate-y-1/2 text-[#0047ab]">
                <User className="w-12 h-12" />
              </div>
              <input 
                type="text"
                placeholder="NOME COMPLETO"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})}
                required
                className="w-full bg-slate-100 p-12 pl-24 rounded-3xl text-5xl font-bold text-[#003380] border-4 border-transparent focus:border-[#f7941d] outline-none transition-all placeholder:text-slate-400 uppercase truncate max-w-full text-ellipsis overflow-hidden whitespace-nowrap"
              />
            </div>
          </div>

          <div className="bg-slate-50 p-8 rounded-[2rem] border-2 border-slate-100">
            <label className="flex items-start gap-6 cursor-pointer group">
              <div className="relative mt-1">
                <input 
                  type="checkbox" 
                  checked={formData.acceptedTerms}
                  onChange={e => setFormData({...formData, acceptedTerms: e.target.checked})}
                  required
                  className="peer appearance-none w-12 h-12 border-4 border-[#0047ab] rounded-xl checked:bg-[#0047ab] transition-all cursor-pointer"
                />
                <CheckCircle2 className="absolute top-0 left-0 w-12 h-12 text-white scale-0 peer-checked:scale-100 transition-all pointer-events-none" />
              </div>
              <span className="text-3xl font-semibold text-slate-600 leading-tight">
                Aceito participar da ação promocional e autorizo o uso dos meus dados para validar minha participação e entrega do brinde.
              </span>
            </label>
          </div>

          {error && (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-red-50 border-4 border-red-200 p-10 rounded-3xl"
            >
              <p className="text-4xl font-black text-red-600 text-center uppercase leading-tight">{error}</p>
            </motion.div>
          )}

          <motion.button 
            whileTap={isFormValid ? { scale: 0.96 } : {}}
            disabled={loading || !isFormValid}
            className={`w-full py-12 rounded-[3.5rem] shadow-2xl flex items-center justify-center gap-6 border-b-[16px] transition-all mt-4
              ${isFormValid 
                ? 'bg-[#f7941d] border-[#d47a00] active:border-b-0' 
                : 'bg-slate-300 border-slate-400 cursor-not-allowed opacity-60'}
              ${loading ? 'opacity-70 grayscale' : ''}
            `}
          >
            <span className="text-6xl font-black text-white tracking-widest uppercase italic">
              {loading ? 'PROCESSANDO...' : 'COMEÇAR O DESAFIO'}
            </span>
            {!loading && <ChevronRight className="w-20 h-20 text-white" />}
          </motion.button>
        </form>
      </div>
    </motion.div>
  );
};
