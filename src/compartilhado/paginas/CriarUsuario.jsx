import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import {
  UserPlus, Mail, Lock, User, Eye, EyeOff, Loader2,
  CheckCircle2, XCircle, ShieldCheck, ArrowLeft,
  CreditCard, Briefcase, ShieldAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getDefaultRouteByRole } from '@/lib/authUtils';

// ── Configuração dos tipos de usuário ─────────────────────────────────────────
const TIPOS_USUARIO = [
  {
    valor: 'admin',
    rotulo: 'Administrador',
    descricao: 'Acessa todas as areas e pode criar novos usuarios',
    icone: ShieldCheck,
    cor: 'border-slate-300 bg-slate-50 text-slate-700',
    corSelecionado: 'border-slate-600 bg-slate-100 ring-2 ring-slate-400',
  },
  {
    valor: 'financeiro',
    rotulo: 'Financeiro',
    descricao: 'Acessa o painel de Solicitação de Cartão',
    icone: CreditCard,
    cor: 'border-orange-300 bg-orange-50 text-orange-700',
    corSelecionado: 'border-orange-500 bg-orange-100 ring-2 ring-orange-400',
  },
  {
    valor: 'rh',
    rotulo: 'RH',
    descricao: 'Acessa o painel de Vagas e candidatos',
    icone: Briefcase,
    cor: 'border-emerald-300 bg-emerald-50 text-emerald-700',
    corSelecionado: 'border-emerald-500 bg-emerald-100 ring-2 ring-emerald-400',
  },
  {
    valor: 'juridico',
    rotulo: 'Jurídico',
    descricao: 'Acessa o painel de Denúncias',
    icone: ShieldAlert,
    cor: 'border-violet-300 bg-violet-50 text-violet-700',
    corSelecionado: 'border-violet-500 bg-violet-100 ring-2 ring-violet-400',
  },
];

// ── Regras de senha ────────────────────────────────────────────────────────────
const REGRAS_SENHA = [
  { id: 'tamanho',    label: 'Mínimo 8 caracteres',              teste: (s) => s.length >= 8 },
  { id: 'maiuscula',  label: 'Pelo menos 1 letra maiúscula',      teste: (s) => /[A-Z]/.test(s) },
  { id: 'minuscula',  label: 'Pelo menos 1 letra minúscula',      teste: (s) => /[a-z]/.test(s) },
  { id: 'numero',     label: 'Pelo menos 1 número',               teste: (s) => /[0-9]/.test(s) },
  { id: 'especial',   label: 'Pelo menos 1 caractere especial',   teste: (s) => /[^A-Za-z0-9]/.test(s) },
];

function calcularForca(senha) {
  const aprovadas = REGRAS_SENHA.filter((r) => r.teste(senha)).length;
  if (aprovadas <= 1) return { nivel: 0, rotulo: 'Muito fraca',  cor: 'bg-red-500' };
  if (aprovadas === 2) return { nivel: 1, rotulo: 'Fraca',       cor: 'bg-orange-500' };
  if (aprovadas === 3) return { nivel: 2, rotulo: 'Moderada',    cor: 'bg-yellow-500' };
  if (aprovadas === 4) return { nivel: 3, rotulo: 'Forte',       cor: 'bg-blue-500' };
  return                      { nivel: 4, rotulo: 'Muito forte', cor: 'bg-emerald-500' };
}

