/**
 * Utilitários de autenticação e autorização
 */

/**
 * Retorna a rota padrão conforme o tipo de usuário
 * @param {string} userType - Tipo do usuário: 'rh' ou 'financeiro'
 * @returns {string} Rota padrão para o tipo de usuário
 */
export const getDefaultRouteByRole = (userType) => {
  switch (userType) {
    case 'rh':
      return '/operator-rh';
    case 'financeiro':
      return '/operator-dashboard';
    case 'juridico':
      return '/operator-juridico';
    default:
      return '/login';
  }
};

/**
 * Verifica se um usuário tem permissão para acessar uma rota
 * @param {string} userType - Tipo do usuário
 * @param {string} requiredType - Tipo requerido para a rota (ou array de tipos)
 * @returns {boolean} Se o usuário tem permissão
 */
export const hasRoutePermission = (userType, requiredType) => {
  if (!userType) return false;

  if (Array.isArray(requiredType)) {
    return requiredType.includes(userType);
  }

  return userType === requiredType;
};

/**
 * Verifica se o usuário é do tipo RH
 */
export const isRH = (userType) => userType === 'rh';

/**
 * Verifica se o usuário é do tipo Financeiro
 */
export const isFinanceiro = (userType) => userType === 'financeiro';

/**
 * Normaliza o tipo de usuário (lowercase, trim)
 */
export const normalizeUserType = (userType) => {
  return (userType || '').toLowerCase().trim();
};
