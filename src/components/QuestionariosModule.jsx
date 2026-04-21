
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, ChevronDown, ArrowUp, ArrowDown, Edit, ToggleLeft, ToggleRight, Loader2, FileText } from 'lucide-react';
import { useToast } from './ui/use-toast';
import { createQuestionario, fetchQuestionariosAdmin, updateQuestionario, toggleQuestionarioAtivo } from '../lib/rhService';

const DEFAULT_QUESTION = {
  label: '',
  tipo: 'texto',
  obrigatorio: false,
  opcoes: [''],
};

const QuestionariosModule = ({ isOpen }) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [nome, setNome] = useState('');
  const [ativo, setAtivo] = useState(true);
  const [questions, setQuestions] = useState([{ ...DEFAULT_QUESTION }]);
  const [errors, setErrors] = useState([]);
  const [expandedIndex, setExpandedIndex] = useState(0);
  const [questionarios, setQuestionarios] = useState([]);
  const [creatingNew, setCreatingNew] = useState(false);
  const [editingQuestionario, setEditingQuestionario] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadAllQuestionarios();
      resetForm();
    }
  }, [isOpen]);

  const loadAllQuestionarios = async () => {
    try {
      setLoading(true);
      const { data, error } = await fetchQuestionariosAdmin();
      if (error) throw error;
      setQuestionarios(data || []);
    } catch (error) {
      console.error('Erro ao carregar questionários:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os questionários.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNome('');
    setAtivo(true);
    setQuestions([{ ...DEFAULT_QUESTION }]);
    setErrors([]);
    setExpandedIndex(0);
    setCreatingNew(false);
    setEditingQuestionario(null);
  };

  const handleNewQuestionario = () => {
    resetForm();
    setCreatingNew(true);
  };

  const handleEditQuestionario = (questionario) => {
    try {
      const estrutura = JSON.parse(questionario.estrutura_json || '{"titulo":"","campos":[]}');
      setNome(estrutura.titulo || questionario.nome);
      setAtivo(questionario.ativo);
      setQuestions(estrutura.campos?.length > 0 ? estrutura.campos : [{ ...DEFAULT_QUESTION }]);
      setEditingQuestionario(questionario);
      setCreatingNew(false);
      setExpandedIndex(0);
    } catch (error) {
      console.error('Erro ao carregar questionário para edição:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar o questionário.',
        variant: 'destructive',
      });
    }
  };

  const handleToggleAtivo = async (questionario) => {
    try {
      const { error } = await toggleQuestionarioAtivo(questionario.id, !questionario.ativo);
      if (error) throw error;

      setQuestionarios(prev => prev.map(q =>
        q.id === questionario.id ? { ...q, ativo: !q.ativo } : q
      ));

      toast({
        title: 'Sucesso',
        description: `Questionário ${!questionario.ativo ? 'ativado' : 'desativado'} com sucesso.`,
      });
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível alterar o status.',
        variant: 'destructive',
      });
    }
  };

  const handleAddQuestion = () => {
    const newIndex = questions.length;
    setQuestions((prev) => [...prev, { ...DEFAULT_QUESTION }]);
    setExpandedIndex(newIndex);
  };

  const handleRemoveQuestion = (index) => {
    const newQuestions = questions.filter((_, idx) => idx !== index);
    setQuestions(newQuestions);
    if (expandedIndex >= newQuestions.length && expandedIndex > 0) {
      setExpandedIndex(expandedIndex - 1);
    }
  };

  const handleMoveUp = (index) => {
    if (index === 0) return;
    const newQuestions = [...questions];
    [newQuestions[index], newQuestions[index - 1]] = [newQuestions[index - 1], newQuestions[index]];
    setQuestions(newQuestions);
    setExpandedIndex(index - 1);
  };

  const handleMoveDown = (index) => {
    if (index === questions.length - 1) return;
    const newQuestions = [...questions];
    [newQuestions[index], newQuestions[index + 1]] = [newQuestions[index + 1], newQuestions[index]];
    setQuestions(newQuestions);
    setExpandedIndex(index + 1);
  };

  const handleQuestionChange = (index, key, value) => {
    setQuestions((prev) =>
      prev.map((question, idx) => {
        if (idx !== index) return question;
        const nextQuestion = { ...question, [key]: value };
        if (key === 'tipo' && value !== 'radio' && value !== 'checkbox') {
          nextQuestion.opcoes = [''];
        }
        return nextQuestion;
      })
    );
  };

  const handleOptionChange = (questionIndex, optionIndex, value) => {
    setQuestions((prev) =>
      prev.map((question, idx) => {
        if (idx !== questionIndex) return question;
        const opcoes = [...question.opcoes];
        opcoes[optionIndex] = value;
        return { ...question, opcoes };
      })
    );
  };

  const handleAddOption = (questionIndex) => {
    setQuestions((prev) =>
      prev.map((question, idx) => {
        if (idx !== questionIndex) return question;
        return { ...question, opcoes: [...question.opcoes, ''] };
      })
    );
  };

  const handleRemoveOption = (questionIndex, optionIndex) => {
    setQuestions((prev) =>
      prev.map((question, idx) => {
        if (idx !== questionIndex) return question;
        const opcoes = question.opcoes.filter((_, optIdx) => optIdx !== optionIndex);
        return { ...question, opcoes: opcoes.length ? opcoes : [''] };
      })
    );
  };

  const validateForm = () => {
    const validationErrors = [];
    if (!nome.trim()) {
      validationErrors.push('Nome do questionário é obrigatório.');
    }

    if (!questions.length) {
      validationErrors.push('Adicione pelo menos uma pergunta.');
    }

    questions.forEach((question, index) => {
      if (!question.label.trim()) {
        validationErrors.push(`Pergunta ${index + 1} não pode ficar vazia.`);
      }

      if (question.tipo === 'radio' || question.tipo === 'checkbox') {
        const validOptions = question.opcoes.filter((option) => option.trim());
        if (!validOptions.length) {
          validationErrors.push(`A pergunta ${index + 1} precisa de pelo menos uma opção.`);
        }
      }
    });

    return validationErrors;
  };

  const handleSave = async () => {
    const validationErrors = validateForm();
    if (validationErrors.length) {
      setErrors(validationErrors);
      toast({
        title: 'Dados incompletos',
        description: 'Revise o formulário antes de salvar.',
        variant: 'destructive',
      });
      return;
    }

    setErrors([]);
    setSaving(true);

    try {
      const estrutura = {
        titulo: nome.trim(),
        campos: questions.map((question, index) => {
          const campo = {
            id: `pergunta_${index + 1}`,
            label: question.label.trim(),
            tipo: question.tipo,
            obrigatorio: !!question.obrigatorio,
          };

          if (question.tipo === 'radio' || question.tipo === 'checkbox') {
            campo.opcoes = question.opcoes
              .filter((option) => option.trim())
              .map((option) => option.trim());
          }

          return campo;
        }),
      };

      const payload = {
        nome: nome.trim(),
        ativo,
        estrutura_json: JSON.stringify(estrutura),
      };

      let response;
      if (editingQuestionario) {
        response = await updateQuestionario(editingQuestionario.id, payload);
      } else {
        response = await createQuestionario(payload);
      }

      if (response.error) throw response.error;

      toast({
        title: 'Sucesso',
        description: editingQuestionario ? 'Questionário atualizado com sucesso.' : 'Questionário criado com sucesso.',
      });

      resetForm();
      loadAllQuestionarios();
    } catch (error) {
      console.error('Erro ao salvar questionário:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o questionário.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Header com lista de questionários */}
      {!creatingNew && !editingQuestionario && (
        <>
          <div className="border-b border-slate-200 pb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Questionários</h2>
              <p className="mt-1 text-sm text-slate-600">Gerencie todos os questionários.</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleNewQuestionario}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white font-semibold text-sm shadow-lg shadow-brand-200 hover:bg-brand-700 transition-all"
            >
              <Plus className="h-4 w-4" />
              Novo questionário
            </motion.button>
          </div>

          {/* Lista de questionários */}
          <div className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
              </div>
            ) : questionarios.length === 0 ? (
              <div className="text-center py-12 rounded-xl border border-dashed border-slate-300 bg-slate-50">
                <p className="text-slate-600 mb-4">Nenhum questionário cadastrado.</p>
                <button
                  onClick={handleNewQuestionario}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition"
                >
                  <Plus className="h-4 w-4" />
                  Criar primeiro questionário
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {questionarios.map((questionario) => (
                  <motion.div
                    key={questionario.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-lg border border-slate-200 bg-white p-4 flex items-center justify-between hover:shadow-md transition-shadow"
                  >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600 flex-shrink-0">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-slate-900 truncate">{questionario.nome}</h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Criado em {new Date(questionario.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                      questionario.ativo
                        ? 'bg-green-100 text-green-800'
                        : 'bg-slate-100 text-slate-800'
                    }`}>
                      {questionario.ativo ? 'Ativo' : 'Inativo'}
                    </span>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleEditQuestionario(questionario)}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleToggleAtivo(questionario)}
                        className={`p-2 rounded-lg transition ${
                          questionario.ativo
                            ? 'text-green-600 hover:bg-green-50'
                            : 'text-slate-400 hover:bg-slate-100'
                        }`}
                        title={questionario.ativo ? 'Desativar' : 'Ativar'}
                      >
                        {questionario.ativo ? (
                          <ToggleRight className="h-5 w-5" />
                        ) : (
                          <ToggleLeft className="h-5 w-5" />
                        )}
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Builder */}
      {(creatingNew || editingQuestionario) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          <div className="border-b border-slate-200 pb-6">
            <button
              onClick={resetForm}
              className="text-sm font-semibold text-slate-600 hover:text-slate-900 mb-4"
            >
              ← Voltar
            </button>
            <h2 className="text-2xl font-bold text-slate-900">
              {editingQuestionario ? 'Editar questionário' : 'Criar novo questionário'}
            </h2>
            <p className="mt-1 text-sm text-slate-600">Construtor visual para estruturar perguntas.</p>
          </div>

          {/* Configurações básicas */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="grid gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Nome do questionário</label>
            <input
              type="text"
              value={nome}
              onChange={(event) => setNome(event.target.value)}
              placeholder="Ex: Questionário de inscrição"
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <label className="inline-flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={ativo}
                onChange={(event) => setAtivo(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              <span className="font-medium">Ativar questionário</span>
            </label>
          </div>
        </div>
      </div>

      {/* Erros de validação */}
      {errors.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-rose-200 bg-rose-50 p-4"
        >
          <p className="text-sm font-semibold text-rose-800 mb-2">Corrija antes de salvar:</p>
          <ul className="space-y-1 text-sm text-rose-700">
            {errors.map((error, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-rose-400 mt-1">•</span>
                {error}
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Lista de perguntas - Builder style */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">Perguntas</h3>
        
        <AnimatePresence mode="popLayout">
          {questions.map((question, index) => {
            const isExpanded = expandedIndex === index;
            const typeLabel = {
              texto: 'Texto',
              textarea: 'Texto longo',
              numero: 'Número',
              radio: 'Múltipla escolha',
              checkbox: 'Caixas de seleção',
            }[question.tipo];

            return (
              <motion.div
                key={index}
                layout
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Header (sempre visível) */}
                <button
                  onClick={() => setExpandedIndex(isExpanded ? -1 : index)}
                  className="w-full flex items-center justify-between gap-4 p-4 hover:bg-slate-50 transition-colors text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="flex-shrink-0 inline-flex items-center justify-center h-7 w-7 rounded-lg bg-brand-100 text-brand-700 text-xs font-semibold">
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {question.label || 'Pergunta sem título'}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {typeLabel}
                          {question.obrigatorio && ' • Obrigatória'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="h-5 w-5 text-slate-400" />
                    </motion.div>
                  </div>
                </button>

                {/* Conteúdo expandido */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-slate-200 bg-slate-50"
                    >
                      <div className="p-4 space-y-4">
                        {/* Campo de pergunta */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Pergunta</label>
                          <input
                            type="text"
                            value={question.label}
                            onChange={(e) => handleQuestionChange(index, 'label', e.target.value)}
                            placeholder="Ex: Qual é o seu nome completo?"
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                          />
                        </div>

                        {/* Tipo e Obrigatório */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Tipo</label>
                            <select
                              value={question.tipo}
                              onChange={(e) => handleQuestionChange(index, 'tipo', e.target.value)}
                              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                            >
                              <option value="texto">Texto</option>
                              <option value="textarea">Texto longo</option>
                              <option value="numero">Número</option>
                              <option value="radio">Múltipla escolha</option>
                              <option value="checkbox">Caixas de seleção</option>
                            </select>
                          </div>

                          <div className="flex items-end">
                            <label className="inline-flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors w-full justify-center">
                              <input
                                type="checkbox"
                                checked={question.obrigatorio}
                                onChange={(e) => handleQuestionChange(index, 'obrigatorio', e.target.checked)}
                                className="h-4 w-4 rounded border-slate-300 text-brand-600"
                              />
                              <span className="text-xs font-medium text-slate-700">Obrigatória</span>
                            </label>
                          </div>
                        </div>

                        {/* Opções para radio/checkbox */}
                        {(question.tipo === 'radio' || question.tipo === 'checkbox') && (
                          <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-3">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Opções</label>
                              <button
                                type="button"
                                onClick={() => handleAddOption(index)}
                                className="text-xs font-semibold text-brand-600 hover:text-brand-700 transition"
                              >
                                + Adicionar
                              </button>
                            </div>
                            <div className="space-y-2">
                              {question.opcoes.map((option, optIdx) => (
                                <div key={optIdx} className="flex gap-2">
                                  <input
                                    type="text"
                                    value={option}
                                    onChange={(e) => handleOptionChange(index, optIdx, e.target.value)}
                                    placeholder={`Opção ${optIdx + 1}`}
                                    className="flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveOption(index, optIdx)}
                                    className="px-2 py-2 text-xs text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Footer com botões de ação */}
                      <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between gap-2">
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => handleMoveUp(index)}
                            disabled={index === 0}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition"
                            title="Mover para cima"
                          >
                            <ArrowUp className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveDown(index)}
                            disabled={index === questions.length - 1}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition"
                            title="Mover para baixo"
                          >
                            <ArrowDown className="h-4 w-4" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(index)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition ml-auto"
                          title="Remover pergunta"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Botão adicionar pergunta */}
        <motion.button
          type="button"
          onClick={handleAddQuestion}
          className="w-full py-3 rounded-xl border-2 border-dashed border-slate-300 hover:border-brand-500 bg-slate-50 hover:bg-brand-50 text-slate-700 hover:text-brand-700 font-medium text-sm transition-all"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <Plus className="h-4 w-4 inline-block mr-2" />
          Adicionar pergunta
        </motion.button>
      </div>

          {/* Botão salvar */}
          <div className="flex justify-end pt-4 border-t border-slate-200">
            <motion.button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 rounded-xl bg-brand-600 text-white font-semibold text-sm shadow-lg shadow-brand-200 hover:bg-brand-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {saving ? 'Salvando...' : editingQuestionario ? 'Atualizar questionário' : 'Salvar questionário'}
            </motion.button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default QuestionariosModule;
