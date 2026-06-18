import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { generateAndOpenContract } from '@/lib/contractUtils';
import OperatorValidation from './CardReleaseFlow/OperatorValidation';
import ClientValidation from './CardReleaseFlow/ClientValidation';
import ContractGeneration from './CardReleaseFlow/ContractGeneration';
import ContractSignedBlock from './CardReleaseFlow/ContractSignedBlock';
import PasswordDisplay from './CardReleaseFlow/PasswordDisplay';

/**
 * CardReleaseFlow - Popup de Liberação/Assinatura de Cartão
 * 
 * Fluxo:
 * 1. Operador valida seu código
 * 2. CPF do cliente é validado (recupera ID e status do Supabase)
 * 3. Gerar contrato (atualiza coluna "contrato" para "assinado")
 * 4. Exibir senha
 * 
 * IMPORTANTE: A atualização da coluna "contrato" no Supabase requer:
 * - RLS Policy de UPDATE na tabela "solicitacoes"
 * - Verificar em: Supabase Dashboard > solicitacoes > RLS > Policies
 * - Ver arquivo: VERIFICACAO_RLS_CONTRATO.md
 */
const CardReleaseFlow = ({ isOpen, onClose }) => {
  const { toast } = useToast();
  const [step, setStep] = useState('operator'); // operator | client | contract | contract-signed | password
  const [operator, setOperator] = useState(null);
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(false);

  // Normalizar contrato para lowercase para comparação case-insensitive
  const getNormalizedContratoStatus = (contrato) => {
    return (contrato || '').toLowerCase().trim();
  };

  const handleOperatorValidated = (operatorData) => {
    setOperator(operatorData);
    setStep('client');
  };

  const handleClientValidated = (clientData) => {
    setClient(clientData);
    
    // Verificar status do contrato (case-insensitive)
    const contratoNormalizado = getNormalizedContratoStatus(clientData.contrato);
    
    if (contratoNormalizado === 'assinado') {
      // Se contrato já está assinado, ir para a tela de bloqueio
      setStep('contract-signed');
    } else {
      // Se pendente ou outro valor, vai para geração de contrato
      setStep('contract');
    }
  };

  const handleContractGenerated = async () => {
    if (!client) {
      console.error('Erro: Cliente não foi carregado');
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Dados do cliente não foram carregados corretamente",
      });
      return;
    }

    if (!client.id) {
      console.error('Erro: ID do cliente não disponível', { client });
      toast({
        variant: "destructive",
        title: "Erro",
        description: "ID do cliente não disponível. Valide o CPF novamente.",
      });
      return;
    }

    setLoading(true);

    try {
      console.log(`Iniciando update do contrato para cliente ID: ${client.id}`);
      
      // Atualizar contrato para 'assinado' usando UUID
      const { data: updateData, error: updateError } = await supabase
        .from('solicitacoes')
        .update({ 
          contrato: 'assinado',
          status: 'assinado'
        })
        .eq('id', client.id)
        .select(); // Retornar dados atualizados para confirmar

      if (updateError) {
        console.error('Erro ao atualizar contrato no Supabase:', {
          error: updateError,
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint,
          clientId: client.id,
        });
        throw new Error(updateError.message || 'Falha ao atualizar contrato no banco de dados');
      }

      console.log('Update realizado com sucesso:', {
        clientId: client.id,
        updateData,
      });

      // Atualizar estado local com o contrato assinado
      const updatedClient = { ...client, contrato: 'assinado' };
      setClient(updatedClient);

      toast({
        title: "✓ Contrato assinado",
        description: "O contrato foi registrado como assinado no sistema",
      });

      // Avançar para tela de exibição de senha
      setStep('password');
    } catch (error) {
      console.error('Erro ao marcar contrato como assinado:', {
        error,
        message: error.message,
        stack: error.stack,
      });
      toast({
        variant: "destructive",
        title: "Erro ao registrar assinatura",
        description: error.message || "Não foi possível registrar o contrato. Tente novamente ou contate o suporte.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordShown = () => {
    toast({
      title: "Cartão liberado",
      description: "Forneça a senha ao cliente e conclua a operação",
    });
  };

  const handleReset = () => {
    setStep('operator');
    setOperator(null);
    setClient(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleReset}
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
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Liberar cartão
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Etapa {step === 'operator' ? 1 : step === 'client' ? 2 : step === 'contract' ? 3 : step === 'contract-signed' ? 3 : 4} de 4
                  </p>
                </div>
                <button
                  onClick={handleReset}
                  disabled={loading}
                  className="ml-4 text-gray-400 hover:text-gray-600 transition-colors p-1.5 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Progress Bar */}
              <div className="mt-4 flex gap-1">
                {[1, 2, 3, 4].map((i) => {
                  const steps = { operator: 1, client: 2, contract: 3, 'contract-signed': 3, password: 4 };
                  const currentStep = steps[step];
                  return (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-all ${
                        i <= currentStep ? 'bg-emerald-500' : 'bg-gray-200'
                      }`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Content */}
            <div className="px-8 py-8">
              <AnimatePresence mode="wait">
                {step === 'operator' && (
                  <motion.div
                    key="operator"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <OperatorValidation
                      onValidated={handleOperatorValidated}
                      loading={loading}
                      setLoading={setLoading}
                    />
                  </motion.div>
                )}

                {step === 'client' && (
                  <motion.div
                    key="client"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <ClientValidation
                      operatorName={operator?.nome}
                      onValidated={handleClientValidated}
                      onBack={() => setStep('operator')}
                      loading={loading}
                      setLoading={setLoading}
                    />
                  </motion.div>
                )}

                {step === 'contract' && client && (
                  <motion.div
                    key="contract"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <ContractGeneration
                      client={client}
                      onGenerated={handleContractGenerated}
                      onBack={() => setStep('client')}
                      loading={loading}
                      setLoading={setLoading}
                    />
                  </motion.div>
                )}

                {step === 'contract-signed' && client && (
                  <motion.div
                    key="contract-signed"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <ContractSignedBlock
                      client={client}
                      onCancel={() => setStep('client')}
                    />
                  </motion.div>
                )}

                {step === 'password' && client && (
                  <motion.div
                    key="password"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <PasswordDisplay
                      client={client}
                      operator={operator}
                      onShown={handlePasswordShown}
                      onBack={() => setStep(client.contrato === 'assinado' ? 'password' : 'contract')}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CardReleaseFlow;
