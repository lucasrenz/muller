import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { getDefaultRouteByRole } from '@/lib/authUtils';
import { Button } from '@/components/ui/button';
import { Loader2, Mail, Lock, User, LogIn } from 'lucide-react';

const SignUpPage = () => {
  const navigate = useNavigate();
  const { signup, currentUser, perfil } = useAuth();
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    password: '',
    passwordConfirm: '',
    tipo: 'rh',
  });

  const [errors, setErrors] = useState({});

  // Se já autenticado, redirecionar para a rota padrão
  React.useEffect(() => {
    if (currentUser && perfil) {
      const defaultRoute = getDefaultRouteByRole(perfil.tipo);
      navigate(defaultRoute);
    }
  }, [currentUser, perfil, navigate]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
    }

    if (!formData.passwordConfirm) {
      newErrors.passwordConfirm = 'Confirmação de senha é obrigatória';
    } else if (formData.password !== formData.passwordConfirm) {
      newErrors.passwordConfirm = 'Senhas não conferem';
    }

    if (!formData.tipo) {
      newErrors.tipo = 'Tipo de usuário é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    const { error } = await signup(
      formData.email,
      formData.password,
      formData.nome,
      formData.tipo
    );

    if (!error) {
      // Se o signup foi bem-sucedido, o context vai atualizar
      // e o useEffect vai redirecionar
      // Aguardar um pouco para o contexto atualizar
      setTimeout(() => {
        if (perfil) {
          navigate(getDefaultRouteByRole(perfil.tipo));
        }
      }, 500);
    } else {
      setServerError(error?.message || 'Erro desconhecido ao criar conta');
    }

    setLoading(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Limpar erro do campo quando o usuário começar a editar
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center px-4 py-12">
      <Helmet>
        <title>Cadastro - Painel do Operador</title>
        <meta name="description" content="Área de cadastro para operadores do sistema" />
      </Helmet>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border border-slate-100"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 text-white font-semibold text-xl mb-4">
            RESTRITO
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Criar Conta</h1>
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

          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Nome Completo
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
              <input
                type="text"
                name="nome"
                value={formData.nome}
                onChange={handleInputChange}
                placeholder="Seu nome"
                className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition text-slate-900 bg-white placeholder-slate-400 ${
                  errors.nome ? 'border-red-500' : 'border-slate-200'
                }`}
              />
            </div>
            {errors.nome && (
              <p className="mt-1 text-xs text-red-600">{errors.nome}</p>
            )}
          </div>

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
                placeholder="seu.email@exemplo.com"
                className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition text-slate-900 bg-white placeholder-slate-400 ${
                  errors.email ? 'border-red-500' : 'border-slate-200'
                }`}
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-xs text-red-600">{errors.email}</p>
            )}
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
                placeholder="••••••••"
                className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition text-slate-900 bg-white placeholder-slate-400 ${
                  errors.password ? 'border-red-500' : 'border-slate-200'
                }`}
              />
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-red-600">{errors.password}</p>
            )}
          </div>

          {/* Confirmar Senha */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Confirmar Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
              <input
                type="password"
                name="passwordConfirm"
                value={formData.passwordConfirm}
                onChange={handleInputChange}
                placeholder="••••••••"
                className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition text-slate-900 bg-white placeholder-slate-400 ${
                  errors.passwordConfirm ? 'border-red-500' : 'border-slate-200'
                }`}
              />
            </div>
            {errors.passwordConfirm && (
              <p className="mt-1 text-xs text-red-600">{errors.passwordConfirm}</p>
            )}
          </div>

          {/* Tipo de Usuário */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Tipo de Usuário
            </label>
            <select
              name="tipo"
              value={formData.tipo}
              onChange={handleInputChange}
              className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition text-slate-900 bg-white ${
                errors.tipo ? 'border-red-500' : 'border-slate-200'
              }`}
            >
              <option value="rh">RH (Recursos Humanos)</option>
              <option value="financeiro">Financeiro</option>
              <option value="juridico">Juridico</option>
            </select>
            {errors.tipo && (
              <p className="mt-1 text-xs text-red-600">{errors.tipo}</p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Criando conta...
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                Criar Conta
              </>
            )}
          </Button>

          {/* Link para Login */}
          <div className="text-center mt-6">
            <p className="text-sm text-slate-600">
              Já tem uma conta?{' '}
              <Link
                to="/login"
                className="text-orange-600 hover:text-orange-700 font-semibold transition-colors"
              >
                Faça login
              </Link>
            </p>
          </div>
        </form>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <p className="text-xs text-center text-slate-500">
            Sistema RESTRITO - Acesso apenas para operadores autorizados
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default SignUpPage;
