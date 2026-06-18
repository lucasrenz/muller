/**
 * Utilitários de autenticação e autorização
 * Mantido para retrocompatibilidade — novos arquivos usem:
 * @/compartilhado/servicos/verificarPermissao
 */

export const getDefaultRouteByRole = (userType) => {
  const tipoNormalizado = normalizeUserType(userType);
  switch (tipoNormalizado) {
    case 'admin':      return '/cartao/painel';
    case 'rh':         return '/vagas/painel';
    case 'financeiro': return '/cartao/painel';
    case 'juridico':   return '/denuncias/painel';
    default:           return '/cartao/login';
  }
};

export const hasRoutePermission = (userType, requiredType) => {
  const userTypeNorm = normalizeUserType(userType);
  if (!userTypeNorm) return false;
  if (userTypeNorm === 'admin') return true;

  if (Array.isArray(requiredType)) {
    return requiredType.map(normalizeUserType).includes(userTypeNorm);
  }

  return userTypeNorm === normalizeUserType(requiredType);
};

export const isRH         = (userType) => userType === 'rh';
export const isFinanceiro = (userType) => userType === 'financeiro';
export const normalizeUserType = (userType) => (userType || '').toLowerCase().trim();
