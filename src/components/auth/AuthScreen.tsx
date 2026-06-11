import React, { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { User, Phone, CheckCircle2, ChevronRight, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  onStart: (data: any) => void;
  onClose?: () => void;

}

export const AuthScreen: React.FC<Props> = ({ onStart, onClose }) => {
  const [formData, setFormData] = useState({
    phone: '',
    name: '',
    acceptedTerms: false
  });
  const [error, setError] = useState('');
  const [isStarting, setIsStarting] = useState(false);

  const formatPhone = (value: string) => {
    const raw = value.replace(/\D/g, '').slice(0, 11);
    if (raw.length <= 2) return raw;
    if (raw.length <= 6) return `(${raw.slice(0, 2)}) ${raw.slice(2)}`;
    if (raw.length <= 10) return `(${raw.slice(0, 2)}) ${raw.slice(2, 6)}-${raw.slice(6)}`;
    return `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, phone: formatPhone(e.target.value) });
  };

  const isFormValid = formData.phone.replace(/\D/g, '').length >= 10 && 
                      formData.name.trim().length >= 3 && 
                      formData.acceptedTerms;

  const handleStartGame = async (event?: React.FormEvent | React.MouseEvent) => {
    event?.preventDefault?.();

    if (isStarting) return;

    setError("");

    const { phone, name, acceptedTerms } = formData;
    const cleanedPhone = String(phone || "").replace(/\D/g, "");
    const cleanedName = String(name || "").trim();

    if (cleanedPhone.length < 10) {
      setError("Informe um telefone válido.");
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
      const payload = {
        p_phone: cleanedPhone,
        p_event_slug: "robustus-expo-2026",
        p_name: cleanedName
      };

      const { data, error: rpcError } = await (supabase.rpc as any)(
        "register_and_start_play_phone",
        payload
      );

      console.log("REGISTER DATA:", data);

      if (rpcError) {
        setError("Não foi possível iniciar agora.");
        return;
      }

      if (!data?.ok) {
        if (data?.status === "invalid_phone") {
          setError("Informe um telefone válido.");
        } else if (data?.status === "invalid_name") {
          setError("Informe seu nome.");
        } else if (data?.status === "event_inactive") {
          setError("Evento indisponível.");
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
      className="registration-screen flex-1 w-full flex flex-col items-center justify-center p-2 sm:p-4 z-10"
    >
      <div className="registration-card w-full max-w-[min(92vw,440px)] bg-white/95 backdrop-blur-3xl p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] shadow-[0_25px_50px_rgba(0,0,0,0.4)] border-t-[8px] sm:border-t-[12px] border-[#f7941d] flex flex-col gap-4 sm:gap-6 relative">
        {onClose && (
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors z-20"
            aria-label="Fechar cadastro"
            type="button"
          >
            <X className="w-6 h-6 sm:w-8 sm:h-8" />
          </button>
        )}

        
        <div className="text-center space-y-1">
          <h2 className="text-3xl sm:text-4xl font-black text-[#0047ab] uppercase italic tracking-tighter">CADASTRO</h2>
          <p className="text-base sm:text-lg font-bold text-slate-500 uppercase tracking-widest leading-tight">Preencha para começar!</p>
        </div>

        <form className="flex flex-col gap-4 w-full" onSubmit={handleStartGame}>
          
          <div className="flex flex-col gap-3 sm:gap-4">
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
                autoComplete="name"
                onFocus={(e) => {
                  setTimeout(() => {
                    e.target.scrollIntoView({ behavior: "smooth", block: "center" });
                  }, 250);
                }}
                className="w-full bg-slate-100 p-3 sm:p-4 pl-12 sm:pl-16 rounded-xl text-lg sm:text-xl font-bold text-[#003380] border-2 border-transparent focus:border-[#f7941d] outline-none transition-all placeholder:text-slate-400 uppercase"
              />

            </div>

            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0047ab]">
                <Phone className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <input 
                type="text"
                inputMode="tel"
                placeholder="TELEFONE"
                value={formData.phone}
                onChange={handlePhoneChange}
                required
                autoComplete="tel"
                onFocus={(e) => {
                  setTimeout(() => {
                    e.target.scrollIntoView({ behavior: "smooth", block: "center" });
                  }, 250);
                }}
                className="w-full bg-slate-100 p-3 sm:p-4 pl-12 sm:pl-16 rounded-xl text-lg sm:text-xl font-bold text-[#003380] border-2 border-transparent focus:border-[#f7941d] outline-none transition-all placeholder:text-slate-400"
              />

            </div>
          </div>

          <div className="bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-100">
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
            className={`w-full py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-xl flex items-center justify-center gap-3 border-b-[4px] sm:border-b-[6px] transition-all mt-1
              ${isFormValid 
                ? 'bg-[#f7941d] border-[#d47a00] active:border-b-0' 
                : 'bg-slate-300 border-slate-400 cursor-not-allowed opacity-60'}
              ${isStarting ? 'opacity-70 grayscale' : ''}
            `}
          >
            <span className="text-lg sm:text-xl font-black text-white tracking-widest uppercase italic">
              {isStarting ? 'INICIANDO...' : 'COMEÇAR O DESAFIO'}
            </span>
            {!isStarting && <ChevronRight className="w-8 h-8 sm:w-10 sm:h-10 text-white" />}
          </motion.button>
        </form>
      </div>
    </motion.div>
  );
};