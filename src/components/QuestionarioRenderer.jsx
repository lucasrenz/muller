import React from 'react';
import { motion } from 'framer-motion';

const QuestionarioRenderer = ({ questionario, respostas, onRespostaChange }) => {
  if (!questionario?.estrutura_json) return null;

  let campos;
  try {
    campos = JSON.parse(questionario.estrutura_json).campos || [];
  } catch (error) {
    console.error('Erro ao parsear estrutura do questionário:', error);
    return <div className="text-red-600">Erro ao carregar questionário</div>;
  }

  const renderCampo = (campo) => {
    const valor = respostas[campo.id] || '';
    const tipoCampo = String(campo.tipo || 'text').toLowerCase();

    switch (tipoCampo) {
      case 'texto':
      case 'text':
        return (
          <input
            type="text"
            value={valor}
            onChange={(e) => onRespostaChange(campo.id, e.target.value)}
            placeholder={campo.placeholder || 'Digite sua resposta...'}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-colors"
            required={campo.obrigatorio}
          />
        );

      case 'textarea':
        return (
          <textarea
            value={valor}
            onChange={(e) => onRespostaChange(campo.id, e.target.value)}
            placeholder={campo.placeholder || 'Digite sua resposta...'}
            rows={4}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-colors resize-none"
            required={campo.obrigatorio}
          />
        );

      case 'numero':
      case 'number':
        return (
          <input
            type="number"
            value={valor}
            onChange={(e) => onRespostaChange(campo.id, e.target.value)}
            placeholder={campo.placeholder || 'Digite um número...'}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-colors"
            required={campo.obrigatorio}
          />
        );

      case 'date':
        return (
          <input
            type="date"
            value={valor}
            onChange={(e) => onRespostaChange(campo.id, e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-colors"
            required={campo.obrigatorio}
          />
        );

      case 'boolean':
        return (
          <div className="space-y-3">
            {['Sim', 'Não'].map((opcao) => (
              <label key={opcao} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name={campo.id}
                  value={opcao}
                  checked={valor === opcao}
                  onChange={(e) => onRespostaChange(campo.id, e.target.value)}
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-slate-300"
                  required={campo.obrigatorio}
                />
                <span className="text-sm text-slate-700">{opcao}</span>
              </label>
            ))}
          </div>
        );

      case 'radio':
        return (
          <div className="space-y-3">
            {campo.opcoes?.map((opcao, index) => (
              <label key={index} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name={campo.id}
                  value={opcao}
                  checked={valor === opcao}
                  onChange={(e) => onRespostaChange(campo.id, e.target.value)}
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-slate-300"
                  required={campo.obrigatorio}
                />
                <span className="text-sm text-slate-700">{opcao}</span>
              </label>
            ))}
          </div>
        );

      case 'checkbox':
        // Para checkbox, armazenamos como array
        const valoresCheckbox = Array.isArray(valor) ? valor : [];
        return (
          <div className="space-y-3">
            {campo.opcoes?.map((opcao, index) => (
              <label key={index} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  value={opcao}
                  checked={valoresCheckbox.includes(opcao)}
                  onChange={(e) => {
                    const novosValores = valoresCheckbox.includes(opcao)
                      ? valoresCheckbox.filter(v => v !== opcao)
                      : [...valoresCheckbox, opcao];
                    onRespostaChange(campo.id, novosValores);
                  }}
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-slate-300 rounded"
                />
                <span className="text-sm text-slate-700">{opcao}</span>
              </label>
            ))}
          </div>
        );

      case 'select':
        return (
          <select
            value={valor}
            onChange={(e) => onRespostaChange(campo.id, e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-colors"
            required={campo.obrigatorio}
          >
            <option value="">Selecione...</option>
            {campo.opcoes?.map((opcao, index) => (
              <option key={index} value={opcao}>{opcao}</option>
            ))}
          </select>
        );

      default:
        return (
          <div className="text-red-600 text-sm">
            Tipo de campo não suportado: {campo.tipo}
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          {questionario.nome}
        </h3>
        <p className="text-sm text-slate-600">
          Responda às perguntas abaixo para completar sua candidatura
        </p>
      </div>

      <div className="space-y-6">
        {campos.map((campo, index) => (
          <motion.div
            key={campo.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-2xl border border-slate-200 p-6"
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-orange-600 text-sm font-semibold flex-shrink-0">
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-base font-semibold text-slate-900 mb-1">
                  {campo.label}
                  {campo.obrigatorio && <span className="text-red-500 ml-1">*</span>}
                </h4>
                {campo.obrigatorio && (
                  <p className="text-xs text-slate-500">Campo obrigatório</p>
                )}
              </div>
            </div>

            <div className="ml-11">
              {renderCampo(campo)}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default QuestionarioRenderer;