
import React from 'react';
import { Route, Routes, BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import ScrollToTop from '@/components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import CardRequestForm from '@/components/CardRequestForm';
import LoginPage from '@/pages/LoginPage';
import SignUpPage from '@/pages/SignUpPage';
import OperatorDashboard from '@/pages/OperatorDashboard';
import WebhookConfigPage from '@/pages/WebhookConfigPage';
import ImageConfigPage from '@/pages/ImageConfigPage';
import VagasPage from '@/pages/VagasPage';
import OperatorRH from '@/pages/OperatorRH';
import OperatorJuridico from '@/pages/OperatorJuridico';
import DenunciaPage from '@/pages/DenunciaPage';
import ConsultarDenunciaPage from '@/pages/ConsultarDenunciaPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<CardRequestForm />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/cadastro-usuario" element={<SignUpPage />} />
          
          {/* Rotas protegidas para Financeiro */}
          <Route
            path="/operator-dashboard"
            element={
              <ProtectedRoute requiredRole="financeiro">
                <OperatorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/webhook-config"
            element={
              <ProtectedRoute requiredRole="financeiro">
                <WebhookConfigPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/config"
            element={
              <ProtectedRoute requiredRole="financeiro">
                <WebhookConfigPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/image-config"
            element={
              <ProtectedRoute requiredRole="financeiro">
                <ImageConfigPage />
              </ProtectedRoute>
            }
          />
          
          {/* Rotas protegidas para RH */}
          <Route
            path="/operator-rh"
            element={
              <ProtectedRoute requiredRole="rh">
                <OperatorRH />
              </ProtectedRoute>
            }
          />
          
          {/* Rotas protegidas para Jurídico */}
          <Route
            path="/operator-juridico"
            element={
              <ProtectedRoute requiredRole="juridico">
                <OperatorJuridico />
              </ProtectedRoute>
            }
          />

          {/* Rotas públicas */}
          <Route path="/vagas" element={<VagasPage />} />
          <Route path="/denuncia" element={<DenunciaPage />} />
          <Route path="/consultar-denuncia" element={<ConsultarDenunciaPage />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