// ── Componente principal ───────────────────────────────────────────────────────
const CriarUsuario = () => {
  const navigate = useNavigate();
  const { signup, perfil: perfilLogado } = useAuth();

  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(null);   // nome do usuário criado
  const [erroServidor, setErroServidor] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false);
  const [ultimaCriacao, setUltimaCriacao] = useState(0); // rate limit

  const [form, setForm] = useState({
    nome: '',
    email: '',
    password: '',
    passwordConfirm: '',
    tipo: 'rh',
  });

  const [erros, setErros] = useState({});

  // Força da senha calculada dinamicamente
  const forca = useMemo(() => calcularForca(form.password), [form.password]);
  const regrasSenha = useMemo(
    () => REGRAS_SENHA.map((r) => ({ ...r, ok: r.teste(form.password) })),
    [form.password]
  );

  // ── Validação ──────────────────────────────────────────────────────────────
  const validar = () => {
    const e = {};

    const nome = form.nome.trim();
    if (!nome)                     e.nome = 'Nome é obrigatório.';
    else if (nome.length < 3)      e.nome = 'Nome deve ter pelo menos 3 caracteres.';
    else if (nome.length > 100)    e.nome = 'Nome muito longo.';

    const email = form.email.trim().toLowerCase();
    if (!email)                                            e.email = 'E-mail é obrigatório.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))   e.email = 'E-mail inválido.';

    const senhaValida = REGRAS_SENHA.every((r) => r.teste(form.password));
    if (!form.password)     e.password = 'Senha é obrigatória.';
    else if (!senhaValida)  e.password = 'A senha não atende todos os requisitos.';

    if (!form.passwordConfirm)
      e.passwordConfirm = 'Confirme a senha.';
    else if (form.password !== form.passwordConfirm)
      e.passwordConfirm = 'As senhas não conferem.';

    if (!form.tipo)   e.tipo = 'Selecione o tipo de acesso.';

    setErros(e);
    return Object.keys(e).length === 0;
  };

  // ── Envio ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErroServidor('');

    if (!validar()) return;

    // Rate limit: aguardar 5s entre criações
    const agora = Date.now();
    if (agora - ultimaCriacao < 5000) {
      setErroServidor('Aguarde alguns segundos antes de criar outro usuário.');
      return;
    }

    setLoading(true);

    const { error } = await signup(
      form.email.trim().toLowerCase(),
      form.password,
      form.nome.trim(),
      form.tipo,
    );

    if (error) {
      setErroServidor(error.message || 'Erro ao criar usuário. Tente novamente.');
    } else {
      setSucesso(form.nome.trim());
      setUltimaCriacao(Date.now());
      setForm({ nome: '', email: '', password: '', passwordConfirm: '', tipo: 'rh' });
      setErros({});
    }

    setLoading(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (erros[name]) setErros((er) => ({ ...er, [name]: '' }));
    setErroServidor('');
    setSucesso(null);
  };

  const rotaVoltar = getDefaultRouteByRole(perfilLogado?.tipo);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center px-4 py-12">
      <Helmet>
        <title>Criar Usuário — Painel Admin</title>
      </Helmet>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-lg p-8"
      >
        {/* Cabeçalho */}
        <div className="flex items-center gap-3 mb-8">
          <button
            type="button"
            onClick={() => navigate(rotaVoltar)}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
            title="Voltar"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-slate-600 to-slate-900 flex items-center justify-center shadow">
                <UserPlus className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 leading-tight">Criar Novo Usuário</h1>
                <p className="text-xs text-slate-400">Todos os campos são obrigatórios</p>
              </div>
            </div>
          </div>
        </div>

        {/* Mensagem de sucesso */}
        <AnimatePresence>
          {sucesso && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-3 flex items-start gap-3"
            >
              <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-sm">Usuário criado com sucesso!</p>
                <p className="text-xs text-emerald-600 mt-0.5">
                  <strong>{sucesso}</strong> já pode fazer login no sistema correspondente.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Erro do servidor */}
        <AnimatePresence>
          {erroServidor && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 flex items-start gap-3"
            >
              <XCircle className="w-5 h-5 mt-0.5 shrink-0" />
              <span>{erroServidor}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">

          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nome completo</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                name="nome"
                value={form.nome}
                onChange={handleChange}
                maxLength={100}
                autoComplete="off"
                placeholder="Ex.: Ana Silva"
                className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 transition ${
                  erros.nome ? 'border-red-400 bg-red-50' : 'border-slate-200'
                }`}
              />
            </div>
            {erros.nome && <p className="text-xs text-red-500 mt-1">{erros.nome}</p>}
          </div>

          {/* E-mail */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                autoComplete="off"
                placeholder="usuario@empresa.com"
                className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 transition ${
                  erros.email ? 'border-red-400 bg-red-50' : 'border-slate-200'
                }`}
              />
            </div>
            {erros.email && <p className="text-xs text-red-500 mt-1">{erros.email}</p>}
          </div>

          {/* Senha */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type={mostrarSenha ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                autoComplete="new-password"
                placeholder="Mínimo 8 caracteres"
                className={`w-full pl-10 pr-10 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 transition ${
                  erros.password ? 'border-red-400 bg-red-50' : 'border-slate-200'
                }`}
              />
              <button
                type="button"
                onClick={() => setMostrarSenha((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                tabIndex={-1}
              >
                {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {erros.password && <p className="text-xs text-red-500 mt-1">{erros.password}</p>}

            {/* Barra de força */}
            {form.password.length > 0 && (
              <div className="mt-2 space-y-1.5">
                <div className="flex gap-1">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                        i <= forca.nivel - 1 ? forca.cor : 'bg-slate-200'
                      }`}
                    />
                  ))}
                </div>
                <p className={`text-xs font-medium ${
                  forca.nivel <= 1 ? 'text-red-500' :
                  forca.nivel === 2 ? 'text-yellow-600' :
                  forca.nivel === 3 ? 'text-blue-600' : 'text-emerald-600'
                }`}>
                  Força: {forca.rotulo}
                </p>
                {/* Checklist */}
                <ul className="space-y-0.5">
                  {regrasSenha.map((r) => (
                    <li key={r.id} className={`flex items-center gap-1.5 text-xs ${r.ok ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {r.ok
                        ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        : <XCircle className="w-3.5 h-3.5 shrink-0" />
                      }
                      {r.label}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Confirmar senha */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Confirmar senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type={mostrarConfirmacao ? 'text' : 'password'}
                name="passwordConfirm"
                value={form.passwordConfirm}
                onChange={handleChange}
                autoComplete="new-password"
                placeholder="Repita a senha"
                className={`w-full pl-10 pr-10 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 transition ${
                  erros.passwordConfirm ? 'border-red-400 bg-red-50' :
                  form.passwordConfirm && form.password === form.passwordConfirm
                    ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200'
                }`}
              />
              <button
                type="button"
                onClick={() => setMostrarConfirmacao((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                tabIndex={-1}
              >
                {mostrarConfirmacao ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {erros.passwordConfirm && (
              <p className="text-xs text-red-500 mt-1">{erros.passwordConfirm}</p>
            )}
            {form.passwordConfirm && form.password === form.passwordConfirm && !erros.passwordConfirm && (
              <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Senhas conferem
              </p>
            )}
          </div>

          {/* Tipo de acesso */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Tipo de acesso (sistema)
            </label>
            <div className="grid grid-cols-1 gap-2">
              {TIPOS_USUARIO.map(({ valor, rotulo, descricao, icone: Icone, cor, corSelecionado }) => (
                <button
                  key={valor}
                  type="button"
                  onClick={() => {
                    setForm((f) => ({ ...f, tipo: valor }));
                    if (erros.tipo) setErros((e) => ({ ...e, tipo: '' }));
                  }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all duration-150 ${
                    form.tipo === valor ? corSelecionado : `${cor} hover:opacity-80`
                  }`}
                >
                  <Icone className="w-5 h-5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold leading-tight">{rotulo}</p>
                    <p className="text-xs opacity-70 leading-tight">{descricao}</p>
                  </div>
                  {form.tipo === valor && (
                    <CheckCircle2 className="w-4 h-4 ml-auto shrink-0" />
                  )}
                </button>
              ))}
            </div>
            {erros.tipo && <p className="text-xs text-red-500 mt-1">{erros.tipo}</p>}
          </div>

          {/* Aviso de segurança */}
          <div className="flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
            <ShieldCheck className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <p className="text-xs text-slate-500">
              O usuário receberá acesso somente ao sistema correspondente ao tipo selecionado.
              Após criado, o acesso pode ser revogado pelo administrador do banco de dados.
            </p>
          </div>

          {/* Botão */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-slate-700 to-slate-900 hover:from-slate-800 hover:to-black text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 mt-2 shadow-md"
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Criando usuário...</>
              : <><UserPlus className="w-4 h-4" /> Criar usuário</>
            }
          </Button>
        </form>
      </motion.div>
    </div>
  );
};

export default CriarUsuario;
