import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Check, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const OperatorValidation = ({ onValidated, loading, setLoading }) => {
  const { toast } = useToast();
  const [codigo, setCodigo] = useState('');
  const [operador, setOperador] = useState(null);
  const [error, setError] = useState('');
  const [validado, setValidado] = useState(false);

  const handleValidate = async () => {
    if (!codigo.trim()) {
      setError('Digite o código do operador');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error: queryError } = await supabase
        .from('operadores')
        .select('*')
        .eq('codigo', codigo.trim())
        .maybeSingle();

      if (queryError) throw queryError;

      if (!data) {
        setError('Código do operador não encontrado');
        setLoading(false);
        return;
      }

      setOperador(data);
      setValidado(true);

      // stop loading before advancing so the next step can enable inputs
      setLoading(false);

      setTimeout(() => {
        onValidated(data);
      }, 800);
    } catch (err) {
      console.error('Erro ao validar operador:', err);
      setError(err.message || 'Erro ao validar operador');
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
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Código do operador</h3>
        <p className="text-sm text-gray-600">Digite seu código para iniciar o fluxo</p>
      </div>

      {!validado ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Código <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={codigo}
              onChange={(e) => {
                setCodigo(e.target.value);
                setError('');
              }}
              onKeyPress={handleKeyPress}
              placeholder="Ex: OP001"
              disabled={loading}
              className={`w-full px-4 py-3 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-all ${
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
            disabled={loading || !codigo.trim()}
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
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Check className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {operador?.nome || 'Operador'}
              </p>
              <p className="text-xs text-gray-600">
                Código: {operador?.codigo}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default OperatorValidation;
