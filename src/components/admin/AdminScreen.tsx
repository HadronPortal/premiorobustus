import React, { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Ticket, Search, ShieldCheck, XCircle, Gift, User, Calendar, Smartphone, FileText, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const AdminScreen: React.FC = () => {
  const [code, setCode] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [prizeInfo, setPrizeInfo] = useState<any>(null);

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleString('pt-BR');
  };

  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setPrizeInfo(null);

    try {
      const { data, error: rpcError } = await (supabase.rpc as any)("validate_prize_code", {
        p_code: code.toUpperCase(),
        p_admin_pin: pin
      });

      if (rpcError) throw rpcError;
      
      const response = data as {
        ok: boolean;
        status: string;
        message?: string;
        data?: {
          name: string;
          cpf_masked: string;
          status: 'pending' | 'redeemed';
          won_at: string;
        };
      };

      if (!response.ok) {
        if (response.status === 'invalid_code') setError('Código inválido ou inexistente.');
        else if (response.status === 'unauthorized') setError('PIN de administrador inválido.');
        else setError(response.message || 'Erro ao validar código.');
      } else {
        setPrizeInfo(response.data);
      }
    } catch (err: any) {
      setError(err.message || 'Erro de conexão.');
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async () => {
    setLoading(true);
    setError('');

    try {
      const { data, error: rpcError } = await (supabase.rpc as any)("redeem_prize_code", {
        p_code: code.toUpperCase(),
        p_admin_pin: pin
      });

      if (rpcError) throw rpcError;

      const response = data as { ok: boolean; status: string; message?: string };

      if (!response.ok) {
        setError(response.message || 'Erro ao resgatar brinde.');
      } else {
        // Atualizar estado local
        setPrizeInfo({ ...prizeInfo, status: 'redeemed' });
      }
    } catch (err: any) {
      setError(err.message || 'Erro de conexão.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 w-full flex flex-col items-center justify-center p-8 z-10 bg-slate-900">
      <div className="w-full max-w-[900px] bg-white rounded-[4rem] shadow-2xl p-16 flex flex-col gap-12">
        
        <div className="flex items-center justify-between border-b-4 border-slate-100 pb-8">
          <div className="space-y-2">
            <h2 className="text-6xl font-black text-[#0047ab] uppercase italic tracking-tighter">VALIDADOR</h2>
            <p className="text-2xl font-bold text-slate-400 uppercase tracking-[0.3em]">EQUIPE STAND ROBUSTUS</p>
          </div>
          <ShieldCheck className="w-24 h-24 text-[#0047ab]/20" />
        </div>

        <form onSubmit={handleValidate} className="flex flex-col gap-8">
          <div className="grid grid-cols-1 gap-8">
            <div className="relative">
              <div className="absolute left-8 top-1/2 -translate-y-1/2 text-[#0047ab]">
                <Ticket className="w-10 h-10" />
              </div>
              <input 
                type="text"
                placeholder="CÓDIGO DO BRINDE"
                value={code}
                onChange={e => setCode(e.target.value)}
                required
                className="w-full bg-slate-100 p-10 pl-24 rounded-3xl text-4xl font-bold text-[#003380] border-4 border-transparent focus:border-[#f7941d] outline-none uppercase"
              />
            </div>
            <div className="relative">
              <div className="absolute left-8 top-1/2 -translate-y-1/2 text-[#0047ab]">
                <ShieldCheck className="w-10 h-10" />
              </div>
              <input 
                type="password"
                inputMode="numeric"
                placeholder="PIN ADMIN"
                value={pin}
                onChange={e => setPin(e.target.value)}
                required
                className="w-full bg-slate-100 p-10 pl-24 rounded-3xl text-4xl font-bold text-[#003380] border-4 border-transparent focus:border-[#f7941d] outline-none"
              />
            </div>
          </div>

          <motion.button 
            whileTap={{ scale: 0.96 }}
            disabled={loading}
            className={`w-full bg-[#0047ab] py-12 rounded-[3rem] shadow-2xl flex items-center justify-center gap-6 border-b-[16px] border-[#002b6b] active:border-b-0 transition-all
              ${loading ? 'opacity-70' : ''}
            `}
          >
            <Search className="w-12 h-12 text-white" />
            <span className="text-4xl font-black text-white tracking-widest uppercase italic">
              {loading ? 'BUSCANDO...' : 'BUSCAR CÓDIGO'}
            </span>
          </motion.button>
        </form>

        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-red-50 border-4 border-red-200 p-10 rounded-[3rem] flex items-center gap-8"
            >
              <XCircle className="w-16 h-16 text-red-500 shrink-0" />
              <p className="text-3xl font-black text-red-600 uppercase leading-tight">{error}</p>
            </motion.div>
          )}

          {prizeInfo && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-50 border-4 border-slate-200 p-12 rounded-[4rem] space-y-10"
            >
              <div className="grid grid-cols-1 gap-8">
                <div className="flex items-center gap-6">
                  <User className="w-12 h-12 text-[#0047ab]" />
                  <div>
                    <p className="text-xl font-bold text-slate-400 uppercase">Ganhador</p>
                    <p className="text-4xl font-black text-[#003380] uppercase">{prizeInfo.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <FileText className="w-12 h-12 text-[#0047ab]" />
                  <div>
                    <p className="text-xl font-bold text-slate-400 uppercase">CPF</p>
                    <p className="text-4xl font-black text-[#003380] tracking-widest">{prizeInfo.cpf_masked}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <Calendar className="w-12 h-12 text-[#0047ab]" />
                  <div>
                    <p className="text-xl font-bold text-slate-400 uppercase">Data da Vitória</p>
                    <p className="text-3xl font-bold text-[#003380]">{formatTime(prizeInfo.won_at)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <Gift className="w-12 h-12 text-[#0047ab]" />
                  <div>
                    <p className="text-xl font-bold text-slate-400 uppercase">Status do Brinde</p>
                    <div className={`inline-block px-6 py-2 rounded-full border-2 mt-2 ${
                      prizeInfo.status === 'pending' 
                        ? 'bg-amber-100 border-amber-300 text-amber-700' 
                        : 'bg-green-100 border-green-300 text-green-700'
                    }`}>
                      <p className="text-2xl font-black uppercase">
                        {prizeInfo.status === 'pending' ? '🟡 PENDENTE' : '🟢 JÁ ENTREGUE'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {prizeInfo.status === 'pending' && (
                <motion.button 
                  whileTap={{ scale: 0.96 }}
                  onClick={handleRedeem}
                  disabled={loading}
                  className="w-full bg-[#f7941d] py-12 rounded-[3rem] shadow-2xl flex items-center justify-center gap-6 border-b-[16px] border-[#d47a00] active:border-b-0 transition-all"
                >
                  <Gift className="w-16 h-16 text-white" />
                  <span className="text-4xl font-black text-white tracking-widest uppercase italic">ENTREGAR BRINDE</span>
                  <ChevronRight className="w-12 h-12 text-white" />
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <button 
          onClick={() => window.location.href = '/'}
          className="text-2xl font-bold text-slate-400 uppercase tracking-widest mt-4 hover:text-[#0047ab] transition-colors"
        >
          Voltar para o Jogo
        </button>
      </div>
    </div>
  );
};
