const FIELD_TYPES = ['text', 'textarea', 'number', 'date', 'radio', 'checkbox', 'select', 'boolean'];
const OPTION_TYPES = ['radio', 'checkbox', 'select'];

export const slugifyQuestionKey = (value) => {
  if (!value) return '';

  return value
    .toString()
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
};

export const ensureUniqueCampoId = (baseValue, existingIds = []) => {
  const safeBase = slugifyQuestionKey(baseValue) || `campo`;
  let candidate = safeBase;
  let suffix = 1;

  while (existingIds.includes(candidate)) {
    candidate = `${safeBase}_${suffix}`;
    suffix += 1;
  }

  return candidate;
};

export const createEmptyCampo = (existingIds = []) => {
  const id = ensureUniqueCampoId(`campo_${Date.now()}`, existingIds);

  return {
    id,
    label: '',
    tipo: 'text',
    obrigatorio: false,
    placeholder: '',
    ajuda: '',
    opcoes: [],
  };
};

export const parseQuestionarioEstrutura = (jsonString) => {
  try {
    const parsed = JSON.parse(jsonString || '{}');
    if (Array.isArray(parsed)) {
      return {
        titulo: '',
        campos: parsed.map((campo) => normalizeCampo(campo)),
      };
    }

    if (parsed && typeof parsed === 'object') {
      return {
        titulo: parsed.titulo || '',
        campos: Array.isArray(parsed.campos)
          ? parsed.campos.map((campo) => normalizeCampo(campo))
          : [],
      };
    }
  } catch (error) {
    console.error('Erro ao parsear estrutura JSON do questionário:', error);
  }

  return {
    titulo: '',
    campos: [],
  };
};

const normalizeCampo = (campo) => {
  const tipo = FIELD_TYPES.includes(campo.tipo) ? campo.tipo : 'text';
  const opcoes = Array.isArray(campo.opcoes)
    ? campo.opcoes.map((option) => String(option))
    : tipo === 'boolean'
      ? ['Sim', 'Não']
      : [];

  return {
    id: campo.id || slugifyQuestionKey(campo.label) || `campo_${Date.now()}`,
    label: campo.label || '',
    tipo,
    obrigatorio: !!campo.obrigatorio,
    placeholder: campo.placeholder || '',
    ajuda: campo.ajuda || '',
    opcoes,
  };
};

export const buildQuestionarioEstrutura = (formState) => {
  const campos = (formState.campos || [])
    .filter((campo) => campo.label.trim())
    .map((campo) => {
      const normalized = {
        id: campo.id,
        label: campo.label.trim(),
        tipo: campo.tipo,
        obrigatorio: !!campo.obrigatorio,
      };

      if (['text', 'textarea', 'number'].includes(campo.tipo) && campo.placeholder.trim()) {
        normalized.placeholder = campo.placeholder.trim();
      }

      if (campo.ajuda?.trim()) {
        normalized.ajuda = campo.ajuda.trim();
      }

      if (OPTION_TYPES.includes(campo.tipo)) {
        normalized.opcoes = campo.tipo === 'boolean'
          ? ['Sim', 'Não']
          : campo.opcoes.filter((option) => option?.toString().trim()).map((option) => option.toString().trim());
      }

      if (campo.tipo === 'boolean') {
        normalized.opcoes = ['Sim', 'Não'];
      }

      return normalized;
    });

  return {
    titulo: formState.nome.trim() || '',
    campos,
  };
};

export const validateQuestionarioForm = (formState) => {
  const errors = [];
  const campos = (formState.campos || []).filter((campo) => campo.label.trim());

  if (!formState.nome.trim()) {
    errors.push('Nome do questionário é obrigatório.');
  }

  if (!campos.length) {
    errors.push('Adicione pelo menos uma pergunta ao questionário.');
  }

  const ids = campos.map((campo) => campo.id);
  const duplicateIds = ids.filter((id, index) => id && ids.indexOf(id) !== index);
  const uniqueDuplicates = [...new Set(duplicateIds)];

  if (uniqueDuplicates.length) {
    errors.push(`IDs duplicados detectados: ${uniqueDuplicates.join(', ')}.`);
  }

  campos.forEach((campo, index) => {
    if (!campo.label.trim()) {
      errors.push(`Preencha o label da pergunta ${index + 1}.`);
    }

    if (['radio', 'checkbox', 'select'].includes(campo.tipo)) {
      const options = (campo.opcoes || []).filter((option) => option?.toString().trim());
      if (!options.length) {
        errors.push(`A pergunta "${campo.label || `#${index + 1}`}" precisa de pelo menos uma opção.`);
      }
    }
  });

  return errors;
};

export const QUESTIONARIO_FIELD_TYPES = FIELD_TYPES;
export const OPTION_FIELD_TYPES = OPTION_TYPES;
