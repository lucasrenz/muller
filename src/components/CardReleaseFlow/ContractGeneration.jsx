import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, FileText, ChevronLeft, AlertCircle, Check, Lock } from 'lucide-react';
import { generateAndOpenContract } from '@/lib/contractUtils';
import { useToast } from '@/components/ui/use-toast';

const ContractGeneration = ({ client, onGenerated, onBack, loading, setLoading }) => {
  const { toast } = useToast();
  const [contractGenerating, setContractGenerating] = useState(false);
  const [contractOpened, setContractOpened] = useState(false);

  // Normalizar contrato para lowercase para comparação case-insensitive
  const getNormalizedContratoStatus = (contrato) => {
    return (contrato || '').toLowerCase().trim();
  };

  // Verificar se contrato já está assinado
  const isContractAlreadySigned = () => {
    return getNormalizedContratoStatus(client.contrato) === 'assinado';
  };

  const handleGenerateContract = async () => {
    setContractGenerating(true);

    try {
      await generateAndOpenContract(client);
      setContractOpened(true);

      setTimeout(() => {
        toast({
          title: "Contrato gerado",
          description: "Imprima e obtenha a assinatura do cliente",
        });
      }, 500);
    } catch (error) {
      console.error('Erro ao gerar contrato:', error);
      toast({
        variant: "destructive",
        title: "Erro ao gerar contrato",
        description: error.message || "Não foi possível gerar o contrato",
      });
    } finally {
      setContractGenerating(false);
    }
  };

  const handleConfirmSigned = async () => {
    setLoading(true);
    try {
      await onGenerated();
    } catch (error) {
      console.error('Erro ao confirmar contrato assinado:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  // Se contrato já está assinado, mostrar mensagem de bloqueio
  if (isContractAlreadySigned()) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Gerar contrato</h3>
          <p className="text-sm text-gray-600">Esta ação não está disponível</p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-6 bg-red-50 border-2 border-red-300 rounded-xl space-y-4"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
              <Lock className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 mb-2">Ação bloqueada</p>
              <p className="text-sm text-gray-700">
                O contrato deste cliente já está assinado no sistema. Não é possível gerar um novo contrato.
              </p>
            </div>
          </div>
        </motion.div>

        <div className="p-4 bg-gray-50 rounded-xl space-y-3">
          <div>
            <p className="text-xs text-gray-600 mb-1">Cliente</p>
            <p className="text-sm font-semibold text-gray-900">{client.nome_completo}</p>
            <p className="text-xs text-gray-500 mt-0.5">CPF: {client.cpf}</p>
          </div>
          <div className="pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-600 mb-1">Status do contrato</p>
            <p className="text-sm font-semibold text-gray-900">✓ Assinado</p>
          </div>
        </div>

        <button
          onClick={onBack}
          disabled={contractGenerating || loading}
          className="w-full px-4 py-2 text-gray-700 font-medium bg-gray-100 hover:bg-gray-200 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <ChevronLeft className="w-4 h-4" />
          Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Gerar contrato</h3>
        <p className="text-sm text-gray-600">Imprima o contrato e obtenha a assinatura</p>
      </div>

      <div className="p-4 bg-gray-50 rounded-xl space-y-3">
        <div>
          <p className="text-xs text-gray-600 mb-1">Cliente</p>
          <p className="text-sm font-semibold text-gray-900">{client.nome_completo}</p>
          <p className="text-xs text-gray-500 mt-0.5">CPF: {client.cpf}</p>
        </div>
        <div className="pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-600 mb-1">Limite aprovado</p>
          <p className="text-sm font-semibold text-gray-900">{client.limite || <span className="text-gray-400 italic">Não informado</span>}</p>
        </div>
      </div>

      {!contractOpened ? (
        <motion.button
          onClick={handleGenerateContract}
          disabled={contractGenerating || loading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {contractGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Gerando contrato...
            </>
          ) : (
            <>
              <FileText className="w-4 h-4" />
              Gerar contrato
            </>
          )}
        </motion.button>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-4"
        >
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-3">
            <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-emerald-900">Contrato aberto</p>
              <p className="text-xs text-emerald-700 mt-1">
                Imprima o contrato, obtenha a assinatura do cliente e clique em "Confirmar".
              </p>
            </div>
          </div>

          <motion.button
            onClick={handleConfirmSigned}
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Confirmando...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Confirmar assinatura
              </>
            )}
          </motion.button>
        </motion.div>
      )}

      <button
        onClick={onBack}
        disabled={contractGenerating || loading}
        className="w-full px-4 py-2 text-gray-700 font-medium bg-gray-100 hover:bg-gray-200 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
      >
        <ChevronLeft className="w-4 h-4" />
        Voltar
      </button>
    </div>
  );
};

export default ContractGeneration;
