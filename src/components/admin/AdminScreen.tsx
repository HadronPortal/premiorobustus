import React, { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Ticket, Search, ShieldCheck, XCircle, Gift, User, Calendar, FileText, ChevronRight, RotateCcw, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const AdminScreen: React.FC = () => {
  const [code, setCode] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [prizeInfo, setPrizeInfo] = useState<any>(null);
  const [redeemSuccess, setRedeemSuccess] = useState(false);

  const formatTime = (isoString: string) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleString('pt-BR');
  };

  const normalizeCode = (input: string) => {
    let cleaned = input.toUpperCase().replace(/\s+/g, '').replace(/[^A-Z0-9-]/g, '');
    
    // Se não tiver o prefixo, adiciona
    if (cleaned && !cleaned.startsWith('ROBUSTUS-')) {
      if (cleaned.startsWith('ROBUSTUS')) {
        // Caso ROBUSTUS123
        cleaned = cleaned.replace('ROBUSTUS', 'ROBUSTUS-');
      } else {
        // Caso apenas 123
        cleaned = `ROBUSTUS-${cleaned}`;
      }
    }
    return cleaned;
  };

  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = normalizeCode(code);
    setCode(normalized);
    
    setLoading(true);
    setError('');
    setPrizeInfo(null);
    setRedeemSuccess(false);

    try {
      const { data, error: rpcError } = await (supabase.rpc as any)("validate_prize_code", {
        p_code: normalized,
        p_admin_pin: pin
      });

      console.log("VALIDATE DATA:", data);
      console.error("VALIDATE ERROR:", rpcError);

      if (rpcError) {
        setError("Não foi possível validar agora.");
        return;
      }

      if (!data?.ok) {
        if (data?.status === 'invalid_code') setError('Código inválido');
        else if (data?.status === 'unauthorized') setError('PIN inválido');
        else setError(data?.message || 'Erro ao validar código.');
        return;
      }

      setPrizeInfo({
        ...data.data,
        code: normalized
      });
    } catch (err: any) {
      console.error("Critical Validate Error:", err);
      setError('Não foi possível validar agora.');
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async () => {
    if (!window.confirm("Confirmar entrega do brinde?")) return;

    setLoading(true);
    setError('');

    try {
      const { data, error: rpcError } = await (supabase.rpc as any)("redeem_prize_code", {
        p_code: prizeInfo.code,
        p_admin_pin: pin
      });

      console.log("REDEEM DATA:", data);
      console.error("REDEEM ERROR:", rpcError);

      if (rpcError) {
        setError("Não foi possível validar agora.");
        return;
      }

      if (!data?.ok) {
        if (data?.status === 'already_redeemed') setError('Brinde já foi retirado anteriormente.');
        else if (data?.status === 'invalid_code') setError('Código inválido.');
        else if (data?.status === 'unauthorized') setError('PIN inválido.');
        else setError(data?.message || 'Erro ao resgatar brinde.');
        return;
      }

      setRedeemSuccess(true);
      setPrizeInfo({
        ...prizeInfo,
        status: 'redeemed',
        redeemed_at: new Date().toISOString()
      });
    } catch (err: any) {
      console.error("Critical Redeem Error:", err);
      setError('Não foi possível validar agora.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCode('');
    setPrizeInfo(null);
    setRedeemSuccess(false);
    setError('');
  };

  return (
    <div className="flex-1 w-full min-h-screen flex flex-col items-center justify-center p-8 z-10 bg-[#0047ab]">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0056cf] via-[#0047ab] to-[#003380] opacity-50"></div>
      
      <div className="relative w-full max-w-[900px] bg-white rounded-[4rem] shadow-2xl p-16 flex flex-col gap-10 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-4 bg-[#f7941d]"></div>
        
        <div className="text-center space-y-4">
          <h2 className="text-7xl font-black text-[#0047ab] uppercase italic tracking-tighter leading-none">VALIDAR BRINDE</h2>
          <p className="text-3xl font-bold text-slate-500 uppercase tracking-widest leading-tight px-4">Use esta tela apenas para a equipe do stand.</p>
        </div>

        {!prizeInfo ? (
          <form onSubmit={handleValidate} className="flex flex-col gap-8 w-full">
            <div className="flex flex-col gap-6">
              <div className="relative">
                <div className="absolute left-8 top-1/2 -translate-y-1/2 text-[#0047ab]">
                  <Ticket className="w-12 h-12" />
                </div>
                <input 
                  type="text"
                  placeholder="CÓDIGO DO BRINDE"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  required
                  className="w-full bg-slate-100 p-12 pl-24 rounded-3xl text-5xl font-bold text-[#003380] border-4 border-transparent focus:border-[#f7941d] outline-none uppercase placeholder:text-slate-300"
                />
              </div>
              <div className="relative">
                <div className="absolute left-8 top-1/2 -translate-y-1/2 text-[#0047ab]">
                  <ShieldCheck className="w-12 h-12" />
                </div>
                <input 
                  type="password"
                  inputMode="numeric"
                  placeholder="PIN DA EQUIPE"
                  value={pin}
                  onChange={e => setPin(e.target.value)}
                  required
                  className="w-full bg-slate-100 p-12 pl-24 rounded-3xl text-5xl font-bold text-[#003380] border-4 border-transparent focus:border-[#f7941d] outline-none placeholder:text-slate-300"
                />
              </div>
            </div>

            <motion.button 
              whileTap={{ scale: 0.96 }}
              disabled={loading}
              className={`w-full bg-[#0047ab] py-14 rounded-[4rem] shadow-2xl flex items-center justify-center gap-6 border-b-[18px] border-[#002b6b] active:border-b-0 transition-all
                ${loading ? 'opacity-70 grayscale' : ''}
              `}
            >
              <Search className="w-16 h-16 text-white" />
              <span className="text-5xl font-black text-white tracking-widest uppercase italic">
                {loading ? 'VALIDANDO...' : 'VALIDAR CÓDIGO'}
              </span>
            </motion.button>
          </form>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col gap-10 w-full"
          >
            {redeemSuccess && (
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-green-50 border-4 border-green-200 p-10 rounded-3xl flex items-center gap-8">
                <CheckCircle2 className="w-20 h-20 text-green-500 shrink-0" />
                <div className="flex-1">
                  <p className="text-4xl font-black text-green-600 uppercase leading-none">BRINDE ENTREGUE COM SUCESSO</p>
                  <p className="text-2xl font-bold text-green-500 mt-2">Horário: {formatTime(prizeInfo.redeemed_at)}</p>
                </div>
              </motion.div>
            )}

            <div className="bg-slate-50 border-4 border-slate-100 p-12 rounded-[3.5rem] flex flex-col gap-8">
              <div className="flex items-center gap-8">
                <div className="bg-[#0047ab]/10 p-6 rounded-3xl">
                  <Ticket className="w-16 h-16 text-[#0047ab]" />
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-400 uppercase tracking-widest italic">CÓDIGO</p>
                  <p className="text-6xl font-black text-[#0047ab] italic">{prizeInfo.code}</p>
                </div>
              </div>

              <div className="h-px bg-slate-200 w-full"></div>

              <div className="grid grid-cols-1 gap-10">
                <div className="flex items-center gap-8">
                  <User className="w-12 h-12 text-[#0047ab]/50" />
                  <div>
                    <p className="text-xl font-black text-slate-400 uppercase italic">PARTICIPANTE</p>
                    <p className="text-4xl font-black text-[#003380] uppercase italic">{prizeInfo.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <FileText className="w-12 h-12 text-[#0047ab]/50" />
                  <div>
                    <p className="text-xl font-black text-slate-400 uppercase italic">CPF</p>
                    <p className="text-4xl font-black text-[#003380] italic">{prizeInfo.cpf_masked}</p>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <Calendar className="w-12 h-12 text-[#0047ab]/50" />
                  <div>
                    <p className="text-xl font-black text-slate-400 uppercase italic">DATA DA VITÓRIA</p>
                    <p className="text-3xl font-bold text-[#003380] italic">{formatTime(prizeInfo.won_at)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <Gift className="w-12 h-12 text-[#0047ab]/50" />
                  <div className="flex-1">
                    <p className="text-xl font-black text-slate-400 uppercase italic">STATUS DO BRINDE</p>
                    <div className="mt-2 flex items-center gap-4">
                      {prizeInfo.status === 'pending' ? (
                        <div className="bg-amber-500 px-8 py-3 rounded-full border-4 border-white shadow-lg rotate-[-1deg]">
                          <p className="text-3xl font-black text-white uppercase italic tracking-wider">BRINDE PENDENTE</p>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <div className="bg-slate-400 px-8 py-3 rounded-full border-4 border-white shadow-lg inline-block">
                            <p className="text-3xl font-black text-white uppercase italic tracking-wider">BRINDE JÁ RETIRADO</p>
                          </div>
                          {prizeInfo.redeemed_at && (
                            <p className="text-xl font-bold text-slate-400 italic">Retirado em: {formatTime(prizeInfo.redeemed_at)}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {prizeInfo.status === 'pending' && (
              <motion.button 
                whileTap={{ scale: 0.96 }}
                onClick={handleRedeem}
                disabled={loading}
                className="w-full bg-[#f7941d] py-14 rounded-[4rem] shadow-2xl flex items-center justify-center gap-6 border-b-[18px] border-[#d47a00] active:border-b-0 transition-all mt-4"
              >
                <Gift className="w-16 h-16 text-white" />
                <span className="text-5xl font-black text-white tracking-widest uppercase italic">
                  {loading ? 'PROCESSANDO...' : 'ENTREGAR BRINDE'}
                </span>
              </motion.button>
            )}

            <button 
              onClick={resetForm}
              className="w-full py-10 rounded-[3rem] border-4 border-slate-200 text-3xl font-black text-slate-400 uppercase italic tracking-widest hover:bg-slate-50 transition-colors"
            >
              LIMPAR E VALIDAR OUTRO
            </button>
          </motion.div>
        )}

        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-red-50 border-4 border-red-200 p-10 rounded-3xl flex items-center gap-8"
            >
              <XCircle className="w-20 h-20 text-red-500 shrink-0" />
              <p className="text-4xl font-black text-red-600 uppercase leading-tight italic">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {!prizeInfo && (
          <button 
            onClick={() => window.location.href = '/'}
            className="flex items-center justify-center gap-4 text-3xl font-black text-slate-300 uppercase italic tracking-widest hover:text-[#0047ab] transition-colors mt-4"
          >
            <RotateCcw className="w-10 h-10" />
            VOLTAR AO JOGO
          </button>
        )}
      </div>
    </div>
  );
};
