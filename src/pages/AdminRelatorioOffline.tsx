import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, FileText, Save, Upload, LockKeyhole, ShieldCheck } from 'lucide-react';
import { listMatches, importMatches, dedupeExactMatches, type CestaMatch } from '@/lib/cestaMatches';
import { hasAdminPin, setAdminPin, verifyAdminPin } from '@/lib/adminPin';

const AUTH_KEY = 'robustus.admin.relatorio.ok';

function pad(n: number) { return String(n).padStart(2, '0'); }
function fmtDateBR(iso: string) {
  const d = new Date(iso);
  return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function fmtDuration(s: number) {
  if (!s) return '0s';
  const m = Math.floor(s/60); const r = s%60;
  return m ? `${m}m${pad(r)}s` : `${r}s`;
}
function todayStamp() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}
function csvEscape(v: string) {
  const s = (v ?? '').toString().replace(/\r?\n/g, ' ').replace(/"/g, '""');
  return /[";]/.test(s) ? `"${s}"` : s;
}
function download(name: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime + ';charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name; document.body.appendChild(a);
  a.click(); a.remove(); URL.revokeObjectURL(url);
}
function profileLabel(p: string) {
  if (p === 'lojista') return 'Lojista';
  if (p === 'veterinario') return 'Veterinário';
  if (p === 'outros') return 'Outros';
  return '';
}

export default function AdminRelatorioOffline() {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState<boolean>(() => {
    try { return sessionStorage.getItem(AUTH_KEY) === '1'; } catch { return false; }
  });
  const [pinExists, setPinExists] = useState<boolean | null>(null);
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [pinErr, setPinErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [matches, setMatches] = useState<CestaMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string>('');
  const fileRef = useRef<HTMLInputElement>(null);

  const reload = async () => {
    setLoading(true);
    try {
      // remove duplicatas exatas (mesma partida salva 2x) antes de listar
      await dedupeExactMatches();
      setMatches(await listMatches());
    } catch {}
    setLoading(false);
  };

  useEffect(() => { if (authed) reload(); }, [authed]);

  useEffect(() => {
    if (authed) return;
    hasAdminPin().then(setPinExists).catch(() => setPinExists(false));
  }, [authed]);

  const stats = useMemo(() => {
    const total = matches.length;
    const uniquePhones = new Set(matches.map(m => (m.phone || '').replace(/\D/g, '')).filter(Boolean)).size;
    const by = (pred: (m: CestaMatch) => boolean) => matches.filter(pred).length;
    const lojista = by(m => m.participantType === 'lojista');
    const vet = by(m => m.participantType === 'veterinario');
    const outros = by(m => m.participantType === 'outros');
    const cachorro = by(m => m.pet === 'cachorro');
    const gato = by(m => m.pet === 'gato');
    const scores = matches.map(m => Number(m.score) || 0);
    const avg = scores.length ? scores.reduce((a,b)=>a+b,0) / scores.length : 0;
    const best = scores.length ? Math.max(...scores) : 0;
    const pct = (n: number) => total ? (n*100/total) : 0;
    return { total, uniquePhones, lojista, vet, outros, cachorro, gato, avg, best, pct };
  }, [matches]);

  const handlePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinErr('');
    const value = pin.trim();
    if (pinExists === false) {
      // Criação inicial
      if (!/^\d{4,6}$/.test(value)) { setPinErr('Use de 4 a 6 dígitos numéricos.'); return; }
      if (value !== pinConfirm.trim()) { setPinErr('Os PINs não conferem.'); return; }
      setBusy(true);
      try {
        await setAdminPin(value);
        try { sessionStorage.setItem(AUTH_KEY, '1'); } catch {}
        setAuthed(true);
      } catch (err: any) {
        setPinErr(err?.message || 'Falha ao salvar o PIN.');
      } finally { setBusy(false); }
    } else {
      // Verificação
      if (!value) { setPinErr('Informe o PIN.'); return; }
      setBusy(true);
      try {
        const ok = await verifyAdminPin(value);
        if (ok) {
          try { sessionStorage.setItem(AUTH_KEY, '1'); } catch {}
          setAuthed(true);
        } else setPinErr('PIN incorreto.');
      } finally { setBusy(false); }
    }
  };



  const exportCSV = () => {
    const header = 'data;nome;telefone;perfil;perfil_outro;personagem;pontuacao;duracao';
    const rows = matches.map(m => [
      fmtDateBR(m.playedAt),
      m.name,
      m.phone,
      profileLabel(m.participantType),
      m.participantTypeOther || '',
      m.pet || '',
      String(m.score ?? 0),
      String(m.durationSeconds ?? 0),
    ].map(csvEscape).join(';'));
    const csv = '\uFEFF' + [header, ...rows].join('\r\n');
    download(`robustus-participacoes-${todayStamp()}.csv`, csv, 'text/csv');
  };

  const exportTXT = () => {
    const lines: string[] = [];
    lines.push('RELATÓRIO OFFLINE — JOGO DA CESTA RobustUS');
    lines.push('Gerado em: ' + fmtDateBR(new Date().toISOString()));
    lines.push('');
    lines.push(`Total de partidas: ${stats.total}`);
    lines.push(`Participantes únicos (telefone): ${stats.uniquePhones}`);
    lines.push(`Lojistas: ${stats.lojista} (${stats.pct(stats.lojista).toFixed(1)}%)`);
    lines.push(`Veterinários: ${stats.vet} (${stats.pct(stats.vet).toFixed(1)}%)`);
    lines.push(`Outros: ${stats.outros} (${stats.pct(stats.outros).toFixed(1)}%)`);
    lines.push(`Cachorro: ${stats.cachorro} (${stats.pct(stats.cachorro).toFixed(1)}%)`);
    lines.push(`Gato: ${stats.gato} (${stats.pct(stats.gato).toFixed(1)}%)`);
    lines.push(`Pontuação média: ${stats.avg.toFixed(1)}`);
    lines.push(`Melhor pontuação: ${stats.best}`);
    lines.push('');
    lines.push('PARTIDAS:');
    matches.forEach((m, i) => {
      lines.push(
        `${i+1}. [${fmtDateBR(m.playedAt)}] ${m.name || '(sem nome)'} — ${m.phone || '(sem telefone)'} — ${profileLabel(m.participantType) || '-'}${m.participantTypeOther ? ` (${m.participantTypeOther})` : ''} — ${m.pet || '-'} — ${m.score} pts — ${fmtDuration(m.durationSeconds)}`
      );
    });
    download(`robustus-participacoes-${todayStamp()}.txt`, lines.join('\r\n'), 'text/plain');
  };

  const exportJSON = () => {
    const payload = {
      app: 'robustus-cesta',
      version: 1,
      exportedAt: new Date().toISOString(),
      matches,
    };
    download(`robustus-backup-${todayStamp()}.json`, JSON.stringify(payload, null, 2), 'application/json');
  };

  const onImportFile = async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const arr: CestaMatch[] = Array.isArray(data) ? data : (data.matches || []);
      if (!Array.isArray(arr) || !arr.length) { setMsg('Backup inválido ou vazio.'); return; }
      const n = await importMatches(arr);
      setMsg(`${n} partida(s) importada(s). Registros existentes foram preservados.`);
      await reload();
    } catch {
      setMsg('Falha ao importar arquivo.');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  if (!authed) {
    const creating = pinExists === false;
    const checking = pinExists === null;
    return (
      <main style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', background: '#0a1628', padding: 16 }}>
        <form onSubmit={handlePin} style={{ background: 'white', padding: 24, borderRadius: 16, width: '100%', maxWidth: 380, boxShadow: '0 10px 30px rgba(0,0,0,.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, color: '#0047ab', fontWeight: 800 }}>
            {creating ? <ShieldCheck size={20}/> : <LockKeyhole size={20} />}
            {creating ? 'Definir PIN administrativo' : 'Relatório Offline'}
          </div>
          <p style={{ fontSize: 13, color: '#475569', marginBottom: 14 }}>
            {checking && 'Verificando…'}
            {creating && 'Este é o primeiro acesso neste dispositivo. Crie um PIN de 4 a 6 dígitos. Apenas o hash será salvo localmente — guarde-o, não é possível recuperá-lo.'}
            {pinExists === true && 'Informe o PIN administrativo para acessar.'}
          </p>
          <input
            type="password" inputMode="numeric" autoFocus value={pin}
            disabled={checking || busy}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder={creating ? 'Novo PIN (4-6 dígitos)' : 'PIN'}
            style={{ width: '100%', padding: '14px 12px', fontSize: 18, border: '2px solid #e2e8f0', borderRadius: 10, outline: 'none', letterSpacing: 4, textAlign: 'center' }}
          />
          {creating && (
            <input
              type="password" inputMode="numeric" value={pinConfirm}
              disabled={busy}
              onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Confirmar PIN"
              style={{ width: '100%', padding: '14px 12px', fontSize: 18, border: '2px solid #e2e8f0', borderRadius: 10, outline: 'none', letterSpacing: 4, textAlign: 'center', marginTop: 10 }}
            />
          )}
          {pinErr && <div style={{ color: '#dc2626', fontSize: 13, marginTop: 8 }}>{pinErr}</div>}
          <button type="submit" disabled={checking || busy} style={{ marginTop: 14, width: '100%', padding: '12px 16px', background: '#0047ab', color: 'white', border: 0, borderRadius: 10, fontWeight: 800, fontSize: 15, opacity: (checking || busy) ? 0.6 : 1 }}>
            {busy ? 'Aguarde…' : creating ? 'Criar PIN e entrar' : 'Entrar'}
          </button>
          <button type="button" onClick={() => navigate('/')} style={{ marginTop: 8, width: '100%', padding: '10px 16px', background: 'transparent', color: '#475569', border: 0, fontSize: 13 }}>Voltar</button>
        </form>
      </main>
    );
  }


  const Stat = ({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) => (
    <div style={{ background: 'white', padding: 16, borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,.08)' }}>
      <div style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', marginTop: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{sub}</div>}
    </div>
  );

  return (
    <main style={{ minHeight: '100dvh', background: '#f1f5f9', padding: 16 }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
          <button onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'white', border: 0, padding: '8px 12px', borderRadius: 10, fontWeight: 700, color: '#0047ab', cursor: 'pointer' }}>
            <ArrowLeft size={16}/> Voltar
          </button>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0 }}>Relatório Offline — Jogo da Cesta</h1>
          <div style={{ width: 80 }} />
        </header>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginBottom: 16 }}>
          <Stat label="Total de partidas" value={stats.total} />
          <Stat label="Participantes únicos" value={stats.uniquePhones} sub="por telefone" />
          <Stat label="Pontuação média" value={stats.avg.toFixed(1)} />
          <Stat label="Melhor pontuação" value={stats.best} />
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginBottom: 16 }}>
          <Stat label="Lojistas" value={stats.lojista} sub={`${stats.pct(stats.lojista).toFixed(1)}%`} />
          <Stat label="Veterinários" value={stats.vet} sub={`${stats.pct(stats.vet).toFixed(1)}%`} />
          <Stat label="Outros" value={stats.outros} sub={`${stats.pct(stats.outros).toFixed(1)}%`} />
          <Stat label="Cachorro" value={stats.cachorro} sub={`${stats.pct(stats.cachorro).toFixed(1)}%`} />
          <Stat label="Gato" value={stats.gato} sub={`${stats.pct(stats.gato).toFixed(1)}%`} />
        </section>

        <section style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          <button onClick={exportCSV} style={btnPrimary}><Download size={16}/> Exportar CSV</button>
          <button onClick={exportTXT} style={btnPrimary}><FileText size={16}/> Exportar TXT</button>
          <button onClick={exportJSON} style={btnSecondary}><Save size={16}/> Backup JSON</button>
          <button onClick={() => fileRef.current?.click()} style={btnSecondary}><Upload size={16}/> Importar JSON</button>
          <input ref={fileRef} type="file" accept="application/json,.json" style={{ display: 'none' }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onImportFile(f); }} />
        </section>
        {msg && <div style={{ background: '#ecfeff', border: '1px solid #67e8f9', color: '#0e7490', padding: 10, borderRadius: 8, marginBottom: 12, fontSize: 13 }}>{msg}</div>}

        <section style={{ background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,.08)' }}>
          <div style={{ padding: '12px 14px', fontWeight: 700, color: '#0f172a', borderBottom: '1px solid #e2e8f0' }}>
            Partidas {loading ? '(carregando…)' : `(${matches.length})`}
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead style={{ background: '#f8fafc', color: '#475569', textAlign: 'left' }}>
                <tr>
                  <th style={th}>Data</th><th style={th}>Nome</th><th style={th}>Telefone</th>
                  <th style={th}>Perfil</th><th style={th}>Personagem</th>
                  <th style={th}>Pontos</th><th style={th}>Duração</th>
                </tr>
              </thead>
              <tbody>
                {matches.map(m => (
                  <tr key={m.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                    <td style={td}>{fmtDateBR(m.playedAt)}</td>
                    <td style={td}>{m.name || '-'}</td>
                    <td style={td}>{m.phone || '-'}</td>
                    <td style={td}>{profileLabel(m.participantType) || '-'}{m.participantTypeOther ? ` (${m.participantTypeOther})` : ''}</td>
                    <td style={td}>{m.pet || '-'}</td>
                    <td style={td}>{m.score}</td>
                    <td style={td}>{fmtDuration(m.durationSeconds)}</td>
                  </tr>
                ))}
                {!loading && matches.length === 0 && (
                  <tr><td style={{ ...td, textAlign: 'center', color: '#94a3b8', padding: 24 }} colSpan={7}>Nenhuma partida registrada ainda.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

const btnPrimary: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, background: '#0047ab', color: 'white', border: 0, padding: '10px 14px', borderRadius: 10, fontWeight: 700, cursor: 'pointer' };
const btnSecondary: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, background: 'white', color: '#0f172a', border: '1px solid #cbd5e1', padding: '10px 14px', borderRadius: 10, fontWeight: 700, cursor: 'pointer' };
const th: React.CSSProperties = { padding: '10px 12px', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.4, whiteSpace: 'nowrap' };
const td: React.CSSProperties = { padding: '10px 12px', color: '#0f172a', verticalAlign: 'top' };
