import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Clock, Users, ChevronRight } from 'lucide-react';

const VagaCard = ({ vaga, onVerVaga }) => {
  const formatarTempoPublicacao = (dataCriacao) => {
    const agora = new Date();
    const criacao = new Date(dataCriacao);

    // Normalizar para início do dia para evitar problemas de timezone e hora
    const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
    const diaCriacao = new Date(criacao.getFullYear(), criacao.getMonth(), criacao.getDate());

    // Calcular diferença em dias
    const diffMs = hoje - diaCriacao;
    const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    // Garantir que não seja negativo (proteção contra problemas de timezone)
    const diasPassados = Math.max(0, diffDias);

    if (diasPassados === 0) return 'Publicado hoje';
    if (diasPassados === 1) return 'Publicado ontem';
    if (diasPassados < 7) return `Publicado há ${diasPassados} dias`;
    if (diasPassados < 30) {
      const semanas = Math.floor(diasPassados / 7);
      return `Publicado há ${semanas} semana${semanas > 1 ? 's' : ''}`;
    }
    const meses = Math.floor(diasPassados / 30);
    return `Publicado há ${meses} mês${meses > 1 ? 'es' : ''}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-xl transition-all duration-300"
    >
      {/* Gradiente de fundo sutil */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="relative">
        {/* Header com cargo e status */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-slate-900 truncate mb-1">
              {vaga.cargos?.nome || 'Cargo não informado'}
            </h3>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{vaga.lojas?.cidade || 'Cidade não informada'}</span>
            </div>
          </div>

          <div className="flex-shrink-0 ml-4">
            <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
              Ativa
            </span>
          </div>
        </div>

        {/* Informações adicionais */}
        <div className="flex items-center justify-between text-sm text-slate-500 mb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{vaga.quantidade || 1} vaga{vaga.quantidade !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{formatarTempoPublicacao(vaga.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Loja */}
        <div className="text-sm text-slate-700 mb-4">
          <span className="font-medium">{vaga.lojas?.nome || 'Loja não informada'}</span>
        </div>

        {/* Botão */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onVerVaga(vaga)}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-3 text-white font-semibold text-sm shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all duration-300"
        >
          Ver vaga
          <ChevronRight className="h-4 w-4" />
        </motion.button>
      </div>
    </motion.div>
  );
};

export default VagaCard;