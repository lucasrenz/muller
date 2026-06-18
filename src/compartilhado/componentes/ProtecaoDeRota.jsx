import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  temAcessoAoModulo,
  getLoginRouteByRole,
  getDefaultRouteByRole,
  hasRoutePermission,
} from '@/compartilhado/servicos/verificarPermissao';

/**
 * Proteção de rota com verificação de módulo.
 *
 * Props:
 *  - children: componente a renderizar
 *  - modulo: 'cartao' | 'denuncias' | 'vagas' | 'principal'
 *  - rotaLogin: rota de login a redirecionar se não autenticado
 */
const ProtecaoDeRota = ({
  children,
  modulo = null,
  requiredRole = null,
  rotaLogin = '/cartao/login',
}) => {
  const { currentUser, perfil, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-orange-400 to-orange-600 text-white mb-4">
            <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
          </div>
          <p className="text-sm text-slate-500">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  // Não autenticado → redireciona para o login do sistema
  if (!currentUser || !perfil) {
    return <Navigate to={rotaLogin} replace />;
  }

  // Usuário inativo → login correspondente
  if (perfil.ativo === false) {
    return <Navigate to={rotaLogin} replace />;
  }

  // Verificação de role específica
  if (requiredRole && !hasRoutePermission(perfil.tipo, requiredRole)) {
    return <Navigate to={getDefaultRouteByRole(perfil.tipo)} replace />;
  }

  // Verificação de permissão por módulo
  if (modulo && !temAcessoAoModulo(perfil.tipo, modulo)) {
    // Redireciona para o painel correto do usuário
    const rotaCorreta = getLoginRouteByRole(perfil.tipo);
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center border border-red-100">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600 mb-4 text-2xl">
            🚫
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Acesso Negado</h2>
          <p className="text-slate-500 text-sm mb-6">
            Seu perfil não tem permissão para acessar este sistema.
          </p>
          <a
            href={rotaCorreta}
            className="inline-block px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Ir para meu sistema
          </a>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtecaoDeRota;
