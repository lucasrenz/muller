import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Edit, ToggleLeft, ToggleRight, Plus, Building2, Users, FileText, Loader2, Calendar, ArrowLeft } from 'lucide-react';
import { useToast } from './ui/use-toast';
import {
  fetchVagas,
  createVaga,
  updateVaga,
  toggleVagaStatus,
  fetchLojas,
  fetchCargos,
  fetchQuestionarios
} from '../lib/rhService';

const VagasModule = ({ isOpen, onClose }) => {
  const { toast } = useToast();
  const [vagas, setVagas] = useState([]);
  const [lojas, setLojas] = useState([]);
  const [cargos, setCargos] = useState([]);
  const [questionarios, setQuestionarios] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingVaga, setEditingVaga] = useState(null);
  const [formData, setFormData] = useState({
    loja_id: '',
    cargo_id: '',
    questionario_id: '',
    quantidade: 1,
    data_fechamento: '',
  });

  // Carregar dados
  const loadData = async () => {
    try {
      setIsLoading(true);
      const [vagasRes, lojasRes, cargosRes, questionariosRes] = await Promise.all([
        fetchVagas(),
        fetchLojas(),
        fetchCargos(),
        fetchQuestionarios(),
      ]);

      if (vagasRes.error) throw vagasRes.error;
      if (lojasRes.error) throw lojasRes.error;
      if (cargosRes.error) throw cargosRes.error;
      if (questionariosRes.error) throw questionariosRes.error;

      setVagas(vagasRes.data || []);
      setLojas(lojasRes.data || []);
      setCargos(cargosRes.data || []);
      setQuestionarios(questionariosRes.data || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  // Reset form
  const resetForm = () => {
    setFormData({
      loja_id: '',
      cargo_id: '',
      questionario_id: '',
      quantidade: 1,
      data_fechamento: '',
    });
    setEditingVaga(null);
    setIsCreating(false);
  };

  // Handle new vaga
  const handleNew = () => {
    resetForm();
    setIsCreating(true);
  };

  // Handle edit
  const handleEdit = (vaga) => {
    setFormData({
      loja_id: vaga.loja_id || '',
      cargo_id: vaga.cargo_id || '',
      questionario_id: vaga.questionario_id || '',
      quantidade: vaga.quantidade || 1,
      data_fechamento: vaga.data_fechamento ? vaga.data_fechamento.split('T')[0] : '',
    });
    setEditingVaga(vaga);
    setIsCreating(false);
  };

  // Handle toggle status
  const handleToggleStatus = async (vaga) => {
    const newStatus = vaga.status === 'aberta' ? 'fechada' : 'aberta';
    try {
      const { data, error } = await toggleVagaStatus(vaga.id, newStatus);
      if (error) throw error;

      setVagas(prev => prev.map(v =>
        v.id === vaga.id ? { ...v, status: newStatus, data_fechamento: data.data_fechamento } : v
      ));

      toast({
        title: 'Sucesso',
        description: `Vaga ${newStatus === 'aberta' ? 'reaberta' : 'fechada'} com sucesso.`,
      });
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível alterar o status da vaga.',
        variant: 'destructive',
      });
    }
  };

  // Handle save
  const handleSave = async () => {
    if (!formData.loja_id || !formData.cargo_id) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Loja e cargo são obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    if (formData.quantidade < 1) {
      toast({
        title: 'Quantidade inválida',
        description: 'A quantidade deve ser pelo menos 1.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Sanitizar dados: converter strings vazias em null para campos de data
      const sanitizedData = {
        ...formData,
        data_fechamento: formData.data_fechamento?.trim() === '' ? null : formData.data_fechamento,
      };

      let result;
      if (editingVaga) {
        result = await updateVaga(editingVaga.id, sanitizedData);
      } else {
        result = await createVaga(sanitizedData);
      }

      if (result.error) throw result.error;

      if (editingVaga) {
        setVagas(prev => prev.map(v =>
          v.id === editingVaga.id ? result.data : v
        ));
        toast({
          title: 'Sucesso',
          description: 'Vaga atualizada com sucesso.',
        });
      } else {
        setVagas(prev => [result.data, ...prev]);
        toast({
          title: 'Sucesso',
          description: 'Vaga criada com sucesso.',
        });
      }

      resetForm();
    } catch (error) {
      console.error('Erro ao salvar vaga:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar a vaga.',
        variant: 'destructive',
      });
    }
  };

  // Handle cancel
  const handleCancel = () => {
    resetForm();
  };

  // Get related data names
  const getLojaName = (lojaId) => {
    const loja = lojas.find(l => l.id === lojaId);
    return loja ? loja.nome : 'Loja não encontrada';
  };

  const getCargoName = (cargoId) => {
    const cargo = cargos.find(c => c.id === cargoId);
    return cargo ? cargo.nome : 'Cargo não encontrado';
  };

  const getQuestionarioName = (questionarioId) => {
    const questionario = questionarios.find(q => q.id === questionarioId);
    return questionario ? questionario.nome : 'Sem questionário';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const statusColors = {
    aberta: { bg: 'bg-green-100', text: 'text-green-800', label: 'Aberta' },
    pausada: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pausada' },
    fechada: { bg: 'bg-red-100', text: 'text-red-800', label: 'Fechada' },
  };

  return (
    <div className="space-y-6">
      {/* Header + Lista */}
      {!isCreating && !editingVaga && (
        <>
          <div className="border-b border-slate-200 pb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Vagas</h2>
              <p className="mt-1 text-sm text-slate-600">Gerencie todas as vagas disponíveis.</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleNew}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white font-semibold text-sm shadow-lg shadow-brand-200 hover:bg-brand-700 transition-all"
            >
              <Plus className="h-4 w-4" />
              Nova vaga
            </motion.button>
          </div>

          {/* List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : vagas.length === 0 ? (
            <div className="text-center py-12 rounded-xl border border-dashed border-slate-300 bg-slate-50">
              <Briefcase className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-slate-900 mb-2">Nenhuma vaga cadastrada</h4>
              <p className="text-slate-600 mb-4">Comece criando sua primeira vaga.</p>
              <button
                onClick={handleNew}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Criar primeira vaga
              </button>
            </div>
          ) : (
            <div className="grid gap-3">
              {vagas.map((vaga) => {
                const statusConfig = statusColors[vaga.status] || statusColors.aberta;
                return (
                  <motion.div
                    key={vaga.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-lg border border-slate-200 bg-white p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 flex-shrink-0">
                          <Briefcase className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-slate-900">{getCargoName(vaga.cargo_id)}</h4>
                          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                            <Building2 className="h-3 w-3" />
                            <span className="truncate">{getLojaName(vaga.loja_id)}</span>
                            <span>•</span>
                            <span>{vaga.quantidade} vaga{vaga.quantidade !== 1 ? 's' : ''}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                          {statusConfig.label}
                        </span>

                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleEdit(vaga)}
                          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleToggleStatus(vaga)}
                          className={`p-2 rounded-lg transition ${
                            vaga.status === 'aberta'
                              ? 'text-green-600 hover:bg-green-50'
                              : 'text-slate-400 hover:bg-slate-100'
                          }`}
                          title={vaga.status === 'aberta' ? 'Fechar' : 'Reabrir'}
                        >
                          {vaga.status === 'aberta' ? (
                            <ToggleRight className="h-5 w-5" />
                          ) : (
                            <ToggleLeft className="h-5 w-5" />
                          )}
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Form */}
      {(isCreating || editingVaga) && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="border-b border-slate-200 pb-4">
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </button>
            <h2 className="text-2xl font-bold text-slate-900">
              {editingVaga ? 'Editar Vaga' : 'Nova Vaga'}
            </h2>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Loja *
                </label>
                <select
                  value={formData.loja_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, loja_id: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="">Selecione uma loja</option>
                  {lojas.filter(l => l.ativo).map((loja) => (
                    <option key={loja.id} value={loja.id}>
                      {loja.nome} - {loja.cidade}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Cargo *
                </label>
                <select
                  value={formData.cargo_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, cargo_id: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="">Selecione um cargo</option>
                  {cargos.filter(c => c.ativo).map((cargo) => (
                    <option key={cargo.id} value={cargo.id}>
                      {cargo.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Questionário
                </label>
                <select
                  value={formData.questionario_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, questionario_id: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="">Sem questionário</option>
                  {questionarios.filter(q => q.ativo).map((questionario) => (
                    <option key={questionario.id} value={questionario.id}>
                      {questionario.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Quantidade
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.quantidade}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantidade: parseInt(e.target.value) || 1 }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Data de Fechamento (opcional)
                </label>
                <input
                  type="date"
                  value={formData.data_fechamento}
                  onChange={(e) => setFormData(prev => ({ ...prev, data_fechamento: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-200">
              <button
                onClick={handleCancel}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSave}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
              >
                Salvar
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default VagasModule;