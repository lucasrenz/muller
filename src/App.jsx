
import React from 'react';
import { Route, Routes, BrowserRouter as Router, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import ScrollToTop from '@/components/ScrollToTop';
import { Toaster } from '@/components/ui/toaster';

// ── Rotas por sistema ────────────────────────────────────────────────────────
import rotasCartao from '@/sistemas/financeiro/rotas/rotasCartao';
import rotasDenuncias from '@/sistemas/denuncias/rotas/rotasDenuncias';
import rotasVagas from '@/sistemas/vagas/rotas/rotasVagas';
import rotasPaginaPrincipal from '@/sistemas/pagina-principal/rotas/rotasPaginaPrincipal';

// ── Páginas compartilhadas ────────────────────────────────────────────────────
import ProtecaoDeRota from '@/compartilhado/componentes/ProtecaoDeRota';
import CriarUsuario from '@/compartilhado/paginas/CriarUsuario';

function App() {
  return (
    <Router>
      <AuthProvider>
        <ScrollToTop />
        <Toaster />
        <Routes>

          {/* ── Página raiz ─────────────────────────────────────────────── */}
          <Route path="/" element={<Navigate to="/cartao" replace />} />

          {/* ── Sistemas modulares ──────────────────────────────────────── */}
          {rotasCartao}
          {rotasDenuncias}
          {rotasVagas}
          {rotasPaginaPrincipal}

          {/* ── Criar usuário (protegido — qualquer operador logado) ──── */}
          <Route
            path="/admin/criar-usuario"
            element={
              <ProtecaoDeRota requiredRole="admin" rotaLogin="/cartao/login">
                <CriarUsuario />
              </ProtecaoDeRota>
            }
          />

          {/* ── Retrocompatibilidade (rotas antigas → novas) ────────────── */}
          <Route path="/login"              element={<Navigate to="/cartao/login" replace />} />
          <Route path="/cadastro-usuario"   element={<Navigate to="/cartao/cadastro" replace />} />
          <Route path="/operator-dashboard" element={<Navigate to="/cartao/painel" replace />} />
          <Route path="/webhook-config"     element={<Navigate to="/cartao/configuracoes" replace />} />
          <Route path="/config"             element={<Navigate to="/cartao/configuracoes" replace />} />
          <Route path="/image-config"       element={<Navigate to="/cartao/imagem" replace />} />
          <Route path="/operator-rh"        element={<Navigate to="/vagas/painel" replace />} />
          <Route path="/operator-juridico"  element={<Navigate to="/denuncias/painel" replace />} />
          <Route path="/denuncia"           element={<Navigate to="/denuncias" replace />} />
          <Route path="/consultar-denuncia" element={<Navigate to="/denuncias/consultar" replace />} />

        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
