import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { CreditCard, Mail, Lock, Loader2, LogIn, FileSignature } from 'lucide-react';
import LayoutLogin from '@/compartilhado/componentes/LayoutLogin';
import { Button } from '@/components/ui/button';
import { getDefaultRouteByRole } from '@/compartilhado/servicos/verificarPermissao';
import CardReleaseFlow from '@/sistemas/financeiro/componentes/CardReleaseFlow';

const LoginCartao = () => {
  const navigate = useNavigate();
  const { login, currentUser, perfil, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [form, setForm] = useState({ email: '', password: '' });
  const [cardReleaseOpen, setCardReleaseOpen] = useState(false);

  // Se já autenticado como financeiro → painel do cartão
  React.useEffect(() => {
    if (currentUser && perfil && !authLoading) {
      navigate(getDefaultRouteByRole(perfil.tipo), { replace: true });
    }
  }, [currentUser, perfil, authLoading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setLoading(true);
    const { error } = await login(form.email, form.password, 'financeiro');
    if (error) setErro(error.message || 'Erro ao fazer login.');
    setLoading(false);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErro('');
  };

  return (
    <LayoutLogin
      titulo="Login — Sistema de Cartão"
      subtitulo="Área restrita ao setor Financeiro"
      icone={<CreditCard className="w-7 h-7" />}
      corPrimaria="from-orange-400 to-orange-600"
    >
      <Helmet>
        <title>Login — Sistema de Cartão</title>
      </Helmet>

      <form onSubmit={handleSubmit} className="space-y-4">
        {erro && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3"
          >
            {erro}
          </motion.div>
        )}

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            E-mail
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
              placeholder="seu@email.com"
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition"
            />
          </div>
        </div>

        {/* Senha */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Senha
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition"
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-orange-400 to-orange-600 hover:from-orange-500 hover:to-orange-700 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 mt-2"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <LogIn className="w-4 h-4" />
          )}
          {loading ? 'Entrando...' : 'Entrar'}
        </Button>
      </form>

      <div className="mt-8 pt-6 border-t border-slate-100">
        <div className="text-center space-y-3">
          <p className="text-xs text-slate-500">
            Assinatura de contrato para clientes liberados
          </p>
          <button
            type="button"
            onClick={() => setCardReleaseOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-800 rounded-lg transition-colors font-medium"
          >
            <FileSignature className="w-4 h-4" />
            Assinar contrato
          </button>
        </div>
      </div>

      <CardReleaseFlow
        isOpen={cardReleaseOpen}
        onClose={() => setCardReleaseOpen(false)}
      />
    </LayoutLogin>
  );
};

export default LoginCartao;
