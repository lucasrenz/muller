import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

const RequestDataModal = ({ isOpen, onClose, data }) => {
  if (!data) return null;

  const formatCPF = (cpf) => {
    if (!cpf) return 'Não informado';
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatPhone = (phone) => {
    if (!phone) return 'Não informado';
    const numbers = phone.replace(/\D/g, '');
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  const formatCurrency = (value) => {
    if (!value) return 'Não informado';
    
    // Se já vem formatado como "R$ X,XX", retorna direto
    if (typeof value === 'string' && value.includes('R$')) {
      return value;
    }
    
    // Caso contrário, formata o número
    const num = parseFloat(value);
    if (isNaN(num)) return 'Não informado';
    
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(num);
  };

  const formatDate = (date) => {
    if (!date) return 'Não informado';
    return new Date(date).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAddress = () => {
    const parts = [
      data.rua || '',
      data.numero || '',
      data.bairro || '',
      data.cidade || ''
    ].filter(Boolean);
    
    return parts.length > 0 ? parts.join(', ') : 'Não informado';
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .slice(0, 2)
      .map(word => word[0])
      .join('')
      .toUpperCase();
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      em_analise: {
        label: 'Em análise',
        bgColor: 'bg-amber-50',
        textColor: 'text-amber-700',
        badgeColor: 'bg-amber-200',
      },
      aprovado: {
        label: 'Aprovado',
        bgColor: 'bg-emerald-50',
        textColor: 'text-emerald-700',
        badgeColor: 'bg-emerald-200',
      },
      recusado: {
        label: 'Recusado',
        bgColor: 'bg-red-50',
        textColor: 'text-red-700',
        badgeColor: 'bg-red-200',
      },
      aguardando_documentacao: {
        label: 'Aguardando Documentação',
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-700',
        badgeColor: 'bg-blue-200',
      },
      aguardando_assinatura: {
        label: 'Aguardando Assinatura',
        bgColor: 'bg-purple-50',
        textColor: 'text-purple-700',
        badgeColor: 'bg-purple-200',
      },
      assinado: {
        label: 'Assinado',
        bgColor: 'bg-green-50',
        textColor: 'text-green-700',
        badgeColor: 'bg-green-200',
      },
    };
    return statusMap[status] || statusMap.em_analise;
  };

  const statusInfo = getStatusInfo(data.status);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden"
          >
            {/* Header */}
            <div className="px-8 py-6 border-b border-gray-100">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-gray-500 tracking-wide uppercase">
                    Solicitação de Cartão
                  </h3>
                  <p className="text-lg text-gray-900 mt-1">Detalhes do Cliente</p>
                </div>
                <button
                  onClick={onClose}
                  className="ml-4 text-gray-400 hover:text-gray-600 transition-colors p-1.5 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="px-8 py-8">
              {/* Cliente Header com Avatar */}
              <div className="flex items-start gap-4 mb-8 pb-8 border-b border-gray-100">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-semibold text-sm">
                    {getInitials(data.nome_completo)}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-2xl font-semibold text-gray-900">
                    {data.nome_completo || 'Não informado'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    CPF: {formatCPF(data.cpf)}
                  </p>
                </div>
              </div>

              {/* Grid de Seções */}
              <div className="space-y-8">
                {/* Contato e Renda */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Telefone
                    </label>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <p className="text-base text-gray-900 font-medium">
                        {formatPhone(data.telefone)}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Renda Mensal
                    </label>
                    <p className="text-base text-gray-900 font-medium">
                      {formatCurrency(data.renda)}
                    </p>
                  </div>
                </div>

                {/* Endereço */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Endereço Completo
                  </label>
                  <p className="text-base text-gray-900 leading-relaxed">
                    {formatAddress()}
                  </p>
                </div>

                {/* Data da Solicitação */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Data da Solicitação
                  </label>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <p className="text-sm text-gray-900">
                      {formatDate(data.data_criacao)}
                    </p>
                  </div>
                </div>

                {/* Status */}
                <div className={`p-4 rounded-xl ${statusInfo.bgColor}`}>
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                    Status da Solicitação
                  </p>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${statusInfo.badgeColor}`}
                    />
                    <span className={`text-sm font-medium ${statusInfo.textColor}`}>
                      {statusInfo.label}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 flex justify-end">
              <Button
                onClick={onClose}
                className="text-white font-medium"
                style={{ backgroundColor: '#DC143C' }}
              >
                Fechar
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default RequestDataModal;
