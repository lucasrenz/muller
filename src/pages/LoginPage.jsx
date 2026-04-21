
import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { getDefaultRouteByRole } from '@/lib/authUtils';
import { Button } from '@/components/ui/button';
import { Loader2, Mail, Lock, LogIn } from 'lucide-react';
import CardReleaseFlow from '@/components/CardReleaseFlow';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, currentUser, perfil, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  // Redirecionar conforme perfil, respeitando o getDefaultRouteByRole
  React.useEffect(() => {
    if (currentUser && perfil && !authLoading) {
      const defaultRoute = getDefaultRouteByRole(perfil.tipo);
      navigate(defaultRoute, { replace: true });
    }
  }, [currentUser, perfil, authLoading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setLoading(true);

    const { error } = await login(formData.email, formData.password);

    if (error) {
      setServerError(error.message || 'Erro ao fazer login');
    } else {
      // Se o login foi bem-sucedido, o context vai atualizar
      // e o useEffect vai redirecionar conforme perfil.tipo
    }

    setLoading(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setServerError('');
  };

  const [cardReleaseOpen, setCardReleaseOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center px-4 py-12">
      <Helmet>
        <title>Login - Painel do Operador</title>
        <meta name="description" content="Área de login para operadores do sistema RESTRITO" />
      </Helmet>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border border-slate-100"
      >
        {/* Header */}
        <div className="text-center mb-8">

          <h1 className="text-2xl font-bold text-slate-900">Fazer Login</h1>
          <p className="text-sm text-slate-600 mt-1">Painel do Operador</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Server Error */}
          {serverError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-red-50 border border-red-200 rounded-lg"
            >
              <p className="text-sm text-red-700">{serverError}</p>
            </motion.div>
          )}

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder="seu.email@exemplo.com"
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition text-slate-900 bg-white placeholder-slate-400"
              />
            </div>
          </div>

          {/* Senha */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition text-slate-900 bg-white placeholder-slate-400"
              />
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading || authLoading}
            className="w-full mt-6 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Entrando...
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                Entrar
              </>
            )}
          </Button>


        </form>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <div className="text-center space-y-3">
            <p className="text-xs text-slate-500">
              Apenas operadores autorizados podem acessar este sistema.
            </p>
            <button
              onClick={() => setCardReleaseOpen(true)}
              className="inline-block px-4 py-2 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-800 rounded-lg transition-colors font-medium"
            >
              Assinar contrato
            </button>
          </div>
        </div>
      </motion.div>

      {/* Modal público para assinatura sem login */}
      <CardReleaseFlow
        isOpen={cardReleaseOpen}
        onClose={() => setCardReleaseOpen(false)}
      />
    </div>
  );
};

export default LoginPage;
