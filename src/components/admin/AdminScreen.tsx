import React, { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Ticket, Search, ShieldCheck, XCircle, Gift, User, Calendar, FileText, ChevronRight, RotateCcw, CheckCircle2, AlertTriangle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

type ValidationResult = {
  type: 'pending' | 'redeemed' | 'invalid' | 'unauthorized' | 'error';
  message?: string;
  prizeCode?: string;
  name?: string;
  cpfMasked?: string;
  createdAt?: string;
  redeemedAt?: string;
};

const ConfirmationModal = ({ isOpen, onConfirm, onCancel, loading }: { isOpen: boolean, onConfirm: () => void, onCancel: () => void, loading: boolean }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#003380]/80 backdrop-blur-sm">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }} 
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-[2rem] p-8 max-w-lg w-full shadow-2xl border-4 border-[#f7941d] text-center"
        >
          <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-[#f7941d]" />
          </div>
          <h2 className="text-3xl font-black text-[#003380] uppercase italic tracking-tighter mb-2">Confirmar entrega?</h2>
          <p className="text-base text-slate-500 font-bold uppercase tracking-tight mb-8">Você está prestes a marcar este brinde como entregue.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button 
              onClick={onCancel}
              disabled={loading}
              className="flex-1 py-3 px-6 rounded-xl font-black uppercase italic tracking-widest text-slate-400 hover:bg-slate-100 transition-all text-sm"
            >
              Cancelar
            </button>
            <button 
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 bg-[#0047ab] rounded-xl font-bold text-lg text-white shadow-lg hover:bg-[#003380] active:scale-95 transition-all inline-flex items-center justify-center gap-3 h-[56px] whitespace-nowrap"
            >
              {loading ? <RotateCcw className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5 flex-shrink-0" />}
              {loading ? 'Processando...' : 'Confirmar entrega'}
            </button>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

export const AdminScreen: React.FC = () => {
  const [code, setCode] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

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

  const handleValidate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!code) {
      toast.error("Informe o código do brinde");
      return;
    }
    if (!pin) {
      toast.error("Informe o PIN da equipe");
      return;
    }

    const normalizedCode = normalizeCode(code);
    setCode(normalizedCode);
    
    setLoading(true);
    if (e) setValidationResult(null);

    try {
      const { data, error } = await (supabase.rpc as any)("validate_prize_code", {
        p_code: normalizedCode,
        p_admin_pin: pin
      });

      if (error) {
        toast.error("Erro na validação", { description: "Tente novamente mais tarde." });
        setValidationResult({ type: "error", message: "Não foi possível validar agora." });
        return;
      }

      if (!data?.ok) {
        if (data?.status === "invalid_code") {
          setValidationResult({ type: "invalid", message: "Código não encontrado" });
        } else if (data?.status === "unauthorized") {
          setValidationResult({ type: "unauthorized", message: "PIN inválido" });
        } else {
          setValidationResult({ type: "error", message: data?.message || "Erro na validação" });
        }
        return;
      }

      if (data.status === "found") {
        setValidationResult({
          type: data.prize_status,
          prizeCode: data.prize_code,
          name: data.name,
          cpfMasked: data.cpf_masked,
          createdAt: data.created_at,
          redeemedAt: data.redeemed_at
        });
      }
    } catch (err: any) {
      setValidationResult({ type: "error", message: "Erro de conexão." });
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async () => {
    if (!validationResult?.prizeCode) return;
    setLoading(true);

    try {
      const { data, error } = await (supabase.rpc as any)("redeem_prize_code", {
        p_code: validationResult.prizeCode,
        p_admin_pin: pin
      });

      if (error || !data?.ok) {
        toast.error("Erro ao registrar entrega", { description: data?.message || "Tente novamente." });
        return;
      }

      toast.success("Brinde entregue", { description: "Entrega registrada com sucesso." });
      setShowConfirmModal(false);
      await handleValidate(); 
    } catch (err: any) {
      toast.error("Erro crítico ao registrar entrega.");
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
    <div className="validator-page">
      <ConfirmationModal 
        isOpen={showConfirmModal} 
        onConfirm={handleRedeem} 
        onCancel={() => setShowConfirmModal(false)}
        loading={loading}
      />
      
      <div className="validator-shell">
        {/* Header */}
        <div className="bg-[#ff920f] px-10 py-5 text-white flex items-center justify-between rounded-t-[20px]">
          <div>
            <h1 className="text-2xl font-black uppercase italic tracking-tighter leading-none">Validar Brinde</h1>
            <p className="text-xs font-bold opacity-90 uppercase tracking-widest mt-1">Equipe Stand RobustUS</p>
          </div>
          <ShieldCheck className="w-10 h-10 opacity-30" />
        </div>

        <div className="validator-content">
          {/* Form Section */}
          <form onSubmit={handleValidate} className="validation-form">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 ml-1">Código do Brinde</label>
              <div className="relative">
                <Ticket className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0047ab]" />
                <input 
                  type="text"
                  placeholder="EX: 1234"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-4 pl-12 rounded-xl text-lg font-bold text-[#003380] focus:border-[#f7941d] outline-none transition-all uppercase"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 ml-1">PIN da Equipe</label>
              <div className="relative">
                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0047ab]" />
                <input 
                  type="password"
                  inputMode="numeric"
                  placeholder="PIN"
                  value={pin}
                  onChange={e => setPin(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-4 pl-12 rounded-xl text-lg font-bold text-[#003380] focus:border-[#f7941d] outline-none transition-all"
                />
              </div>
            </div>
            <div>
              <button 
                type="submit"
                disabled={loading}
                className="bg-[#0047ab] text-white px-8 h-[60px] rounded-xl font-black uppercase italic tracking-widest hover:bg-[#003380] transition-all flex items-center justify-center gap-3 disabled:opacity-50 whitespace-nowrap min-w-[200px]"
              >
                {loading ? <RotateCcw className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                {loading ? 'Validando...' : 'Validar Código'}
              </button>
            </div>
          </form>

          {/* Results Area */}
          <div className="validation-result">
            <AnimatePresence mode="wait">
              {!validationResult ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-12 text-center text-slate-300">
                  <Ticket className="w-12 h-12 mx-auto mb-3 opacity-10" />
                  <p className="text-sm font-bold uppercase italic tracking-widest">Aguardando validação...</p>
                </motion.div>
              ) : (validationResult.type === 'invalid' || validationResult.type === 'unauthorized' || validationResult.type === 'error') ? (
                <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="py-8 text-center space-y-4">
                  <XCircle className="w-16 h-16 text-red-500 mx-auto" />
                  <h2 className="text-3xl font-black text-red-600 uppercase italic tracking-tighter">{validationResult.message}</h2>
                  <button onClick={() => setValidationResult(null)} className="text-[#0047ab] font-bold uppercase text-xs hover:underline tracking-widest">Tentar novamente</button>
                </motion.div>
              ) : (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  {/* Status Banner */}
                  <div className={`status-banner border shadow-sm ${
                    validationResult.type === 'pending' 
                      ? 'bg-amber-50 border-amber-100 text-amber-700' 
                      : 'bg-[#0047ab]/5 border-[#0047ab]/10 text-[#0047ab]'
                  }`}>
                    <div className="flex items-center gap-4">
                      {validationResult.type === 'pending' ? <RotateCcw className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
                      <span className="text-2xl font-black uppercase italic tracking-tight">
                        {validationResult.type === 'pending' ? 'Brinde Pendente' : 'Brinde Entregue'}
                      </span>
                    </div>
                    {validationResult.type === 'pending' && (
                      <button 
                        onClick={() => setShowConfirmModal(true)}
                        disabled={loading}
                        className="bg-[#f7941d] text-white px-8 h-[56px] rounded-xl font-black uppercase italic tracking-widest hover:bg-[#d47a00] transition-all shadow-md active:scale-95 inline-flex items-center justify-center gap-3 whitespace-nowrap"
                      >
                        <Gift className="w-5 h-5" />
                        <span>Entregar Brinde</span>
                      </button>
                    )}
                  </div>

                  {/* Info Grid */}
                  <div className="result-grid">
                    <div className="result-card">
                      <p className="text-[9px] font-bold text-slate-400 uppercase mb-2 tracking-widest">Participante</p>
                      <div className="flex items-center gap-3">
                        <User className="w-4 h-4 text-[#0047ab]" />
                        <p className="text-lg font-black text-[#003380] uppercase truncate">{validationResult.name}</p>
                      </div>
                    </div>
                    <div className="result-card">
                      <p className="text-[9px] font-bold text-slate-400 uppercase mb-2 tracking-widest">Documento (CPF)</p>
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-[#0047ab]" />
                        <p className="text-lg font-black text-[#003380]">{validationResult.cpfMasked}</p>
                      </div>
                    </div>
                    <div className="result-card">
                      <p className="text-[9px] font-bold text-slate-400 uppercase mb-2 tracking-widest">Código Validado</p>
                      <div className="flex items-center gap-3">
                        <Ticket className="w-4 h-4 text-[#f7941d]" />
                        <p className="text-lg font-black text-[#003380] italic">{validationResult.prizeCode}</p>
                      </div>
                    </div>
                    <div className="result-card">
                      <p className="text-[9px] font-bold text-slate-400 uppercase mb-2 tracking-widest">
                        {validationResult.type === 'pending' ? 'Data da Vitória' : 'Data da Retirada'}
                      </p>
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-[#0047ab]" />
                        <p className="text-base font-bold text-[#003380]">
                          {validationResult.type === 'pending' ? formatTime(validationResult.createdAt) : formatTime(validationResult.redeemedAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-center">
                    <button onClick={resetForm} className="text-slate-400 hover:text-[#0047ab] font-bold uppercase text-[10px] tracking-[0.15em] flex items-center gap-2 transition-colors py-2">
                      <RotateCcw className="w-3.5 h-3.5" /> Limpar pesquisa
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer */}
        <div className="px-10 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-slate-400 rounded-b-[20px]">
          <button 
            onClick={() => window.location.href = '/'} 
            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest hover:text-[#0047ab] transition-colors"
          >
            <ChevronRight className="w-3 h-3 rotate-180" /> Voltar ao Totem
          </button>
          <p className="text-[10px] font-bold uppercase italic tracking-widest">RobustUS Nutrição Animal</p>
        </div>
      </div>
    </div>
  );
};