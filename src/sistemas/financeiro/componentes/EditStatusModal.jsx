import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';

const EditStatusModal = ({ 
  isOpen, 
  onClose, 
  request, 
  currentStatus,
  onSave,
  isLoading 
}) => {
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);
  const [notes, setNotes] = useState('');

  const statusOptions = [
    {
      value: 'em_analise',
      label: 'Em análise',
      description: 'Solicitação ainda em avaliação',
      color: 'bg-amber-50 border-amber-200 text-amber-700',
      dotColor: 'bg-amber-500',
    },
    {
      value: 'aprovado',
      label: 'Aprovado',
      description: 'Solicitação aprovada',
      color: 'bg-emerald-50 border-emerald-200 text-emerald-700',
      dotColor: 'bg-emerald-500',
    },
    {
      value: 'recusado',
      label: 'Recusado',
      description: 'Solicitação recusada',
      color: 'bg-red-50 border-red-200 text-red-700',
      dotColor: 'bg-red-500',
    },
    {
      value: 'aguardando_documentacao',
      label: 'Aguardando Documentação',
      description: 'Documentação pendente',
      color: 'bg-blue-50 border-blue-200 text-blue-700',
      dotColor: 'bg-blue-500',
    },
    {
      value: 'aguardando_assinatura',
      label: 'Aguardando Assinatura',
      description: 'Aguardando assinatura do contrato',
      color: 'bg-purple-50 border-purple-200 text-purple-700',
      dotColor: 'bg-purple-500',
    },
    {
      value: 'assinado',
      label: 'Assinado',
      description: 'Contrato assinado',
      color: 'bg-green-50 border-green-200 text-green-700',
      dotColor: 'bg-green-500',
    },
  ];

  const handleSave = async () => {
    if (selectedStatus === currentStatus && !notes) {
      onClose();
      return;
    }
    await onSave(selectedStatus, notes);
    setSelectedStatus(currentStatus);
    setNotes('');
  };

  const handleClose = () => {
    setSelectedStatus(currentStatus);
    setNotes('');
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
                    Editar status
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Altere o status com atenção
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

              {/* Status Options */}
              <div className="mb-8">
                <label className="block text-sm font-semibold text-gray-700 mb-4">
                  Novo status
                </label>
                <div className="space-y-3">
                  {statusOptions.map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedStatus === option.value
                          ? `${option.color} border-current`
                          : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center pt-1">
                        <input
                          type="radio"
                          name="status"
                          value={option.value}
                          checked={selectedStatus === option.value}
                          onChange={() => setSelectedStatus(option.value)}
                          className="w-4 h-4 cursor-pointer"
                          disabled={isLoading}
                        />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {option.label}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {option.description}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="mb-8">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Observações (opcional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Digite o motivo da alteração de status..."
                  disabled={isLoading}
                  className="w-full px-4 py-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:bg-gray-100"
                  rows="3"
                />
              </div>

              {/* Divider */}
              <div className="h-px bg-gray-100 mb-6" />

              {/* Actions */}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={handleClose}
                  disabled={isLoading}
                  className="px-4 py-2.5 text-gray-700 text-sm font-medium bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="px-4 py-2.5 text-white text-sm font-medium bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isLoading ? 'Salvando...' : 'Salvar alteração'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default EditStatusModal;
