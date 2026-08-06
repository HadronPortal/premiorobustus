import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { User, Phone, CheckCircle2, ChevronRight, X, Briefcase, ChevronDown } from "lucide-react";
import { createParticipant, type ParticipantType } from "@/lib/mobileOfflineDb";
import { createCurrentPlayId, upsertParticipant, upsertPlay } from "@/lib/cestaMatches";
import logoAsset from "@/assets/Robustus_Laranja.png.asset.json";
import { formatPhoneBR, isValidPhoneBR, normalizePhoneBR } from "@/lib/phoneValidation";

interface Props {
  game: "cesta" | "memoria";
  onStart: (data: { participantId: string }) => void;
  onClose?: () => void;
}

type ParticipantTypeOption = "" | ParticipantType;

export const MobileOfflineAuth: React.FC<Props> = ({ game, onStart, onClose }) => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [participantType, setParticipantType] = useState<ParticipantTypeOption>("");
  const [participantTypeOther, setParticipantTypeOther] = useState("");
  const otherInputRef = useRef<HTMLInputElement>(null);
  const [accepted, setAccepted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const savingRef = useRef(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const cleanedPhone = normalizePhoneBR(phone);
    const cleanedName = name.trim();

    if (cleanedName.length < 3) {
      newErrors.name = "Informe seu nome completo.";
    }
    
    if (phone.length === 0) {
      newErrors.phone = "Informe seu telefone.";
    } else if (cleanedPhone.length < 10) {
      newErrors.phone = "Telefone incompleto. Digite DDD + número.";
    } else if (!isValidPhoneBR(cleanedPhone)) {
      newErrors.phone = "Digite um telefone brasileiro válido.";
    }

    if (participantType === "") {
      newErrors.participantType = "Selecione seu perfil.";
    }
    
    if (participantType === "outros" && participantTypeOther.trim().length < 2) {
      newErrors.participantTypeOther = "Informe qual é o seu perfil.";
    }
    
    if (!accepted) {
      newErrors.accepted = "Aceite os termos para continuar.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isFormInvalid = () => {
    const cleanedPhone = normalizePhoneBR(phone);
    return (
      name.trim().length < 3 ||
      cleanedPhone.length < 10 ||
      !isValidPhoneBR(cleanedPhone) ||
      participantType === "" ||
      (participantType === "outros" && participantTypeOther.trim().length < 2) ||
      !accepted
    );
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || savingRef.current) return;
    
    if (!validateForm()) return;

    const cleanedPhone = normalizePhoneBR(phone);
    const cleanedName = name.trim();
    
    savingRef.current = true;
    setBusy(true);
    try {
      const playId = createCurrentPlayId();
      const rec = await createParticipant({
        playId,
        name: cleanedName,
        phone: cleanedPhone,
        game,
        participantType: participantType as ParticipantType,
        participantTypeOther:
          participantType === "outros" ? participantTypeOther.trim() : "",
      });
      if (game === "cesta") {
        await upsertParticipant({
          phone: cleanedPhone,
          name: cleanedName,
          participantType: participantType as ParticipantType,
          participantTypeOther:
            participantType === "outros" ? participantTypeOther.trim() : "",
        });
        await upsertPlay({
          playId,
          phone: cleanedPhone,
          status: "registered",
          playedAt: new Date().toISOString(),
        });
      }
      onStart({ participantId: rec.id });
    } catch {
      setErrors(prev => ({ ...prev, form: "Não foi possível iniciar. Tente novamente." }));
    } finally {
      setBusy(false);
      savingRef.current = false;
    }
  };

  const inputClass = (field: string) => 
    `w-full bg-slate-100 p-3 pl-12 rounded-xl text-lg font-bold border-2 outline-none placeholder:text-slate-400 uppercase transition-colors ${
      errors[field] ? "border-red-500 text-red-600 focus:border-red-600" : "border-transparent text-[#003380] focus:border-[#f7941d]"
    }`;

  const selectClass = 
    `w-full appearance-none bg-slate-100 p-3 pl-12 pr-12 rounded-xl text-lg font-bold border-2 outline-none uppercase h-[56px] transition-colors ${
      errors.participantType ? "border-red-500 text-red-600 focus:border-red-600" : "border-transparent focus:border-[#f7941d]"
    } ${participantType === "" ? "text-slate-400" : errors.participantType ? "text-red-600" : "text-[#003380]"}`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="registration-overlay fixed inset-0 min-h-[100dvh] w-full flex flex-col items-center justify-center p-4 z-[100] bg-black/20 backdrop-blur-sm pt-[max(24px,env(safe-area-inset-top))] pb-[max(24px,env(safe-area-inset-bottom))]"
    >
      <div className="registration-modal w-full max-w-[min(92vw,380px)] bg-white/95 backdrop-blur-3xl p-5 rounded-[1.5rem] shadow-[0_25px_50px_rgba(0,0,0,0.4)] border-t-[8px] border-[#f7941d] flex flex-col gap-4 relative max-h-[calc(100dvh-64px)] overflow-y-auto">
        {onClose && (
          <button
            onClick={onClose}
            type="button"
            className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 z-20"
            aria-label="Fechar"
          >
            <X className="w-6 h-6" />
          </button>
        )}

        <div className="flex flex-col items-center gap-4">
          <div className="bg-white rounded-2xl border-2 border-[#f7941d] p-2 w-36 h-14 flex items-center justify-center overflow-hidden shadow-sm">
            <img src={logoAsset.url} alt="RobustUS" className="w-[90%] h-[90%] object-contain" />
          </div>
          <div className="text-center space-y-1">
            <h2 className="text-3xl font-black text-[#0047ab] uppercase italic tracking-tighter">
              CADASTRO
            </h2>
            <p className="text-base font-bold text-slate-500 uppercase tracking-widest leading-tight">
              Preencha para começar
            </p>
          </div>
        </div>

        <form className="flex flex-col gap-3 w-full" onSubmit={submit} noValidate>
          {/* Campo Nome */}
          <div className="space-y-1">
            <div className="relative">
              <div className={`absolute left-4 top-1/2 -translate-y-1/2 ${errors.name ? "text-red-500" : "text-[#0047ab]"}`}>
                <User className="w-6 h-6" />
              </div>
              <input
                type="text"
                placeholder="NOME COMPLETO"
                value={name}
                onChange={(e) => {
                  setName(e.target.value.toUpperCase());
                  if (errors.name) setErrors(prev => ({ ...prev, name: "" }));
                }}
                autoComplete="name"
                className={inputClass("name")}
              />
            </div>
            {errors.name && <p className="text-[10px] font-bold text-red-500 uppercase ml-1">{errors.name}</p>}
          </div>

          {/* Campo Telefone */}
          <div className="space-y-1">
            <div className="relative">
              <div className={`absolute left-4 top-1/2 -translate-y-1/2 ${errors.phone ? "text-red-500" : "text-[#0047ab]"}`}>
                <Phone className="w-6 h-6" />
              </div>
              <input
                type="text"
                inputMode="tel"
                placeholder="TELEFONE"
                value={phone}
                onChange={(e) => {
                  setPhone(formatPhoneBR(e.target.value));
                  if (errors.phone) setErrors(prev => ({ ...prev, phone: "" }));
                }}
                autoComplete="tel"
                onBlur={() => {
                  const cleaned = normalizePhoneBR(phone);
                  if (cleaned.length > 0 && cleaned.length < 10) {
                    setErrors(prev => ({ ...prev, phone: "Telefone incompleto. Digite DDD + número." }));
                  } else if (cleaned.length === 0) {
                    setErrors(prev => ({ ...prev, phone: "Informe seu telefone." }));
                  }
                }}
                className={inputClass("phone")}
              />
            </div>
            {errors.phone && <p className="text-[10px] font-bold text-red-500 uppercase ml-1">{errors.phone}</p>}
          </div>

          {/* Perfil do participante */}
          <div className="space-y-2">
            <div className="space-y-1">
              <div className="relative">
                <div className={`absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none ${errors.participantType ? "text-red-500" : "text-[#0047ab]"}`}>
                  <Briefcase className="w-6 h-6" />
                </div>
                <div className={`absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none ${errors.participantType ? "text-red-500" : "text-[#0047ab]"}`}>
                  <ChevronDown className="w-5 h-5" />
                </div>
                <select
                  aria-label="Qual é o seu perfil?"
                  value={participantType}
                  onChange={(e) => {
                    const val = e.target.value as ParticipantTypeOption;
                    setParticipantType(val);
                    setErrors(prev => ({ ...prev, participantType: "" }));
                    if (val === "outros") {
                      setTimeout(() => {
                        otherInputRef.current?.focus();
                        otherInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }, 100);
                    }
                  }}
                  className={selectClass}
                >
                  <option value="" disabled>SELECIONE UMA OPÇÃO</option>
                  <option value="lojista">LOJISTA</option>
                  <option value="veterinario">VETERINÁRIO</option>
                  <option value="estudante">ESTUDANTE</option>
                  <option value="outros">OUTROS</option>
                </select>
              </div>
              {errors.participantType && <p className="text-[10px] font-bold text-red-500 uppercase ml-1">{errors.participantType}</p>}
            </div>

            {participantType === "outros" && (
              <div className="space-y-1">
                <input
                  ref={otherInputRef}
                  type="text"
                  placeholder="QUAL? (EX: TUTOR, ADESTRADOR...)"
                  value={participantTypeOther}
                  onChange={(e) => {
                    setParticipantTypeOther(e.target.value.toUpperCase());
                    if (errors.participantTypeOther) setErrors(prev => ({ ...prev, participantTypeOther: "" }));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      otherInputRef.current?.blur();
                      document.getElementById('terms-checkbox')?.focus();
                    }
                  }}
                  enterKeyHint="next"
                  maxLength={60}
                  className={inputClass("participantTypeOther").replace("pl-12", "px-4")}
                />
                {errors.participantTypeOther && <p className="text-[10px] font-bold text-red-500 uppercase ml-1">{errors.participantTypeOther}</p>}
              </div>
            )}
          </div>

          {/* Termos */}
          <div className="space-y-1">
            <div className={`bg-slate-50 p-3 rounded-xl border transition-colors ${errors.accepted ? "border-red-200 bg-red-50" : "border-slate-100"}`}>
              <label className="flex items-start gap-3 cursor-pointer">
                <div className="relative mt-1 flex-shrink-0">
                  <input
                    id="terms-checkbox"
                    type="checkbox"
                    checked={accepted}
                    onChange={(e) => {
                      setAccepted(e.target.checked);
                      if (errors.accepted) setErrors(prev => ({ ...prev, accepted: "" }));
                    }}
                    className={`peer appearance-none w-6 h-6 border-2 rounded-lg cursor-pointer outline-none focus:ring-2 focus:ring-[#f7941d] transition-colors ${
                      errors.accepted ? "border-red-500 checked:bg-red-500" : "border-[#0047ab] checked:bg-[#0047ab]"
                    }`}
                  />
                  <CheckCircle2 className="absolute top-0 left-0 w-6 h-6 text-white scale-0 peer-checked:scale-100 pointer-events-none" />
                </div>
                <span className={`text-sm font-semibold leading-snug transition-colors ${errors.accepted ? "text-red-600" : "text-slate-600"}`}>
                  Aceito participar e autorizo o armazenamento dos meus dados para
                  validar a participação e entregar o brinde.
                </span>
              </label>
            </div>
            {errors.accepted && <p className="text-[10px] font-bold text-red-500 uppercase ml-1">{errors.accepted}</p>}
          </div>

          {errors.form && (
            <div className="bg-red-50 border-2 border-red-200 p-3 rounded-xl">
              <p className="text-sm font-black text-red-600 text-center uppercase leading-tight">
                {errors.form}
              </p>
            </div>
          )}

          <motion.button
            whileTap={!isFormInvalid() ? { scale: 0.98 } : {}}
            type="submit"
            disabled={busy}
            className={`w-full py-3 rounded-xl shadow-xl flex items-center justify-center gap-3 border-b-[4px] mt-1 transition-all text-white ${
              !isFormInvalid()
                ? "bg-[var(--robustus-orange)] border-[var(--robustus-orange-hover)] active:border-b-0 cursor-pointer opacity-100"
                : "bg-[var(--robustus-orange)] border-[var(--robustus-orange-hover)] cursor-pointer opacity-55"
            } ${busy ? "opacity-70 grayscale" : ""}`}
          >
            <span className="text-lg font-black text-white tracking-widest uppercase italic">
              {busy ? "INICIANDO..." : "COMEÇAR"}
            </span>
            {!busy && <ChevronRight className="w-8 h-8 text-white" />}
          </motion.button>

          <p className="text-[11px] text-center text-slate-400 font-semibold leading-tight mt-1">
            Seus dados ficam salvos no aparelho e são enviados quando houver
            conexão.
          </p>
        </form>
      </div>
    </motion.div>
  );
};
