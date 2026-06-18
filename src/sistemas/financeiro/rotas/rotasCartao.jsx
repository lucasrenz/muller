import React from 'react';
import { Route } from 'react-router-dom';
import ProtecaoDeRota from '@/compartilhado/componentes/ProtecaoDeRota';

// Páginas do sistema de cartão
import LoginCartao from '@/sistemas/financeiro/paginas/LoginCartao';
import FormularioSolicitacaoCartao from '@/sistemas/financeiro/componentes/CardRequestForm';
import PainelCartao from '@/sistemas/financeiro/paginas/PainelCartao';
import ConfiguracoesCartao from '@/sistemas/financeiro/paginas/ConfiguracoesCartao';
import ConfiguracoesImagem from '@/sistemas/financeiro/paginas/ConfiguracoesImagem';
import CadastroUsuario from '@/sistemas/financeiro/paginas/CadastroUsuario';

/**
 * Rotas do sistema de Solicitação de Cartão
 *
 * Públicas:
 *   GET /cartao                 → formulário de solicitação
 *
 * Autenticação:
 *   GET /cartao/login           → login (financeiro)
 *   GET /cartao/cadastro        → cadastro de usuário
 *
 * Protegidas (financeiro):
 *   GET /cartao/painel          → painel do operador financeiro
 *   GET /cartao/configuracoes   → configurações de webhook/mensagem
 *   GET /cartao/imagem          → configuração de imagem
 */
const rotasCartao = [
  // Pública — formulário de solicitação
  <Route key="cartao-form"   path="/cartao"              element={<FormularioSolicitacaoCartao />} />,

  // Autenticação
  <Route key="cartao-login"  path="/cartao/login"         element={<LoginCartao />} />,
  <Route
    key="cartao-cadastro"
    path="/cartao/cadastro"
    element={
      <ProtecaoDeRota requiredRole="admin" rotaLogin="/cartao/login">
        <CadastroUsuario />
      </ProtecaoDeRota>
    }
  />,

  // Protegidas
  <Route
    key="cartao-painel"
    path="/cartao/painel"
    element={
      <ProtecaoDeRota modulo="cartao" rotaLogin="/cartao/login">
        <PainelCartao />
      </ProtecaoDeRota>
    }
  />,
  <Route
    key="cartao-config"
    path="/cartao/configuracoes"
    element={
      <ProtecaoDeRota modulo="cartao" rotaLogin="/cartao/login">
        <ConfiguracoesCartao />
      </ProtecaoDeRota>
    }
  />,
  <Route
    key="cartao-imagem"
    path="/cartao/imagem"
    element={
      <ProtecaoDeRota modulo="cartao" rotaLogin="/cartao/login">
        <ConfiguracoesImagem />
      </ProtecaoDeRota>
    }
  />,
];

export default rotasCartao;
