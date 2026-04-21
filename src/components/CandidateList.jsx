import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye,
  MessageCircle,
  Star,
  ThumbsUp,
  ThumbsDown,
  Heart,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  UserCheck,
} from 'lucide-react';
import { getNormalizedCandidateStatus, statusBadgeConfig } from '../lib/candidateStatusUtils';

const CandidateList = ({
  candidatos,
  isLoading,
  onViewDetails,
  onWhatsApp,
  onChangeStatus,
  onToggleTalentBank,
  onReject,
}) => {
  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          <p className="text-slate-600 font-medium">Carregando candidaturas...</p>
        </div>
      </div>
    );
  }

  if (!candidatos || candidatos.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 py-12">
          <AlertCircle className="h-12 w-12 text-slate-400" />
          <div className="text-center">
            <p className="text-sm font-medium text-slate-900">
              Nenhuma candidatura encontrada
            </p>
            <p className="text-xs text-slate-600 mt-1">
              Altere os filtros ou aguarde novas candidaturas
            </p>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    });
  };

  const getScoreColor = (score) => {
    if (!score) return 'bg-slate-200';
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getInitial = (name) => {
    return name?.charAt(0).toUpperCase() || '?';
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 overflow-visible">
      <div className="overflow-x-auto rounded-xl border border-slate-200/60 bg-white shadow-sm overflow-visible">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200/60 bg-slate-50/50">
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-[0.05em]">
                Candidato
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-[0.05em]">
                Contato
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-[0.05em]">
                Cargo
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-[0.05em]">
                Loja
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-[0.05em]">
                Data
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-[0.05em]">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-[0.05em]">
                Score
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-slate-700 uppercase tracking-[0.05em]">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/60">
            {candidatos.map((candidato, idx) => {
              const normalizedStatus = getNormalizedCandidateStatus(candidato);
              const statusConfig = statusBadgeConfig[normalizedStatus];

              return (
                <motion.tr
                  key={candidato.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2, delay: idx * 0.02 }}
                  className="hover:bg-slate-50/50 transition-colors group"
                >
                  {/* Candidato */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 text-white font-semibold text-sm">
                        {getInitial(candidato.nome_completo)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {candidato.nome_completo}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {candidato.cpf}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Contato */}
                  <td className="px-6 py-4">
                    <div className="space-y-0.5">
                      <p className="text-sm text-slate-900">
                        {candidato.email}
                      </p>
                      <p className="text-xs text-slate-600">
                        {candidato.telefone_1}
                      </p>
                    </div>
                  </td>

                  {/* Cargo */}
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-slate-900">
                      {candidato.cargos?.nome || '-'}
                    </p>
                  </td>

                  {/* Loja */}
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-900">
                      {candidato.lojas?.nome || '-'}
                    </p>
                  </td>

                  {/* Data */}
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-600">
                      {formatDate(candidato.created_at)}
                    </p>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {React.createElement(statusConfig.icon, { className: "h-4 w-4" })}
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusConfig.bg} ${statusConfig.text}`}>
                        {statusConfig.label}
                      </span>
                    </div>
                  </td>

                  {/* Score */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-6 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className={`h-full transition-all ${getScoreColor(candidato.score)}`}
                          style={{ width: `${Math.min(candidato.score || 0, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-slate-700">
                        {candidato.score || 0}%
                      </span>
                    </div>
                  </td>

                  {/* Ações */}
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {/* Botão WhatsApp */}
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onWhatsApp(candidato.telefone_1)}
                        title="WhatsApp"
                        className="p-2 rounded-lg text-slate-600 hover:text-green-600 hover:bg-green-50 transition-colors"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </motion.button>

                      {/* Botão Ver Detalhes (Olho) */}
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onViewDetails(candidato.id)}
                        title="Ver detalhes"
                        className="p-2 rounded-lg text-slate-600 hover:text-orange-600 hover:bg-orange-50 transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                      </motion.button>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Rodapé com info */}
      <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
        <p>
          Exibindo <span className="font-semibold">{candidatos.length}</span> candidato(s)
        </p>
      </div>
    </div>
  );
};

export default CandidateList;
