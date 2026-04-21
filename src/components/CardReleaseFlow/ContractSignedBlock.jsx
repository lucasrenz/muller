import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, ChevronLeft } from 'lucide-react';

const ContractSignedBlock = ({ client, onCancel }) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Contrato já foi assinado!</h3>
        <p className="text-sm text-gray-600">Este cliente já tem o contrato assinado no sistema</p>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-6 bg-amber-50 border-2 border-amber-300 rounded-xl space-y-4"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 mb-2">Ação não permitida</p>
            <p className="text-sm text-gray-700 mb-3">
              O contrato deste cliente já foi assinado e está registrado no sistema. Não é possível:
            </p>
            <ul className="text-sm text-gray-700 space-y-1 ml-4">
              <li>• Gerar um novo contrato</li>
              <li>• Alterar o status do contrato</li>
              <li>• Revelar a senha novamente</li>
            </ul>
          </div>
        </div>

        <div className="pt-4 border-t border-amber-200">
          <p className="text-xs text-amber-800">
            <span className="font-semibold">Cliente:</span> {client?.nome_completo}
          </p>
          <p className="text-xs text-amber-800 mt-1">
            <span className="font-semibold">CPF:</span> {client?.cpf}
          </p>
          <p className="text-xs text-amber-800 mt-1">
            <span className="font-semibold">Contrato:</span> ✓ Assinado
          </p>
        </div>
      </motion.div>

      <button
        onClick={onCancel}
        className="w-full px-4 py-3 text-gray-700 font-medium bg-gray-100 hover:bg-gray-200 rounded-lg transition-all flex items-center justify-center gap-2"
      >
        <ChevronLeft className="w-4 h-4" />
        Voltar para validação
      </button>
    </div>
  );
};

export default ContractSignedBlock;
