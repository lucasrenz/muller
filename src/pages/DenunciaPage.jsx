import React, { useState, useRef } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

const BUCKET = 'denuncias-anexos';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'audio/mpeg', 'audio/mp3'];

export default function DenunciaPage() {
  const [identificar, setIdentificar] = useState(false);
  const [termos, setTermos] = useState(false);
  const [files, setFiles] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(null); // { protocolo, codigo_acesso }
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    tipo_ocorrencia: '',
    data_ocorrencia: '',
    local_ocorrencia: '',
    descricao: '',
    envolvidos: '',
    testemunhas: '',
    nome: '',
    email: '',
    telefone: '',
  });

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  function handleFiles(incoming) {
    const valid = [];
    for (const file of incoming) {
      if (file.size > MAX_FILE_SIZE) { setErro(`Arquivo "${file.name}" excede 10MB.`); continue; }
      valid.push(file);
    }
    setFiles((prev) => [...prev, ...valid]);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    handleFiles(Array.from(e.dataTransfer.files));
  }

  function removeFile(idx) {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');

    if (!form.tipo_ocorrencia) return setErro('Selecione o tipo de ocorrência.');
    if (!form.descricao.trim()) return setErro('A descrição do ocorrido é obrigatória.');
    if (!termos) return setErro('Você precisa aceitar os termos antes de enviar.');
    if (identificar && !form.nome.trim() && !form.email.trim() && !form.telefone.trim()) {
      return setErro('Ao se identificar, preencha ao menos um dos campos: nome, e-mail ou telefone.');
    }

    setLoading(true);
    try {
      // 1) Inserir denúncia
      const payload = {
        anonimo: !identificar,
        tipo_ocorrencia: form.tipo_ocorrencia,
        descricao: form.descricao.trim(),
        data_ocorrencia: form.data_ocorrencia || null,
        local_ocorrencia: form.local_ocorrencia.trim() || null,
        envolvidos: form.envolvidos.trim() || null,
        testemunhas: form.testemunhas.trim() || null,
        nome_denunciante: identificar ? form.nome.trim() || null : null,
        email_denunciante: identificar ? form.email.trim() || null : null,
        telefone_denunciante: identificar ? form.telefone.trim() || null : null,
      };

      const { data: inserted, error: insertError } = await supabase
        .from('denuncias')
        .insert(payload)
        .select('id, protocolo, codigo_acesso')
        .single();

      if (insertError) throw insertError;

      // 2) Upload de arquivos (se houver)
      if (files.length > 0) {
        for (const file of files) {
          const ext = file.name.split('.').pop();
          const path = `${inserted.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

          const { error: uploadError } = await supabase.storage
            .from(BUCKET)
            .upload(path, file, { contentType: file.type, upsert: false });

          if (uploadError) {
            console.warn('Falha ao enviar arquivo:', file.name, uploadError.message);
            continue;
          }

          const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);

          await supabase.from('denuncia_anexos').insert({
            denuncia_id: inserted.id,
            nome_arquivo: file.name,
            url_arquivo: urlData.publicUrl,
            tipo_arquivo: file.type,
            tamanho_bytes: file.size,
            enviado_por: 'denunciante',
          });
        }
      }

      setSucesso({ protocolo: inserted.protocolo, codigo_acesso: inserted.codigo_acesso });
    } catch (err) {
      console.error(err);
      setErro('Ocorreu um erro ao enviar sua denúncia. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        /* Fonte padrão para páginas de denúncia */
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,200..800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');

          /* Aplica Bricolage Grotesque como fonte padrão para texto nas páginas de denúncia.
            Evita sobrescrever fontes de ícones (Material Symbols) e SVGs (ex.: lucide-react). */
          .denuncia-root { font-family: 'Bricolage Grotesque', sans-serif; background-color: #f8f9fa; color: #191c1d; min-height: 100vh; display: flex; flex-direction: column; }

          /* Define explicitamente os elementos de texto que devem herdar Bricolage
            usando !important para sobrescrever estilos inline que definem outra fonte,
            mas preserva elementos de ícone identificados por classe ou tag. */
          .denuncia-root :is(h1,h2,h3,h4,h5,h6,p,span,a,button,label,li,input,textarea,select,option,strong,small,div) {
           font-family: 'Bricolage Grotesque', sans-serif !important;
          }

          /* Garantir que Material Symbols use sua própria fonte (não será sobrescrita). */
          .denuncia-root .material-symbols-outlined { font-family: 'Material Symbols Outlined' !important; }

          /* Excluir SVGs (ex.: lucide-react) para que permaneçam inalterados. */
          .denuncia-root svg { font-family: unset !important; }
        .denuncia-gradient-primary { background: linear-gradient(135deg, #904d00 0%, #ff8c00 100%); }
        .denuncia-shadow-ambient { box-shadow: 0 20px 40px rgba(25, 28, 29, 0.05); }
        .denuncia-input { width: 100%; background-color: #ffffff; border: 1px solid rgba(221,193,174,0.3); color: #191c1d; border-radius: 0.75rem; padding: 0.75rem 1rem; font-size: 1rem; transition: all 0.2s; }
        .denuncia-input:focus { outline: none; border-color: transparent; box-shadow: 0 0 0 2px rgba(255,140,0,0.15); background-color: #ffffff; }
        .denuncia-input::placeholder { color: rgba(86,67,52,0.5); }
        .denuncia-select { appearance: none; }
        .denuncia-fieldset { background-color: #f3f4f5; padding: 1.5rem; border-radius: 1rem; display: flex; flex-direction: column; gap: 1.5rem; border: none; }
        @media (min-width: 768px) { .denuncia-fieldset { padding: 2rem; } }
        .denuncia-label { font-size: 0.875rem; font-weight: 600; color: #564334; display: block; margin-bottom: 0.5rem; }
        .denuncia-legend { font-size: 1.125rem; font-weight: 700; color: #191c1d; margin-bottom: 1rem; float: unset; width: 100%; }
        .denuncia-btn-submit { background: linear-gradient(135deg, #904d00 0%, #ff8c00 100%); color: white; font-weight: 700; font-size: 1.125rem; padding: 1rem 2rem; border-radius: 0.75rem; border: none; cursor: pointer; box-shadow: 0 8px 20px -6px rgba(255,140,0,0.5); display: flex; align-items: center; gap: 0.75rem; transition: all 0.2s; }
        .denuncia-btn-submit:hover { box-shadow: 0 12px 25px -6px rgba(255,140,0,0.6); transform: translateY(-1px); }
        .denuncia-upload-zone { border: 2px dashed rgba(221,193,174,0.4); border-radius: 1rem; padding: 2rem; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; cursor: pointer; transition: background-color 0.2s; }
        .denuncia-upload-zone:hover { background-color: #e7e8e9; }
        .denuncia-toggle-track { width: 3.5rem; height: 1.75rem; border-radius: 9999px; background-color: #d9dadb; position: relative; transition: background-color 0.3s; }
        .denuncia-toggle-track.active { background-color: #ff8c00; }
        .denuncia-toggle-thumb { width: 1.5rem; height: 1.5rem; background-color: white; border-radius: 9999px; position: absolute; top: 2px; left: 2px; transition: transform 0.3s; box-shadow: 0 1px 3px rgba(0,0,0,0.2); }
        .denuncia-toggle-track.active .denuncia-toggle-thumb { transform: translateX(1.75rem); }
        .material-symbols-outlined { font-family: 'Material Symbols Outlined'; font-weight: normal; font-style: normal; font-size: 24px; line-height: 1; letter-spacing: normal; text-transform: none; display: inline-block; white-space: nowrap; word-wrap: normal; direction: ltr; -webkit-font-smoothing: antialiased; }
      `}</style>

      <div className="denuncia-root">
        {/* Top Navigation */}
        <nav style={{ position: 'fixed', top: 0, width: '100%', zIndex: 50, backgroundColor: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(20px)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }} className="hidden-mobile">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '1rem 1.5rem', maxWidth: '80rem', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
              <a href="/" title="Voltar para home" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
                <img
                  src="https://i.ibb.co/cXwpq4sq/Logo-Grupo-Muller.png"
                  alt="Logo Grupo Müller"
                  style={{ height: '56px', width: 'auto', display: 'block' }}
                />
              </a>
              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                <a href="/denuncia" style={{ color: '#ea580c', fontWeight: 700, borderBottom: '2px solid #f97316', paddingBottom: '4px', fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', textDecoration: 'none' }}>Nova Denúncia</a>
                <a href="/consultar-denuncia" style={{ color: '#71717a', fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', textDecoration: 'none', fontWeight: 500 }}>Acompanhar</a>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#ea580c' }}>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem', borderRadius: '9999px', color: '#ea580c' }}>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>language</span>
              </button>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem', borderRadius: '9999px', color: '#ea580c' }}>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>help</span>
              </button>
            </div>
          </div>
          <div style={{ backgroundColor: '#e4e4e7', height: '1px', width: '100%' }}></div>
        </nav>

        {/* Main Canvas */}
        <main style={{ flexGrow: 1, paddingTop: '6rem', paddingBottom: '6rem', paddingLeft: '1rem', paddingRight: '1rem', maxWidth: '80rem', margin: '0 auto', width: '100%' }}>

          {/* ===== TELA DE SUCESSO ===== */}
          {sucesso && (
            <div style={{ maxWidth: '42rem', margin: '4rem auto', textAlign: 'center' }}>
              <div className="denuncia-shadow-ambient" style={{ backgroundColor: '#ffffff', borderRadius: '1.5rem', padding: '3rem 2rem', position: 'relative', overflow: 'hidden' }}>
                <div className="denuncia-gradient-primary" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '8px' }}></div>
                <span className="material-symbols-outlined" style={{ fontSize: '4rem', color: '#904d00', marginBottom: '1.5rem', display: 'block', fontVariationSettings: "'FILL' 1" }}>task_alt</span>
                <h2 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '2rem', fontWeight: 800, color: '#191c1d', marginBottom: '0.75rem' }}>Denúncia registrada!</h2>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '1rem', color: '#564334', lineHeight: 1.6, marginBottom: '2.5rem' }}>
                  Sua denúncia foi recebida com sucesso. Guarde as informações abaixo para acompanhar o andamento.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                  <div style={{ backgroundColor: '#f3f4f5', borderRadius: '1rem', padding: '1.5rem' }}>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', fontWeight: 600, color: '#897362', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Protocolo</p>
                    <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '1.25rem', fontWeight: 800, color: '#191c1d', letterSpacing: '0.05em', margin: 0 }}>{sucesso.protocolo}</p>
                  </div>
                  <div style={{ backgroundColor: '#fff7ed', borderRadius: '1rem', padding: '1.5rem', border: '1px solid rgba(255,140,0,0.2)' }}>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', fontWeight: 600, color: '#897362', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Código de Acesso</p>
                    <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '1.25rem', fontWeight: 800, color: '#904d00', letterSpacing: '0.1em', margin: 0 }}>{sucesso.codigo_acesso}</p>
                  </div>
                </div>
                <div style={{ backgroundColor: '#f3f4f5', borderRadius: '0.75rem', padding: '1rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem', textAlign: 'left' }}>
                  <span className="material-symbols-outlined" style={{ color: '#ff8c00', flexShrink: 0, marginTop: '2px' }}>info</span>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', color: '#564334', lineHeight: 1.6, margin: 0 }}>
                    Anote o <strong>Código de Acesso</strong> — ele não pode ser recuperado posteriormente. Use-o junto com o protocolo para consultar o status da sua denúncia.
                  </p>
                </div>
                <button
                  onClick={() => { setSucesso(null); setForm({ tipo_ocorrencia:'', data_ocorrencia:'', local_ocorrencia:'', descricao:'', envolvidos:'', testemunhas:'', nome:'', email:'', telefone:'' }); setFiles([]); setTermos(false); setIdentificar(false); }}
                  style={{ marginTop: '2rem', background: 'none', border: '1px solid rgba(144,77,0,0.3)', borderRadius: '0.75rem', padding: '0.75rem 1.5rem', color: '#904d00', fontFamily: 'Inter, sans-serif', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}
                >
                  Fazer outra denúncia
                </button>
              </div>
            </div>
          )}

          {/* ===== FORMULÁRIO PRINCIPAL ===== */}
          {!sucesso && (<>

          {/* Header Section */}
          <header style={{ maxWidth: '48rem', marginBottom: '4rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0.75rem', borderRadius: '9999px', backgroundColor: '#e7e8e9', color: '#564334', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '1.5rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#ff8c00' }}>shield</span>
              PLATAFORMA SEGURA
            </div>
            <h1 style={{ fontFamily: 'Manrope, sans-serif', fontSize: 'clamp(2.5rem, 5vw, 3.75rem)', fontWeight: 800, letterSpacing: '-0.04em', color: '#191c1d', marginBottom: '1.5rem', lineHeight: 1.1 }}>Canal de Denúncias</h1>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 'clamp(1.125rem, 2vw, 1.5rem)', color: '#564334', lineHeight: 1.6, fontWeight: 300 }}>Um espaço seguro para relatar situações que vão contra nossos valores e normas.</p>
          </header>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '3rem', alignItems: 'start' }}>

            {/* Left Column */}
            <div style={{ gridColumn: 'span 12 / span 12', display: 'flex', flexDirection: 'column', gap: '3rem' }} className="denuncia-left-col">

              {/* Nosso Compromisso */}
              <section className="denuncia-shadow-ambient" style={{ backgroundColor: '#f3f4f5', padding: '2rem', borderRadius: '1rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '2.5rem', color: '#904d00', marginBottom: '1rem', display: 'block', fontVariationSettings: "'FILL' 1" }}>assured_workload</span>
                <h3 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', color: '#191c1d' }}>Nosso Compromisso</h3>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '1rem', color: '#564334', lineHeight: 1.7 }}>
                  Acreditamos em um ambiente de trabalho íntegro, transparente e seguro. Este canal garante total confidencialidade, permitindo o relato de condutas antiéticas, fraudes ou violações de forma segura e protegida.
                </p>
              </section>

              {/* O que pode ser denunciado */}
              <section style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div>
                  <h4 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', color: '#191c1d', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="material-symbols-outlined" style={{ color: '#ff8c00' }}>info</span>
                    O que pode ser denunciado?
                  </h4>
                  <ul style={{ display: 'flex', flexDirection: 'column', gap: '1rem', listStyle: 'none', padding: 0, margin: 0 }}>
                    {[
                      { icon: 'warning', text: 'Assédio moral ou sexual e discriminação.' },
                      { icon: 'payments', text: 'Fraudes, corrupção ou suborno.' },
                      { icon: 'gavel', text: 'Violações de leis ou normativas internas.' },
                    ].map((item) => (
                      <li key={item.icon} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', color: '#564334' }}>
                        <span className="material-symbols-outlined" style={{ color: '#897362', fontSize: '20px', marginTop: '1px', flexShrink: 0 }}>{item.icon}</span>
                        <span>{item.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div style={{ height: '1px', backgroundColor: '#e7e8e9' }}></div>
                <div>
                  <h4 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', color: '#191c1d', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="material-symbols-outlined" style={{ color: '#ff8c00' }}>verified_user</span>
                    Garantias ao denunciante
                  </h4>
                  <ul style={{ display: 'flex', flexDirection: 'column', gap: '1rem', listStyle: 'none', padding: 0, margin: 0 }}>
                    {[
                      { icon: 'visibility_off', text: 'Anonimato garantido (se desejado).' },
                      { icon: 'security', text: 'Proteção absoluta contra retaliações.' },
                      { icon: 'lock', text: 'Tratamento seguro e sigiloso dos dados.' },
                    ].map((item) => (
                      <li key={item.icon} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', color: '#564334' }}>
                        <span className="material-symbols-outlined" style={{ color: '#897362', fontSize: '20px', marginTop: '1px', flexShrink: 0 }}>{item.icon}</span>
                        <span>{item.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>

              {/* LGPD */}
              <div style={{ paddingTop: '2rem', borderTop: '1px solid #e7e8e9' }}>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', color: '#564334', lineHeight: 1.7, opacity: 0.8 }}>
                  Em conformidade com a Lei Geral de Proteção de Dados (LGPD), as informações coletadas aqui serão utilizadas exclusivamente para apuração do relato, garantindo o sigilo e a privacidade dos envolvidos.
                </p>
              </div>
            </div>

            {/* Right Column: Form */}
            <div style={{ gridColumn: 'span 12 / span 12' }} className="denuncia-right-col">
              <div className="denuncia-shadow-ambient" style={{ backgroundColor: '#ffffff', borderRadius: '1.5rem', padding: '2rem', position: 'relative', overflow: 'hidden' }}>
                <div className="denuncia-gradient-primary" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '8px' }}></div>
                <div style={{ marginBottom: '2.5rem' }}>
                  <h2 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '1.875rem', fontWeight: 800, color: '#191c1d', marginBottom: '0.5rem' }}>Faça sua denúncia</h2>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '1rem', color: '#564334' }}>Forneça o máximo de detalhes possível para auxiliar na investigação. Seus dados estão seguros.</p>
                </div>

                <form style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} onSubmit={handleSubmit}>

                  {/* Mensagem de erro */}
                  {erro && (
                    <div style={{ backgroundColor: '#ffdad6', border: '1px solid rgba(186,26,26,0.2)', borderRadius: '0.75rem', padding: '0.875rem 1rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                      <span className="material-symbols-outlined" style={{ color: '#ba1a1a', flexShrink: 0, fontSize: '20px', marginTop: '2px' }}>error</span>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', color: '#93000a', margin: 0 }}>{erro}</p>
                    </div>
                  )}

                  {/* Detalhes do Ocorrido */}
                  <fieldset className="denuncia-fieldset">
                    <legend className="denuncia-legend">Detalhes do Ocorrido</legend>
                    <div>
                      <label className="denuncia-label" htmlFor="tipo_ocorrencia">Tipo de ocorrência *</label>
                      <div style={{ position: 'relative' }}>
                        <select className="denuncia-input denuncia-select" id="tipo_ocorrencia" value={form.tipo_ocorrencia} onChange={set('tipo_ocorrencia')}>
                          <option disabled value="">Selecione uma categoria...</option>
                          <option value="assedio">Assédio Moral / Sexual</option>
                          <option value="fraude">Fraude ou Desvio</option>
                          <option value="corrupcao">Corrupção</option>
                          <option value="outros">Outros</option>
                        </select>
                        <span className="material-symbols-outlined" style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#564334', pointerEvents: 'none' }}>expand_more</span>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                      <div>
                        <label className="denuncia-label" htmlFor="data_ocorrido">Data do ocorrido (Aproximada)</label>
                        <input className="denuncia-input" id="data_ocorrido" type="date" value={form.data_ocorrencia} onChange={set('data_ocorrencia')} />
                      </div>
                      <div>
                        <label className="denuncia-label" htmlFor="local_ocorrido">Local onde ocorreu</label>
                        <input className="denuncia-input" id="local_ocorrido" placeholder="Ex: Filial São Paulo, Setor Financeiro..." type="text" value={form.local_ocorrencia} onChange={set('local_ocorrencia')} />
                      </div>
                    </div>
                    <div>
                      <label className="denuncia-label" htmlFor="descricao">Descreva o ocorrido *</label>
                      <p style={{ fontSize: '0.75rem', color: '#564334', marginBottom: '0.25rem' }}>Seja detalhista. O que aconteceu? Como? Por que?</p>
                      <textarea className="denuncia-input" id="descricao" rows={5} style={{ resize: 'none' }} value={form.descricao} onChange={set('descricao')}></textarea>
                    </div>
                  </fieldset>

                  {/* Pessoas Envolvidas */}
                  <fieldset className="denuncia-fieldset">
                    <legend className="denuncia-legend">Pessoas Envolvidas</legend>
                    <div>
                      <label className="denuncia-label" htmlFor="pessoas_envolvidas">Quem está envolvido?</label>
                      <textarea className="denuncia-input" id="pessoas_envolvidas" placeholder="Nomes, cargos ou departamentos..." rows={3} style={{ resize: 'none' }} value={form.envolvidos} onChange={set('envolvidos')}></textarea>
                    </div>
                    <div>
                      <label className="denuncia-label" htmlFor="testemunhas">Possíveis testemunhas</label>
                      <textarea className="denuncia-input" id="testemunhas" placeholder="Houve testemunhas? Quem?" rows={2} style={{ resize: 'none' }} value={form.testemunhas} onChange={set('testemunhas')}></textarea>
                    </div>
                  </fieldset>

                  {/* Evidências */}
                  <fieldset style={{ border: 'none', padding: 0 }}>
                    <div>
                      <label className="denuncia-label">Anexar arquivos (Opcional)</label>
                      <p style={{ fontSize: '0.75rem', color: '#564334', marginBottom: '0.5rem' }}>Fotos, documentos, áudios que comprovem o relato.</p>
                      <div
                        className="denuncia-upload-zone"
                        style={{ backgroundColor: dragOver ? '#e7e8e9' : undefined }}
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          multiple
                          accept=".pdf,.jpg,.jpeg,.png,.mp3"
                          style={{ display: 'none' }}
                          onChange={(e) => handleFiles(Array.from(e.target.files))}
                        />
                        <span className="material-symbols-outlined" style={{ fontSize: '2.5rem', color: '#ff8c00', marginBottom: '0.75rem' }}>cloud_upload</span>
                        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', color: '#191c1d', fontWeight: 600 }}>Clique para anexar ou arraste os arquivos</span>
                        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', color: '#564334', marginTop: '0.25rem' }}>PDF, JPG, PNG, MP3 (Max 10MB)</span>
                      </div>
                      {files.length > 0 && (
                        <ul style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', listStyle: 'none', padding: 0 }}>
                          {files.map((file, idx) => (
                            <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: '#f3f4f5', borderRadius: '0.5rem', padding: '0.5rem 0.75rem' }}>
                              <span className="material-symbols-outlined" style={{ color: '#897362', fontSize: '18px' }}>attach_file</span>
                              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.8125rem', color: '#191c1d', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', color: '#897362' }}>{(file.size / 1024 / 1024).toFixed(1)}MB</span>
                              <button type="button" onClick={() => removeFile(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ba1a1a', padding: '0 0.25rem', lineHeight: 1 }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </fieldset>

                  {/* Identificação */}
                  <fieldset className="denuncia-fieldset">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                      <div>
                        <h3 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '1.125rem', fontWeight: 700, color: '#191c1d', margin: 0 }}>Identificação</h3>
                        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', color: '#564334', margin: 0 }}>Seu relato pode ser 100% anônimo.</p>
                      </div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                        <div
                          className={`denuncia-toggle-track${identificar ? ' active' : ''}`}
                          onClick={() => setIdentificar(!identificar)}
                        >
                          <div className="denuncia-toggle-thumb"></div>
                        </div>
                        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', fontWeight: 600, color: '#191c1d' }}>Desejo me identificar</span>
                      </label>
                    </div>
                    <div style={{ opacity: identificar ? 1 : 0.4, pointerEvents: identificar ? 'auto' : 'none', display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', marginTop: '1rem', borderTop: '1px solid #e7e8e9', paddingTop: '1.5rem', transition: 'opacity 0.3s' }}>
                      <div>
                        <label className="denuncia-label" htmlFor="nome">Nome completo</label>
                        <input className="denuncia-input" id="nome" type="text" value={form.nome} onChange={set('nome')} />
                      </div>
                      <div>
                        <label className="denuncia-label" htmlFor="email">E-mail</label>
                        <input className="denuncia-input" id="email" type="email" value={form.email} onChange={set('email')} />
                      </div>
                      <div>
                        <label className="denuncia-label" htmlFor="telefone">Telefone</label>
                        <input className="denuncia-input" id="telefone" type="tel" value={form.telefone} onChange={set('telefone')} />
                      </div>
                    </div>
                  </fieldset>

                  {/* Termos */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginTop: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', height: '20px', marginTop: '2px', flexShrink: 0 }}>
                      <input
                        id="termos"
                        type="checkbox"
                        checked={termos}
                        onChange={(e) => setTermos(e.target.checked)}
                        style={{ width: '1.25rem', height: '1.25rem', accentColor: '#ff8c00', borderRadius: '0.25rem', cursor: 'pointer' }}
                      />
                    </div>
                    <label htmlFor="termos" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', color: '#564334', lineHeight: 1.6 }}>
                      Declaro que as informações aqui prestadas são verdadeiras e estou ciente de que denúncias falsas ou de má-fé podem acarretar sanções disciplinares ou legais. *
                    </label>
                  </div>

                  {/* Submit */}
                  <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <button className="denuncia-btn-submit" type="submit" disabled={loading} style={{ opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
                      {loading ? (
                        <>
                          <span className="material-symbols-outlined" style={{ animation: 'denuncia-spin 1s linear infinite' }}>progress_activity</span>
                          Enviando...
                        </>
                      ) : (
                        <>
                          Enviar denúncia
                          <span className="material-symbols-outlined">send</span>
                        </>
                      )}
                    </button>
                  </div>
                  <style>{`@keyframes denuncia-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
                </form>
              </div>
            </div>
          </div>

          <style>{`
            @media (min-width: 1024px) {
              .denuncia-left-col { grid-column: span 4 / span 4 !important; }
              .denuncia-right-col { grid-column: span 8 / span 8 !important; }
            }
            @media (min-width: 768px) {
              .denuncia-right-col .denuncia-input[type="date"],
              .denuncia-right-col #local_ocorrido {
                grid-column: span 1;
              }
            }
            .hidden-mobile { display: none; }
            @media (min-width: 768px) { .hidden-mobile { display: block; } }
          `}</style>
        </>) /* fim !sucesso */}
        </main>

        {/* Mobile Bottom Nav */}
        <nav style={{ position: 'fixed', bottom: 0, width: '100%', zIndex: 50, borderRadius: '1rem 1rem 0 0', borderTop: '1px solid #f4f4f5', boxShadow: '0 -4px 20px rgba(0,0,0,0.05)', backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)' }} className="denuncia-mobile-nav">
          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '0.75rem 1rem 1.25rem' }}>
            <a href="#" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#fff7ed', color: '#ea580c', borderRadius: '0.75rem', padding: '0.5rem 1rem', textDecoration: 'none' }}>
              <span className="material-symbols-outlined" style={{ marginBottom: '4px' }}>add_moderator</span>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Report</span>
            </a>
            <a href="/consultar-denuncia" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#a1a1aa', padding: '0.5rem 1rem', textDecoration: 'none' }}>
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

        {/* Footer */}
        <footer style={{ width: '100%', padding: '3rem 0', backgroundColor: '#f9fafb', marginTop: 'auto', display: 'none' }} className="denuncia-footer">
          <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1.5rem' }}>
            <div style={{ backgroundColor: '#e4e4e7', height: '1px', marginBottom: '2rem' }}></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#a1a1aa' }}>© 2026 Grupo Muller.</span>
              <div style={{ display: 'flex', gap: '1.5rem' }}>
                {['Política de Privacidade', 'Escudo de Anonimato', 'Integridade Corporativa'].map((link) => (
                  <a key={link} href="#" style={{ color: '#71717a', fontSize: '0.875rem', textDecoration: 'none', fontFamily: 'Inter, sans-serif' }}>{link}</a>
                ))}
              </div>
            </div>
          </div>
          <style>{`@media (min-width: 768px) { .denuncia-footer { display: block !important; } }`}</style>
        </footer>
      </div>
    </>
  );
}
