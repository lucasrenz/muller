import React from 'react';
import { Route } from 'react-router-dom';
import ProtecaoDeRota from '@/compartilhado/componentes/ProtecaoDeRota';

// Páginas do sistema de vagas
import LoginVagas from '@/sistemas/vagas/paginas/LoginVagas';
import PaginaVagas from '@/sistemas/vagas/paginas/PaginaVagas';
import PainelVagas from '@/sistemas/vagas/paginas/PainelVagas';

/**
 * Rotas do sistema de Vagas
 *
 * Públicas:
 *   GET /vagas                  → lista de vagas abertas
 *
 * Autenticação:
 *   GET /vagas/login            → login (rh)
 *
 * Protegidas (rh):
 *   GET /vagas/painel           → painel do operador de RH
 */
const rotasVagas = [
  // Pública
  <Route key="vagas-lista"   path="/vagas"         element={<PaginaVagas />} />,

  // Autenticação
  <Route key="vagas-login"   path="/vagas/login"   element={<LoginVagas />} />,

  // Protegida
  <Route
    key="vagas-painel"
    path="/vagas/painel"
    element={
      <ProtecaoDeRota modulo="vagas" rotaLogin="/vagas/login">
        <PainelVagas />
      </ProtecaoDeRota>
    }
  />,
];

export default rotasVagas;
