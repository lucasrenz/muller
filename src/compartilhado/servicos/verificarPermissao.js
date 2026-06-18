/**
 * Utilitários de verificação de permissão
 * Compatível com o sistema de tipos existente no banco: financeiro, rh, juridico
 */

/** Rota padrão conforme tipo de usuário */
export const getDefaultRouteByRole = (tipo) => {
  const tipoNormalizado = normalizeUserType(tipo);
  switch (tipoNormalizado) {
    case 'admin':      return '/cartao/painel';
    case 'rh':         return '/vagas/painel';
    case 'financeiro': return '/cartao/painel';
    case 'juridico':   return '/denuncias/painel';
    default:           return '/cartao/login';
  }
};

/** Login padrão conforme tipo de usuário */
export const getLoginRouteByRole = (tipo) => {
  const tipoNormalizado = normalizeUserType(tipo);
  switch (tipoNormalizado) {
    case 'rh':         return '/vagas/login';
    case 'financeiro': return '/cartao/login';
    case 'juridico':   return '/denuncias/login';
    default:           return '/cartao/login';
  }
};

/** Verifica se o usuário tem permissão para o tipo/role requerido */
export const hasRoutePermission = (userType, requiredType) => {
  const userTypeNorm = normalizeUserType(userType);
  if (!userTypeNorm) return false;
  if (userTypeNorm === 'admin') return true;

  if (Array.isArray(requiredType)) {
    return requiredType.map(normalizeUserType).includes(userTypeNorm);
  }

  return userTypeNorm === normalizeUserType(requiredType);
};

/** Verifica se o tipo de usuário tem acesso ao módulo */
export const temAcessoAoModulo = (tipo, modulo) => {
  const tipoNormalizado = normalizeUserType(tipo);
  if (!tipoNormalizado) return false;
  if (tipoNormalizado === 'admin') return true;

  const mapa = {
    cartao:    ['financeiro'],
    denuncias: ['juridico'],
    vagas:     ['rh'],
    principal: ['financeiro', 'rh', 'juridico'],
    admin:     ['admin'],
  };
  return (mapa[modulo] || []).includes(tipoNormalizado);
};

export const isRH         = (tipo) => tipo === 'rh';
export const isFinanceiro = (tipo) => tipo === 'financeiro';
export const isJuridico   = (tipo) => tipo === 'juridico';
export const normalizeUserType  = (tipo) => (tipo || '').toLowerCase().trim();
export const normalizarTipo     = normalizeUserType;
