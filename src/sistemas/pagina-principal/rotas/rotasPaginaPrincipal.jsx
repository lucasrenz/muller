import React from 'react';
import { Route } from 'react-router-dom';

// Páginas do sistema principal
import LoginPrincipal from '@/sistemas/pagina-principal/paginas/LoginPrincipal';
import PaginaPrincipal from '@/sistemas/pagina-principal/paginas/PaginaPrincipal';

/**
 * Rotas da Página Principal
 *
 *   GET /principal/login  → login geral (redireciona ao painel correto do usuário)
 *   GET /principal        → página principal
 */
const rotasPaginaPrincipal = [
  <Route key="principal-home"  path="/principal"        element={<PaginaPrincipal />} />,
  <Route key="principal-login" path="/principal/login"  element={<LoginPrincipal />} />,
];

export default rotasPaginaPrincipal;
