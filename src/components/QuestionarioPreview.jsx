import React from 'react';

const renderFieldPreview = (field) => {
  switch (field.tipo) {
    case 'text':
      return (
        <input
          type="text"
          value=""
          placeholder={field.placeholder || 'Resposta curta'}
          disabled
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
        />
      );
    case 'textarea':
      return (
        <textarea
          value=""
          placeholder={field.placeholder || 'Resposta longa'}
          disabled
          rows={4}
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
        />
      );
    case 'number':
      return (
        <input
          type="number"
          value=""
          placeholder={field.placeholder || '0'}
          disabled
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
        />
      );
    case 'date':
      return (
        <input
          type="date"
          value=""
          disabled
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
        />
      );
    case 'radio':
      return (
        <div className="mt-2 space-y-2">
          {(field.opcoes || []).map((option, index) => (
            <label key={`${field.id}-radio-${index}`} className="flex cursor-not-allowed items-center gap-3 text-sm text-slate-700">
              <input type="radio" disabled className="h-4 w-4 rounded-full border-slate-300 text-brand-600" />
              <span>{option}</span>
            </label>
          ))}
        </div>
      );
    case 'checkbox':
      return (
        <div className="mt-2 space-y-2">
          {(field.opcoes || []).map((option, index) => (
            <label key={`${field.id}-checkbox-${index}`} className="flex cursor-not-allowed items-center gap-3 text-sm text-slate-700">
              <input type="checkbox" disabled className="h-4 w-4 rounded border-slate-300 text-brand-600" />
              <span>{option}</span>
            </label>
          ))}
        </div>
      );
    case 'select':
      return (
        <select disabled className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900">
          <option>{field.opcoes?.[0] || 'Selecione uma opção'}</option>
        </select>
      );
    case 'boolean':
      return (
        <div className="mt-2 flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
          <label className="flex items-center gap-2">
            <input type="radio" disabled className="h-4 w-4 rounded-full border-slate-300 text-brand-600" />
            Sim
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" disabled className="h-4 w-4 rounded-full border-slate-300 text-brand-600" />
            Não
          </label>
        </div>
      );
    default:
      return (
        <input
          type="text"
          value=""
          disabled
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
        />
      );
  }
};

const QuestionarioPreview = ({ titulo, campos }) => {
  if (!campos || campos.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
        <p className="text-sm font-semibold text-slate-900">Preview vazio</p>
        <p className="mt-2 text-sm text-slate-600">Adicione perguntas para visualizar como o candidato verá o formulário.</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-900">Preview do formulário</h3>
        <p className="text-sm text-slate-600">Veja a visualização do questionário para o candidato.</p>
      </div>

      <div className="space-y-5">
        {campos.map((field) => (
          <div key={field.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-slate-900">{field.label || 'Pergunta sem título'}</p>
                  {field.obrigatorio && <span className="text-xs text-rose-600">Obrigatório</span>}
                </div>
                {field.ajuda && <span className="text-xs text-slate-500">{field.ajuda}</span>}
              </div>
              {renderFieldPreview(field)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuestionarioPreview;
