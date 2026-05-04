import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Check, AlertCircle, ChevronLeft } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const ClientValidation = ({ operatorName, onValidated, onBack, loading, setLoading }) => {
  const { toast } = useToast();
  const [cpf, setCpf] = useState('');
  const [cliente, setCliente] = useState(null);
  const [error, setError] = useState('');
  const [validado, setValidado] = useState(false);

  // Normalizar contrato para lowercase para comparação case-insensitive
  const getNormalizedContratoStatus = (contrato) => {
    return (contrato || '').toLowerCase().trim();
  };

  // Obter rótulo de exibição do status do contrato
  const getContratoDisplayLabel = (contrato) => {
    const normalized = getNormalizedContratoStatus(contrato);
    if (normalized === 'assinado') return '✓ Assinado';
    if (normalized === 'pendente') return '○ Pendente';
    return `○ ${contrato || 'Desconhecido'}`;
  };

  const formatCPF = (value) => {
    const numbers = value.replace(/\D/g, '').slice(0, 11);
    if (numbers.length === 0) return '';
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9)}`;
  };

  const handleCPFChange = (e) => {
    const value = e.target.value;
    setCpf(formatCPF(value));
    setError('');
  };

  const handleValidate = async () => {
    const cpfClean = cpf.replace(/\D/g, '');
    
    if (cpfClean.length !== 11) {
      setError('CPF deve conter 11 dígitos');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Normalize input and create an ilike pattern that allows matching
      // masked CPFs like "037.344.400-17" regardless of separators.
      const pattern = `%${cpfClean.split('').join('%')}%`;

      console.log(`Buscando cliente com CPF: ${cpfClean}`);

      const { data: rows, error: queryError } = await supabase
        .from('solicitacoes')
        .select('*')
        .ilike('cpf', pattern)
        .limit(1);

      if (queryError) {
        console.error('Erro ao buscar cliente:', {
          code: queryError.code,
          message: queryError.message,
          details: queryError.details,
          hint: queryError.hint,
          cpf: cpfClean,
        });
        throw queryError;
      }

      const data = rows?.[0] ?? null;

      if (!data) {
        setError('Cliente não encontrado');
        setLoading(false);
        return;
      }

      // Validar que o id existe
      if (!data.id) {
        console.error('Erro: Registro retornado sem ID', { data });
        setError('Erro ao buscar cliente: ID não disponível');
        setLoading(false);
        return;
      }

      console.log('Cliente encontrado:', {
        id: data.id,
        cpf: data.cpf,
        nome: data.nome_completo,
        status: data.status,
        contrato: data.contrato,
      });

      const normalizedStatus = (data.status || '').toLowerCase().trim();
      const normalizedContrato = getNormalizedContratoStatus(data.contrato);

      if (normalizedContrato === 'assinado') {
        setError('Contrato já foi assinado.');
        setLoading(false);
        return;
      }

      // Critério oficial: aceitar apenas registros com status 'aguardando_assinatura'
      if (normalizedStatus !== 'aguardando_assinatura') {
        setError("Somente solicitações com status 'Aguardando assinatura' podem ser liberadas para assinatura do contrato.");
        setLoading(false);
        return;
      }

      setCliente(data);
      setValidado(true);

      // stop loading before advancing so the next step can enable inputs
      setLoading(false);

      setTimeout(() => {
        onValidated(data);
      }, 800);
    } catch (err) {
      console.error('Erro ao validar cliente:', {
        code: err.code,
        message: err.message,
        details: err.details,
        hint: err.hint,
        stack: err.stack,
      });
      setError(err.message || 'Erro ao validar cliente');
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading && !validado) {
      handleValidate();
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">CPF do cliente</h3>
        <p className="text-sm text-gray-600">Buscar a solicitação aprovada</p>
      </div>

      {!validado ? (
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-700">
              <span className="font-semibold">Operador:</span> {operatorName}
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              CPF <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={cpf}
              onChange={handleCPFChange}
              onKeyPress={handleKeyPress}
              placeholder="000.000.000-00"
              disabled={loading}
              className={`w-full px-4 py-3 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-all font-mono ${
                error
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-gray-200 focus:ring-emerald-500'
              } disabled:bg-gray-100`}
            />
            {error && (
              <p className="text-xs text-red-600 flex items-center gap-1 mt-2">
                <AlertCircle className="w-3 h-3" />
                {error}
              </p>
            )}
          </div>

          <motion.button
            onClick={handleValidate}
            disabled={loading || cpf.replace(/\D/g, '').length !== 11}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Validando...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Validar
              </>
            )}
          </motion.button>

          <button
            onClick={onBack}
            disabled={loading}
            className="w-full px-4 py-2 text-gray-700 font-medium bg-gray-100 hover:bg-gray-200 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4" />
            Voltar
          </button>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg space-y-3"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Check className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {cliente?.nome_completo || 'Cliente'}
              </p>
              <p className="text-xs text-gray-600">
                CPF: {cpf}
              </p>
            </div>
          </div>
          <div className="text-xs text-gray-700 pt-2 border-t border-emerald-200">
            <p><span className="font-semibold">Limite:</span> {cliente?.limite || <span className="text-gray-400 italic">Não informado</span>}</p>
            <p><span className="font-semibold">Contrato:</span> {getContratoDisplayLabel(cliente?.contrato)}</p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ClientValidation;
