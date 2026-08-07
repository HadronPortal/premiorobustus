import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, FileText, Save, Upload, LockKeyhole, ShieldCheck, Settings, X, Plus, Trash2, Check } from 'lucide-react';
import {
  getReport,
  getReportStats,
  exportBackup,
  importBackup,
  type ParticipantReport,
  type ReportStats,
} from '@/lib/cestaMatches';
import { hasAdminPin, setAdminPin, verifyAdminPin } from '@/lib/adminPin';
import { getPrizeSettings, savePrizeSettings, type PrizeConfig, DEFAULT_PRIZES } from '@/lib/prizeSettings';

const AUTH_KEY = 'robustus.admin.relatorio.ok';

function pad(n: number) { return String(n).padStart(2, '0'); }
function fmtDateBR(iso: string) {
  if (!iso) return '-';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '-';
  return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function todayStamp() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}
function csvEscape(v: string) {
  const s = (v ?? '').toString().replace(/\r?\n/g, ' ').replace(/"/g, '""');
  return /[";]/.test(s) ? `"${s}"` : s;
}
async function handleDownload(name: string, content: string, mime: string) {
  try {
    const blob = new Blob([content], { type: mime + ';charset=utf-8' });
    
    // Tentativa de download nativo (funciona em navegadores modernos)
    if (window.navigator && (window.navigator as any).msSaveOrOpenBlob) {
      (window.navigator as any).msSaveOrOpenBlob(blob, name);
      return;
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 200);

    // No APK/Android, o clique pode não disparar o download se não houver um intent
    // Então oferecemos o fallback de cópia se o usuário estiver num ambiente restrito
  } catch (err) {
    console.error('Download error:', err);
    await fallbackExport(content);
  }
}

async function fallbackExport(content: string) {
  try {
    await navigator.clipboard.writeText(content);
    alert('Download automático não disponível neste dispositivo.\n\nO conteúdo foi copiado para a área de transferência com sucesso!');
  } catch (clipErr) {
    alert('Erro ao exportar dados. Por favor, tente em outro navegador ou dispositivo.');
  }
}
function profileLabel(p: string) {
  if (p === 'lojista') return 'Lojista';
  if (p === 'veterinario') return 'Veterinário';
  if (p === 'outros') return 'Outros';
  return '';
}
function fmtPhoneBR(phone: string) {
  const d = (phone || '').replace(/\D/g, '');
  if (d.length === 11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
  return d;
}
function petLabel(p: string) {
  if (p === 'cachorro') return '🐶 Cachorro';
  if (p === 'gato') return '🐱 Gato';
  return '-';
}

const EMPTY_STATS: ReportStats = {
  totalPlays: 0, totalParticipants: 0,
  cachorro: 0, gato: 0, topPet: '—', pctCachorro: 0, pctGato: 0,
  lojista: 0, vet: 0, outros: 0, topProfile: '—',
  avgScore: 0, bestScore: 0,
};

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
  const [rows, setRows] = useState<ParticipantReport[]>([]);
  const [stats, setStats] = useState<ReportStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string>('');
  const fileRef = useRef<HTMLInputElement>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [prizeConfigs, setPrizeConfigs] = useState<PrizeConfig[]>([]);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState('');

  const reload = async () => {
    setLoading(true);
    try {
      const [r, s] = await Promise.all([getReport(), getReportStats()]);
      setRows(r);
      setStats(s);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { 
    if (authed) {
      reload();
      getPrizeSettings().then(setPrizeConfigs);
    } 
  }, [authed]);

  useEffect(() => {
    if (authed) return;
    hasAdminPin().then(setPinExists).catch(() => setPinExists(false));
  }, [authed]);

  const pct = useMemo(() => (n: number) => stats.totalParticipants ? (n*100/stats.totalParticipants) : 0, [stats.totalParticipants]);

  const handlePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinErr('');
    const value = pin.trim();
    if (pinExists === false) {
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

  const exportCSV = async () => {
    const header = 'nome;telefone;perfil;perfil_outro;tentativas;ultimo_personagem;ultima_pontuacao;melhor_pontuacao;ultimo_brinde;codigo_brinde;ultima_partida';
    const lines = rows.map(r => [
      r.name,
      fmtPhoneBR(r.phoneNormalized),
      profileLabel(r.participantType),
      r.participantTypeOther || '',
      String(r.attempts),
      r.lastPet || '',
      String(r.lastScore),
      String(r.bestScore),
      r.lastPrize || '',
      r.lastPrizeCode || '',
      fmtDateBR(r.lastPlayedAt),
    ].map(csvEscape).join(';'));
    const csv = '\uFEFF' + [header, ...lines].join('\r\n');
    await handleDownload(`robustus-participantes-${todayStamp()}.csv`, csv, 'text/csv');
  };

  const exportTXT = async () => {
    const lines: string[] = [];
    lines.push('RELATÓRIO OFFLINE — JOGO DA CESTA RobustUS');
    lines.push('Gerado em: ' + fmtDateBR(new Date().toISOString()));
    lines.push('');
    lines.push(`Participantes únicos: ${stats.totalParticipants}`);
    lines.push(`Total de partidas: ${stats.totalPlays}`);
    lines.push(`Personagem mais escolhido: ${stats.topPet}`);
    lines.push(`Perfil que mais participou: ${stats.topProfile}`);
    lines.push(`Lojistas: ${stats.lojista} (${pct(stats.lojista).toFixed(1)}%)`);
    lines.push(`Veterinários: ${stats.vet} (${pct(stats.vet).toFixed(1)}%)`);
    lines.push(`Outros: ${stats.outros} (${pct(stats.outros).toFixed(1)}%)`);
    lines.push(`Cachorro: ${stats.cachorro} (${stats.pctCachorro.toFixed(1)}%)`);
    lines.push(`Gato: ${stats.gato} (${stats.pctGato.toFixed(1)}%)`);
    lines.push(`Pontuação média: ${stats.avgScore.toFixed(1)}`);
    lines.push(`Melhor pontuação: ${stats.bestScore}`);
    lines.push('');
    lines.push('PARTICIPANTES:');
    rows.forEach((r, i) => {
      lines.push(
        `${i+1}. ${r.name || '(sem nome)'} — ${fmtPhoneBR(r.phoneNormalized) || '(sem telefone)'} — ${profileLabel(r.participantType) || '-'}${r.participantTypeOther ? ` (${r.participantTypeOther})` : ''} — Tentativas: ${r.attempts} — Último: ${r.lastPet || '-'} ${r.lastScore} pts — Melhor: ${r.bestScore} pts — Brinde: ${r.lastPrize || '-'}${r.lastPrizeCode ? ` (${r.lastPrizeCode})` : ''} — ${fmtDateBR(r.lastPlayedAt)}`
      );
    });
    await handleDownload(`robustus-participantes-${todayStamp()}.txt`, lines.join('\r\n'), 'text/plain');
  };

  const exportJSON = async () => {
    const payload = await exportBackup();
    await handleDownload(`robustus-backup-${todayStamp()}.json`, JSON.stringify(payload, null, 2), 'application/json');
  };

  const onImportFile = async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const r = await importBackup(data);
      setMsg(`${r.participants} participante(s) e ${r.plays} partida(s) importadas. Registros existentes foram preservados.`);
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
          <Stat label="Participantes únicos" value={stats.totalParticipants} sub="por telefone" />
          <Stat label="Total de partidas" value={stats.totalPlays} />
          <Stat label="Pontuação média" value={stats.avgScore.toFixed(1)} />
          <Stat label="Melhor pontuação" value={stats.bestScore} />
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginBottom: 16 }}>
          <Stat label="Lojistas" value={stats.lojista} sub={`${pct(stats.lojista).toFixed(1)}%`} />
          <Stat label="Veterinários" value={stats.vet} sub={`${pct(stats.vet).toFixed(1)}%`} />
          <Stat label="Outros" value={stats.outros} sub={`${pct(stats.outros).toFixed(1)}%`} />
          <Stat label="Cachorro" value={stats.cachorro} sub={`${stats.pctCachorro.toFixed(1)}% dos pets`} />
          <Stat label="Gato" value={stats.gato} sub={`${stats.pctGato.toFixed(1)}% dos pets`} />
        </section>

        <section style={{
          background: 'linear-gradient(135deg,#0047ab,#0070f3)', color: 'white',
          padding: 16, borderRadius: 12, marginBottom: 16, display: 'flex',
          alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
        }}>
          <div style={{ fontSize: 13, opacity: 0.85, textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.5 }}>
            Personagem mais escolhido
          </div>
          <div style={{ fontSize: 28, fontWeight: 900 }}>{stats.topPet}</div>
          <div style={{ fontSize: 13, opacity: 0.9 }}>
            🐶 {stats.cachorro} ({stats.pctCachorro.toFixed(1)}%) · 🐱 {stats.gato} ({stats.pctGato.toFixed(1)}%)
          </div>
        </section>

        <section style={{
          background: 'linear-gradient(135deg,#f7941d,#ff7a18)', color: 'white',
          padding: 16, borderRadius: 12, marginBottom: 16, display: 'flex',
          alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
        }}>
          <div style={{ fontSize: 13, opacity: 0.9, textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.5 }}>
            Perfil que mais participou
          </div>
          <div style={{ fontSize: 28, fontWeight: 900 }}>{stats.topProfile}</div>
        </section>

        <section style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          <button onClick={exportCSV} style={btnPrimary} disabled={loading}><Download size={16}/> Exportar CSV</button>
          <button onClick={exportTXT} style={btnPrimary} disabled={loading}><FileText size={16}/> Exportar TXT</button>
          <button onClick={exportJSON} style={btnSecondary} disabled={loading}><Save size={16}/> Backup JSON</button>
          <button onClick={() => setShowSettings(true)} style={btnSecondary} title="Configurações da roleta"><Settings size={16}/></button>
          <button onClick={() => fileRef.current?.click()} style={btnSecondary} disabled={loading}><Upload size={16}/> Importar JSON</button>
          <input ref={fileRef} type="file" accept="application/json,.json" style={{ display: 'none' }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onImportFile(f); }} />
        </section>
        {msg && <div style={{ background: '#ecfeff', border: '1px solid #67e8f9', color: '#0e7490', padding: 10, borderRadius: 8, marginBottom: 12, fontSize: 13 }}>{msg}</div>}

        <section style={{ background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,.08)' }}>
          <div style={{ padding: '12px 14px', fontWeight: 700, color: '#0f172a', borderBottom: '1px solid #e2e8f0' }}>
            Participantes {loading ? '(carregando…)' : `(${rows.length})`}
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead style={{ background: '#f8fafc', color: '#475569', textAlign: 'left' }}>
                <tr>
                  <th style={th}>Nome</th>
                  <th style={th}>Telefone</th>
                  <th style={th}>Perfil</th>
                  <th style={th}>Tentativas</th>
                  <th style={th}>Último personagem</th>
                  <th style={th}>Última pontuação</th>
                  <th style={th}>Melhor</th>
                  <th style={th}>Brinde</th>
                  <th style={th}>Última partida</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.phoneNormalized} style={{ borderTop: '1px solid #f1f5f9' }}>
                    <td style={td}>{r.name || '-'}</td>
                    <td style={td}>{fmtPhoneBR(r.phoneNormalized) || '-'}</td>
                    <td style={td}>{profileLabel(r.participantType) || '-'}{r.participantTypeOther ? ` (${r.participantTypeOther})` : ''}</td>
                    <td style={{ ...td, fontWeight: 700, color: '#0047ab' }}>{r.attempts}</td>
                    <td style={td}>{petLabel(r.lastPet)}</td>
                    <td style={td}>{r.lastScore}</td>
                    <td style={td}>{r.bestScore}</td>
                    <td style={td}>
                      {r.lastPrize || '-'}
                      {r.lastPrizeCode && <div style={{ fontSize: 11, color: '#64748b' }}>{r.lastPrizeCode}</div>}
                    </td>
                    <td style={td}>{fmtDateBR(r.lastPlayedAt)}</td>
                  </tr>
                ))}
                {!loading && rows.length === 0 && (
                  <tr><td style={{ ...td, textAlign: 'center', color: '#94a3b8', padding: 24 }} colSpan={9}>Nenhum participante registrado ainda.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {showSettings && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <div style={modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Settings size={20} color="#0047ab" />
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Configurações da Roleta</h2>
              </div>
              <button onClick={() => setShowSettings(false)} style={closeBtn}><X size={20} /></button>
            </div>

            <div style={modalBody}>
              <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
                Configure os brindes e suas chances de sorteio. A soma das porcentagens deve ser exatamente 100%.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {prizeConfigs.map((cfg, idx) => (
                  <div key={idx} style={{ 
                    display: 'flex', gap: 8, alignItems: 'center', background: '#f8fafc', 
                    padding: 8, borderRadius: 8, border: '1px solid #e2e8f0',
                    opacity: cfg.enabled ? 1 : 0.6
                  }}>
                    <input 
                      type="text" value={cfg.name} 
                      onChange={(e) => {
                        const newConfigs = [...prizeConfigs];
                        newConfigs[idx].name = e.target.value;
                        setPrizeConfigs(newConfigs);
                      }}
                      placeholder="Nome do brinde"
                      style={{ ...inputStyle, flex: 1 }}
                    />
                    <div style={{ position: 'relative', width: 80 }}>
                      <input 
                        type="text" 
                        inputMode="numeric"
                        value={cfg.chance === 0 ? '' : cfg.chance} 
                        onFocus={(e) => {
                          if (cfg.chance === 0) e.target.value = '';
                        }}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          const num = val === '' ? 0 : Math.min(100, Math.max(0, parseInt(val, 10)));
                          const newConfigs = [...prizeConfigs];
                          newConfigs[idx].chance = num;
                          setPrizeConfigs(newConfigs);
                        }}
                        onBlur={(e) => {
                          if (e.target.value === '') {
                            const newConfigs = [...prizeConfigs];
                            newConfigs[idx].chance = 0;
                            setPrizeConfigs(newConfigs);
                          }
                        }}
                        style={{ ...inputStyle, width: '100%', paddingRight: 20 }}
                      />
                      <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: '#94a3b8', pointerEvents: 'none' }}>%</span>
                    </div>
                    <button 
                      onClick={() => {
                        const newConfigs = [...prizeConfigs];
                        newConfigs[idx].enabled = !newConfigs[idx].enabled;
                        setPrizeConfigs(newConfigs);
                      }}
                      style={{ ...iconBtn, color: cfg.enabled ? '#059669' : '#94a3b8' }}
                      title={cfg.enabled ? 'Ativo' : 'Inativo'}
                    >
                      <Check size={18} />
                    </button>
                    <button 
                      onClick={() => {
                        setPrizeConfigs(prizeConfigs.filter((_, i) => i !== idx));
                      }}
                      style={{ ...iconBtn, color: '#dc2626' }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>

              {prizeConfigs.length < 4 ? (
                <button 
                  onClick={() => setPrizeConfigs([...prizeConfigs, { name: '', chance: 0, enabled: true }])}
                  style={{ ...btnSecondary, marginTop: 16, width: '100%', justifyContent: 'center' }}
                >
                  <Plus size={16} /> Adicionar Brinde
                </button>
              ) : (
                <div style={{ marginTop: 16, padding: 10, borderRadius: 8, fontSize: 13, background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  A roleta pode ter no máximo 4 prêmios.
                </div>
              )}

              <div style={{ 
                marginTop: 20, padding: 12, borderRadius: 10, 
                background: prizeConfigs.reduce((acc, c) => acc + (c.enabled ? c.chance : 0), 0) === 100 ? '#f0fdf4' : '#fef2f2',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <span style={{ fontSize: 14, fontWeight: 700 }}>Total (Ativos):</span>
                <span style={{ 
                  fontSize: 16, fontWeight: 900, 
                  color: prizeConfigs.reduce((acc, c) => acc + (c.enabled ? c.chance : 0), 0) === 100 ? '#16a34a' : '#dc2626' 
                }}>
                  {prizeConfigs.reduce((acc, c) => acc + (c.enabled ? c.chance : 0), 0)}%
                </span>
              </div>

              {settingsMsg && (
                <div style={{ marginTop: 12, padding: 10, borderRadius: 8, fontSize: 13, background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}>
                  {settingsMsg}
                </div>
              )}
            </div>

            <div style={{ padding: 16, borderTop: '1px solid #e2e8f0', display: 'flex', gap: 10 }}>
              <button 
                onClick={() => setShowSettings(false)}
                style={{ ...btnSecondary, flex: 1, justifyContent: 'center' }}
              >
                Cancelar
              </button>
              <button 
                onClick={async () => {
                  const total = prizeConfigs.reduce((acc, c) => acc + (c.enabled ? c.chance : 0), 0);
                  if (total !== 100) {
                    setSettingsMsg(`Erro: A soma das porcentagens (itens ativos) é ${total}%. Deve ser exatamente 100%.`);
                    return;
                  }
                  setSavingSettings(true);
                  try {
                    await savePrizeSettings(prizeConfigs);
                    setSettingsMsg('');
                    setShowSettings(false);
                  } catch (e) {
                    setSettingsMsg('Erro ao salvar configurações.');
                  } finally {
                    setSavingSettings(false);
                  }
                }}
                disabled={savingSettings}
                style={{ ...btnPrimary, flex: 1, justifyContent: 'center' }}
              >
                {savingSettings ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

const modalOverlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', 
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16
};
const modalContent: React.CSSProperties = {
  background: 'white', borderRadius: 16, width: '100%', maxWidth: 500, 
  maxHeight: '90dvh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
};
const modalHeader: React.CSSProperties = {
  padding: 16, borderBottom: '1px solid #e2e8f0', display: 'flex', 
  justifyContent: 'space-between', alignItems: 'center'
};
const modalBody: React.CSSProperties = {
  padding: 16, overflowY: 'auto', flex: 1
};
const closeBtn: React.CSSProperties = {
  background: 'transparent', border: 0, color: '#64748b', cursor: 'pointer', padding: 4
};
const inputStyle: React.CSSProperties = {
  padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1', outline: 'none', fontSize: 14
};
const iconBtn: React.CSSProperties = {
  background: 'white', border: '1px solid #e2e8f0', borderRadius: 6, 
  padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
};

const btnPrimary: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, background: '#0047ab', color: 'white', border: 0, padding: '10px 14px', borderRadius: 10, fontWeight: 700, cursor: 'pointer' };
const btnSecondary: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, background: 'white', color: '#0f172a', border: '1px solid #cbd5e1', padding: '10px 14px', borderRadius: 10, fontWeight: 700, cursor: 'pointer' };
const th: React.CSSProperties = { padding: '10px 12px', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.4, whiteSpace: 'nowrap' };
const td: React.CSSProperties = { padding: '10px 12px', color: '#0f172a', verticalAlign: 'top' };
