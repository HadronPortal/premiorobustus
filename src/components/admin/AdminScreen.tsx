import React, { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Ticket, Search, ShieldCheck, XCircle, Gift, User, Calendar, FileText, ChevronRight, RotateCcw, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type ValidationResult = {
  type: 'pending' | 'redeemed' | 'invalid' | 'unauthorized' | 'error';
  message?: string;
  prizeCode?: string;
  name?: string;
  cpfMasked?: string;
  createdAt?: string;
  redeemedAt?: string;
};

export const AdminScreen: React.FC = () => {
  const [code, setCode] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleString('pt-BR');
  };

  const normalizeCode = (input: string) => {
    let cleaned = input.toUpperCase().replace(/\s+/g, '').replace(/[^A-Z0-9-]/g, '');
    if (cleaned && !cleaned.startsWith('ROBUSTUS-')) {
      if (cleaned.startsWith('ROBUSTUS')) {
        cleaned = cleaned.replace('ROBUSTUS', 'ROBUSTUS-');
      } else {
        cleaned = `ROBUSTUS-${cleaned}`;
      }
    }
    return cleaned;
  };

  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedCode = normalizeCode(code);
    setCode(normalizedCode);
    
    setLoading(true);
    setValidationResult(null);

    try {
      const { data, error } = await (supabase.rpc as any)("validate_prize_code", {
        p_code: normalizedCode,
        p_admin_pin: pin
      });

      console.log("VALIDATE DATA:", data);
      console.error("VALIDATE ERROR:", error);

      if (error) {
        setValidationResult({
          type: "error",
          message: "Não foi possível validar agora."
        });
        return;
      }

      if (!data?.ok) {
        if (data?.status === "invalid_code") {
          setValidationResult({
            type: "invalid",
            message: "Código inválido."
          });
        } else if (data?.status === "unauthorized") {
          setValidationResult({
            type: "unauthorized",
            message: "PIN inválido."
          });
        } else {
          setValidationResult({
            type: "error",
            message: data?.message || "Não foi possível validar."
          });
        }
        return;
      }

      if (data.status === "found") {
        setValidationResult({
          type: data.prize_status, // pending ou redeemed
          prizeCode: data.prize_code,
          name: data.name,
          cpfMasked: data.cpf_masked,
          createdAt: data.created_at,
          redeemedAt: data.redeemed_at
        });
      }
    } catch (err: any) {
      console.error("Critical Error:", err);
      setValidationResult({
        type: "error",
        message: "Erro de conexão."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async () => {
    if (!validationResult?.prizeCode || !window.confirm("Confirmar entrega do brinde?")) return;

    setLoading(true);

    try {
      const { data, error } = await (supabase.rpc as any)("redeem_prize_code", {
        p_code: validationResult.prizeCode,
        p_admin_pin: pin
      });

      console.log("REDEEM DATA:", data);
      console.error("REDEEM ERROR:", error);

      if (error) {
        alert("Não foi possível validar agora.");
        return;
      }

      if (!data?.ok) {
        if (data?.status === 'already_redeemed') alert('Brinde já foi retirado anteriormente.');
        else if (data?.status === 'invalid_code') alert('Código inválido.');
        else if (data?.status === 'unauthorized') alert('PIN inválido.');
        else alert(data?.message || 'Erro ao resgatar brinde.');
        return;
      }

      // Sucesso na entrega
      alert("Brinde entregue com sucesso!");
      handleValidate(new Event('submit') as any); // Re-valida para atualizar status
    } catch (err: any) {
      console.error("Critical Redeem Error:", err);
      alert('Erro de conexão.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCode('');
    setPin('');
    setValidationResult(null);
  };

  return (
    <div className="min-h-screen w-full bg-[#0047ab] flex items-center justify-center p-4 sm:p-8 font-sans">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-[#f7941d] p-6 text-white flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black uppercase italic tracking-tighter">Validar Brinde</h1>
            <p className="text-sm font-bold opacity-90 uppercase tracking-widest">Equipe Stand RobustUS</p>
          </div>
          <ShieldCheck className="w-12 h-12 opacity-50" />
        </div>

        <div className="p-8 flex flex-col gap-8">
          {/* Form Section */}
          <form onSubmit={handleValidate} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            <div className="md:col-span-1">
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Código do Brinde</label>
              <div className="relative">
                <Ticket className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0047ab]" />
                <input 
                  type="text"
                  placeholder="EX: 1234"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 p-4 pl-12 rounded-xl text-xl font-bold text-[#003380] focus:border-[#f7941d] outline-none transition-all uppercase"
                />
              </div>
            </div>
            <div className="md:col-span-1">
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">PIN da Equipe</label>
              <div className="relative">
                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0047ab]" />
                <input 
                  type="password"
                  inputMode="numeric"
                  placeholder="PIN"
                  value={pin}
                  onChange={e => setPin(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 p-4 pl-12 rounded-xl text-xl font-bold text-[#003380] focus:border-[#f7941d] outline-none transition-all"
                />
              </div>
            </div>
            <div className="md:col-span-1">
              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-[#0047ab] text-white py-4 rounded-xl font-black uppercase italic tracking-widest hover:bg-[#003380] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {loading ? <RotateCcw className="w-6 h-6 animate-spin" /> : <Search className="w-6 h-6" />}
                {loading ? 'Validando...' : 'Validar Código'}
              </button>
            </div>
          </form>

          {/* Results Area */}
          <div className="min-h-[300px] border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50 flex flex-col items-center justify-center p-8">
            <AnimatePresence mode="wait">
              {!validationResult ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-slate-300">
                  <Ticket className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p className="text-xl font-bold uppercase italic">Aguardando validação...</p>
                </motion.div>
              ) : validationResult.type === 'invalid' || validationResult.type === 'unauthorized' || validationResult.type === 'error' ? (
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-4">
                  <XCircle className="w-20 h-20 text-red-500 mx-auto" />
                  <h2 className="text-4xl font-black text-red-600 uppercase italic tracking-tighter">{validationResult.message}</h2>
                  <button onClick={() => setValidationResult(null)} className="text-[#0047ab] font-bold uppercase text-sm hover:underline">Tentar novamente</button>
                </motion.div>
              ) : (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full space-y-8">
                  {/* Status Banner */}
                  <div className={`p-6 rounded-2xl flex items-center justify-between shadow-sm border-2 ${
                    validationResult.type === 'pending' 
                      ? 'bg-amber-50 border-amber-100 text-amber-700' 
                      : 'bg-slate-100 border-slate-200 text-slate-500'
                  }`}>
                    <div className="flex items-center gap-4">
                      {validationResult.type === 'pending' ? <RotateCcw className="w-8 h-8" /> : <CheckCircle2 className="w-8 h-8" />}
                      <span className="text-3xl font-black uppercase italic tracking-tight">
                        {validationResult.type === 'pending' ? 'Brinde Pendente' : 'Brinde já Retirado'}
                      </span>
                    </div>
                    {validationResult.type === 'pending' && (
                      <button 
                        onClick={handleRedeem}
                        disabled={loading}
                        className="bg-[#f7941d] text-white px-8 py-3 rounded-xl font-black uppercase italic tracking-widest hover:bg-[#d47a00] transition-all shadow-lg active:scale-95"
                      >
                        Entregar Brinde
                      </button>
                    )}
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-widest">Participante</p>
                      <div className="flex items-center gap-3">
                        <User className="w-5 h-5 text-[#0047ab]" />
                        <p className="text-xl font-black text-[#003380] uppercase truncate">{validationResult.name}</p>
                      </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-widest">Documento (CPF)</p>
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-[#0047ab]" />
                        <p className="text-xl font-black text-[#003380]">{validationResult.cpfMasked}</p>
                      </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-widest">Código Validado</p>
                      <div className="flex items-center gap-3">
                        <Ticket className="w-5 h-5 text-[#f7941d]" />
                        <p className="text-xl font-black text-[#003380] italic">{validationResult.prizeCode}</p>
                      </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-widest">
                        {validationResult.type === 'pending' ? 'Data da Vitória' : 'Data da Retirada'}
                      </p>
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-[#0047ab]" />
                        <p className="text-lg font-bold text-[#003380]">
                          {validationResult.type === 'pending' ? formatTime(validationResult.createdAt) : formatTime(validationResult.redeemedAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-center pt-4">
                    <button onClick={resetForm} className="text-slate-400 hover:text-[#0047ab] font-bold uppercase text-xs tracking-widest flex items-center gap-2">
                      <RotateCcw className="w-4 h-4" /> Limpar pesquisa
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-slate-400">
          <button 
            onClick={() => window.location.href = '/'} 
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest hover:text-[#0047ab]"
          >
            <ChevronRight className="w-4 h-4 rotate-180" /> Voltar ao Totem
          </button>
          <p className="text-[10px] font-bold uppercase italic tracking-widest">RobustUS Nutrição Animal</p>
        </div>
      </div>
    </div>
  );
};
