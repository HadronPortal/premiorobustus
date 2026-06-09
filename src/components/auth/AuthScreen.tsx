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
  const [isStarting, setIsStarting] = useState(false);

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

  const handleStartGame = async (event?: React.FormEvent | React.MouseEvent) => {
    event?.preventDefault?.();

    if (isStarting) return;

    setError("");

    const { cpf, name, acceptedTerms } = formData;
    const cleanedCpf = String(cpf || "").replace(/\D/g, "");
    const cleanedName = String(name || "").trim();

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

    setIsStarting(true);

    try {
      console.log("SUPABASE URL REAL: https://hayodojtfomtzkzathhq.supabase.co");
      
      const payload = {
        p_cpf: cleanedCpf,
        p_event_slug: "robustus-expo-2026",
        p_name: cleanedName
      };

      const { data, error: rpcError } = await (supabase.rpc as any)(
        "register_and_start_play",
        payload
      );

      console.log("REGISTER DATA:", data);
      console.error("REGISTER ERROR:", rpcError);

      if (rpcError) {
        setError(rpcError.message || "Não foi possível iniciar agora.");
        return;
      }

      if (!data?.ok) {
        if (data?.status === "invalid_cpf") {
          setError("CPF inválido.");
        } else {
          setError(data?.message || "Não foi possível iniciar agora.");
        }
        return;
      }

      onStart(data);
    } catch (err: any) {
      console.error("Critical Error:", err);
      setError("Não foi possível iniciar agora.");
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-1 w-full flex flex-col items-center justify-center p-4 sm:p-8 z-10"
    >
      <div className="w-full max-w-[min(92vw,460px)] bg-white/95 backdrop-blur-3xl p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] shadow-[0_25px_50px_rgba(0,0,0,0.4)] border-t-[10px] sm:border-t-[15px] border-[#f7941d] flex flex-col gap-6 sm:gap-8 overflow-y-auto max-h-[90dvh]">
        
        <div className="text-center space-y-2">
          <h2 className="text-4xl sm:text-5xl font-black text-[#0047ab] uppercase italic tracking-tighter">CADASTRO</h2>
          <p className="text-lg sm:text-xl font-bold text-slate-500 uppercase tracking-widest leading-tight">Preencha para começar!</p>
        </div>

        <form className="flex flex-col gap-6 w-full" onSubmit={handleStartGame}>
          
          <div className="flex flex-col gap-4 sm:gap-6">
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0047ab]">
                <FileText className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <input 
                type="text"
                inputMode="numeric"
                placeholder="CPF"
                value={formData.cpf}
                onChange={handleCPFChange}
                required
                className="w-full bg-slate-100 p-4 sm:p-6 pl-12 sm:pl-16 rounded-2xl text-xl sm:text-2xl font-bold text-[#003380] border-2 border-transparent focus:border-[#f7941d] outline-none transition-all placeholder:text-slate-400 uppercase"
              />
            </div>

            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0047ab]">
                <User className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <input 
                type="text"
                placeholder="NOME COMPLETO"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})}
                required
                className="w-full bg-slate-100 p-4 sm:p-6 pl-12 sm:pl-16 rounded-2xl text-xl sm:text-2xl font-bold text-[#003380] border-2 border-transparent focus:border-[#f7941d] outline-none transition-all placeholder:text-slate-400 uppercase"
              />
            </div>
          </div>

          <div className="bg-slate-50 p-4 sm:p-6 rounded-2xl border border-slate-100">
            <label className="flex items-start gap-3 sm:gap-4 cursor-pointer group">
              <div className="relative mt-1 flex-shrink-0">
                <input 
                  type="checkbox" 
                  checked={formData.acceptedTerms}
                  onChange={e => setFormData({...formData, acceptedTerms: e.target.checked})}
                  required
                  className="peer appearance-none w-6 h-6 sm:w-8 sm:h-8 border-2 border-[#0047ab] rounded-lg checked:bg-[#0047ab] transition-all cursor-pointer"
                />
                <CheckCircle2 className="absolute top-0 left-0 w-6 h-6 sm:w-8 sm:h-8 text-white scale-0 peer-checked:scale-100 transition-all pointer-events-none" />
              </div>
              <span className="text-sm sm:text-base font-semibold text-slate-600 leading-snug">
                Aceito participar da ação promocional e autorizo o uso dos meus dados para validar minha participação e entrega do brinde.
              </span>
            </label>
          </div>

          {error && (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-red-50 border-2 border-red-200 p-4 rounded-xl"
            >
              <p className="text-sm sm:text-base font-black text-red-600 text-center uppercase leading-tight">{error}</p>
            </motion.div>
          )}

          <motion.button 
            whileTap={isFormValid ? { scale: 0.98 } : {}}
            type="submit"
            disabled={isStarting || !isFormValid}
            className={`w-full py-4 sm:py-6 rounded-2xl sm:rounded-3xl shadow-xl flex items-center justify-center gap-3 border-b-[6px] sm:border-b-[10px] transition-all mt-2
              ${isFormValid 
                ? 'bg-[#f7941d] border-[#d47a00] active:border-b-0' 
                : 'bg-slate-300 border-slate-400 cursor-not-allowed opacity-60'}
              ${isStarting ? 'opacity-70 grayscale' : ''}
            `}
          >
            <span className="text-xl sm:text-2xl font-black text-white tracking-widest uppercase italic">
              {isStarting ? 'INICIANDO...' : 'COMEÇAR O DESAFIO'}
            </span>
            {!isStarting && <ChevronRight className="w-8 h-8 sm:w-10 sm:h-10 text-white" />}
          </motion.button>
        </form>
      </div>
    </motion.div>
  );
};
