import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Sparkles, CheckCircle2, XCircle, Clock, Award, UserCheck } from 'lucide-react';
import { KPI_CALCULATIONS } from '../lib/candidateStatusUtils';

const KPIGrid = ({
  inscricoes,
  selectedFilter,
  onFilterChange
}) => {
  // Calcular indicadores a partir dos dados reais usando funções centralizadas
  const total = KPI_CALCULATIONS.total(inscricoes);
  const novas = KPI_CALCULATIONS.novas(inscricoes);
  const analise = KPI_CALCULATIONS.analise(inscricoes);
  const aprovados = KPI_CALCULATIONS.aprovado(inscricoes);
  const reprovados = KPI_CALCULATIONS.reprovado(inscricoes);
  const bancoTalentos = KPI_CALCULATIONS.banco(inscricoes);
  const contratados = KPI_CALCULATIONS.contratado(inscricoes);

  const kpis = [
    {
      id: 'total',
      label: 'Total de Candidaturas',
      value: total,
      icon: TrendingUp,
      color: 'from-blue-500/20 to-blue-600/20',
      textColor: 'text-blue-700',
      borderColor: 'border-blue-200',
    },
    {
      id: 'novas',
      label: 'Novas',
      value: novas,
      icon: Sparkles,
      color: 'from-emerald-500/20 to-emerald-600/20',
      textColor: 'text-emerald-700',
      borderColor: 'border-emerald-200',
    },
    {
      id: 'analise',
      label: 'Analise',
      value: analise,
      icon: Clock,
      color: 'from-amber-500/20 to-amber-600/20',
      textColor: 'text-amber-700',
      borderColor: 'border-amber-200',
    },
    {
      id: 'aprovado',
      label: 'Aprovados',
      value: aprovados,
      icon: CheckCircle2,
      color: 'from-green-500/20 to-green-600/20',
      textColor: 'text-green-700',
      borderColor: 'border-green-200',
    },
    {
      id: 'reprovado',
      label: 'Reprovados',
      value: reprovados,
      icon: XCircle,
      color: 'from-red-500/20 to-red-600/20',
      textColor: 'text-red-700',
      borderColor: 'border-red-200',
    },
    {
      id: 'banco_talentos',
      label: 'Banco',
      value: bancoTalentos,
      icon: Award,
      color: 'from-purple-500/20 to-purple-600/20',
      textColor: 'text-purple-700',
      borderColor: 'border-purple-200',
    },
    {
      id: 'contratado',
      label: 'Contratados',
      value: contratados,
      icon: UserCheck,
      color: 'from-emerald-500/20 to-emerald-600/20',
      textColor: 'text-emerald-700',
      borderColor: 'border-emerald-200',
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          const isSelected = selectedFilter === kpi.id;

          return (
            <motion.button
              key={kpi.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onFilterChange(isSelected ? null : kpi.id)}
              className={`relative overflow-hidden rounded-xl border p-3 transition-all ${
                isSelected
                  ? `${kpi.borderColor} bg-gradient-to-br ${kpi.color} ring-1 ring-offset-1`
                  : `border-slate-200/60 bg-white hover:border-slate-300/60 hover:shadow-sm`
              }`}
            >
              <div className="relative z-10 flex items-center gap-2">
                <Icon className={`h-4 w-4 ${kpi.textColor} flex-shrink-0`} />
                <div className="text-left min-w-0 flex-1">
                  <p className="text-xs font-medium text-slate-600 uppercase tracking-[0.05em] leading-tight">
                    {kpi.label}
                  </p>
                  <p className={`text-lg font-bold ${kpi.textColor} leading-tight`}>
                    {kpi.value}
                  </p>
                </div>
              </div>

              {/* Efeito de fundo sutil */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${kpi.color} opacity-0 transition-opacity ${
                  isSelected ? 'opacity-20' : ''
                }`}
              />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default KPIGrid;
