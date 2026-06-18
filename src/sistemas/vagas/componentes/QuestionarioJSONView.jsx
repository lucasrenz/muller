import React from 'react';

const QuestionarioJSONView = ({ estrutura }) => {
  const jsonString = JSON.stringify(estrutura, null, 2);

  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900">JSON Avançado</h3>
          <p className="text-sm text-slate-600">Visualização do JSON que será salvo no banco.</p>
        </div>
      </div>

      <pre className="max-h-[420px] overflow-auto rounded-3xl border border-slate-200 bg-slate-950 p-4 text-sm text-slate-100">
        {jsonString}
      </pre>
    </div>
  );
};

export default QuestionarioJSONView;
