import React, { useState } from "react";
import { OfflineLayout, OfflineLogo } from "./OfflineLayout";
import {
  findOfflineByPrizeCode,
  markOfflinePrizeDelivered,
  OfflineParticipant,
} from "@/lib/offlineStorage";

type Status =
  | { kind: "idle" }
  | { kind: "not_found" }
  | { kind: "already_delivered"; entry: OfflineParticipant }
  | { kind: "found"; entry: OfflineParticipant }
  | { kind: "delivered_now"; entry: OfflineParticipant };

export default function OfflineValidatePrize() {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  function lookup(e: React.FormEvent) {
    e.preventDefault();
    const found = findOfflineByPrizeCode(code);
    if (!found) return setStatus({ kind: "not_found" });
    if (found.prizeStatus === "retirado")
      return setStatus({ kind: "already_delivered", entry: found });
    setStatus({ kind: "found", entry: found });
  }

  function confirmDelivery() {
    if (status.kind !== "found") return;
    const updated = markOfflinePrizeDelivered(status.entry.prizeCode!);
    if (updated) setStatus({ kind: "delivered_now", entry: updated });
  }

  function reset() {
    setCode("");
    setStatus({ kind: "idle" });
  }

  const entry =
    status.kind === "found" ||
    status.kind === "already_delivered" ||
    status.kind === "delivered_now"
      ? status.entry
      : null;

  return (
    <OfflineLayout>
      <main className="flex-1 w-full flex flex-col items-center justify-center px-10 gap-6">
        <OfflineLogo />
        <div className="bg-white rounded-3xl shadow-2xl border-t-[12px] border-[#10b981] p-8 w-full max-w-xl">
          <h2 className="text-3xl font-black italic uppercase text-[#0047ab] text-center">
            Validar Brinde
          </h2>
          <p className="text-center font-bold text-slate-500 uppercase tracking-widest text-sm mt-1">
            Consulta apenas dados deste tablet
          </p>
          <form onSubmit={lookup} className="mt-6 flex gap-3">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ROBUSTUS-1234"
              className="flex-1 bg-slate-100 p-4 rounded-xl text-xl font-bold text-[#003380] border-2 border-transparent focus:border-[#10b981] outline-none placeholder:text-slate-400"
            />
            <button className="bg-[#0047ab] text-white px-6 rounded-xl font-black uppercase tracking-widest">
              Buscar
            </button>
          </form>

          {status.kind === "not_found" && (
            <div className="mt-6 bg-red-50 border-2 border-red-200 p-4 rounded-xl text-center text-red-600 font-black uppercase">
              Código não encontrado neste tablet.
            </div>
          )}

          {entry && (
            <div className="mt-6 bg-slate-50 rounded-2xl p-5 space-y-1">
              <Row label="Nome" value={entry.name} />
              <Row label="Telefone" value={entry.phone} />
              <Row
                label="Jogo"
                value={entry.game === "cesta" ? "Cesta" : "Memória"}
              />
              <Row label="Pontuação" value={String(entry.score)} />
              <Row
                label="Data"
                value={new Date(entry.playedAt).toLocaleString("pt-BR")}
              />
              <Row
                label="Status"
                value={
                  entry.prizeStatus === "retirado"
                    ? `Retirado ${
                        entry.prizeDeliveredAt
                          ? "em " +
                            new Date(entry.prizeDeliveredAt).toLocaleString(
                              "pt-BR"
                            )
                          : ""
                      }`
                    : "Pendente"
                }
              />
            </div>
          )}

          {status.kind === "found" && (
            <button
              onClick={confirmDelivery}
              className="mt-5 w-full bg-[#10b981] py-4 rounded-2xl text-white text-xl font-black uppercase italic tracking-widest shadow-xl"
            >
              Confirmar entrega
            </button>
          )}

          {status.kind === "already_delivered" && (
            <div className="mt-5 bg-amber-50 border-2 border-amber-200 p-4 rounded-xl text-center text-amber-700 font-black uppercase">
              Este brinde já foi retirado.
            </div>
          )}

          {status.kind === "delivered_now" && (
            <div className="mt-5 bg-emerald-50 border-2 border-emerald-200 p-4 rounded-xl text-center text-emerald-700 font-black uppercase">
              Entrega confirmada!
            </div>
          )}

          {status.kind !== "idle" && (
            <button
              onClick={reset}
              className="mt-3 w-full bg-slate-200 py-3 rounded-2xl text-slate-600 font-black uppercase tracking-widest"
            >
              Nova consulta
            </button>
          )}
        </div>
      </main>
    </OfflineLayout>
  );
}

const Row: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex justify-between gap-4 py-1">
    <span className="text-xs font-black uppercase tracking-widest text-slate-400">
      {label}
    </span>
    <span className="text-base font-bold text-[#0047ab] text-right">
      {value}
    </span>
  </div>
);
