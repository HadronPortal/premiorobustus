import React, { useState } from "react";
import { motion } from "framer-motion";
import { User, Phone, CheckCircle2, ChevronRight, X, Briefcase, ChevronDown } from "lucide-react";
import { createParticipant, type ParticipantType } from "@/lib/mobileOfflineDb";

interface Props {
  game: "cesta" | "memoria";
  onStart: (data: { participantId: string }) => void;
  onClose?: () => void;
}

type ParticipantTypeOption = "" | ParticipantType;

function formatPhone(value: string) {
  const raw = value.replace(/\D/g, "").slice(0, 11);
  if (raw.length <= 2) return raw;
  if (raw.length <= 6) return `(${raw.slice(0, 2)}) ${raw.slice(2)}`;
  if (raw.length <= 10)
    return `(${raw.slice(0, 2)}) ${raw.slice(2, 6)}-${raw.slice(6)}`;
  return `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7)}`;
}

export const MobileOfflineAuth: React.FC<Props> = ({ game, onStart, onClose }) => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [participantType, setParticipantType] = useState<ParticipantTypeOption>("");
  const [participantTypeOther, setParticipantTypeOther] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const otherValid =
    participantType !== "outros" || participantTypeOther.trim().length >= 2;

  const valid =
    phone.replace(/\D/g, "").length >= 10 &&
    name.trim().length >= 3 &&
    participantType !== "" &&
    otherValid &&
    accepted;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError("");
    const cleanedPhone = phone.replace(/\D/g, "");
    const cleanedName = name.trim();
    if (cleanedName.length < 3) return setError("Informe seu nome.");
    if (cleanedPhone.length < 10) return setError("Informe um telefone válido.");
    if (participantType === "") return setError("Selecione seu perfil para continuar.");
    if (participantType === "outros" && participantTypeOther.trim().length < 2)
      return setError("Diga qual é o seu perfil.");
    if (!accepted) return setError("Aceite a participação para continuar.");
    setBusy(true);
    try {
      const rec = await createParticipant({
        name: cleanedName,
        phone: cleanedPhone,
        game,
        participantType: participantType as ParticipantType,
        participantTypeOther:
          participantType === "outros" ? participantTypeOther.trim() : "",
      });
      onStart({ participantId: rec.id });
    } catch {
      setError("Não foi possível iniciar. Tente novamente.");
    } finally {
      setBusy(false);
    }
  };

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

        <div className="text-center space-y-1">
          <h2 className="text-3xl font-black text-[#0047ab] uppercase italic tracking-tighter">
            CADASTRO
          </h2>
          <p className="text-base font-bold text-slate-500 uppercase tracking-widest leading-tight">
            Preencha para começar
          </p>
        </div>

        <form className="flex flex-col gap-4 w-full" onSubmit={submit}>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0047ab]">
              <User className="w-6 h-6" />
            </div>
            <input
              type="text"
              placeholder="NOME COMPLETO"
              value={name}
              onChange={(e) => setName(e.target.value.toUpperCase())}
              required
              autoComplete="name"
              className="w-full bg-slate-100 p-3 pl-12 rounded-xl text-lg font-bold text-[#003380] border-2 border-transparent focus:border-[#f7941d] outline-none placeholder:text-slate-400 uppercase"
            />
          </div>

          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0047ab]">
              <Phone className="w-6 h-6" />
            </div>
            <input
              type="text"
              inputMode="tel"
              placeholder="TELEFONE"
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              required
              autoComplete="tel"
              className="w-full bg-slate-100 p-3 pl-12 rounded-xl text-lg font-bold text-[#003380] border-2 border-transparent focus:border-[#f7941d] outline-none placeholder:text-slate-400"
            />
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <label className="flex items-start gap-3 cursor-pointer">
              <div className="relative mt-1 flex-shrink-0">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={(e) => setAccepted(e.target.checked)}
                  required
                  className="peer appearance-none w-6 h-6 border-2 border-[#0047ab] rounded-lg checked:bg-[#0047ab] cursor-pointer"
                />
                <CheckCircle2 className="absolute top-0 left-0 w-6 h-6 text-white scale-0 peer-checked:scale-100 pointer-events-none" />
              </div>
              <span className="text-sm font-semibold text-slate-600 leading-snug">
                Aceito participar e autorizo o armazenamento dos meus dados para
                validar a participação e entregar o brinde.
              </span>
            </label>
          </div>

          {error && (
            <div className="bg-red-50 border-2 border-red-200 p-3 rounded-xl">
              <p className="text-sm font-black text-red-600 text-center uppercase leading-tight">
                {error}
              </p>
            </div>
          )}

          <motion.button
            whileTap={valid ? { scale: 0.98 } : {}}
            type="submit"
            disabled={busy || !valid}
            className={`w-full py-3 rounded-xl shadow-xl flex items-center justify-center gap-3 border-b-[4px] mt-1 ${
              valid
                ? "bg-[#f7941d] border-[#d47a00] active:border-b-0"
                : "bg-slate-300 border-slate-400 cursor-not-allowed opacity-60"
            } ${busy ? "opacity-70 grayscale" : ""}`}
          >
            <span className="text-lg font-black text-white tracking-widest uppercase italic">
              {busy ? "INICIANDO..." : "COMEÇAR"}
            </span>
            {!busy && <ChevronRight className="w-8 h-8 text-white" />}
          </motion.button>

          <p className="text-[11px] text-center text-slate-400 font-semibold leading-tight">
            Seus dados ficam salvos no aparelho e são enviados quando houver
            conexão.
          </p>
        </form>
      </div>
    </motion.div>
  );
};
