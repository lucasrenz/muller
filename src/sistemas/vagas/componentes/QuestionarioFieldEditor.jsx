import React from 'react';
import { ArrowDown, ArrowUp, Copy, Trash2 } from 'lucide-react';
import { OPTION_FIELD_TYPES, QUESTIONARIO_FIELD_TYPES } from '../lib/questionarioUtils';

const QuestionarioFieldEditor = ({
  field,
  index,
  totalFields,
  onFieldChange,
  onRemove,
  onDuplicate,
  onMoveUp,
  onMoveDown,
}) => {
  const isOptionType = OPTION_FIELD_TYPES.includes(field.tipo);
  const showPlaceholder = ['text', 'textarea', 'number'].includes(field.tipo);

  const updateField = (patch) => {
    onFieldChange(index, { ...field, ...patch });
  };

  const handleLabelChange = (value) => {
    updateField({ label: value });
  };

  const handleTipoChange = (value) => {
    const nextField = {
      ...field,
      tipo: value,
    };

    if (value === 'boolean') {
      nextField.opcoes = ['Sim', 'Não'];
    }

    if (!OPTION_FIELD_TYPES.includes(value)) {
      nextField.opcoes = [];
    }

    updateField(nextField);
  };

  const handleOptionChange = (optionValue, optionIndex) => {
    const nextOpcoes = [...(field.opcoes || [])];
    nextOpcoes[optionIndex] = optionValue;
    updateField({ opcoes: nextOpcoes });
  };

  const addOption = () => {
    updateField({ opcoes: [...(field.opcoes || []), ''] });
  };

  const removeOption = (optionIndex) => {
    const nextOpcoes = [...(field.opcoes || [])];
    nextOpcoes.splice(optionIndex, 1);
    updateField({ opcoes: nextOpcoes });
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-900">Pergunta {index + 1}</p>
          <p className="text-xs text-slate-500">ID: {field.id}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onDuplicate(field)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100"
          >
            <Copy className="mr-1 inline h-3.5 w-3.5 align-text-bottom" /> Duplicar
          </button>
          <button
            type="button"
            onClick={() => onRemove(field.id)}
            className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-100"
          >
            <Trash2 className="mr-1 inline h-3.5 w-3.5 align-text-bottom" /> Excluir
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-[0.15em] text-slate-500 mb-2">
            Label da pergunta
          </label>
          <input
            type="text"
            value={field.label}
            onChange={(event) => handleLabelChange(event.target.value)}
            placeholder="Digite o texto da pergunta"
            className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.15em] text-slate-500 mb-2">
              Tipo de pergunta
            </label>
            <select
              value={field.tipo}
              onChange={(event) => handleTipoChange(event.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              {QUESTIONARIO_FIELD_TYPES.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2">
            <label className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
              Obrigatório
            </label>
            <input
              type="checkbox"
              checked={field.obrigatorio}
              onChange={(event) => updateField({ obrigatorio: event.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
          </div>
        </div>

        {showPlaceholder && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.15em] text-slate-500 mb-2">
              Placeholder
            </label>
            <input
              type="text"
              value={field.placeholder}
              onChange={(event) => updateField({ placeholder: event.target.value })}
              placeholder="Ex: Responda aqui"
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold uppercase tracking-[0.15em] text-slate-500 mb-2">
            Ajuda / descrição curta
          </label>
          <input
            type="text"
            value={field.ajuda}
            onChange={(event) => updateField({ ajuda: event.target.value })}
            placeholder="Texto auxiliar para o candidato"
            className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        {isOptionType && (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Opções</p>
                <p className="text-xs text-slate-500">Adicione as escolhas que o candidato verá.</p>
              </div>
              <button
                type="button"
                onClick={addOption}
                className="rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white hover:bg-brand-700 transition-colors"
              >
                + Opção
              </button>
            </div>

            <div className="space-y-3">
              {(field.opcoes || []).map((opcao, optionIndex) => (
                <div key={`${field.id}-option-${optionIndex}`} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={opcao}
                    onChange={(event) => handleOptionChange(event.target.value, optionIndex)}
                    className="flex-1 rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    placeholder={`Opção ${optionIndex + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => removeOption(optionIndex)}
                    className="rounded-full border border-slate-200 bg-slate-100 p-2 text-slate-600 hover:bg-slate-200"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={index === 0}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ArrowUp className="h-3.5 w-3.5" />
            Subir
          </button>

          <button
            type="button"
            onClick={onMoveDown}
            disabled={index === totalFields - 1}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ArrowDown className="h-3.5 w-3.5" />
            Descer
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuestionarioFieldEditor;
