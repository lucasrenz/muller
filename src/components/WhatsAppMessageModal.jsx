import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const WhatsAppMessageModal = ({ isOpen, onClose, request, onSendTemplate, onSendCustom }) => {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [customMessage, setCustomMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const templates = [
    {
      id: 1,
      name: 'Limite Aprovado - Retomada de Contato',
      description: 'Retomada de contato com clientes que já possuem limite aprovado, mas ainda não enviaram a documentação necessária.',
    },
    {
      id: 2,
      name: 'Limite Aprovado - Reforço de Contato',
      description: 'Reforço de contato com clientes que já possuem limite aprovado há alguns dias, mas ainda não enviaram a documentação. A mensagem busca retomar o atendimento com leve urgência, incentivando o envio dos documentos para liberação do cartão.',
    },
    {
      id: 3,
      name: 'Cartão Aprovado - Liberação para Assinatura',
      description: 'Mensagem enviada após o recebimento e validação dos documentos do cliente. Informa que o processo está concluído e orienta o cliente a comparecer a uma loja para assinatura do contrato, com liberação imediata do cartão para uso.',
    },
  ];

  const handleSendTemplate = async (templateId) => {
    setIsLoading(true);

    try {
      await onSendTemplate(templateId);
      resetModal();
      onClose();
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast({
        variant: "destructive",
        title: "Erro ao enviar",
        description: error.message || "Não foi possível enviar a mensagem",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendCustomMessage = async () => {
    if (!customMessage.trim()) {
      toast({
        variant: "destructive",
        title: "Campo vazio",
        description: "Por favor, escreva uma mensagem antes de enviar",
      });
      return;
    }

    setIsLoading(true);

    try {
      await onSendCustom(customMessage);
      resetModal();
      onClose();
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast({
        variant: "destructive",
        title: "Erro ao enviar",
        description: error.message || "Não foi possível enviar a mensagem",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetModal = () => {
    setSelectedTemplate(null);
    setCustomMessage('');
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!isOpen || !request) return null;

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .slice(0, 2)
      .map(word => word[0])
      .join('')
      .toUpperCase();
  };

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
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-50">
                    <MessageCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Enviar mensagem
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Escolha um modelo ou escreva uma mensagem
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  disabled={isLoading}
                  className="ml-4 text-gray-400 hover:text-gray-600 transition-colors p-1.5 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Cliente Info */}
              <div className="p-3 bg-green-50 rounded-xl border border-green-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-green-700 font-semibold text-sm">
                      {getInitials(request.nome_completo)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {request.nome_completo || 'Cliente'}
                    </p>
                    <p className="text-xs text-gray-600 font-mono">
                      {request.telefone || 'Telefone não informado'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-8 py-8">
              {/* Templates Selection */}
              {selectedTemplate === null ? (
                <div className="space-y-4">
                  {/* Template Buttons */}
                  <div className="space-y-3">
                    {templates.map((template) => (
                      <motion.button
                        key={template.id}
                        onClick={() => setSelectedTemplate(template.id)}
                        disabled={isLoading}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full p-4 bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-xl hover:border-green-300 hover:bg-green-50 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed group"
                      >
                        <p className="font-semibold text-gray-900 group-hover:text-green-700">
                          {template.name}
                        </p>
                        <p className="text-xs text-gray-600 mt-1 group-hover:text-green-600">
                          {template.description}
                        </p>
                      </motion.button>
                    ))}
                  </div>

                  {/* Divider */}
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="px-2 text-gray-500 bg-white">ou</span>
                    </div>
                  </div>

                  {/* Escrever Button */}
                  <motion.button
                    onClick={() => setSelectedTemplate('custom')}
                    disabled={isLoading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full p-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>✏️</span>
                    Escrever mensagem
                  </motion.button>
                </div>
              ) : (
                /* Custom Message Form */
                <div className="space-y-4">
                  {selectedTemplate !== 'custom' && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                      <p className="text-sm font-semibold text-gray-900 mb-1">
                        Modelo {selectedTemplate} selecionado
                      </p>
                      <p className="text-xs text-gray-600">
                        Clique em "Enviar" para confirmar o envio
                      </p>
                    </div>
                  )}

                  {selectedTemplate === 'custom' && (
                    <div className="space-y-3">
                      <label className="block">
                        <span className="text-sm font-semibold text-gray-700 mb-2 block">
                          Sua mensagem
                        </span>
                        <textarea
                          value={customMessage}
                          onChange={(e) => setCustomMessage(e.target.value)}
                          placeholder="Digite sua mensagem aqui..."
                          disabled={isLoading}
                          className="w-full h-32 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none text-gray-900 bg-white placeholder-gray-400 disabled:bg-gray-100"
                        />
                      </label>
                      <p className="text-xs text-gray-500">
                        {customMessage.length} caracteres
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <motion.button
                      onClick={() => {
                        resetModal();
                        setSelectedTemplate(null);
                      }}
                      disabled={isLoading}
                      className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Voltar
                    </motion.button>

                    <motion.button
                      onClick={
                        selectedTemplate === 'custom'
                          ? handleSendCustomMessage
                          : () => handleSendTemplate(selectedTemplate)
                      }
                      disabled={isLoading || (selectedTemplate === 'custom' && !customMessage.trim())}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <MessageCircle className="w-4 h-4" />
                          Enviar
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default WhatsAppMessageModal;
