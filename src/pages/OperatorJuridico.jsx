import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import {
  Scale, LogOut, Search, RefreshCw, X, Plus, Send,
  Loader2, FileText, MessageSquare, Paperclip, ClipboardList,
  Eye, EyeOff, ChevronDown, CheckCircle2, ExternalLink, ShieldAlert,
  MessageCircle, AlertCircle, TrendingUp, Clock, Archive, Sparkles,
  MoreVertical,
} from 'lucide-react';

// ─── constantes ────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  nova:                   { label: 'Nova',            bg: 'bg-sky-50',     text: 'text-sky-600',     dot: 'bg-sky-400',     ring: 'ring-sky-200/70',     gradFrom: 'from-sky-500/12',     gradTo: 'to-sky-600/12',     borderColor: 'border-sky-200',     icon: Sparkles     },
  triagem:                { label: 'Em triagem',      bg: 'bg-violet-50',  text: 'text-violet-600',  dot: 'bg-violet-400',  ring: 'ring-violet-200/70',  gradFrom: 'from-violet-500/12',  gradTo: 'to-violet-600/12',  borderColor: 'border-violet-200',  icon: Eye          },
  em_analise:             { label: 'Em análise',      bg: 'bg-amber-50',   text: 'text-amber-600',   dot: 'bg-amber-400',   ring: 'ring-amber-200/70',   gradFrom: 'from-amber-500/12',   gradTo: 'to-amber-600/12',   borderColor: 'border-amber-200',   icon: Clock        },
  em_investigacao:        { label: 'Investigação',    bg: 'bg-orange-50',  text: 'text-orange-600',  dot: 'bg-orange-400',  ring: 'ring-orange-200/70',  gradFrom: 'from-orange-500/12',  gradTo: 'to-orange-600/12',  borderColor: 'border-orange-200',  icon: Search       },
  aguardando_informacoes: { label: 'Ag. informações', bg: 'bg-yellow-50',  text: 'text-yellow-700',  dot: 'bg-yellow-400',  ring: 'ring-yellow-200/70',  gradFrom: 'from-yellow-500/12',  gradTo: 'to-yellow-600/12',  borderColor: 'border-yellow-200',  icon: MessageSquare },
  concluida:              { label: 'Concluída',       bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-400', ring: 'ring-emerald-200/70', gradFrom: 'from-emerald-500/12', gradTo: 'to-emerald-600/12', borderColor: 'border-emerald-200', icon: CheckCircle2 },
  arquivada:              { label: 'Arquivada',       bg: 'bg-slate-100',  text: 'text-slate-500',   dot: 'bg-slate-300',   ring: 'ring-slate-200/70',   gradFrom: 'from-slate-400/12',   gradTo: 'to-slate-500/12',   borderColor: 'border-slate-200',   icon: Archive      },
};

const PRIORITY_CONFIG = {
  baixa:   { label: 'Baixa',   bg: 'bg-slate-50',  text: 'text-slate-500', dot: 'bg-slate-300', ring: 'ring-slate-200/70' },
  normal:  { label: 'Normal',  bg: 'bg-blue-50',   text: 'text-blue-600',  dot: 'bg-blue-300',  ring: 'ring-blue-200/70'  },
  alta:    { label: 'Alta',    bg: 'bg-amber-50',  text: 'text-amber-600', dot: 'bg-amber-400', ring: 'ring-amber-200/70' },
  critica: { label: 'Crítica', bg: 'bg-rose-50',   text: 'text-rose-600',  dot: 'bg-rose-400',  ring: 'ring-rose-200/70'  },
};

const TIPO_LABELS = {
  assedio:   'Assédio Moral / Sexual',
  fraude:    'Fraude ou Desvio',
  corrupcao: 'Corrupção',
  outros:    'Outros',
};

const STATUS_ORDER   = ['nova','triagem','em_analise','em_investigacao','aguardando_informacoes','concluida','arquivada'];
const PRIORITY_ORDER = ['baixa','normal','alta','critica'];
const PAGE_SIZE      = 50;

// ─── helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}
function formatDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }) +
    ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}
function fileIcon(tipo) {
  if (!tipo) return '📎';
  if (tipo.includes('pdf'))   return '📄';
  if (tipo.includes('image')) return '🖼️';
  if (tipo.includes('audio')) return '🎵';
  return '📎';
}
function formatBytes(b) {
  if (!b) return '';
  if (b < 1024)        return b + ' B';
  if (b < 1048576)     return (b / 1024).toFixed(1) + ' KB';
  return (b / 1048576).toFixed(1) + ' MB';
}
function typeInitialChar(tipo) {
  return tipo === 'assedio' ? 'A' : tipo === 'fraude' ? 'F' : tipo === 'corrupcao' ? 'C' : 'D';
}

// ─── StatusBadge ──────────────────────────────────────────────────────────────

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || { label: status, bg: 'bg-gray-50', text: 'text-gray-500', dot: 'bg-gray-300', ring: 'ring-gray-200/70' };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ring-inset ${cfg.bg} ${cfg.text} ${cfg.ring}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

// ─── PriorityBadge ────────────────────────────────────────────────────────────

