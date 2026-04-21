import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Edit, ToggleLeft, ToggleRight, Plus, Briefcase, Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from './ui/use-toast';
import { fetchCargos, createCargo, updateCargo, toggleCargoAtivo } from '../lib/rhService';

const CargosModule = ({ isOpen, onClose }) => {
  const { toast } = useToast();
  const [cargos, setCargos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingCargo, setEditingCargo] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
  });

  // Carregar cargos
  const loadCargos = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await fetchCargos();
      if (error) throw error;
      setCargos(data || []);
    } catch (error) {
      console.error('Erro ao carregar cargos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os cargos.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadCargos();
    }
  }, [isOpen]);

  // Reset form
  const resetForm = () => {
    setFormData({
      nome: '',
      descricao: '',
    });
    setEditingCargo(null);
    setIsCreating(false);
  };

  // Handle new cargo
  const handleNew = () => {
    resetForm();
    setIsCreating(true);
  };

  // Handle edit
  const handleEdit = (cargo) => {
    setFormData({
      nome: cargo.nome,
      descricao: cargo.descricao || '',
    });
    setEditingCargo(cargo);
    setIsCreating(false);
  };

  // Handle toggle ativo
  const handleToggleAtivo = async (cargo) => {
    try {
      const { data, error } = await toggleCargoAtivo(cargo.id, !cargo.ativo);
      if (error) throw error;

      setCargos(prev => prev.map(c =>
        c.id === cargo.id ? { ...c, ativo: !c.ativo } : c
      ));

      toast({
        title: 'Sucesso',
        description: `Cargo ${!cargo.ativo ? 'ativado' : 'desativado'} com sucesso.`,
      });
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível alterar o status do cargo.',
        variant: 'destructive',
      });
    }
  };

  // Handle save
  const handleSave = async () => {
    if (!formData.nome.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Nome é obrigatório.',
        variant: 'destructive',
      });
      return;
    }

    try {
      let result;
      if (editingCargo) {
        result = await updateCargo(editingCargo.id, formData);
      } else {
        result = await createCargo(formData);
      }

      if (result.error) throw result.error;

      if (editingCargo) {
        setCargos(prev => prev.map(c =>
          c.id === editingCargo.id ? result.data : c
        ));
        toast({
          title: 'Sucesso',
          description: 'Cargo atualizado com sucesso.',
        });
      } else {
        setCargos(prev => [result.data, ...prev]);
        toast({
          title: 'Sucesso',
          description: 'Cargo criado com sucesso.',
        });
      }

      resetForm();
    } catch (error) {
      console.error('Erro ao salvar cargo:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o cargo.',
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
      {/* Header + Lista */}
      {!isCreating && !editingCargo && (
        <>
          <div className="border-b border-slate-200 pb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Cargos</h2>
              <p className="mt-1 text-sm text-slate-600">Gerencie todos os cargos cadastrados.</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleNew}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white font-semibold text-sm shadow-lg shadow-brand-200 hover:bg-brand-700 transition-all"
            >
              <Plus className="h-4 w-4" />
              Novo cargo
            </motion.button>
          </div>

          {/* List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : cargos.length === 0 ? (
            <div className="text-center py-12 rounded-xl border border-dashed border-slate-300 bg-slate-50">
              <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-slate-900 mb-2">Nenhum cargo cadastrado</h4>
              <p className="text-slate-600 mb-4">Comece criando seu primeiro cargo.</p>
              <button
                onClick={handleNew}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Criar primeiro cargo
              </button>
            </div>
          ) : (
            <div className="grid gap-3">
              {cargos.map((cargo) => (
                <motion.div
                  key={cargo.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg border border-slate-200 bg-white p-4 flex items-center justify-between hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600 flex-shrink-0">
                      <Briefcase className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-slate-900">{cargo.nome}</h4>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 whitespace-pre-line">{cargo.descricao || 'Sem descrição'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                      cargo.ativo
                        ? 'bg-green-100 text-green-800'
                        : 'bg-slate-100 text-slate-800'
                    }`}>
                      {cargo.ativo ? 'Ativo' : 'Inativo'}
                    </span>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleEdit(cargo)}
                      className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
                      title="Editar"
                    >
                      <Edit className="h-4 w-4" />
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleToggleAtivo(cargo)}
                      className={`p-2 rounded-lg transition ${
                        cargo.ativo
                          ? 'text-green-600 hover:bg-green-50'
                          : 'text-slate-400 hover:bg-slate-100'
                      }`}
                      title={cargo.ativo ? 'Desativar' : 'Ativar'}
                    >
                      {cargo.ativo ? (
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
      {(isCreating || editingCargo) && (
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
              {editingCargo ? 'Editar Cargo' : 'Novo Cargo'}
            </h2>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 flex flex-col min-h-[550px]">
            <div className="space-y-4 mb-6 flex-1">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nome do Cargo *
                </label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  placeholder="Digite o nome do cargo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Descrição
                </label>
                <textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                  rows={8}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 resize-none"
                  placeholder="Digite uma descrição para o cargo (opcional)"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-200 flex-shrink-0">
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

export default CargosModule;