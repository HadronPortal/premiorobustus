import React, { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { User, Smartphone, Mail, FileText, CheckCircle2, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  onStart: (data: any) => void;
}

export const AuthScreen: React.FC<Props> = ({ onStart }) => {
  const [formData, setFormData] = useState({
    cpf: '',
    name: '',
    whatsapp: '',
    email: '',
    acceptedTerms: false,
    marketingConsent: false
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Máscara simples para CPF
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.acceptedTerms) {
      setError('Aceite as regras para participar.');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      // Usando query direta para chamar o RPC se o TS estiver reclamando da definição do Database
      const { data, error: rpcError } = await (supabase.rpc as any)("start_participation", {
        p_event_slug: "robustus-expo-2026",
        p_cpf: formData.cpf.replace(/\D/g, ''),
        p_name: formData.name,
        p_whatsapp: formData.whatsapp || null,
        p_email: formData.email || null,
        p_accepted_terms: formData.acceptedTerms,
        p_marketing_consent: formData.marketingConsent
      });

      if (rpcError) throw rpcError;
      
      const response = data as { 
        ok: boolean; 
        status: string; 
        message?: string;
        play_id?: string;
        play_token?: string;
        max_attempts?: number;
        max_seconds?: number;
      };

      if (!response.ok) {
        if (response.status === 'already_played') {
          setError('Este CPF já participou desta ação. Obrigado pela visita!');
        } else if (response.status === 'invalid_cpf') {
          setError('CPF inválido.');
        } else {
          setError(response.message || 'Erro ao iniciar participação.');
        }
      } else {
        onStart(response);
      }
    } catch (err: any) {
      setError(err.message || 'Erro inesperado de conexão.');
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
      <div className="w-full max-w-[900px] bg-white/95 backdrop-blur-3xl p-16 rounded-[4rem] shadow-[0_50px_100px_rgba(0,0,0,0.6)] border-t-[20px] border-[#f7941d] flex flex-col gap-12 overflow-hidden">
        
        <div className="text-center space-y-4">
          <h2 className="text-7xl font-black text-[#0047ab] uppercase italic tracking-tighter">CADASTRO</h2>
          <p className="text-3xl font-bold text-slate-500 uppercase tracking-widest">Preencha os dados para começar!</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-8 w-full">
          
          <div className="grid grid-cols-1 gap-8">
            <div className="relative">
              <div className="absolute left-8 top-1/2 -translate-y-1/2 text-[#0047ab]">
                <FileText className="w-10 h-10" />
              </div>
              <input 
                type="text"
                inputMode="numeric"
                placeholder="CPF (Obrigatório)"
                value={formData.cpf}
                onChange={handleCPFChange}
                required
                className="w-full bg-slate-100 p-10 pl-24 rounded-3xl text-4xl font-bold text-[#003380] border-4 border-transparent focus:border-[#f7941d] outline-none transition-all placeholder:text-slate-400"
              />
            </div>

            <div className="relative">
              <div className="absolute left-8 top-1/2 -translate-y-1/2 text-[#0047ab]">
                <User className="w-10 h-10" />
              </div>
              <input 
                type="text"
                placeholder="NOME COMPLETO (Obrigatório)"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})}
                required
                className="w-full bg-slate-100 p-10 pl-24 rounded-3xl text-4xl font-bold text-[#003380] border-4 border-transparent focus:border-[#f7941d] outline-none transition-all placeholder:text-slate-400"
              />
            </div>

            <div className="relative">
              <div className="absolute left-8 top-1/2 -translate-y-1/2 text-[#0047ab]">
                <Smartphone className="w-10 h-10" />
              </div>
              <input 
                type="tel"
                placeholder="WHATSAPP (Opcional)"
                value={formData.whatsapp}
                onChange={e => setFormData({...formData, whatsapp: e.target.value})}
                className="w-full bg-slate-100 p-10 pl-24 rounded-3xl text-4xl font-bold text-[#003380] border-4 border-transparent focus:border-[#f7941d] outline-none transition-all placeholder:text-slate-400"
              />
            </div>

            <div className="relative">
              <div className="absolute left-8 top-1/2 -translate-y-1/2 text-[#0047ab]">
                <Mail className="w-10 h-10" />
              </div>
              <input 
                type="email"
                placeholder="E-MAIL (Opcional)"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full bg-slate-100 p-10 pl-24 rounded-3xl text-4xl font-bold text-[#003380] border-4 border-transparent focus:border-[#f7941d] outline-none transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="space-y-6 mt-4">
            <label className="flex items-start gap-6 cursor-pointer group">
              <div className="relative mt-1">
                <input 
                  type="checkbox" 
                  checked={formData.acceptedTerms}
                  onChange={e => setFormData({...formData, acceptedTerms: e.target.checked})}
                  required
                  className="peer appearance-none w-10 h-10 border-4 border-[#0047ab] rounded-xl checked:bg-[#0047ab] transition-all cursor-pointer"
                />
                <CheckCircle2 className="absolute top-0 left-0 w-10 h-10 text-white scale-0 peer-checked:scale-100 transition-all pointer-events-none" />
              </div>
              <span className="text-2xl font-semibold text-slate-600 leading-tight">
                Aceito participar da ação promocional e autorizo o uso dos meus dados para validar minha participação e entrega do brinde.
              </span>
            </label>

            <label className="flex items-start gap-6 cursor-pointer">
              <div className="relative mt-1">
                <input 
                  type="checkbox" 
                  checked={formData.marketingConsent}
                  onChange={e => setFormData({...formData, marketingConsent: e.target.checked})}
                  className="peer appearance-none w-10 h-10 border-4 border-[#0047ab] rounded-xl checked:bg-[#0047ab] transition-all cursor-pointer"
                />
                <CheckCircle2 className="absolute top-0 left-0 w-10 h-10 text-white scale-0 peer-checked:scale-100 transition-all pointer-events-none" />
              </div>
              <span className="text-2xl font-semibold text-slate-600 leading-tight">
                Aceito receber contato da RobustUS após o evento.
              </span>
            </label>
          </div>

          {error && (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-red-50 border-4 border-red-200 p-8 rounded-3xl"
            >
              <p className="text-3xl font-black text-red-600 text-center uppercase leading-tight">{error}</p>
            </motion.div>
          )}

          <motion.button 
            whileTap={{ scale: 0.96 }}
            disabled={loading}
            className={`w-full bg-[#f7941d] py-12 rounded-[3rem] shadow-2xl flex items-center justify-center gap-6 border-b-[16px] border-[#d47a00] active:border-b-0 transition-all mt-6
              ${loading ? 'opacity-70 grayscale cursor-not-allowed' : ''}
            `}
          >
            <span className="text-5xl font-black text-white tracking-widest uppercase italic">
              {loading ? 'CARREGANDO...' : 'COMEÇAR O DESAFIO'}
            </span>
            {!loading && <ChevronRight className="w-16 h-16 text-white" />}
          </motion.button>
        </form>
      </div>
    </motion.div>
  );
};