const PriorityBadge = ({ priority }) => {
  const cfg = PRIORITY_CONFIG[priority] || { label: priority, bg: 'bg-gray-50', text: 'text-gray-500', dot: 'bg-gray-300', ring: 'ring-gray-200/70' };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ring-inset ${cfg.bg} ${cfg.text} ${cfg.ring}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

// ─── SkeletonRow ──────────────────────────────────────────────────────────────

const SkeletonRow = () => (
  <tr className="border-b border-slate-100">
    <td className="px-6 py-3.5">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-slate-100 animate-pulse" />
        <div className="space-y-1.5">
          <div className="h-3 w-28 bg-slate-100 rounded animate-pulse" />
          <div className="h-2.5 w-14 bg-slate-100 rounded animate-pulse" />
        </div>
      </div>
    </td>
    <td className="px-6 py-3.5"><div className="h-3.5 w-20 bg-slate-100 rounded animate-pulse" /></td>
    <td className="px-6 py-3.5"><div className="h-5 w-20 bg-slate-100 rounded-full animate-pulse" /></td>
    <td className="px-6 py-3.5"><div className="h-5 w-14 bg-slate-100 rounded-full animate-pulse" /></td>
    <td className="px-6 py-3.5"><div className="h-3.5 w-16 bg-slate-100 rounded animate-pulse" /></td>
    <td className="px-6 py-3.5"><div className="h-7 w-7 bg-slate-100 rounded-lg animate-pulse ml-auto" /></td>
  </tr>
);

// ─── DrawerEmpty ──────────────────────────────────────────────────────────────

function DrawerEmpty({ icon: Icon, text }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 py-12">
      <Icon className="h-10 w-10 text-slate-300" />
      <p className="text-sm text-slate-500 text-center">{text}</p>
    </div>
  );
}

// ─── DetailCard ───────────────────────────────────────────────────────────────

