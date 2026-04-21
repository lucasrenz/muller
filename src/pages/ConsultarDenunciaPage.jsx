import React, { useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

const STATUS_CONFIG = {
  nova:                   { label: 'Recebida',              icon: 'task_alt',        color: '#904d00' },
  triagem:                { label: 'Em triagem',            icon: 'manage_search',   color: '#904d00' },
  em_analise:             { label: 'Em análise',            icon: 'pending_actions', color: '#904d00' },
  em_investigacao:        { label: 'Em investigação',       icon: 'policy',          color: '#904d00' },
  aguardando_informacoes: { label: 'Aguardando informações',icon: 'schedule',        color: '#904d00' },
  concluida:              { label: 'Concluída',             icon: 'verified',        color: '#1a6b3a' },
  arquivada:              { label: 'Arquivada',             icon: 'inventory_2',     color: '#564334' },
};

// Etapas do stepper na ordem cronológica
const ETAPAS = [
  { statuses: ['nova'],                   label: 'Recebida',       desc: 'Sua denúncia foi registrada com sucesso no sistema.', icon: 'task_alt' },
  { statuses: ['triagem'],                label: 'Em triagem',     desc: 'A equipe está verificando as informações iniciais do relato.', icon: 'manage_search' },
  { statuses: ['em_analise','em_investigacao','aguardando_informacoes'], label: 'Em análise',     desc: 'A equipe de integridade está revisando os detalhes e evidências fornecidas.', icon: 'pending_actions' },
  { statuses: ['concluida','arquivada'],  label: 'Concluída',      desc: 'A investigação foi finalizada e as medidas cabíveis aplicadas.', icon: 'verified' },
];

function getEtapaAtual(status) {
  return ETAPAS.findIndex(e => e.statuses.includes(status));
}

function maskProtocolo(value) {
  // Mantém apenas dígitos, limita a 10
  const digits = value.replace(/\D/g, '').slice(0, 10);
  if (digits.length <= 4) return digits;
  return digits.slice(0, 4) + '-' + digits.slice(4);
}

function formatarData(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) + ' - ' +
    d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export default function ConsultarDenunciaPage() {
  const [protocolo, setProtocolo] = useState('');
  const [codigo, setCodigo] = useState('');
  const [mostrarCodigo, setMostrarCodigo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [resultado, setResultado] = useState(null); // { denuncia, publicacoes }

  async function handleConsultar(e) {
    e.preventDefault();
    setErro('');
    setResultado(null);

    if (!protocolo.trim()) return setErro('Informe o número do protocolo.');
    if (!codigo.trim()) return setErro('Informe o código de acesso.');

    setLoading(true);
    try {
      const { data: denuncia, error: denunciaError } = await supabase
        .from('denuncias')
        .select('id, protocolo, status, tipo_ocorrencia, created_at, updated_at, resposta_publica_atual, data_publicacao_resposta, anonimo')
        .eq('protocolo', protocolo.trim().toUpperCase())
        .eq('codigo_acesso', codigo.trim().toUpperCase())
        .maybeSingle();

      if (denunciaError) throw denunciaError;

      if (!denuncia) {
        setErro('Protocolo ou código de acesso inválido. Verifique os dados e tente novamente.');
        setLoading(false);
        return;
      }

      const { data: publicacoes } = await supabase
        .from('denuncia_publicacoes')
        .select('id, titulo, mensagem, publicado_em, usuario_nome')
        .eq('denuncia_id', denuncia.id)
        .eq('visivel_denunciante', true)
        .order('publicado_em', { ascending: false });

      setResultado({ denuncia, publicacoes: publicacoes || [] });
    } catch (err) {
      console.error(err);
      setErro('Ocorreu um erro ao consultar a denúncia. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  const TIPO_LABELS = {
    assedio: 'Assédio Moral / Sexual',
    fraude: 'Fraude ou Desvio',
    corrupcao: 'Corrupção',
    outros: 'Outros',
  };

  const etapaAtual = resultado ? getEtapaAtual(resultado.denuncia.status) : -1;
  const statusCfg = resultado ? (STATUS_CONFIG[resultado.denuncia.status] || STATUS_CONFIG.nova) : null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,200..800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');

        .denuncia-root { font-family: 'Bricolage Grotesque', sans-serif; background-color: #f8f9fa; color: #191c1d; min-height: 100vh; display: flex; flex-direction: column; }
        .denuncia-root :is(h1,h2,h3,h4,h5,h6,p,span,a,button,label,li,input,textarea,select,option,strong,small,div) { font-family: 'Bricolage Grotesque', sans-serif !important; }
        .denuncia-root .material-symbols-outlined { font-family: 'Material Symbols Outlined' !important; }
        .denuncia-root svg { font-family: unset !important; }

        .denuncia-gradient-primary { background: linear-gradient(135deg, #904d00 0%, #ff8c00 100%); }
        .denuncia-shadow-ambient { box-shadow: 0 20px 40px rgba(25, 28, 29, 0.05); }
        .denuncia-input { width: 100%; background-color: #ffffff; border: 1px solid rgba(221,193,174,0.3); color: #191c1d; border-radius: 0.75rem; padding: 0.75rem 1rem; font-size: 1rem; transition: all 0.2s; }
        .denuncia-input:focus { outline: none; border-color: transparent; box-shadow: 0 0 0 2px rgba(255,140,0,0.15); background-color: #ffffff; }
        .denuncia-input::placeholder { color: rgba(86,67,52,0.5); }
        .denuncia-label { font-size: 0.875rem; font-weight: 600; color: #564334; display: block; margin-bottom: 0.5rem; }
        .denuncia-btn-submit { background: linear-gradient(135deg, #904d00 0%, #ff8c00 100%); color: white; font-weight: 700; font-size: 1.125rem; padding: 1rem 2rem; border-radius: 0.75rem; border: none; cursor: pointer; box-shadow: 0 8px 20px -6px rgba(255,140,0,0.5); display: flex; align-items: center; gap: 0.75rem; transition: all 0.2s; width: 100%; justify-content: center; }
        .denuncia-btn-submit:hover { box-shadow: 0 12px 25px -6px rgba(255,140,0,0.6); transform: translateY(-1px); }
        .denuncia-btn-submit:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }

        .material-symbols-outlined { font-family: 'Material Symbols Outlined'; font-weight: normal; font-style: normal; font-size: 24px; line-height: 1; letter-spacing: normal; text-transform: none; display: inline-block; white-space: nowrap; word-wrap: normal; direction: ltr; -webkit-font-smoothing: antialiased; }
        
        /* Stepper */
        .stepper-line { position: absolute; left: 11px; top: 12px; bottom: 0; width: 2px; background-color: #e7e8e9; z-index: 0; }
        .stepper-line-fill { position: absolute; left: 11px; top: 12px; width: 2px; background: linear-gradient(180deg, #ff8c00 0%, #ff8c00 100%); z-index: 0; transition: height 0.6s ease; }

        @keyframes denuncia-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.4s ease forwards; }
      `}</style>

      <div className="denuncia-root">

        {/* ── Top Navigation ── */}
        <nav style={{ position: 'fixed', top: 0, width: '100%', zIndex: 50, backgroundColor: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }} className="hidden-mobile">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '0.75rem 1.5rem', maxWidth: '80rem', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
              <a href="/" title="Voltar para home" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
                <img src="https://i.ibb.co/cXwpq4sq/Logo-Grupo-Muller.png" alt="Logo Grupo Müller" style={{ height: '56px', width: 'auto', display: 'block' }} />
              </a>
              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                <a href="/denuncia" style={{ color: '#71717a', fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', textDecoration: 'none', fontWeight: 500 }}>Nova Denúncia</a>
                <a href="/consultar-denuncia" style={{ color: '#ea580c', fontWeight: 700, borderBottom: '2px solid #f97316', paddingBottom: '4px', fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', textDecoration: 'none' }}>Acompanhar</a>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#ea580c' }}>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem', borderRadius: '9999px', color: '#ea580c' }}>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>help</span>
              </button>
            </div>
          </div>
          <div style={{ backgroundColor: '#e4e4e7', height: '1px', width: '100%' }}></div>
        </nav>

        {/* ── Main Canvas ── */}
        <main style={{ flexGrow: 1, paddingTop: '6rem', paddingBottom: '6rem', paddingLeft: '1rem', paddingRight: '1rem', maxWidth: '72rem', margin: '0 auto', width: '100%' }}>

          {/* Header Section */}
          <div style={{ maxWidth: '40rem', marginBottom: '3.5rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0.75rem', borderRadius: '9999px', backgroundColor: '#e7e8e9', color: '#564334', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '1.25rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#ff8c00' }}>manage_search</span>
              CONSULTAR STATUS
            </div>
            <h1 style={{ fontFamily: 'Manrope, sans-serif', fontSize: 'clamp(2rem, 4.5vw, 3rem)', fontWeight: 800, letterSpacing: '-0.04em', color: '#191c1d', marginBottom: '1rem', lineHeight: 1.1 }}>Acompanhar denúncia</h1>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '1.0625rem', color: '#564334', lineHeight: 1.65, fontWeight: 300 }}>Insira o protocolo e o código de acesso recebidos no momento do registro para verificar o status da sua denúncia.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '2.5rem', alignItems: 'start' }} className="denuncia-grid">

            {/* ── Coluna Esquerda: formulário + aviso ── */}
            <div style={{ gridColumn: 'span 12 / span 12', display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="denuncia-left-col">

              {/* Card formulário */}
              <div className="denuncia-shadow-ambient" style={{ backgroundColor: '#ffffff', borderRadius: '1.5rem', padding: '2rem', position: 'relative', overflow: 'hidden' }}>
                <div className="denuncia-gradient-primary" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '8px' }}></div>

                <h2 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '1.375rem', fontWeight: 700, color: '#191c1d', marginBottom: '1.75rem' }}>Identificar denúncia</h2>

                <form onSubmit={handleConsultar} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {/* Protocolo */}
                  <div>
                    <label className="denuncia-label" htmlFor="protocolo">Número do protocolo</label>
                    <input
                      id="protocolo"
                      className="denuncia-input"
                      type="text"
                      placeholder="Ex: 2026-000001"
                      value={protocolo}
                      onChange={e => setProtocolo(maskProtocolo(e.target.value))}
                      inputMode="numeric"
                      maxLength={11}
                    />
                  </div>

                  {/* Código de acesso */}
                  <div>
                    <label className="denuncia-label" htmlFor="codigo">Código de acesso</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        id="codigo"
                        className="denuncia-input"
                        type={mostrarCodigo ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={codigo}
                        onChange={e => setCodigo(e.target.value)}
                        style={{ paddingRight: '3rem', textTransform: 'uppercase' }}
                      />
                      <button
                        type="button"
                        onClick={() => setMostrarCodigo(v => !v)}
                        style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#564334', padding: '0.25rem', display: 'flex', alignItems: 'center' }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '20px', fontVariationSettings: "'FILL' 0" }}>
                          {mostrarCodigo ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Erro */}
                  {erro && (
                    <div style={{ backgroundColor: '#ffdad6', border: '1px solid rgba(186,26,26,0.2)', borderRadius: '0.75rem', padding: '0.875rem 1rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                      <span className="material-symbols-outlined" style={{ color: '#ba1a1a', flexShrink: 0, fontSize: '20px', marginTop: '2px' }}>error</span>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', color: '#93000a', margin: 0 }}>{erro}</p>
                    </div>
                  )}

                  <button className="denuncia-btn-submit" type="submit" disabled={loading} style={{ marginTop: '0.5rem' }}>
                    {loading ? (
                      <>
                        <span className="material-symbols-outlined" style={{ animation: 'denuncia-spin 1s linear infinite', fontSize: '20px' }}>progress_activity</span>
                        Consultando...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>search</span>
                        Consultar
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Card acesso seguro */}
              <div style={{ backgroundColor: '#f3f4f5', borderRadius: '1rem', padding: '1.25rem 1.5rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '9999px', backgroundColor: '#e7e8e9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span className="material-symbols-outlined" style={{ color: '#564334', fontSize: '20px', fontVariationSettings: "'FILL' 1" }}>lock</span>
                </div>
                <div>
                  <h3 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '1rem', fontWeight: 700, color: '#191c1d', marginBottom: '0.25rem' }}>Acesso Seguro</h3>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', color: '#564334', lineHeight: 1.6, margin: 0 }}>Suas informações são consultadas através de um canal criptografado. Garantimos a confidencialidade do seu acesso.</p>
                </div>
              </div>
            </div>

            {/* ── Coluna Direita: resultado ── */}
            <div style={{ gridColumn: 'span 12 / span 12' }} className="denuncia-right-col">
              {!resultado ? (
                /* Estado vazio */
                <div className="denuncia-shadow-ambient" style={{ backgroundColor: '#ffffff', borderRadius: '1.5rem', padding: '3rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', minHeight: '18rem' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '3.5rem', color: '#ddc1ae', marginBottom: '1.25rem', fontVariationSettings: "'FILL' 0" }}>policy</span>
                  <h3 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '1.25rem', fontWeight: 700, color: '#191c1d', marginBottom: '0.5rem' }}>Nenhuma consulta realizada</h3>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.9375rem', color: '#564334', lineHeight: 1.6, maxWidth: '22rem' }}>Preencha o protocolo e o código de acesso ao lado para visualizar o status da sua denúncia.</p>
                </div>
              ) : (
                /* Resultado */
                <div className="denuncia-shadow-ambient fade-in" style={{ backgroundColor: '#ffffff', borderRadius: '1.5rem', padding: '2rem', position: 'relative', overflow: 'hidden' }}>
                  <div className="denuncia-gradient-primary" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '8px' }}></div>

                  {/* Cabeçalho do resultado */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <span style={{ display: 'inline-block', padding: '0.2rem 0.75rem', backgroundColor: '#e7e8e9', color: '#564334', fontSize: '0.7rem', fontWeight: 700, borderRadius: '9999px', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Status Atual</span>
                      <h2 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '1.75rem', fontWeight: 800, color: '#191c1d', margin: 0 }}>{statusCfg?.label}</h2>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', color: '#564334', marginTop: '0.25rem' }}>
                        Última atualização: {formatarData(resultado.denuncia.updated_at)}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: '#fff7ed', borderRadius: '0.75rem', padding: '0.75rem 1rem' }}>
                      <span className="material-symbols-outlined" style={{ color: '#904d00', fontSize: '20px', fontVariationSettings: "'FILL' 1" }}>
                        {statusCfg?.icon}
                      </span>
                      <div>
                        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.7rem', fontWeight: 600, color: '#897362', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Protocolo</p>
                        <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 800, color: '#904d00', margin: 0, letterSpacing: '0.04em' }}>{resultado.denuncia.protocolo}</p>
                      </div>
                    </div>
                  </div>

                  {/* Info tipo */}
                  <div style={{ backgroundColor: '#f3f4f5', borderRadius: '0.75rem', padding: '0.875rem 1rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span className="material-symbols-outlined" style={{ color: '#897362', fontSize: '18px' }}>category</span>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', color: '#564334' }}>
                      <strong>Tipo:</strong> {TIPO_LABELS[resultado.denuncia.tipo_ocorrencia] || resultado.denuncia.tipo_ocorrencia}
                    </span>
                    <span style={{ marginLeft: 'auto', fontFamily: 'Inter, sans-serif', fontSize: '0.8125rem', color: '#897362' }}>
                      Registrada em {formatarData(resultado.denuncia.created_at)}
                    </span>
                  </div>

                  {/* Stepper */}
                  <div style={{ position: 'relative', marginBottom: '2rem', paddingLeft: '0.25rem' }}>
                    {/* linha de fundo */}
                    <div style={{ position: 'absolute', left: '11px', top: '12px', bottom: '12px', width: '2px', backgroundColor: '#e7e8e9', zIndex: 0 }}></div>
                    {/* linha de progresso */}
                    <div style={{
                      position: 'absolute', left: '11px', top: '12px', width: '2px', zIndex: 0,
                      background: 'linear-gradient(180deg, #ff8c00 0%, #ff8c00 100%)',
                      height: etapaAtual === -1 ? '0%' : etapaAtual >= ETAPAS.length - 1 ? 'calc(100% - 24px)' : `${(etapaAtual / (ETAPAS.length - 1)) * 100}%`,
                      transition: 'height 0.6s ease',
                    }}></div>

                    {ETAPAS.map((etapa, idx) => {
                      const concluida = idx < etapaAtual;
                      const atual = idx === etapaAtual;
                      const pendente = idx > etapaAtual;

                      return (
                        <div key={idx} style={{ position: 'relative', zIndex: 1, display: 'flex', gap: '1.25rem', marginBottom: idx < ETAPAS.length - 1 ? '2rem' : 0, opacity: pendente ? 0.45 : 1 }}>
                          {/* Bolinha */}
                          <div style={{
                            width: '24px', height: '24px', borderRadius: '9999px', flexShrink: 0, marginTop: '2px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            backgroundColor: concluida ? '#ff8c00' : atual ? '#ffffff' : '#e7e8e9',
                            border: atual ? '2px solid #ff8c00' : 'none',
                            boxShadow: `0 0 0 4px #ffffff`,
                          }}>
                            {concluida && (
                              <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#ffffff', fontVariationSettings: "'FILL' 1" }}>check</span>
                            )}
                            {atual && (
                              <div style={{ width: '8px', height: '8px', borderRadius: '9999px', backgroundColor: '#ff8c00' }}></div>
                            )}
                          </div>

                          {/* Conteúdo */}
                          <div style={{ flex: 1 }}>
                            <h4 style={{
                              fontFamily: 'Manrope, sans-serif', fontSize: '1.0625rem', fontWeight: 700,
                              color: atual ? '#904d00' : '#191c1d', marginBottom: '0.25rem',
                            }}>{etapa.label}</h4>
                            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', color: '#564334', margin: 0, lineHeight: 1.55 }}>{etapa.desc}</p>

                            {/* Mensagens da equipe nesta etapa */}
                            {atual && resultado.publicacoes.length > 0 && (
                              <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {resultado.publicacoes.map(pub => (
                                  <div key={pub.id} style={{ backgroundColor: '#fff7ed', borderRadius: '0.75rem', padding: '1rem', borderLeft: '3px solid #ff8c00' }}>
                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                                      <span className="material-symbols-outlined" style={{ color: '#897362', fontSize: '16px' }}>forum</span>
                                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', fontWeight: 700, color: '#897362', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        {pub.titulo || 'Mensagem da Equipe'}
                                      </span>
                                      <span style={{ marginLeft: 'auto', fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', color: '#897362' }}>{formatarData(pub.publicado_em)}</span>
                                    </div>
                                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', color: '#191c1d', fontStyle: 'italic', margin: 0, lineHeight: 1.6 }}>"{pub.mensagem}"</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Resposta pública atual */}
                  {resultado.denuncia.resposta_publica_atual && (
                    <div style={{ backgroundColor: '#f3f4f5', borderRadius: '1rem', padding: '1.25rem', marginTop: '1rem', borderLeft: '3px solid #904d00' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.625rem' }}>
                        <span className="material-symbols-outlined" style={{ color: '#904d00', fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>verified_user</span>
                        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', fontWeight: 700, color: '#564334', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Posicionamento oficial</span>
                      </div>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.9375rem', color: '#191c1d', lineHeight: 1.65, margin: 0 }}>{resultado.denuncia.resposta_publica_atual}</p>
                    </div>
                  )}

                  {/* Nova consulta */}
                  <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => { setResultado(null); setProtocolo(''); setCodigo(''); }}
                      style={{ background: 'none', border: '1px solid rgba(144,77,0,0.3)', borderRadius: '0.75rem', padding: '0.65rem 1.25rem', color: '#904d00', fontFamily: 'Inter, sans-serif', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>refresh</span>
                      Nova consulta
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

          <style>{`
            @media (min-width: 1024px) {
              .denuncia-left-col { grid-column: span 4 / span 4 !important; }
              .denuncia-right-col { grid-column: span 8 / span 8 !important; }
            }
            .hidden-mobile { display: none; }
            @media (min-width: 768px) { .hidden-mobile { display: block; } }
          `}</style>
        </main>

        {/* ── Mobile Bottom Nav ── */}
        <nav style={{ position: 'fixed', bottom: 0, width: '100%', zIndex: 50, borderRadius: '1rem 1rem 0 0', borderTop: '1px solid #f4f4f5', boxShadow: '0 -4px 20px rgba(0,0,0,0.05)', backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)' }} className="denuncia-mobile-nav">
          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '0.75rem 1rem 1.25rem' }}>
            <a href="/denuncia" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#a1a1aa', padding: '0.5rem 1rem', textDecoration: 'none' }}>
              <span className="material-symbols-outlined" style={{ marginBottom: '4px' }}>add_moderator</span>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Report</span>
            </a>
            <a href="/consultar-denuncia" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#fff7ed', color: '#ea580c', borderRadius: '0.75rem', padding: '0.5rem 1rem', textDecoration: 'none' }}>
              <span className="material-symbols-outlined" style={{ marginBottom: '4px' }}>manage_search</span>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Track</span>
            </a>
            <a href="#" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#a1a1aa', padding: '0.5rem 1rem', textDecoration: 'none' }}>
              <span className="material-symbols-outlined" style={{ marginBottom: '4px' }}>verified_user</span>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Support</span>
            </a>
          </div>
          <style>{`.denuncia-mobile-nav { display: flex; } @media (min-width: 768px) { .denuncia-mobile-nav { display: none !important; } }`}</style>
        </nav>

        {/* ── Footer ── */}
        <footer style={{ width: '100%', padding: '3rem 0 5rem', backgroundColor: '#f9fafb', marginTop: 'auto' }} className="denuncia-footer">
          <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1.5rem' }}>
            <div style={{ backgroundColor: '#e4e4e7', height: '1px', marginBottom: '2rem' }}></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#a1a1aa' }}>© 2026 Grupo Müller. Todos os direitos reservados.</span>
              <div style={{ display: 'flex', gap: '1.5rem' }}>
                <a href="/denuncia" style={{ color: '#71717a', fontSize: '0.875rem', textDecoration: 'none', fontFamily: 'Inter, sans-serif' }}>Nova Denúncia</a>
                <a href="/consultar-denuncia" style={{ color: '#71717a', fontSize: '0.875rem', textDecoration: 'none', fontFamily: 'Inter, sans-serif' }}>Acompanhar</a>
              </div>
            </div>
          </div>
          <style>{`@media (min-width: 768px) { .denuncia-footer { padding-bottom: 3rem !important; } }`}</style>
        </footer>
      </div>
    </>
  );
}
