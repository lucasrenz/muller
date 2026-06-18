import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building2, Edit, ToggleLeft, ToggleRight, Plus, MapPin, Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from './ui/use-toast';
import { fetchLojas, createLoja, updateLoja, toggleLojaAtivo } from '../lib/rhService';

const LojasModule = ({ isOpen, onClose }) => {
  const { toast } = useToast();
  const [lojas, setLojas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingLoja, setEditingLoja] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    cidade: '',
    endereco: '',
  });

  // Carregar lojas
  const loadLojas = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await fetchLojas();
      if (error) throw error;
      setLojas(data || []);
    } catch (error) {
      console.error('Erro ao carregar lojas:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as lojas.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadLojas();
    }
  }, [isOpen]);

  // Reset form
  const resetForm = () => {
    setFormData({
      nome: '',
      cidade: '',
      endereco: '',
    });
    setEditingLoja(null);
    setIsCreating(false);
  };

  // Handle new loja
  const handleNew = () => {
    resetForm();
    setIsCreating(true);
  };

  // Handle edit
  const handleEdit = (loja) => {
    setFormData({
      nome: loja.nome,
      cidade: loja.cidade,
      endereco: loja.endereco,
    });
    setEditingLoja(loja);
    setIsCreating(false);
  };

  // Handle toggle ativo
  const handleToggleAtivo = async (loja) => {
    try {
      const { data, error } = await toggleLojaAtivo(loja.id, !loja.ativo);
      if (error) throw error;

      setLojas(prev => prev.map(l =>
        l.id === loja.id ? { ...l, ativo: !l.ativo } : l
      ));

      toast({
        title: 'Sucesso',
        description: `Loja ${!loja.ativo ? 'ativada' : 'desativada'} com sucesso.`,
      });
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível alterar o status da loja.',
        variant: 'destructive',
      });
    }
  };

  // Handle save
  const handleSave = async () => {
    if (!formData.nome.trim() || !formData.cidade.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Nome e cidade são obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    try {
      let result;
      if (editingLoja) {
        result = await updateLoja(editingLoja.id, formData);
      } else {
        result = await createLoja(formData);
      }

      if (result.error) throw result.error;

      if (editingLoja) {
        setLojas(prev => prev.map(l =>
          l.id === editingLoja.id ? result.data : l
        ));
        toast({
          title: 'Sucesso',
          description: 'Loja atualizada com sucesso.',
        });
      } else {
        setLojas(prev => [result.data, ...prev]);
        toast({
          title: 'Sucesso',
          description: 'Loja criada com sucesso.',
        });
      }

      resetForm();
    } catch (error) {
      console.error('Erro ao salvar loja:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar a loja.',
        variant: 'destructive',
      });
    }
  };

  // Handle cancel
  const handleCancel = () => {
    resetForm();
  };

  return (
    <div className="space-y-6">
      {/* Header + Listagem */}
      {!isCreating && !editingLoja && (
        <>
          <div className="border-b border-slate-200 pb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Lojas</h2>
              <p className="mt-1 text-sm text-slate-600">Gerencie todas as lojas cadastradas.</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleNew}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white font-semibold text-sm shadow-lg shadow-brand-200 hover:bg-brand-700 transition-all"
            >
              <Plus className="h-4 w-4" />
              Nova loja
            </motion.button>
          </div>

          {/* List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : lojas.length === 0 ? (
            <div className="text-center py-12 rounded-xl border border-dashed border-slate-300 bg-slate-50">
              <Building2 className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-slate-900 mb-2">Nenhuma loja cadastrada</h4>
              <p className="text-slate-600 mb-4">Comece criando sua primeira loja.</p>
              <button
                onClick={handleNew}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Criar primeira loja
              </button>
            </div>
          ) : (
            <div className="grid gap-3">
              {lojas.map((loja) => (
                <motion.div
                  key={loja.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg border border-slate-200 bg-white p-4 flex items-center justify-between hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 flex-shrink-0">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-slate-900">{loja.nome}</h4>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <MapPin className="h-3 w-3" />
                        <span>{loja.cidade}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                      loja.ativo
                        ? 'bg-green-100 text-green-800'
                        : 'bg-slate-100 text-slate-800'
                    }`}>
                      {loja.ativo ? 'Ativa' : 'Inativa'}
                    </span>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleEdit(loja)}
                      className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
                      title="Editar"
                    >
                      <Edit className="h-4 w-4" />
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleToggleAtivo(loja)}
                      className={`p-2 rounded-lg transition ${
                        loja.ativo
                          ? 'text-green-600 hover:bg-green-50'
                          : 'text-slate-400 hover:bg-slate-100'
                      }`}
                      title={loja.ativo ? 'Desativar' : 'Ativar'}
                    >
                      {loja.ativo ? (
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
        </>
      )}

      {/* Form */}
      {(isCreating || editingLoja) && (
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
              {editingLoja ? 'Editar Loja' : 'Nova Loja'}
            </h2>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nome da Loja *
                </label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  placeholder="Digite o nome da loja"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Cidade *
                </label>
                <input
                  type="text"
                  value={formData.cidade}
                  onChange={(e) => setFormData(prev => ({ ...prev, cidade: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  placeholder="Digite a cidade"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Endereço
                </label>
                <input
                  type="text"
                  value={formData.endereco}
                  onChange={(e) => setFormData(prev => ({ ...prev, endereco: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  placeholder="Digite o endereço completo"
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

export default LojasModule;