function DetailCard({ label, children, className = '' }) {
  return (
    <div className={`rounded-xl border border-slate-200/60 bg-slate-50/30 px-4 py-3 min-w-0 ${className}`}>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-[0.05em] mb-1">{label}</p>
      {typeof children === 'string'
        ? <p className="text-sm font-medium text-slate-900">{children}</p>
        : children}
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

function Section({ title, children }) {
  return (
    <section>
      <h3 className="mb-3 text-xs font-semibold text-slate-900 uppercase tracking-[0.1em]">{title}</h3>
      {children}
    </section>
  );
}

// ─── DenunciaDrawer ───────────────────────────────────────────────────────────

function DenunciaDrawer({ denuncia, onClose, onUpdated, perfil }) {
  const { toast } = useToast();
  const [activeTab,    setActiveTab]    = useState('detalhes');
  const [loadingDetail,setLoadingDetail]= useState(true);
  const [actionsOpen,  setActionsOpen]  = useState(false);
  const actionsRef = useRef(null);

  const [notas,          setNotas]          = useState([]);
  const [novaNota,       setNovaNota]       = useState('');
  const [sendingNota,    setSendingNota]    = useState(false);
  const [anexos,         setAnexos]         = useState([]);
  const [publicacoes,    setPublicacoes]    = useState([]);
  const [novaPublicacao, setNovaPublicacao] = useState({ titulo: '', mensagem: '', visivel: true });
  const [sendingPub,     setSendingPub]     = useState(false);
  const [logs,           setLogs]           = useState([]);

  const [editStatus,   setEditStatus]   = useState(denuncia.status);
  const [editPriority, setEditPriority] = useState(denuncia.prioridade);
  const [savingFields, setSavingFields] = useState(false);

  const hasChanges = editStatus !== denuncia.status || editPriority !== denuncia.prioridade;
  const operadorNome = perfil?.nome || 'Operador';
  const operadorAuthId = perfil?.auth_user_id || null;

  useEffect(() => {
    const handler = (e) => {
      if (actionsOpen && actionsRef.current && !actionsRef.current.contains(e.target)) setActionsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [actionsOpen]);

  const loadDetail = useCallback(async () => {
    setLoadingDetail(true);
    try {
      const [{ data: n }, { data: a }, { data: p }, { data: l }] = await Promise.all([
        supabase.from('denuncia_notas_internas').select('*').eq('denuncia_id', denuncia.id).order('created_at', { ascending: false }),
        supabase.from('denuncia_anexos').select('*').eq('denuncia_id', denuncia.id).order('created_at', { ascending: false }),
        supabase.from('denuncia_publicacoes').select('*').eq('denuncia_id', denuncia.id).order('publicado_em', { ascending: false }),
        supabase.from('denuncia_logs').select('*').eq('denuncia_id', denuncia.id).order('created_at', { ascending: false }),
      ]);
      setNotas(n || []); setAnexos(a || []); setPublicacoes(p || []); setLogs(l || []);
    } catch (err) { console.error(err); }
    finally { setLoadingDetail(false); }
  }, [denuncia.id]);

  useEffect(() => { loadDetail(); }, [loadDetail]);

  function getRpcErrorMessage(error, fallback) {
    if (!error) return fallback;
    const raw = error.message || fallback;
    if (/row-level security|permission denied|403|42501/i.test(raw)) {
      return 'Permissão negada pelo RLS. Aplique as funções SQL de operação de denúncias no Supabase.';
    }
    if (/Could not find the function|function .* does not exist/i.test(raw)) {
      return 'Função RPC não encontrada no Supabase. Aplique o SQL atualizado do módulo de denúncias.';
    }
    return raw;
  }

  async function handleSaveFields() {
    setSavingFields(true);
    try {
      const { error } = await supabase.rpc('atualizar_denuncia_operacao', {
        p_denuncia_id: denuncia.id,
        p_status: editStatus,
        p_prioridade: editPriority,
        p_usuario_id: operadorAuthId,
        p_usuario_nome: operadorNome,
      });
      if (error) throw error;

      toast({ title: 'Alterações salvas' });
      onUpdated({ ...denuncia, status: editStatus, prioridade: editPriority });
      await loadDetail();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Erro', description: getRpcErrorMessage(err, 'Não foi possível salvar as alterações.') });
    }
    finally { setSavingFields(false); }
  }

  async function handleQuickStatus(newStatus) {
    setEditStatus(newStatus); setActionsOpen(false); setSavingFields(true);
    try {
      const { error } = await supabase.rpc('atualizar_denuncia_operacao', {
        p_denuncia_id: denuncia.id,
        p_status: newStatus,
        p_prioridade: editPriority,
        p_usuario_id: operadorAuthId,
        p_usuario_nome: operadorNome,
      });
      if (error) throw error;
      toast({ title: `Status alterado para "${STATUS_CONFIG[newStatus]?.label || newStatus}"` });
      onUpdated({ ...denuncia, status: newStatus, prioridade: editPriority });
      await loadDetail();
    } catch (err) {
      setEditStatus(denuncia.status);
      toast({ variant: 'destructive', title: 'Erro', description: getRpcErrorMessage(err, 'Não foi possível alterar o status.') });
    }
    finally { setSavingFields(false); }
  }

  async function handleAddNota() {
    if (!novaNota.trim()) return;
    setSendingNota(true);
    try {
      const { error } = await supabase.rpc('adicionar_nota_interna_denuncia', {
        p_denuncia_id: denuncia.id,
        p_nota: novaNota.trim(),
        p_usuario_id: operadorAuthId,
        p_usuario_nome: operadorNome,
        p_setor: 'jurídico',
      });
      if (error) throw error;
      setNovaNota('');
      await loadDetail();
      toast({ title: 'Nota adicionada' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Erro', description: getRpcErrorMessage(err, 'Não foi possível adicionar a nota.') });
    }
    finally { setSendingNota(false); }
  }

  async function handlePublicar() {
    if (!novaPublicacao.mensagem.trim()) return;
    setSendingPub(true);
    try {
      const { error } = await supabase.rpc('publicar_resposta_denuncia', {
        p_denuncia_id: denuncia.id,
        p_titulo: novaPublicacao.titulo.trim() || null,
        p_mensagem: novaPublicacao.mensagem.trim(),
        p_usuario_id: operadorAuthId,
        p_usuario_nome: operadorNome,
        p_novo_status: null,
        p_visivel_denunciante: novaPublicacao.visivel,
      });
      if (error) throw error;

      setNovaPublicacao({ titulo: '', mensagem: '', visivel: true });
      await loadDetail();
      toast({ title: 'Publicação enviada com sucesso' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Erro ao publicar', description: getRpcErrorMessage(err, 'Não foi possível publicar a mensagem.') });
    }
    finally { setSendingPub(false); }
  }

  const tabs = [
    { id: 'detalhes',    label: 'Detalhes',                                                    Icon: FileText      },
    { id: 'notas',       label: `Notas${notas.length ? ` (${notas.length})` : ''}`,            Icon: MessageSquare },
    { id: 'anexos',      label: `Anexos${anexos.length ? ` (${anexos.length})` : ''}`,         Icon: Paperclip     },
    { id: 'publicacoes', label: 'Publicações',                                                 Icon: MessageCircle },
    { id: 'log',         label: 'Log',                                                         Icon: ClipboardList },
  ];

  return (
    <motion.div
      initial={{ x: 540, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 540, opacity: 0 }}
      transition={{ duration: 0.3, type: 'spring', damping: 25 }}
      className="fixed right-0 top-5 bottom-5 z-50 w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl flex flex-col"
    >
      {/* ── Header ── */}
      <div className="sticky top-0 z-10 border-b border-slate-200/60 bg-white/95 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-start justify-between gap-4 px-6 py-5">

          {/* Avatar + info */}
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 text-white font-bold text-lg flex-shrink-0 shadow-sm shadow-orange-200">
              {typeInitialChar(denuncia.tipo_ocorrencia)}
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-slate-900 truncate">
                {TIPO_LABELS[denuncia.tipo_ocorrencia] || denuncia.tipo_ocorrencia}
              </h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="font-mono text-xs text-orange-600 font-bold">{denuncia.protocolo}</span>
                <StatusBadge status={editStatus} />
                <PriorityBadge priority={editPriority} />
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="relative" ref={actionsRef}>
              <button
                onClick={() => setActionsOpen(o => !o)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
                title="Alterar status"
              >
                <MoreVertical className="h-5 w-5" />
              </button>
              {actionsOpen && (
                <div className="absolute right-0 top-full z-20 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                  <div className="flex flex-col p-1">
                    <p className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Alterar status</p>
                    {STATUS_ORDER.map(s => {
                      const cfg  = STATUS_CONFIG[s];
                      const Icon = cfg.icon;
                      return (
                        <button key={s} onClick={() => handleQuickStatus(s)}
                          className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-colors ${editStatus === s ? `${cfg.bg} ${cfg.text} font-semibold` : 'text-slate-700 hover:bg-slate-50'}`}
                        >
                          <Icon className={`h-4 w-4 ${editStatus === s ? cfg.text : 'text-slate-400'}`} />
                          {cfg.label}
                          {editStatus === s && <CheckCircle2 className={`h-3.5 w-3.5 ml-auto ${cfg.text}`} />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <button onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
              title="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Prioridade + salvar */}
        <div className="flex items-center justify-between gap-4 px-6 pb-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Prioridade</span>
            <div className="relative">
              <select
                value={editPriority}
                onChange={e => setEditPriority(e.target.value)}
                className="appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-7 py-1.5 text-sm font-medium text-slate-900 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 focus:outline-none"
              >
                {PRIORITY_ORDER.map(p => <option key={p} value={p}>{PRIORITY_CONFIG[p].label}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            </div>
            <span className="text-xs text-slate-400">Recebida {formatDate(denuncia.created_at)}</span>
          </div>
          {hasChanges && (
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={handleSaveFields} disabled={savingFields}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-1.5 text-white text-sm font-semibold shadow-sm disabled:opacity-60 transition-all"
            >
              {savingFields ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              Salvar
            </motion.button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-t border-slate-100 overflow-x-auto">
          {tabs.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-5 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${
                activeTab === id
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />{label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Conteúdo ── */}
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
        {loadingDetail && activeTab !== 'detalhes' ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-6 h-6 animate-spin text-orange-400" />
          </div>
        ) : (
          <>
            {/* DETALHES */}
            {activeTab === 'detalhes' && (
              <div className="p-6 space-y-5">
                <Section title="Dados da ocorrência">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <DetailCard label="Tipo">{TIPO_LABELS[denuncia.tipo_ocorrencia] || denuncia.tipo_ocorrencia || '—'}</DetailCard>
                    {denuncia.data_ocorrencia && (
                      <DetailCard label="Data do ocorrido">{formatDate(denuncia.data_ocorrencia)}</DetailCard>
                    )}
                    {denuncia.local_ocorrencia && (
                      <DetailCard label="Local" className="sm:col-span-2">{denuncia.local_ocorrencia}</DetailCard>
                    )}
                  </div>
                </Section>

                <Section title="Descrição">
                  <div className="rounded-xl border border-slate-200/60 bg-slate-50/30 px-4 py-3">
                    <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">{denuncia.descricao}</p>
                  </div>
                </Section>

                {(denuncia.envolvidos || denuncia.testemunhas) && (
                  <Section title="Pessoas envolvidas">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {denuncia.envolvidos && (
                        <div className="rounded-xl border border-slate-200/60 bg-slate-50/30 px-4 py-3">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-[0.05em] mb-1">Envolvidos</p>
                          <p className="text-sm font-medium text-slate-900 whitespace-pre-line">{denuncia.envolvidos}</p>
                        </div>
                      )}
                      {denuncia.testemunhas && (
                        <div className="rounded-xl border border-slate-200/60 bg-slate-50/30 px-4 py-3">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-[0.05em] mb-1">Testemunhas</p>
                          <p className="text-sm font-medium text-slate-900 whitespace-pre-line">{denuncia.testemunhas}</p>
                        </div>
                      )}
                    </div>
                  </Section>
                )}

                <Section title="Denunciante">
                  {denuncia.anonimo ? (
                    <div className="flex items-center gap-2.5 rounded-xl border border-slate-200/60 bg-slate-50/30 px-4 py-3 text-sm text-slate-600">
                      <ShieldAlert className="h-4 w-4 text-slate-400 flex-shrink-0" />
                      Denúncia anônima — identidade não coletada
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {denuncia.nome_denunciante && (
                        <DetailCard label="Nome">{denuncia.nome_denunciante}</DetailCard>
                      )}
                      {denuncia.email_denunciante && (
                        <DetailCard label="E-mail">
                          <a href={`mailto:${denuncia.email_denunciante}`} className="text-orange-600 hover:text-orange-700 font-medium truncate block">
                            {denuncia.email_denunciante}
                          </a>
                        </DetailCard>
                      )}
                      {denuncia.telefone_denunciante && (
                        <DetailCard label="Telefone">
                          <a href={`tel:${denuncia.telefone_denunciante}`} className="text-orange-600 hover:text-orange-700 font-medium">
                            {denuncia.telefone_denunciante}
                          </a>
                        </DetailCard>
                      )}
                    </div>
                  )}
                </Section>
              </div>
            )}

            {/* NOTAS */}
            {activeTab === 'notas' && (
              <div className="flex flex-col h-full">
                <div className="flex-1 overflow-y-auto p-6 space-y-3">
                  {notas.length === 0 && (
                    <DrawerEmpty icon={MessageSquare} text="Nenhuma nota interna adicionada ainda." />
                  )}
                  {notas.map(n => (
                    <div key={n.id} className="rounded-xl border border-amber-100 bg-amber-50/60 px-4 py-3.5 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-white text-xs font-bold flex-shrink-0">
                            {(n.usuario_nome || 'O').charAt(0).toUpperCase()}
                          </div>
                          <span className="text-xs font-semibold text-slate-800">{n.usuario_nome || 'Operador'}</span>
                          {n.setor && (
                            <span className="text-[10px] bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded-full font-semibold">{n.setor}</span>
                          )}
                        </div>
                        <span className="text-xs text-slate-400 flex-shrink-0">{formatDateTime(n.created_at)}</span>
                      </div>
                      <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">{n.nota}</p>
                    </div>
                  ))}
                </div>
                <div className="flex-shrink-0 border-t border-slate-200/60 bg-white p-4 space-y-2.5">
                  <textarea
                    value={novaNota}
                    onChange={e => setNovaNota(e.target.value)}
                    placeholder="Escreva uma nota interna confidencial..."
                    rows={3}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 resize-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 focus:outline-none transition-all"
                  />
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={handleAddNota}
                    disabled={!novaNota.trim() || sendingNota}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-2 text-white text-sm font-semibold shadow-sm disabled:opacity-50 transition-all"
                  >
                    {sendingNota ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Adicionar nota
                  </motion.button>
                </div>
              </div>
            )}

            {/* ANEXOS */}
            {activeTab === 'anexos' && (
              <div className="p-6 space-y-3">
                {anexos.length === 0 && (
                  <DrawerEmpty icon={Paperclip} text="Nenhum anexo foi enviado para esta denúncia." />
                )}
                {anexos.map(a => (
                  <div key={a.id} className="flex items-center gap-4 rounded-xl border border-slate-200/60 bg-white px-4 py-3.5 hover:border-orange-200 hover:shadow-sm transition-all">
                    <span className="text-2xl flex-shrink-0">{fileIcon(a.tipo_arquivo)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{a.nome_arquivo}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {a.tamanho_bytes > 0 && <span className="text-xs text-slate-400">{formatBytes(a.tamanho_bytes)}</span>}
                        <span className="text-xs text-slate-300">·</span>
                        <span className="text-xs text-slate-400">{a.enviado_por === 'interno' ? 'Interno' : 'Denunciante'}</span>
                        <span className="text-xs text-slate-300">·</span>
                        <span className="text-xs text-slate-400">{formatDate(a.created_at)}</span>
                      </div>
                    </div>
                    <a
                      href={a.url_arquivo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-orange-600 hover:border-orange-200 transition-colors"
                      title="Abrir arquivo"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                ))}
              </div>
            )}

            {/* PUBLICAÇÕES */}
            {activeTab === 'publicacoes' && (
              <div className="flex flex-col h-full">
                <div className="flex-1 overflow-y-auto p-6 space-y-3">
                  {publicacoes.length === 0 && (
                    <DrawerEmpty icon={MessageCircle} text="Nenhuma publicação ao denunciante ainda." />
                  )}
                  {publicacoes.map(p => (
                    <div key={p.id} className={`rounded-xl border px-4 py-3.5 space-y-2 ${p.visivel_denunciante ? 'bg-emerald-50/60 border-emerald-100' : 'bg-slate-50/60 border-slate-200/60'}`}>
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-700">{p.usuario_nome || 'Operador'}</span>
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${p.visivel_denunciante ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                            {p.visivel_denunciante ? <Eye className="w-2.5 h-2.5" /> : <EyeOff className="w-2.5 h-2.5" />}
                            {p.visivel_denunciante ? 'Visível' : 'Oculto'}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400">{formatDateTime(p.publicado_em)}</span>
                      </div>
                      {p.titulo && <p className="text-xs font-bold text-slate-800">{p.titulo}</p>}
                      <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">{p.mensagem}</p>
                    </div>
                  ))}
                </div>
                <div className="flex-shrink-0 border-t border-slate-200/60 bg-white p-4 space-y-2.5">
                  <input
                    type="text"
                    value={novaPublicacao.titulo}
                    onChange={e => setNovaPublicacao(p => ({ ...p, titulo: e.target.value }))}
                    placeholder="Assunto (opcional)"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 focus:outline-none transition-all"
                  />
                  <textarea
                    value={novaPublicacao.mensagem}
                    onChange={e => setNovaPublicacao(p => ({ ...p, mensagem: e.target.value }))}
                    placeholder="Mensagem ao denunciante..."
                    rows={3}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 resize-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 focus:outline-none transition-all"
                  />
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={novaPublicacao.visivel}
                        onChange={e => setNovaPublicacao(p => ({ ...p, visivel: e.target.checked }))}
                        className="w-4 h-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500/20"
                      />
                      Visível ao denunciante
                    </label>
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={handlePublicar}
                      disabled={!novaPublicacao.mensagem.trim() || sendingPub}
                      className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-2 text-white text-sm font-semibold shadow-sm disabled:opacity-50 transition-all"
                    >
                      {sendingPub ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      Publicar
                    </motion.button>
                  </div>
                </div>
              </div>
            )}

            {/* LOG */}
            {activeTab === 'log' && (
              <div className="p-6">
                {logs.length === 0 && (
                  <DrawerEmpty icon={ClipboardList} text="Nenhuma atividade registrada." />
                )}
                <div className="relative">
                  {logs.length > 1 && <div className="absolute left-[11px] top-3 bottom-3 w-px bg-slate-200" />}
                  <div className="space-y-4">
                    {logs.map((l, idx) => (
                      <div key={l.id} className="flex gap-4">
                        <div className={`flex-shrink-0 w-[22px] h-[22px] rounded-full flex items-center justify-center mt-0.5 z-10 ${idx === 0 ? 'bg-orange-100 border-2 border-orange-400' : 'bg-slate-100 border-2 border-slate-300'}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${idx === 0 ? 'bg-orange-500' : 'bg-slate-400'}`} />
                        </div>
                        <div className="flex-1 min-w-0 pb-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-slate-800 capitalize">{l.acao}</span>
                            {l.usuario_nome && <span className="text-xs text-slate-400">por {l.usuario_nome}</span>}
                            <span className="text-xs text-slate-400 ml-auto">{formatDateTime(l.created_at)}</span>
                          </div>
                          {l.detalhes && <p className="mt-0.5 text-xs text-slate-500 leading-relaxed">{l.detalhes}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}

// ─── Página Principal ──────────────────────────────────────────────────────────

const OperatorJuridico = () => {
  const navigate = useNavigate();
  const { logout, perfil } = useAuth();
  const { toast } = useToast();

  const [denuncias,     setDenuncias]     = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore,       setHasMore]       = useState(false);
  const [selected,      setSelected]      = useState(null);
  const [drawerOpen,    setDrawerOpen]    = useState(false);

  const [filterStatus,   setFilterStatus]   = useState(null);
  const [filterPriority, setFilterPriority] = useState('');
  const [filterTipo,     setFilterTipo]     = useState('');
  const [search,         setSearch]         = useState('');
  const [debouncedSearch,setDebouncedSearch]= useState('');
  const [counters,       setCounters]       = useState({ total: 0 });

  const debounceRef  = useRef(null);
  const observerRef  = useRef(null);
  const sentinelRef  = useRef(null);
  const offsetRef    = useRef(0);

  const handleLogout = async () => { await logout(); navigate('/login'); };

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 380);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  const fetchCounters = useCallback(async () => {
    const counts = { total: 0 };
    const [total, ...rest] = await Promise.all([
      supabase.from('denuncias').select('id', { count: 'exact', head: true }),
      ...STATUS_ORDER.map(s => supabase.from('denuncias').select('id', { count: 'exact', head: true }).eq('status', s)),
    ]);
    counts.total = total.count || 0;
    STATUS_ORDER.forEach((s, i) => { counts[s] = rest[i].count || 0; });
    setCounters(counts);
  }, []);

  const fetchDenuncias = useCallback(async (append = false) => {
    if (!append) { setLoading(true); offsetRef.current = 0; }
    else setIsLoadingMore(true);
    try {
      let q = supabase.from('denuncias').select('*')
        .order('created_at', { ascending: false })
        .range(offsetRef.current, offsetRef.current + PAGE_SIZE - 1);
      if (filterStatus)    q = q.eq('status', filterStatus);
      if (filterPriority)  q = q.eq('prioridade', filterPriority);
      if (filterTipo)      q = q.eq('tipo_ocorrencia', filterTipo);
      if (debouncedSearch) q = q.or(`protocolo.ilike.%${debouncedSearch}%,descricao.ilike.%${debouncedSearch}%`);
      const { data, error } = await q;
      if (error) throw error;
      const nd = data || [];
      setHasMore(nd.length === PAGE_SIZE);
      offsetRef.current += nd.length;
      setDenuncias(prev => append ? [...prev, ...nd] : nd);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Erro ao carregar denúncias', description: err.message });
    } finally { setLoading(false); setIsLoadingMore(false); }
  }, [filterStatus, filterPriority, filterTipo, debouncedSearch, toast]);

  useEffect(() => { fetchDenuncias(false); }, [fetchDenuncias]);
  useEffect(() => { fetchCounters(); }, [fetchCounters]);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !isLoadingMore) fetchDenuncias(true);
    }, { threshold: 0.1 });
    if (sentinelRef.current) observerRef.current.observe(sentinelRef.current);
    return () => observerRef.current?.disconnect();
  }, [hasMore, isLoadingMore, fetchDenuncias]);

  const handleUpdated = (updated) => {
    setDenuncias(prev => prev.map(d => d.id === updated.id ? { ...d, ...updated } : d));
    setSelected(updated);
    fetchCounters();
  };

  const closeDrawer = () => { setDrawerOpen(false); setTimeout(() => setSelected(null), 320); };
  const toggleDrawer = (d) => {
    if (selected?.id === d.id && drawerOpen) closeDrawer();
    else { setSelected(d); setDrawerOpen(true); }
  };

  const hasActiveFilters = filterStatus || filterPriority || filterTipo || search;

  const barColors = {
    nova: '#f97316',
    triagem: '#fb923c',
    em_analise: '#fdba74',
    em_investigacao: '#fb923c',
    aguardando_informacoes: '#fbbf24',
    concluida: '#fdba74',
    arquivada: '#cbd5e1',
  };

  const activeCase = selected || denuncias[0] || null;
  const activeCaseStatus = activeCase ? (STATUS_CONFIG[activeCase.status] || null) : null;
  const activeCasePriority = activeCase ? (PRIORITY_CONFIG[activeCase.prioridade] || null) : null;

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <Helmet>
        <title>Jurídico | Whistleblowing System</title>
        <meta name="description" content="Painel do operador jurídico" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
      </Helmet>

      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6 min-w-0">
          <span className="text-xl font-bold text-orange-700 tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Jurídico
          </span>
          <nav className="hidden md:flex items-center gap-6 h-16">
            <span className="text-slate-600 hover:text-orange-700 transition-colors duration-200 text-sm font-medium cursor-default" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              Denúncias
            </span>
            <span className="text-slate-500 hover:text-orange-700 transition-colors duration-200 text-sm font-medium cursor-default" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              Formulários
            </span>
            <span className="text-slate-500 hover:text-orange-700 transition-colors duration-200 text-sm font-medium cursor-default" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              Arquivos
            </span>
          </nav>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-full border border-slate-200">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              className="bg-transparent border-none focus:ring-0 text-sm w-32 lg:w-40 placeholder:text-slate-400 outline-none"
              placeholder="Pesquisar..."
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { fetchDenuncias(false); fetchCounters(); }}
            disabled={loading}
            className="p-2 text-slate-500 hover:bg-slate-50 rounded-full transition-all disabled:opacity-40"
            title="Atualizar"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </motion.button>
          <div className="h-8 w-px bg-slate-200 mx-1" />
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="text-right hidden lg:block">
              <p className="text-sm font-semibold text-orange-700">{perfil?.nome || 'Operador Jurídico'}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Operador Senior</p>
            </div>
            <div className="w-10 h-10 rounded-full border-2 border-white shadow-sm bg-gradient-to-br from-orange-400 to-orange-600 text-white text-sm font-bold flex items-center justify-center">
              {(perfil?.nome || 'J').charAt(0).toUpperCase()}
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-100 bg-red-50 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 hover:border-red-200 transition-all"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sair
          </motion.button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-8">
          <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setFilterStatus(null)}
              className={`bg-white p-6 rounded-xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all text-left ${!filterStatus ? 'ring-2 ring-orange-200/80 border-orange-200' : 'hover:border-orange-200'}`}
            >
              <div className="flex justify-between items-start mb-4">
                <span className="text-slate-500 text-[11px] font-semibold uppercase tracking-[0.06em]">Total Denúncias</span>
                <TrendingUp className="h-4 w-4 text-orange-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <h3 className="text-[36px] leading-none font-bold text-orange-700" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{counters.total ?? 0}</h3>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">canal ativo</span>
              </div>
            </motion.button>

            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setFilterStatus(filterStatus === 'nova' ? null : 'nova')}
              className={`bg-white p-6 rounded-xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all text-left ${filterStatus === 'nova' ? 'ring-2 ring-orange-200/80 border-orange-200' : 'hover:border-orange-200'}`}
            >
              <div className="flex justify-between items-start mb-4">
                <span className="text-slate-500 text-[11px] font-semibold uppercase tracking-[0.06em]">Aguardando Triagem</span>
                <Sparkles className="h-4 w-4 text-amber-500" />
              </div>
              <h3 className="text-[36px] leading-none font-bold text-orange-700" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{counters.nova ?? 0}</h3>
            </motion.button>

            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setFilterStatus(filterStatus === 'em_investigacao' ? null : 'em_investigacao')}
              className={`bg-white p-6 rounded-xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all text-left ${filterStatus === 'em_investigacao' ? 'ring-2 ring-orange-200/80 border-orange-200' : 'hover:border-orange-200'}`}
            >
              <div className="flex justify-between items-start mb-4">
                <span className="text-slate-500 text-[11px] font-semibold uppercase tracking-[0.06em]">Em Investigação</span>
                <Search className="h-4 w-4 text-orange-500" />
              </div>
              <h3 className="text-[36px] leading-none font-bold text-orange-700" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{counters.em_investigacao ?? 0}</h3>
            </motion.button>

            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setFilterStatus(filterStatus === 'concluida' ? null : 'concluida')}
              className={`bg-white p-6 rounded-xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all text-left ${filterStatus === 'concluida' ? 'ring-2 ring-orange-200/80 border-orange-200' : 'hover:border-orange-200'}`}
            >
              <div className="flex justify-between items-start mb-4">
                <span className="text-slate-500 text-[11px] font-semibold uppercase tracking-[0.06em]">Concluídas</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
              <h3 className="text-[36px] leading-none font-bold text-orange-700" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{counters.concluida ?? 0}</h3>
            </motion.button>
          </section>

          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-12 lg:col-span-8 space-y-6">
              <div className="flex flex-wrap items-center gap-3 py-2">
                <div className="relative flex-1 min-w-[220px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <input
                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all outline-none"
                    placeholder="Filtrar por ID ou Assunto..."
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                <button
                  onClick={() => setFilterStatus(null)}
                  className="flex items-center gap-2 px-3 py-2 text-slate-600 bg-white border border-slate-200 rounded-lg text-sm hover:bg-slate-50 transition-colors"
                >
                  <Clock className="h-4 w-4" />
                  <span>Período</span>
                </button>
                <div className="relative">
                  <select
                    value={filterStatus || ''}
                    onChange={e => setFilterStatus(e.target.value || null)}
                    className="appearance-none pl-3 pr-8 py-2 text-slate-600 bg-white border border-slate-200 rounded-lg text-sm hover:bg-slate-50 transition-colors"
                  >
                    <option value="">Status</option>
                    {STATUS_ORDER.map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
                  </select>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <div className="relative">
                  <select
                    value={filterPriority}
                    onChange={e => setFilterPriority(e.target.value)}
                    className="appearance-none pl-3 pr-8 py-2 text-slate-600 bg-white border border-slate-200 rounded-lg text-sm hover:bg-slate-50 transition-colors"
                  >
                    <option value="">Prioridade</option>
                    {PRIORITY_ORDER.map(p => <option key={p} value={p}>{PRIORITY_CONFIG[p].label}</option>)}
                  </select>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <div className="relative">
                  <select
                    value={filterTipo}
                    onChange={e => setFilterTipo(e.target.value)}
                    className="appearance-none pl-3 pr-8 py-2 text-slate-600 bg-white border border-slate-200 rounded-lg text-sm hover:bg-slate-50 transition-colors"
                  >
                    <option value="">Categoria</option>
                    {Object.entries(TIPO_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                {hasActiveFilters && (
                  <button
                    onClick={() => { setFilterStatus(null); setFilterPriority(''); setFilterTipo(''); setSearch(''); }}
                    className="flex items-center gap-2 px-3 py-2 text-slate-600 bg-white border border-slate-200 rounded-lg text-sm hover:bg-slate-50 transition-colors"
                  >
                    <X className="h-4 w-4" />
                    Limpar
                  </button>
                )}
              </div>

              <div className="bg-white rounded-xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100">
                        <th className="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-[0.05em]">ID</th>
                        <th className="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-[0.05em]">Assunto</th>
                        <th className="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-[0.05em]">Categoria</th>
                        <th className="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-[0.05em]">Relator</th>
                        <th className="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-[0.05em]">Data</th>
                        <th className="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-[0.05em]">Status</th>
                        <th className="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-[0.05em]">Operador</th>
                        <th className="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-[0.05em] text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {loading ? (
                        Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                      ) : denuncias.length === 0 ? (
                        <tr>
                          <td colSpan={8}>
                            <div className="flex flex-col items-center justify-center gap-3 py-16">
                              <AlertCircle className="h-12 w-12 text-slate-300" />
                              <p className="text-sm font-medium text-slate-700">Nenhuma denúncia encontrada</p>
                              <p className="text-xs text-slate-500">Altere os filtros ou aguarde novos registros</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        denuncias.map((d) => {
                          const isActiveRow = activeCase?.id === d.id;
                          const sCfg = STATUS_CONFIG[d.status] || {};
                          const assunto = (d.descricao || '').slice(0, 42);
                          return (
                            <tr
                              key={d.id}
                              onClick={() => setSelected(d)}
                              className={`hover:bg-slate-50/50 transition-colors cursor-pointer ${isActiveRow ? 'bg-orange-50/40' : ''}`}
                            >
                              <td className="px-6 py-4 font-semibold text-orange-700 text-sm">{d.protocolo || d.id}</td>
                              <td className="px-6 py-4 text-sm text-slate-700">{assunto ? `${assunto}${d.descricao?.length > 42 ? '…' : ''}` : 'Sem descrição'}</td>
                              <td className="px-6 py-4 text-sm text-slate-600">{TIPO_LABELS[d.tipo_ocorrencia] || d.tipo_ocorrencia}</td>
                              <td className="px-6 py-4 text-sm text-slate-500">{d.anonimo ? 'Anônimo' : 'Identificado'}</td>
                              <td className="px-6 py-4 text-sm text-slate-500">{formatDate(d.created_at)}</td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${sCfg.bg || 'bg-slate-100'} ${sCfg.text || 'text-slate-600'}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${sCfg.dot || 'bg-slate-500'}`} />
                                  {sCfg.label || d.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-600">{perfil?.nome || 'Jurídico'}</td>
                              <td className="px-6 py-4 text-right">
                                <button
                                  onClick={e => { e.stopPropagation(); setSelected(d); setDrawerOpen(true); }}
                                  className="text-slate-400 hover:text-orange-600"
                                  title="Abrir detalhes"
                                >
                                  <MoreVertical className="h-5 w-5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="px-6 py-4 bg-slate-50/40 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
                  <span className="text-sm text-slate-500 font-medium">
                    Exibindo <span className="font-semibold text-slate-700">{denuncias.length}</span> de <span className="font-semibold text-slate-700">{(counters.total ?? 0).toLocaleString('pt-BR')}</span> denúncias
                  </span>
                  <div ref={sentinelRef} className="flex items-center h-5">
                    {isLoadingMore && (
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                        <span>Carregando...</span>
                      </div>
                    )}
                  </div>
                </div>
            </div>
            </div>
            <div className="col-span-12 lg:col-span-4 space-y-6">
              <div className="bg-white rounded-xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] h-full flex flex-col min-h-[520px]">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center gap-3">
                  <div>
                    <h4 className="text-[18px] font-semibold text-orange-700" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                      {activeCase ? `Caso ${activeCase.protocolo}` : 'Selecione um caso'}
                    </h4>
                    <p className="text-xs text-slate-400">
                      {activeCase ? `Criado em ${formatDateTime(activeCase.created_at)}` : 'Clique em uma linha da tabela para visualizar'}
                    </p>
                  </div>
                  {activeCase && (
                    <button
                      onClick={() => setDrawerOpen(true)}
                      className="p-2 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-orange-600"
                      title="Abrir painel completo"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {activeCase ? (
                    <>
                      <div className="space-y-3">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Descrição do Relato</label>
                        <p className="text-sm text-slate-600 leading-relaxed bg-slate-50/50 p-4 rounded-lg border border-slate-100 whitespace-pre-line">
                          {activeCase.descricao || 'Sem descrição informada.'}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Status</label>
                          <div className={`w-full text-xs font-medium rounded-lg px-3 py-2 border ${activeCaseStatus?.bg || 'bg-slate-50'} ${activeCaseStatus?.text || 'text-slate-600'} border-slate-200`}>
                            {activeCaseStatus?.label || activeCase.status}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Prioridade</label>
                          <div className={`w-full text-xs font-medium rounded-lg px-3 py-2 border ${activeCasePriority?.bg || 'bg-slate-50'} ${activeCasePriority?.text || 'text-slate-600'} border-slate-200`}>
                            {activeCasePriority?.label || activeCase.prioridade}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Linha do Tempo</label>
                        <div className="space-y-4 relative before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-px before:bg-slate-100">
                          <div className="relative pl-8">
                            <div className="absolute left-0 top-1 w-5 h-5 rounded-full bg-orange-100 border-4 border-white" />
                            <p className="text-xs font-semibold text-slate-700">Denúncia Recebida</p>
                            <p className="text-[10px] text-slate-400">{formatDateTime(activeCase.created_at)}</p>
                          </div>
                          <div className="relative pl-8">
                            <div className="absolute left-0 top-1 w-5 h-5 rounded-full bg-slate-100 border-4 border-white" />
                            <p className="text-xs font-semibold text-slate-700">Status Atual</p>
                            <p className="text-[10px] text-slate-400">{activeCaseStatus?.label || activeCase.status}</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Ações</label>
                        <button
                          onClick={() => setDrawerOpen(true)}
                          className="w-full px-4 py-2.5 bg-orange-600 text-white font-semibold text-sm rounded-lg hover:bg-orange-700 transition-all active:scale-95 shadow-lg shadow-orange-600/20"
                        >
                          Abrir Fluxo Completo
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-sm text-slate-500">Nenhum caso carregado.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <footer className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch pt-2">
            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col">
              <h5 className="text-[11px] font-semibold tracking-[0.08em] uppercase text-slate-500 mb-6">Distribuição por Status</h5>
              <div className="flex-1 flex items-end justify-between gap-3 px-2 pb-2 min-h-[160px]">
                {STATUS_ORDER.map(s => {
                  const count = counters[s] || 0;
                  const maxCount = Math.max(...STATUS_ORDER.map(st => counters[st] || 0), 1);
                  const heightPct = Math.max((count / maxCount) * 100, 10);
                  return (
                    <button
                      key={s}
                      className="flex-1 flex flex-col items-center gap-2"
                      onClick={() => setFilterStatus(filterStatus === s ? null : s)}
                    >
                      <div
                        className={`w-full rounded-t transition-all ${filterStatus === s ? 'ring-2 ring-orange-300' : ''}`}
                        style={{ height: `${heightPct}%`, backgroundColor: barColors[s] }}
                      />
                      <span className="text-[10px] text-slate-400 font-semibold uppercase truncate w-full">
                        {STATUS_CONFIG[s].label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex items-center gap-6">
              <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center">
                <Scale className="h-8 w-8 text-orange-600" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-[18px] font-semibold text-orange-700" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                  {(counters.nova || 0) > 0 ? 'Ação pendente' : 'Tudo em ordem'}
                </p>
                <p className="text-sm text-slate-500">
                  {(counters.nova || 0) > 0
                    ? `Você possui ${counters.nova} denúncia${counters.nova !== 1 ? 's' : ''} aguardando triagem inicial.`
                    : 'Nenhuma denúncia pendente de ação imediata crítica no seu radar hoje.'}
                </p>
              </div>
              <button
                onClick={() => setFilterStatus('nova')}
                className="px-5 py-3 bg-orange-600 text-white font-semibold text-sm rounded-lg hover:bg-orange-700 transition-all active:scale-95 shadow-lg shadow-orange-600/20"
              >
                Ver Próxima Ação
              </button>
            </div>
          </footer>
        </main>
      </div>

      {/* ── Drawer ── */}
      <AnimatePresence>
        {drawerOpen && selected && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={closeDrawer}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            />
            <DenunciaDrawer
              key={selected.id}
              denuncia={selected}
              onClose={closeDrawer}
              onUpdated={handleUpdated}
              perfil={perfil}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OperatorJuridico;