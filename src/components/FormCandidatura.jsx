import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Loader2, CheckCircle, User, FileText, Send } from 'lucide-react';
import { useToast } from './ui/use-toast';
import QuestionarioRenderer from './QuestionarioRenderer';
import { fetchQuestionarioByVagaId, createInscricao } from '../lib/rhService';
import { montarRespostasJsonEstruturado } from '../lib/respostasUtils';

const FormCandidatura = ({ vaga, isOpen, onClose, onSuccess }) => {
  const { toast } = useToast();
  const [etapaAtual, setEtapaAtual] = useState(1);
  const [loading, setLoading] = useState(false);
  const [questionario, setQuestionario] = useState(null);
  const [loadingQuestionario, setLoadingQuestionario] = useState(false);

  // Dados do formulário
  const [dadosPessoais, setDadosPessoais] = useState({
    nome_completo: '',
    cpf: '',
    cidade: '',
    data_nascimento: '',
    disponibilidade_horario: '',
    email: '',
    telefone_1: '',
    telefone_2: '',
    como_conheceu: ''
  });

  const [respostasQuestionario, setRespostasQuestionario] = useState({});
  const [erros, setErros] = useState({});

  // Carregar questionário da vaga
  useEffect(() => {
    if (vaga?.id && isOpen) {
      carregarQuestionario();
    }
  }, [vaga?.id, isOpen]);

  const carregarQuestionario = async () => {
    setLoadingQuestionario(true);
    try {
      const { data, error } = await fetchQuestionarioByVagaId(vaga.id);
      if (error) throw error;
      setQuestionario(data);
    } catch (error) {
      console.error('Erro ao carregar questionário:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar o questionário.',
        variant: 'destructive',
      });
    } finally {
      setLoadingQuestionario(false);
    }
  };

  // Reset form quando modal abre/fecha
  useEffect(() => {
    if (isOpen) {
      setEtapaAtual(1);
      setDadosPessoais({
        nome_completo: '',
        cpf: '',
        cidade: '',
        data_nascimento: '',
        disponibilidade_horario: '',
        email: '',
        telefone_1: '',
        telefone_2: '',
        como_conheceu: ''
      });
      setRespostasQuestionario({});
      setErros({});
    }
  }, [isOpen]);

  const validarDadosPessoais = () => {
    const novosErros = {};

    if (!dadosPessoais.nome_completo.trim()) {
      novosErros.nome_completo = 'Nome completo é obrigatório';
    }

    if (!dadosPessoais.cpf.trim()) {
      novosErros.cpf = 'CPF é obrigatório';
    } else if (!validarCPF(dadosPessoais.cpf)) {
      novosErros.cpf = 'CPF inválido';
    }

    if (!dadosPessoais.cidade.trim()) {
      novosErros.cidade = 'Cidade é obrigatória';
    }

    if (!dadosPessoais.data_nascimento) {
      novosErros.data_nascimento = 'Data de nascimento é obrigatória';
    }

    if (!dadosPessoais.disponibilidade_horario.trim()) {
      novosErros.disponibilidade_horario = 'Disponibilidade é obrigatória';
    }

    if (!dadosPessoais.email.trim()) {
      novosErros.email = 'E-mail é obrigatório';
    } else if (!validarEmail(dadosPessoais.email)) {
      novosErros.email = 'E-mail inválido';
    }

    if (!dadosPessoais.telefone_1.trim()) {
      novosErros.telefone_1 = 'Telefone principal é obrigatório';
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const validarQuestionario = () => {
    if (!questionario?.estrutura_json) return true;

    let campos;
    try {
      campos = JSON.parse(questionario.estrutura_json).campos || [];
    } catch (error) {
      return true; // Se não conseguir parsear, considera válido
    }

    const novosErros = {};

    campos.forEach(campo => {
      if (campo.obrigatorio) {
        const resposta = respostasQuestionario[campo.id];
        if (!resposta || (Array.isArray(resposta) && resposta.length === 0)) {
          novosErros[campo.id] = 'Campo obrigatório';
        }
      }
    });

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const validarCPF = (cpf) => {
    cpf = cpf.replace(/[^\d]/g, '');
    if (cpf.length !== 11) return false;

    // Verificação básica de CPF
    let soma = 0;
    for (let i = 0; i < 9; i++) {
      soma += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.charAt(9))) return false;

    soma = 0;
    for (let i = 0; i < 10; i++) {
      soma += parseInt(cpf.charAt(i)) * (11 - i);
    }
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.charAt(10))) return false;

    return true;
  };

  const validarEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleProximaEtapa = () => {
    if (etapaAtual === 1) {
      if (!validarDadosPessoais()) return;
      setEtapaAtual(2);
    } else if (etapaAtual === 2) {
      if (!validarQuestionario()) return;
      setEtapaAtual(3);
    }
  };

  const handleEtapaAnterior = () => {
    if (etapaAtual > 1) {
      setEtapaAtual(etapaAtual - 1);
    }
  };

  const handleEnviarCandidatura = async () => {
    setLoading(true);
    try {
      // Transformar respostas para novo formato estruturado
      const respostasEstruturadas = montarRespostasJsonEstruturado(
        respostasQuestionario,
        questionario
      );

      const inscricaoData = {
        nome_completo: dadosPessoais.nome_completo.trim(),
        cpf: dadosPessoais.cpf.replace(/[^\d]/g, ''),
        cidade: dadosPessoais.cidade.trim(),
        data_nascimento: dadosPessoais.data_nascimento,
        disponibilidade_horario: dadosPessoais.disponibilidade_horario.trim(),
        email: dadosPessoais.email.trim().toLowerCase(),
        telefone_1: dadosPessoais.telefone_1.trim(),
        telefone_2: dadosPessoais.telefone_2.trim() || null,
        como_conheceu: dadosPessoais.como_conheceu.trim() || null,
        vaga_id: vaga.id,
        loja_id: vaga.loja_id,
        cargo_id: vaga.cargo_id,
        respostas_json: JSON.stringify(respostasEstruturadas),
        status: 'novo'
      };

      const { data, error } = await createInscricao(inscricaoData);
      if (error) throw error;

      toast({
        title: 'Sucesso!',
        description: 'Sua candidatura foi enviada com sucesso. Entraremos em contato em breve!',
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao enviar candidatura:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar sua candidatura. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderEtapa1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="flex justify-center mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-orange-600">
            <User className="h-6 w-6" />
          </div>
        </div>
        <h3 className="text-xl font-semibold text-slate-900 mb-2">
          Dados pessoais
        </h3>
        <p className="text-sm text-slate-600">
          Preencha suas informações básicas para continuar
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Nome completo *
          </label>
          <input
            type="text"
            value={dadosPessoais.nome_completo}
            onChange={(e) => setDadosPessoais(prev => ({ ...prev, nome_completo: e.target.value }))}
            className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors ${
              erros.nome_completo
                ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-100'
                : 'border-slate-300 bg-slate-50 focus:border-orange-500 focus:ring-orange-100'
            }`}
            placeholder="Digite seu nome completo"
          />
          {erros.nome_completo && (
            <p className="text-red-600 text-xs mt-1">{erros.nome_completo}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            CPF *
          </label>
          <input
            type="text"
            value={dadosPessoais.cpf}
            onChange={(e) => setDadosPessoais(prev => ({ ...prev, cpf: e.target.value }))}
            className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors ${
              erros.cpf
                ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-100'
                : 'border-slate-300 bg-slate-50 focus:border-orange-500 focus:ring-orange-100'
            }`}
            placeholder="000.000.000-00"
          />
          {erros.cpf && (
            <p className="text-red-600 text-xs mt-1">{erros.cpf}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Cidade *
          </label>
          <input
            type="text"
            value={dadosPessoais.cidade}
            onChange={(e) => setDadosPessoais(prev => ({ ...prev, cidade: e.target.value }))}
            className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors ${
              erros.cidade
                ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-100'
                : 'border-slate-300 bg-slate-50 focus:border-orange-500 focus:ring-orange-100'
            }`}
            placeholder="Sua cidade"
          />
          {erros.cidade && (
            <p className="text-red-600 text-xs mt-1">{erros.cidade}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Data de nascimento *
          </label>
          <input
            type="date"
            value={dadosPessoais.data_nascimento}
            onChange={(e) => setDadosPessoais(prev => ({ ...prev, data_nascimento: e.target.value }))}
            className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors ${
              erros.data_nascimento
                ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-100'
                : 'border-slate-300 bg-slate-50 focus:border-orange-500 focus:ring-orange-100'
            }`}
          />
          {erros.data_nascimento && (
            <p className="text-red-600 text-xs mt-1">{erros.data_nascimento}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Disponibilidade de horário *
          </label>
          <select
            value={dadosPessoais.disponibilidade_horario}
            onChange={(e) => setDadosPessoais(prev => ({ ...prev, disponibilidade_horario: e.target.value }))}
            className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors ${
              erros.disponibilidade_horario
                ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-100'
                : 'border-slate-300 bg-slate-50 focus:border-orange-500 focus:ring-orange-100'
            }`}
          >
            <option value="">Selecione...</option>
            <option value="integral">Integral</option>
            <option value="meio-periodo">Meio período</option>
            <option value="flexivel">Horário flexível</option>
          </select>
          {erros.disponibilidade_horario && (
            <p className="text-red-600 text-xs mt-1">{erros.disponibilidade_horario}</p>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            E-mail *
          </label>
          <input
            type="email"
            value={dadosPessoais.email}
            onChange={(e) => setDadosPessoais(prev => ({ ...prev, email: e.target.value }))}
            className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors ${
              erros.email
                ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-100'
                : 'border-slate-300 bg-slate-50 focus:border-orange-500 focus:ring-orange-100'
            }`}
            placeholder="seu@email.com"
          />
          {erros.email && (
            <p className="text-red-600 text-xs mt-1">{erros.email}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Telefone principal *
          </label>
          <input
            type="tel"
            value={dadosPessoais.telefone_1}
            onChange={(e) => setDadosPessoais(prev => ({ ...prev, telefone_1: e.target.value }))}
            className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors ${
              erros.telefone_1
                ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-100'
                : 'border-slate-300 bg-slate-50 focus:border-orange-500 focus:ring-orange-100'
            }`}
            placeholder="(11) 99999-9999"
          />
          {erros.telefone_1 && (
            <p className="text-red-600 text-xs mt-1">{erros.telefone_1}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Telefone secundário
          </label>
          <input
            type="tel"
            value={dadosPessoais.telefone_2}
            onChange={(e) => setDadosPessoais(prev => ({ ...prev, telefone_2: e.target.value }))}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-orange-100 transition-colors"
            placeholder="(11) 99999-9999"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Como nos conheceu?
          </label>
          <select
            value={dadosPessoais.como_conheceu}
            onChange={(e) => setDadosPessoais(prev => ({ ...prev, como_conheceu: e.target.value }))}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-orange-100 transition-colors"
          >
            <option value="">Selecione...</option>
            <option value="google">Google</option>
            <option value="facebook">Facebook</option>
            <option value="instagram">Instagram</option>
            <option value="linkedin">LinkedIn</option>
            <option value="indicação">Indicação</option>
            <option value="outro">Outro</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderEtapa2 = () => {
    if (loadingQuestionario) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-orange-600 mb-4" />
          <p className="text-slate-600">Carregando questionário...</p>
        </div>
      );
    }

    if (!questionario) {
      return (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600">Nenhum questionário configurado para esta vaga.</p>
        </div>
      );
    }

    return (
      <QuestionarioRenderer
        questionario={questionario}
        respostas={respostasQuestionario}
        onRespostaChange={(campoId, valor) => {
          setRespostasQuestionario(prev => ({ ...prev, [campoId]: valor }));
          // Limpar erro do campo se existir
          if (erros[campoId]) {
            setErros(prev => {
              const novosErros = { ...prev };
              delete novosErros[campoId];
              return novosErros;
            });
          }
        }}
      />
    );
  };

  const renderEtapa3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="flex justify-center mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
            <CheckCircle className="h-6 w-6" />
          </div>
        </div>
        <h3 className="text-xl font-semibold text-slate-900 mb-2">
          Confirmar candidatura
        </h3>
        <p className="text-sm text-slate-600">
          Revise suas informações antes de enviar
        </p>
      </div>

      <div className="bg-slate-50 rounded-2xl p-6 space-y-4">
        <div>
          <h4 className="font-semibold text-slate-900 mb-3">Dados pessoais</h4>
          <div className="grid md:grid-cols-2 gap-3 text-sm">
            <div><span className="text-slate-500">Nome:</span> {dadosPessoais.nome_completo}</div>
            <div><span className="text-slate-500">CPF:</span> {dadosPessoais.cpf}</div>
            <div><span className="text-slate-500">Cidade:</span> {dadosPessoais.cidade}</div>
            <div><span className="text-slate-500">Data nascimento:</span> {new Date(dadosPessoais.data_nascimento).toLocaleDateString('pt-BR')}</div>
            <div><span className="text-slate-500">E-mail:</span> {dadosPessoais.email}</div>
            <div><span className="text-slate-500">Telefone:</span> {dadosPessoais.telefone_1}</div>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-slate-900 mb-3">Vaga pretendida</h4>
          <div className="text-sm">
            <div><span className="text-slate-500">Cargo:</span> {vaga.cargos?.nome}</div>
            <div><span className="text-slate-500">Loja:</span> {vaga.lojas?.nome} - {vaga.lojas?.cidade}</div>
          </div>
        </div>

        {questionario && Object.keys(respostasQuestionario).length > 0 && (
          <div>
            <h4 className="font-semibold text-slate-900 mb-3">Respostas do questionário</h4>
            <div className="text-sm space-y-2">
              {Object.entries(respostasQuestionario).map(([campoId, resposta]) => {
                let campos;
                try {
                  campos = JSON.parse(questionario.estrutura_json).campos || [];
                } catch (error) {
                  return null;
                }
                const campo = campos.find(c => c.id === campoId);
                if (!campo) return null;

                return (
                  <div key={campoId}>
                    <span className="text-slate-500">{campo.label}:</span>{' '}
                    {Array.isArray(resposta) ? resposta.join(', ') : resposta}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm text-blue-800">
          Ao enviar sua candidatura, você concorda com o processamento dos seus dados pessoais conforme nossa política de privacidade.
        </p>
      </div>
    </div>
  );

  const getTituloEtapa = () => {
    switch (etapaAtual) {
      case 1: return 'Dados pessoais';
      case 2: return questionario ? questionario.nome : 'Questionário';
      case 3: return 'Confirmação';
      default: return '';
    }
  };

  const getIconeEtapa = () => {
    switch (etapaAtual) {
      case 1: return <User className="h-5 w-5" />;
      case 2: return <FileText className="h-5 w-5" />;
      case 3: return <Send className="h-5 w-5" />;
      default: return null;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed inset-4 md:inset-8 lg:inset-16 bg-white rounded-3xl shadow-2xl z-50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="relative bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-6 text-white">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white">
                  {getIconeEtapa()}
                </div>
                <div>
                  <h1 className="text-xl font-bold">{getTituloEtapa()}</h1>
                  <p className="text-white/80 text-sm">Etapa {etapaAtual} de 3</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-4 bg-white/20 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(etapaAtual / 3) * 100}%` }}
                  transition={{ duration: 0.3 }}
                  className="bg-white h-2 rounded-full"
                />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-2xl mx-auto">
                {etapaAtual === 1 && renderEtapa1()}
                {etapaAtual === 2 && renderEtapa2()}
                {etapaAtual === 3 && renderEtapa3()}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 px-6 py-4 bg-slate-50">
              <div className="max-w-2xl mx-auto flex justify-between items-center">
                <button
                  onClick={etapaAtual === 1 ? onClose : handleEtapaAnterior}
                  className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                  {etapaAtual === 1 ? 'Cancelar' : 'Voltar'}
                </button>

                {etapaAtual < 3 ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleProximaEtapa}
                    className="flex items-center gap-2 px-6 py-2 rounded-xl bg-orange-600 text-white font-semibold shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all"
                  >
                    Próxima etapa
                    <ChevronRight className="h-4 w-4" />
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleEnviarCandidatura}
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-2 rounded-xl bg-green-600 text-white font-semibold shadow-lg shadow-green-500/30 hover:shadow-green-500/50 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Enviar candidatura
                      </>
                    )}
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default FormCandidatura;