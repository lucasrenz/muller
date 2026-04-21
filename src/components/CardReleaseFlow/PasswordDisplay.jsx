import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Copy, Check, ChevronLeft, AlertCircle, Lock } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const PasswordDisplay = ({ client, operator, onShown, onBack }) => {
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  // Normalizar contrato para lowercase para comparação case-insensitive
  const getNormalizedContratoStatus = (contrato) => {
    return (contrato || '').toLowerCase().trim();
  };

  // Verificar se contrato está assinado
  const isContractSigned = () => {
    return getNormalizedContratoStatus(client.contrato) === 'assinado';
  };

  const handleCopyPassword = () => {
    if (client.senha) {
      navigator.clipboard.writeText(client.senha);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copiado",
        description: "Senha copiada para a área de transferência",
      });
    }
  };

  const handleShowPassword = () => {
    if (!showPassword) {
      setShowPassword(true);
      onShown();
    }
  };

  // Se contrato NÃO está assinado, bloquear
  if (!isContractSigned()) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Senha do cartão</h3>
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
              <p className="text-sm text-gray-700 mb-2">
                A senha só pode ser exibida após o contrato estar assinado.
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Status atual do contrato:</span> Pendente
              </p>
            </div>
          </div>
        </motion.div>

        <div className="p-4 bg-gray-50 rounded-xl space-y-3">
          <div>
            <p className="text-xs text-gray-600 mb-1">Cliente</p>
            <p className="text-sm font-semibold text-gray-900">{client?.nome_completo}</p>
            <p className="text-xs text-gray-500 mt-0.5">CPF: {client?.cpf}</p>
          </div>
        </div>

        <button
          onClick={onBack}
          className="w-full px-4 py-2 text-gray-700 font-medium bg-gray-100 hover:bg-gray-200 rounded-lg transition-all flex items-center justify-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Voltar
        </button>
      </div>
    );
  }

  // Se não houver senha, mostrar erro
  if (!client.senha) {
    return (
      <div className="space-y-6">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-900">Erro</p>
            <p className="text-xs text-red-700 mt-1">
              Senha não encontrada. Verifique se a solicitação foi aprovada corretamente.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Fluxo normal - contrato assinado e senha disponível
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Senha do cartão</h3>
        <p className="text-sm text-gray-600">Forneça a senha ao cliente</p>
      </div>

      <div className="space-y-4">
        <div className="p-4 bg-gray-50 rounded-xl">
          <p className="text-xs text-gray-600 mb-3">Cliente</p>
          <div className="space-y-2">
            <div>
              <p className="text-xs text-gray-500">Nome</p>
              <p className="text-sm font-semibold text-gray-900">{client.nome_completo}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">CPF</p>
              <p className="text-sm font-mono text-gray-900">{client.cpf}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Limite</p>
              <p className="text-sm font-semibold text-gray-900">{client.limite}</p>
            </div>
          </div>
        </div>

        {/* Password Display */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-300 rounded-xl text-center"
        >
          <p className="text-xs font-semibold text-emerald-700 mb-3 uppercase tracking-wider">
            Senha do cartão
          </p>

          {!showPassword ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Clique para revelar a senha
              </p>
              <button
                onClick={handleShowPassword}
                className="mx-auto px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg flex items-center gap-2 transition-colors"
              >
                <Eye className="w-4 h-4" />
                Revelar
              </button>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              <div className="text-5xl font-bold text-emerald-700 font-mono tracking-widest">
                {client.senha.split('').map((digit, i) => (
                  <span key={i} className="inline-block w-12 h-12 leading-12">
                    {digit}
                  </span>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleCopyPassword}
                  className="flex-1 px-4 py-2 bg-white hover:bg-gray-50 text-emerald-700 font-medium rounded-lg flex items-center justify-center gap-2 transition-colors border border-emerald-200"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copiar
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowPassword(false)}
                  className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-lg flex items-center justify-center gap-2 transition-colors border border-gray-200"
                >
                  <EyeOff className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Important Info */}
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs text-amber-800">
            <span className="font-semibold">⚠ Importante:</span> A senha foi registrada apenas para este cartão. O cliente deve memorizar ou anotar em local seguro.
          </p>
        </div>

        {/* Operator Info */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-700">
            <span className="font-semibold">Operador:</span> {operator?.nome} ({operator?.codigo})
          </p>
        </div>
      </div>

      <button
        onClick={onBack}
        className="w-full px-4 py-2 text-gray-700 font-medium bg-gray-100 hover:bg-gray-200 rounded-lg transition-all flex items-center justify-center gap-2"
      >
        <ChevronLeft className="w-4 h-4" />
        Voltar
      </button>
    </div>
  );
};

export default PasswordDisplay;
