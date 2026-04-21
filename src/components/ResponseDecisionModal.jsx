import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, AlertCircle, Loader2, RefreshCw } from 'lucide-react';

const ResponseDecisionModal = ({ 
  isOpen, 
  onClose, 
  request, 
  onApprove, 
  onReject,
  isLoading 
}) => {
  const [selectedAction, setSelectedAction] = useState(null);
  const [limite, setLimite] = useState('');
  const [motivo, setMotivo] = useState('');
  const [senha, setSenha] = useState('');
  const [errors, setErrors] = useState({});

  // Gerar senha automática ao selecionar "Aprovar"
  useEffect(() => {
    if (selectedAction === 'approve') {
      gerarSenhaAutomatica();
    }
  }, [selectedAction]);

  const gerarSenhaAutomatica = () => {
    const novaSenha = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    setSenha(novaSenha);
  };

  const formatCurrency = (value) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length === 0) return '';
    
    const num = parseFloat(numbers) / 100;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(num);
  };

  const handleLimiteChange = (e) => {
    const value = e.target.value;
    setLimite(formatCurrency(value));
    if (errors.limite) {
      setErrors({ ...errors, limite: null });
    }
  };

  const handleSenhaChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    setSenha(value);
    if (errors.senha) {
      setErrors({ ...errors, senha: null });
    }
  };

  const handleMotivoChange = (e) => {
    const value = e.target.value;
    setMotivo(value);
    if (errors.motivo) {
      setErrors({ ...errors, motivo: null });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (selectedAction === 'approve' && !limite) {
      newErrors.limite = 'Limite é obrigatório';
    }

    if (selectedAction === 'approve' && !senha) {
      newErrors.senha = 'Senha é obrigatória';
    }

    if (selectedAction === 'approve' && senha.length !== 4) {
      newErrors.senha = 'Senha deve ter exatamente 4 dígitos';
    }

    if (selectedAction === 'approve' && !/^\d+$/.test(senha)) {
      newErrors.senha = 'Senha deve conter apenas números';
    }
    
    if (selectedAction === 'reject' && !motivo.trim()) {
      newErrors.motivo = 'Motivo é obrigatório';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleApprove = async () => {
    if (!validateForm()) return;
    setSelectedAction('approve');

    // Atualizar lógica para salvar status e contrato
    const updatedRequest = {
      ...request,
      status: 'aguardando_documentacao', // Novo status
      contrato: 'pendente', // Sempre pendente ao aprovar
      limite,
      senha,
    };

    await onApprove(updatedRequest);
    resetForm();
  };

  const handleReject = async () => {
    if (!validateForm()) return;
    setSelectedAction('reject');
    await onReject(motivo);
    resetForm();
  };

  const resetForm = () => {
    setSelectedAction(null);
    setLimite('');
    setSenha('');
    setMotivo('');
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!request) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden"
          >
            {/* Header */}
            <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-br from-gray-50 to-white">
              <div className="flex items-start justify-between mb-1">
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Responder solicitação
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Escolha a ação e preencha as informações necessárias
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  disabled={isLoading}
                  className="ml-4 text-gray-400 hover:text-gray-600 transition-colors p-1.5 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="px-8 py-8">
              {/* Cliente Info */}
              <div className="mb-8 p-4 bg-gray-50 rounded-xl">
                <p className="text-sm font-medium text-gray-600 mb-2">Cliente</p>
                <p className="text-base font-semibold text-gray-900">
                  {request.nome_completo || 'Não informado'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  CPF: {request.cpf}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {/* Approve Button */}
                <button
                  onClick={() => {
                    setSelectedAction('approve');
                    setMotivo('');
                    setErrors({});
                  }}
                  disabled={isLoading}
                  className={`relative overflow-hidden group px-4 py-4 rounded-xl font-medium text-sm transition-all ${
                    selectedAction === 'approve'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                  } disabled:opacity-50`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Check className="w-5 h-5" />
                    <span className="text-xs font-semibold">Aprovar</span>
                  </div>
                </button>

                {/* Reject Button */}
                <button
                  onClick={() => {
                    setSelectedAction('reject');
                    setLimite('');
                    setErrors({});
                  }}
                  disabled={isLoading}
                  className={`relative overflow-hidden group px-4 py-4 rounded-xl font-medium text-sm transition-all ${
                    selectedAction === 'reject'
                      ? 'bg-red-600 text-white'
                      : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                  } disabled:opacity-50`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    <span className="text-xs font-semibold">Recusar</span>
                  </div>
                </button>
              </div>

              {/* Form Fields - Approve */}
              <AnimatePresence>
                {selectedAction === 'approve' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-6 space-y-4"
                  >
                    {/* Limite */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Limite concedido <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={limite}
                        onChange={handleLimiteChange}
                        placeholder="R$ 0,00"
                        disabled={isLoading}
                        className={`w-full px-4 py-3 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                          errors.limite
                            ? 'border-red-300 focus:ring-red-500'
                            : 'border-gray-200 focus:ring-emerald-500'
                        } disabled:bg-gray-100`}
                      />
                      {errors.limite && (
                        <p className="text-xs text-red-600 flex items-center gap-1">
                          <span className="inline-block w-1 h-1 bg-red-600 rounded-full" />
                          {errors.limite}
                        </p>
                      )}
                    </div>

                    {/* Senha do Cartão */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-sm font-semibold text-gray-700">
                          Senha do cartão <span className="text-red-500">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={gerarSenhaAutomatica}
                          disabled={isLoading}
                          className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 transition-colors px-2 py-1 hover:bg-emerald-50 rounded disabled:opacity-50"
                          title="Gerar nova senha"
                        >
                          <RefreshCw className="w-3 h-3" />
                          Gerar
                        </button>
                      </div>
                      <input
                        type="text"
                        value={senha}
                        onChange={handleSenhaChange}
                        placeholder="0000"
                        maxLength="4"
                        disabled={isLoading}
                        className={`w-full px-4 py-3 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-all font-mono text-center tracking-widest ${
                          errors.senha
                            ? 'border-red-300 focus:ring-red-500'
                            : 'border-gray-200 focus:ring-emerald-500'
                        } disabled:bg-gray-100`}
                      />
                      <p className="text-xs text-gray-500">
                        4 dígitos. Uma senha foi gerada automaticamente, mas você pode alterá-la.
                      </p>
                      {errors.senha && (
                        <p className="text-xs text-red-600 flex items-center gap-1">
                          <span className="inline-block w-1 h-1 bg-red-600 rounded-full" />
                          {errors.senha}
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Form Fields - Reject */}
              <AnimatePresence>
                {selectedAction === 'reject' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-6 space-y-2"
                  >
                    <label className="block text-sm font-semibold text-gray-700">
                      Motivo da recusa <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={motivo}
                      onChange={handleMotivoChange}
                      placeholder="Digite o motivo da recusa..."
                      disabled={isLoading}
                      className={`w-full px-4 py-3 text-sm border rounded-lg focus:outline-none focus:ring-2 resize-none transition-all ${
                        errors.motivo
                          ? 'border-red-300 focus:ring-red-500'
                          : 'border-gray-200 focus:ring-red-500'
                      } disabled:bg-gray-100`}
                      rows="3"
                    />
                    {errors.motivo && (
                      <p className="text-xs text-red-600 flex items-center gap-1">
                        <span className="inline-block w-1 h-1 bg-red-600 rounded-full" />
                        {errors.motivo}
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Divider */}
              <div className="h-px bg-gray-100 mb-6" />

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={handleClose}
                  disabled={isLoading}
                  className="px-4 py-2.5 text-gray-700 text-sm font-medium bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                {selectedAction && (
                  <motion.button
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={selectedAction === 'approve' ? handleApprove : handleReject}
                    disabled={isLoading}
                    className={`px-4 py-2.5 text-white text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
                      selectedAction === 'approve'
                        ? 'bg-emerald-600 hover:bg-emerald-700'
                        : 'bg-red-600 hover:bg-red-700'
                    } disabled:opacity-50`}
                  >
                    {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isLoading ? 'Salvando...' : (selectedAction === 'approve' ? 'Aprovar' : 'Recusar')}
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ResponseDecisionModal;
