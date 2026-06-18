import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, MessageCircle, CheckCircle2, XCircle, Mail, Phone, MapPin, Briefcase, Building2, Calendar, AlertCircle, UserCheck, MoreVertical } from 'lucide-react';
import { normalizarRespostas } from '../lib/respostasUtils';
import { getNormalizedCandidateStatus, statusColorsConfig } from '../lib/candidateStatusUtils';

const CandidateDrawer = ({
  isOpen,
  candidato,
  onClose,
  onToggleTalentBank,
  onChangeStatus,
  onWhatsApp,
}) => {
  const [actionsOpen, setActionsOpen] = useState(false);
  const actionsButtonRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        actionsOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        !actionsButtonRef.current?.contains(event.target)
      ) {
        setActionsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [actionsOpen]);

  if (!candidato) return null;

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatPhone = (phone) => {
    if (!phone) return '-';
    return phone.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3');
  };

  // Configuração visual dos status (cores alinhadas com KPIGrid)
  const statusColors = statusColorsConfig;

  // Normalizar respostas para suportar ambos os formatos (antigo e novo)
  // Primeiro tenta usar normalizarRespostas, depois fallback manual se necessário
  let respostas = [];
  try {
    if (candidato.vagas?.questionarios?.estrutura_json) {
      respostas = normalizarRespostas(
        candidato.respostas_json,
        candidato.vagas.questionarios
      );
    } else {
      // Fallback se não houver questionário - apenas parse básico
      const parsed = typeof candidato.respostas_json === 'string'
        ? JSON.parse(candidato.respostas_json)
        : candidato.respostas_json;

      if (Array.isArray(parsed)) {
        respostas = parsed;
      } else if (typeof parsed === 'object' && parsed !== null) {
        // Formato antigo plano - converter para array
        respostas = Object.entries(parsed).map(([pergunta, resposta], idx) => ({
          id: pergunta,
          pergunta: pergunta,
          tipo: Array.isArray(resposta) ? 'checkbox' : 'text',
          resposta
        }));
      }
    }
  } catch (error) {
    console.error('Erro ao normalizar respostas:', error);
    respostas = [];
  }

  const toggleActions = () => {
    setActionsOpen((current) => !current);
  };

  const handleAction = (status) => {
    onChangeStatus(candidato.id, status);
    setActionsOpen(false);
  };

  const renderRespostaValue = (value) => {
    if (Array.isArray(value)) {
      return value.length > 0 ? value.join(', ') : '-';
    }
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value);
    }
    return value ?? '-';
  };

  const normalizedStatus = getNormalizedCandidateStatus(candidato);
  const statusConfig = statusColors[normalizedStatus];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: 500, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 500, opacity: 0 }}
            transition={{ duration: 0.3, type: 'spring', damping: 25 }}
            className="fixed right-0 top-5 bottom-5 z-50 w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl flex flex-col"
          >
            {/* Header - Fixo */}
            <div className="sticky top-0 z-10 border-b border-slate-200/60 bg-white/95 backdrop-blur-sm flex-shrink-0">
              <div className="flex items-start justify-between gap-4 p-6">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 text-white font-semibold text-lg flex-shrink-0">
                        {candidato.nome_completo?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-lg font-bold text-slate-900 truncate">
                          {candidato.nome_completo}
                        </h2>
                        <p className="text-xs text-slate-600 truncate">{candidato.cpf}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusConfig.bg} ${statusConfig.text} whitespace-nowrap`}>
                        {statusConfig.label}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 whitespace-nowrap">
                        Score: {candidato.score || 0}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => onWhatsApp(candidato.telefone_1)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors flex-shrink-0"
                    title="Enviar WhatsApp"
                  >
                    <MessageCircle className="h-5 w-5" />
                  </button>

                  <div className="relative" ref={menuRef}>
                    <button
                      type="button"
                      ref={actionsButtonRef}
                      onClick={toggleActions}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors flex-shrink-0"
                      title="Ações"
                    >
                      <MoreVertical className="h-5 w-5" />
                    </button>

                    {actionsOpen && (
                      <div className="absolute right-0 top-full z-20 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                        <div className="flex flex-col p-1">
                          <button
                            type="button"
                            onClick={() => handleAction('em_analise')}
                            className="text-left rounded-xl px-4 py-2.5 text-sm text-slate-700 hover:bg-orange-50 hover:text-orange-700 transition-colors"
                          >
                            Mover para análise
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAction('aprovado')}
                            className="text-left rounded-xl px-4 py-2.5 text-sm text-slate-700 hover:bg-green-50 hover:text-green-700 transition-colors"
                          >
                            Aprovar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAction('reprovado')}
                            className="text-left rounded-xl px-4 py-2.5 text-sm text-slate-700 hover:bg-red-50 hover:text-red-700 transition-colors"
                          >
                            Reprovar
                          </button>
                          <div className="border-t border-slate-100 my-1" />
                          <button
                            type="button"
                            onClick={() => {
                              onToggleTalentBank(candidato.id, true);
                              setActionsOpen(false);
                            }}
                            className="text-left rounded-xl px-4 py-2.5 text-sm text-slate-700 hover:bg-purple-50 hover:text-purple-700 transition-colors"
                          >
                            Banco de talentos
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAction('contratado')}
                            className="text-left rounded-xl px-4 py-2.5 text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                          >
                            Marcar como contratado
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors flex-shrink-0"
                    title="Fechar"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Conteúdo - Com Overflow */}
            <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
              <div className="space-y-6 p-6">
                {/* Dados Pessoais */}
                <section>
                  <h3 className="mb-4 text-sm font-semibold text-slate-900 uppercase tracking-[0.1em]">
                    Dados Pessoais
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="rounded-lg border border-slate-200/60 bg-slate-50/30 px-4 py-3 min-w-0">
                      <p className="text-xs font-medium text-slate-600 uppercase tracking-[0.05em]">Email</p>
                      <a
                        href={`mailto:${candidato.email}`}
                        className="mt-1 flex items-center gap-2 text-sm font-medium text-orange-600 hover:text-orange-700 truncate"
                        title={candidato.email}
                      >
                        <Mail className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{candidato.email}</span>
                      </a>
                    </div>

                    <div className="rounded-lg border border-slate-200/60 bg-slate-50/30 px-4 py-3 min-w-0">
                      <p className="text-xs font-medium text-slate-600 uppercase tracking-[0.05em]">Telefone</p>
                      <a
                        href={`tel:${candidato.telefone_1}`}
                        className="mt-1 flex items-center gap-2 text-sm font-medium text-orange-600 hover:text-orange-700"
                      >
                        <Phone className="h-4 w-4 flex-shrink-0" />
                        {formatPhone(candidato.telefone_1)}
                      </a>
                    </div>

                    <div className="rounded-lg border border-slate-200/60 bg-slate-50/30 px-4 py-3 min-w-0">
                      <p className="text-xs font-medium text-slate-600 uppercase tracking-[0.05em]">Data de Nascimento</p>
                      <p className="mt-1 text-sm font-medium text-slate-900 truncate">
                        {formatDate(candidato.data_nascimento)}
                      </p>
                    </div>

                    <div className="rounded-lg border border-slate-200/60 bg-slate-50/30 px-4 py-3 min-w-0">
                      <p className="text-xs font-medium text-slate-600 uppercase tracking-[0.05em]">Cidade</p>
                      <p className="mt-1 flex items-center gap-2 text-sm font-medium text-slate-900 truncate">
                        <MapPin className="h-4 w-4 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{candidato.cidade}</span>
                      </p>
                    </div>

                    <div className="rounded-lg border border-slate-200/60 bg-slate-50/30 px-4 py-3 min-w-0">
                      <p className="text-xs font-medium text-slate-600 uppercase tracking-[0.05em]">Disponibilidade</p>
                      <p className="mt-1 text-sm font-medium text-slate-900 truncate">
                        {candidato.disponibilidade_horario}
                      </p>
                    </div>

                    <div className="rounded-lg border border-slate-200/60 bg-slate-50/30 px-4 py-3 min-w-0">
                      <p className="text-xs font-medium text-slate-600 uppercase tracking-[0.05em]">Como conheceu</p>
                      <p className="mt-1 text-sm font-medium text-slate-900 truncate">
                        {candidato.como_conheceu}
                      </p>
                    </div>
                  </div>
                </section>

                {/* Dados da Candidatura */}
                <section>
                  <h3 className="mb-4 text-sm font-semibold text-slate-900 uppercase tracking-[0.1em]">
                    Dados da Candidatura
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {candidato.cargos && (
                      <div className="rounded-lg border border-slate-200/60 bg-slate-50/30 px-4 py-3 min-w-0">
                        <p className="text-xs font-medium text-slate-600 uppercase tracking-[0.05em]">Cargo</p>
                        <p className="mt-1 flex items-center gap-2 text-sm font-medium text-slate-900 truncate">
                          <Briefcase className="h-4 w-4 text-slate-400 flex-shrink-0" />
                          <span className="truncate">{candidato.cargos.nome}</span>
                        </p>
                      </div>
                    )}

                    {candidato.lojas && (
                      <div className="rounded-lg border border-slate-200/60 bg-slate-50/30 px-4 py-3 min-w-0">
                        <p className="text-xs font-medium text-slate-600 uppercase tracking-[0.05em]">Loja</p>
                        <p className="mt-1 flex items-center gap-2 text-sm font-medium text-slate-900 truncate">
                          <Building2 className="h-4 w-4 text-slate-400 flex-shrink-0" />
                          <span className="truncate">{candidato.lojas.nome}</span>
                        </p>
                      </div>
                    )}

                    <div className="rounded-lg border border-slate-200/60 bg-slate-50/30 px-4 py-3 min-w-0">
                      <p className="text-xs font-medium text-slate-600 uppercase tracking-[0.05em]">Data de Cadastro</p>
                      <p className="mt-1 flex items-center gap-2 text-sm font-medium text-slate-900">
                        <Calendar className="h-4 w-4 text-slate-400 flex-shrink-0" />
                        {formatDate(candidato.created_at)}
                      </p>
                    </div>

                    <div className="rounded-lg border border-slate-200/60 bg-slate-50/30 px-4 py-3 min-w-0">
                      <p className="text-xs font-medium text-slate-600 uppercase tracking-[0.05em]">Score</p>
                      <p className="mt-1 text-sm font-bold text-orange-600">
                        {candidato.score || 0}%
                      </p>
                    </div>
                  </div>
                </section>

                {/* Respostas do Formulário */}
                <section>
                  <h3 className="mb-4 text-sm font-semibold text-slate-900 uppercase tracking-[0.1em]">
                    Respostas do formulário
                  </h3>
                  <div className="space-y-3">
                    {respostas.length > 0 ? (
                      respostas.map((resposta, idx) => (
                        <div key={idx} className="rounded-lg border border-slate-200/60 bg-slate-50/30 px-4 py-3">
                          <p className="text-xs font-medium text-slate-600 uppercase tracking-[0.05em]">
                            {resposta.pergunta || resposta.label || `Pergunta ${idx + 1}`}
                          </p>
                          <p className="mt-2 break-words text-sm text-slate-900 whitespace-pre-wrap">
                            {renderRespostaValue(resposta.resposta)}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-lg border border-slate-200/60 bg-slate-50/30 px-4 py-6 text-center">
                        <p className="text-sm text-slate-600">Nenhuma resposta de formulário encontrada.</p>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CandidateDrawer;
