import React from 'react';
import { Route } from 'react-router-dom';
import ProtecaoDeRota from '@/compartilhado/componentes/ProtecaoDeRota';

// Páginas do sistema de denúncias
import LoginDenuncias from '@/sistemas/denuncias/paginas/LoginDenuncias';
import FormularioDenuncia from '@/sistemas/denuncias/paginas/FormularioDenuncia';
import ConsultarDenuncia from '@/sistemas/denuncias/paginas/ConsultarDenuncia';
import PainelDenuncias from '@/sistemas/denuncias/paginas/PainelDenuncias';

/**
 * Rotas do sistema de Denúncias
 *
 * Públicas:
 *   GET /denuncias              → formulário de denúncia
 *   GET /denuncias/consultar    → consultar status da denúncia
 *
 * Autenticação:
 *   GET /denuncias/login        → login (juridico)
 *
 * Protegidas (juridico):
 *   GET /denuncias/painel       → painel do operador jurídico
 */
const rotasDenuncias = [
  // Públicas
  <Route key="denuncias-form"    path="/denuncias"           element={<FormularioDenuncia />} />,
  <Route key="denuncias-consultar" path="/denuncias/consultar" element={<ConsultarDenuncia />} />,

  // Autenticação
  <Route key="denuncias-login"   path="/denuncias/login"     element={<LoginDenuncias />} />,

  // Protegida
  <Route
    key="denuncias-painel"
    path="/denuncias/painel"
    element={
      <ProtecaoDeRota modulo="denuncias" rotaLogin="/denuncias/login">
        <PainelDenuncias />
      </ProtecaoDeRota>
    }
  />,
];

export default rotasDenuncias;
