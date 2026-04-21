/**
 * Utilitários para tratamento de erros do Supabase
 */

/**
 * Parseia erros de validação retornados pelo Supabase
 * @param {Error} error - Erro do Supabase
 * @returns {object|null} - Objeto com {field, message} ou null se não for erro de validação
 */
export const parseSupabaseValidationError = (error) => {
  if (!error) return null;

  const message = error.message?.toLowerCase() || '';
  const details = error.details?.toLowerCase() || '';

  // Erros de constraint (unique, check, etc)
  if (error.code === '23505' || message.includes('duplicate') || details.includes('duplicate')) {
    if (message.includes('cpf') || details.includes('cpf')) {
      return {
        field: 'cpf',
        message: 'Este CPF já possui uma solicitação em andamento.'
      };
    }
    if (message.includes('telefone') || details.includes('telefone')) {
      return {
        field: 'telefone',
        message: 'Este telefone já está registrado.'
      };
    }
    return {
      field: 'submit',
      message: 'Dados duplicados. Verifique seu CPF e telefone.'
    };
  }

  // Erros de not null constraint
  if (error.code === '23502') {
    return {
      field: 'submit',
      message: 'Preencha todos os campos obrigatórios.'
    };
  }

  // Erros de foreign key
  if (error.code === '23503') {
    return {
      field: 'submit',
      message: 'Erro na referência de dados. Tente novamente.'
    };
  }

  // Erros genéricos do Supabase
  if (error.code === '42501') {
    return {
      field: 'submit',
      message: 'Você não tem permissão para enviar solicitações.'
    };
  }

  return null;
};

/**
 * Cria um objeto de toast a partir de um erro parseado
 * @param {object} parsedError - Objeto com {field, message}
 * @returns {object} - Objeto de configuração do toast
 */
export const createErrorToast = (parsedError) => {
  if (!parsedError) {
    return {
      variant: "destructive",
      title: "Erro desconhecido",
      description: "Ocorreu um erro ao processar sua solicitação."
    };
  }

  const titleMap = {
    cpf: 'Erro no CPF',
    telefone: 'Erro no Telefone',
    submit: 'Erro ao enviar'
  };

  return {
    variant: "destructive",
    title: titleMap[parsedError.field] || 'Erro na validação',
    description: parsedError.message
  };
};

/**
 * Formata erro genérico para exibição
 * @param {Error} error - Erro a ser formatado
 * @returns {object} - Objeto de configuração do toast
 */
export const formatErrorToast = (error) => {
  const parsed = parseSupabaseValidationError(error);
  
  if (parsed) {
    return createErrorToast(parsed);
  }

  return {
    variant: "destructive",
    title: "Erro ao enviar solicitação",
    description: error.message || "Algo deu errado. Tente novamente."
  };
};
