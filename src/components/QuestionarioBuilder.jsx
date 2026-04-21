import React from 'react';
import { Plus } from 'lucide-react';
import QuestionarioFieldEditor from './QuestionarioFieldEditor';

const QuestionarioBuilder = ({
  campos,
  onAddQuestion,
  onFieldChange,
  onRemoveQuestion,
  onDuplicateQuestion,
  onMoveQuestionUp,
  onMoveQuestionDown,
}) => {
  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Construtor de perguntas</h3>
            <p className="text-sm text-slate-600">Adicione, edite e reorganize perguntas de forma visual.</p>
          </div>
          <button
            type="button"
            onClick={onAddQuestion}
            className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nova pergunta
          </button>
        </div>
      </div>

      {campos.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-8 text-center text-slate-600">
          <p className="text-sm font-medium text-slate-900 mb-2">Sem perguntas adicionadas</p>
          <p className="text-sm">Clique em “Nova pergunta” para começar a montar o formulário.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {campos.map((field, index) => (
            <QuestionarioFieldEditor
              key={field.id}
              field={field}
              index={index}
              totalFields={campos.length}
              onFieldChange={onFieldChange}
              onRemove={onRemoveQuestion}
              onDuplicate={onDuplicateQuestion}
              onMoveUp={() => onMoveQuestionUp(index)}
              onMoveDown={() => onMoveQuestionDown(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default QuestionarioBuilder;
