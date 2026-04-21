// Utilitários para normalização de status de candidatos
// Centraliza a lógica de mapeamento visual de status

/**
 * REGRA DE PRIORIDADE ABSOLUTA:
 * 1. Se candidate.banco_talentos === true → status final = "banco"
 * 2. Senão, classificar pelo campo status usando mapa normalizado
 * 
 * Essa função retorna o status efetivo que deve ser usado para TUDO:
 * - Exibição visual na UI
 * - Cálculo de KPIs
 * - Aplicação de filtros
 * - Decisão de qual categoria mostrar
 */
export const getEffectiveCandidateStatus = (candidate) => {
  // REGRA 1: Banco tem prioridade absoluta
  if (candidate?.banco_talentos === true) {
    return 'banco';
  }

  // REGRA 2: Se não estiver no banco, normalizar pelo status
  const status = (candidate?.status || '').toLowerCase().trim();
  
  // Mapa de normalização
  const statusMap = {
    'novo': 'novas',
    'nova': 'novas',
    'em_analise': 'analise',
    'em análise': 'analise',
    'analise': 'analise',
    'análise': 'analise',
    'pendente': 'analise',
    'aprovado': 'aprovado',
    'reprovado': 'reprovado',
    'banco': 'banco', // Fallback se status for "banco" (mas banco_talentos deve ser true)
    'contratado': 'contratado',
  };

  return statusMap[status] || 'analise';
};

/**
 * Normaliza o status visual de um candidato (alias para getEffectiveCandidateStatus)
 * Mantido para compatibilidade com código existente
 * @deprecated Use getEffectiveCandidateStatus() ao invés
 */
export const getNormalizedCandidateStatus = (candidate) => {
  return getEffectiveCandidateStatus(candidate);
};

/**
 * Funções centralizadas de cálculo de KPIs
 * IMPORTANTE: Todas usam getEffectiveCandidateStatus() para respeitar prioridade de banco
 */
export const KPI_CALCULATIONS = {
  total: (candidatos) => candidatos.length,
  
  novas: (candidatos) => candidatos.filter(i => {
    // Novas: status 'novas' (novo normalizado) mas NÃO no banco de talentos
    return getEffectiveCandidateStatus(i) === 'novas';
  }).length,
  
  analise: (candidatos) => candidatos.filter(i => {
    // Análise: status 'analise' mas NÃO no banco de talentos
    // Se estiver no banco, getEffectiveCandidateStatus() retorna 'banco', não 'analise'
    return getEffectiveCandidateStatus(i) === 'analise';
  }).length,
  
  aprovado: (candidatos) => candidatos.filter(i => 
    getEffectiveCandidateStatus(i) === 'aprovado'
  ).length,
  
  reprovado: (candidatos) => candidatos.filter(i => 
    getEffectiveCandidateStatus(i) === 'reprovado'
  ).length,
  
  banco: (candidatos) => candidatos.filter(i => 
    getEffectiveCandidateStatus(i) === 'banco'
  ).length,
  
  contratado: (candidatos) => candidatos.filter(i => 
    getEffectiveCandidateStatus(i) === 'contratado'
  ).length,
};

/**
 * Funções centralizadas de filtro KPI
 * IMPORTANTE: Todas usam getEffectiveCandidateStatus() para respeitar prioridade de banco
 */
export const KPI_FILTERS = {
  total: (candidato) => true, // Todas as candidaturas
  
  novas: (candidato) => 
    getEffectiveCandidateStatus(candidato) === 'novas',
  
  analise: (candidato) => 
    getEffectiveCandidateStatus(candidato) === 'analise',
  
  aprovado: (candidato) => 
    getEffectiveCandidateStatus(candidato) === 'aprovado',
  
  reprovado: (candidato) => 
    getEffectiveCandidateStatus(candidato) === 'reprovado',
  
  banco_talentos: (candidato) => 
    getEffectiveCandidateStatus(candidato) === 'banco',
  
  contratado: (candidato) => 
    getEffectiveCandidateStatus(candidato) === 'contratado',
};

/**
 * Configuração visual dos badges de status (cores alinhadas com KPIGrid)
 */
export const statusBadgeConfig = {
  'novas': {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    label: 'Nova',
    icon: 'Sparkles'
  },
  'analise': {
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    label: 'Analise',
    icon: 'AlertCircle'
  },
  'aprovado': {
    bg: 'bg-green-100',
    text: 'text-green-700',
    label: 'Aprovado',
    icon: 'CheckCircle'
  },
  'reprovado': {
    bg: 'bg-red-100',
    text: 'text-red-700',
    label: 'Reprovado',
    icon: 'XCircle'
  },
  'banco': {
    bg: 'bg-purple-100',
    text: 'text-purple-700',
    label: 'Banco',
    icon: 'Heart'
  },
  'contratado': {
    bg: 'bg-emerald-100',
    text: 'text-emerald-700',
    label: 'Contratado',
    icon: 'UserCheck'
  },
};

/**
 * Configuração visual dos status para drawers/cards (cores mais escuras)
 */
export const statusColorsConfig = {
  'novas': { bg: 'bg-blue-100', text: 'text-blue-900', label: 'Nova' },
  'analise': { bg: 'bg-amber-100', text: 'text-amber-900', label: 'Analise' },
  'aprovado': { bg: 'bg-green-100', text: 'text-green-900', label: 'Aprovado' },
  'reprovado': { bg: 'bg-red-100', text: 'text-red-900', label: 'Reprovado' },
  'banco': { bg: 'bg-purple-100', text: 'text-purple-900', label: 'Banco' },
  'contratado': { bg: 'bg-emerald-100', text: 'text-emerald-900', label: 'Contratado' },
};