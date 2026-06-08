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
    <div className="validator-page bg-[#003380] flex items-center justify-center">
      <style>{`
        html, body, #root {
          margin: 0;
          padding: 0;
          height: 100%;
          overflow: hidden;
        }
        .validator-page {
          min-height: 100vh;
          height: 100vh;
          width: 100%;
          padding: 16px 24px;
          box-sizing: border-box;
          overflow: hidden;
        }
        .validator-shell {
          width: min(100%, 1120px);
          height: 100%;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: white;
          border-radius: 20px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }
        .validator-header {
          flex: 0 0 auto;
          min-height: 48px;
          padding: 10px 28px;
          background: #ff920f;
          color: white;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .validator-content {
          flex: 1 1 auto;
          min-height: 0;
          padding: 20px 28px 24px;
          overflow-y: auto;
          overflow-x: hidden;
        }
        .validation-form {
          margin-bottom: 18px;
          display: grid;
          grid-template-columns: 1fr 1fr auto;
          gap: 12px;
          align-items: end;
        }
        .validation-result {
          margin-top: 18px;
          padding: 0;
        }
        .status-banner {
          padding: 12px 20px;
          margin-bottom: 18px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .result-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }
        .result-card {
          padding: 14px 18px;
          background: #f8fafc;
          border: 1px solid #f1f5f9;
          border-radius: 16px;
          min-height: auto;
        }
        @media (max-width: 768px) {
          .validation-form {
            grid-template-columns: 1fr;
          }
          .validator-page {
            padding: 10px;
            overflow-y: auto;
            height: auto;
            min-height: 100vh;
          }
          .validator-shell {
            height: auto;
          }
          html, body, #root {
            overflow: auto;
          }
        }
      `}</style>

      <ConfirmationModal 
        isOpen={showConfirmModal} 
        onConfirm={handleRedeem} 
        onCancel={() => setShowConfirmModal(false)}
        loading={loading}
      />
      
      <div className="validator-shell">
        {/* Header */}
        <div className="validator-header">
          <div>
            <h1 className="text-xl font-black uppercase italic tracking-tighter leading-none">Validar Brinde</h1>
            <p className="text-[10px] font-bold opacity-90 uppercase tracking-widest">Equipe Stand RobustUS</p>
          </div>
          <ShieldCheck className="w-8 h-8 opacity-30" />
        </div>

        <div className="validator-content">
          {/* Form Section */}
          <form onSubmit={handleValidate} className="validation-form">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1">Código do Brinde</label>
              <div className="relative">
                <Ticket className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0047ab]" />
                <input 
                  type="text"
                  placeholder="EX: 1234"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-3 pl-10 rounded-xl text-base font-bold text-[#003380] focus:border-[#f7941d] outline-none transition-all uppercase h-[52px]"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1">PIN da Equipe</label>
              <div className="relative">
                <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0047ab]" />
                <input 
                  type="password"
                  inputMode="numeric"
                  placeholder="PIN"
                  value={pin}
                  onChange={e => setPin(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-3 pl-10 rounded-xl text-base font-bold text-[#003380] focus:border-[#f7941d] outline-none transition-all h-[52px]"
                />
              </div>
            </div>
            <div>
              <button 
                type="submit"
                disabled={loading}
                className="bg-[#0047ab] text-white px-6 h-[52px] rounded-xl font-black uppercase italic tracking-widest hover:bg-[#003380] transition-all flex items-center justify-center gap-2 disabled:opacity-50 whitespace-nowrap min-w-[160px] text-sm"
              >
                {loading ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                {loading ? 'Validando...' : 'Validar Código'}
              </button>
            </div>
          </form>

          {/* Results Area */}
          <div className="validation-result">
            <AnimatePresence mode="wait">
              {!validationResult ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-10 text-center text-slate-300">
                  <Ticket className="w-10 h-10 mx-auto mb-2 opacity-10" />
                  <p className="text-xs font-bold uppercase italic tracking-widest">Aguardando validação...</p>
                </motion.div>
              ) : (validationResult.type === 'invalid' || validationResult.type === 'unauthorized' || validationResult.type === 'error') ? (
                <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="py-6 text-center space-y-3">
                  <XCircle className="w-12 h-12 text-red-500 mx-auto" />
                  <h2 className="text-2xl font-black text-red-600 uppercase italic tracking-tighter">{validationResult.message}</h2>
                  <button onClick={() => setValidationResult(null)} className="text-[#0047ab] font-bold uppercase text-[10px] hover:underline tracking-widest">Tentar novamente</button>
                </motion.div>
              ) : (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  {/* Status Banner */}
                  <div className={`status-banner border shadow-sm ${
                    validationResult.type === 'pending' 
                      ? 'bg-amber-50 border-amber-100 text-amber-700' 
                      : 'bg-[#0047ab]/5 border-[#0047ab]/10 text-[#0047ab]'
                  }`}>
                    <div className="flex items-center gap-3">
                      {validationResult.type === 'pending' ? <RotateCcw className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                      <span className="text-xl font-black uppercase italic tracking-tight">
                        {validationResult.type === 'pending' ? 'Brinde Pendente' : 'Brinde Entregue'}
                      </span>
                    </div>
                    {validationResult.type === 'pending' && (
                      <button 
                        onClick={() => setShowConfirmModal(true)}
                        disabled={loading}
                        className="bg-[#f7941d] text-white px-6 h-[48px] rounded-xl font-black uppercase italic tracking-widest hover:bg-[#d47a00] transition-all shadow-md active:scale-95 inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm"
                      >
                        <Gift className="w-4 h-4" />
                        <span>Confirmar Entrega</span>
                      </button>
                    )}
                  </div>

                  {/* Info Grid */}
                  <div className="result-grid">
                    <div className="result-card">
                      <p className="text-[9px] font-bold text-slate-400 uppercase mb-1.5 tracking-widest">Participante</p>
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-[#0047ab]" />
                        <p className="text-base font-black text-[#003380] uppercase truncate">{validationResult.name}</p>
                      </div>
                    </div>
                    <div className="result-card">
                      <p className="text-[9px] font-bold text-slate-400 uppercase mb-1.5 tracking-widest">Documento (CPF)</p>
                      <div className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-[#0047ab]" />
                        <p className="text-base font-black text-[#003380]">{validationResult.cpfMasked}</p>
                      </div>
                    </div>
                    <div className="result-card">
                      <p className="text-[9px] font-bold text-slate-400 uppercase mb-1.5 tracking-widest">Código Validado</p>
                      <div className="flex items-center gap-2">
                        <Ticket className="w-3.5 h-3.5 text-[#f7941d]" />
                        <p className="text-base font-black text-[#003380] italic">{validationResult.prizeCode}</p>
                      </div>
                    </div>
                    <div className="result-card">
                      <p className="text-[9px] font-bold text-slate-400 uppercase mb-1.5 tracking-widest">
                        {validationResult.type === 'pending' ? 'Data da Vitória' : 'Data da Retirada'}
                      </p>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-[#0047ab]" />
                        <p className="text-sm font-bold text-[#003380]">
                          {validationResult.type === 'pending' ? formatTime(validationResult.createdAt) : formatTime(validationResult.redeemedAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-center pt-2">
                    <button onClick={resetForm} className="text-slate-400 hover:text-[#0047ab] font-bold uppercase text-[9px] tracking-[0.15em] flex items-center gap-2 transition-colors py-1">
                      <RotateCcw className="w-3 h-3" /> Limpar pesquisa
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer */}
        <div className="px-10 py-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-slate-400 rounded-b-[20px]">
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
};