import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  LogIn,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { temAcessoAoModulo } from '@/compartilhado/servicos/verificarPermissao';

const LOGO_URL = 'https://i.ibb.co/cXwpq4sq/Logo-Grupo-Muller.png';

const LoginDenuncias = () => {
  const navigate = useNavigate();
  const { login, logout, currentUser, perfil, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });

  useEffect(() => {
    if (authLoading || !currentUser || !perfil) return;

    if (temAcessoAoModulo(perfil.tipo, 'denuncias')) {
      navigate('/denuncias/painel', { replace: true });
      return;
    }

    logout();
    setErro('Este acesso e exclusivo para operadores do canal de denuncias.');
  }, [authLoading, currentUser, perfil, navigate, logout]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');

    if (!form.email.trim() || !form.password) {
      setErro('Informe e-mail e senha para acessar o painel.');
      return;
    }

    setLoading(true);
    const { error } = await login(form.email, form.password, 'denuncias');

    if (error) {
      setErro(error.message || 'Nao foi possivel entrar. Verifique seus dados.');
    }

    setLoading(false);
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErro('');
  };

  return (
    <>
      <Helmet>
        <title>Login - Canal de Denuncias</title>
      </Helmet>

      <main className="min-h-screen bg-[#f8f9fa] text-slate-950">
        <div className="grid min-h-screen lg:grid-cols-[1fr_480px]">
          <section className="relative hidden overflow-hidden bg-slate-950 lg:block">
            <img
              src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1600&q=80"
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-35"
            />
            <div className="absolute inset-0 bg-slate-950/55" />

            <div className="relative z-10 flex h-full flex-col justify-between p-10 xl:p-14">
              <Link
                to="/denuncias"
                className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/95 px-4 py-2 text-sm font-bold text-slate-900 shadow-[0_12px_30px_rgba(0,0,0,0.18)] transition hover:-translate-y-0.5 hover:bg-white"
              >
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-orange-50 text-orange-700">
                  <ArrowLeft className="h-4 w-4" />
                </span>
                Voltar
              </Link>

              <div className="max-w-2xl">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-orange-100">
                  <ShieldCheck className="h-4 w-4" />
                  Area restrita
                </div>
                <h1 className="max-w-xl text-5xl font-bold leading-tight text-white">
                  Canal de Denuncias
                </h1>
                <p className="mt-5 max-w-lg text-base leading-7 text-slate-200">
                  Para Registrar  uma denuncia, volte para a pagina inicial do canal de denuncias e clique no botao "Registrar Denuncia".
                </p>
              </div>
            </div>
          </section>

          <section className="flex min-h-screen flex-col bg-white">
            <header className="flex items-center border-b border-slate-100 px-5 py-4 sm:px-8">
              <Link to="/denuncias" className="flex items-center gap-3">
                <img src={LOGO_URL} alt="Grupo Muller" className="h-10 w-auto" />
                <span className="hidden text-sm font-semibold text-slate-500 sm:inline">
                  Painel Restrito
                </span>
              </Link>
            </header>

            <div className="flex flex-1 items-center px-5 py-10 sm:px-8">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="mx-auto w-full max-w-sm"
              >
                <div className="mb-8">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-orange-50 text-orange-700 ring-1 ring-orange-100">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight text-slate-950">
                    Entrar
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Use suas credenciais para o painel.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {erro && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                    >
                      <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                      <span>{erro}</span>
                    </motion.div>
                  )}

                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                      E-mail
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        required
                        autoComplete="email"
                        placeholder="juridico@juridico.com"
                        className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Senha
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type={mostrarSenha ? 'text' : 'password'}
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        required
                        autoComplete="current-password"
                        placeholder="Digite sua senha"
                        className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-11 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                      />
                      <button
                        type="button"
                        onClick={() => setMostrarSenha((value) => !value)}
                        className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                        aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                      >
                        {mostrarSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-orange-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                    {loading ? 'Entrando...' : 'Entrar'}
                  </button>
                </form>

                <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-500">
                  Acesso restrito para operadores do canal de denuncias. Permitido para
                  <span className="font-semibold text-slate-700"> Equipe Juridica</span> e
                  <span className="font-semibold text-slate-700"> Compliance</span>.
                </div>
              </motion.div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
};

export default LoginDenuncias;
