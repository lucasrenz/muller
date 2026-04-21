
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getDefaultRouteByRole, hasRoutePermission } from '@/lib/authUtils';

/**
 * Componente de rota protegida
 * Valida se usuário está autenticado e tem perfil ativo
 * 
 * @param {object} props
 * @param {ReactNode} props.children - Componente a renderizar
 * @param {string|string[]} props.requiredRole - Role(s) requerido(s) (opcional)
 * @param {string} props.fallbackRoute - Rota de fallback se não autorizado (default: /login)
 */
const ProtectedRoute = ({ 
  children, 
  requiredRole = null,
  fallbackRoute = '/login'
}) => {
  const { currentUser, perfil, loading } = useAuth();

  // Exibir loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-orange-400 to-orange-600 text-white font-semibold mb-4">
            <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
          </div>
          <p className="text-sm text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // Usuário não autenticado
  if (!currentUser) {
    return <Navigate to={fallbackRoute} replace />;
  }

  // Sem perfil carregado
  if (!perfil) {
    return <Navigate to={fallbackRoute} replace />;
  }

  // Validar role se especificado
  if (requiredRole && !hasRoutePermission(perfil?.tipo, requiredRole)) {
    const redirectTo = getDefaultRouteByRole(perfil?.tipo);
    return <Navigate to={redirectTo} replace />;
  }

  return children;
};

export default ProtectedRoute;
