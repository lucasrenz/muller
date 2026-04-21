/**
 * Funções de validação para o formulário de solicitação de cartão
 * Inclui validação de CPF, telefone e regra de 30 dias
 */

import { supabase } from '@/lib/customSupabaseClient';

/**
 * Valida se um CPF é válido através do algoritmo dos dígitos verificadores
 * @param {string} cpf - CPF com ou sem formatação
 * @returns {boolean}
 */
export const isValidCPF = (cpf) => {
  // Remove caracteres não numéricos
  const cleanCPF = cpf.replace(/\D/g, '');

  // Verifica se tem 11 dígitos
  if (cleanCPF.length !== 11) return false;

  // Verifica se todos os dígitos são iguais (inválido)
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;

  // Calcula primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF[i]) * (10 - i);
  }
  let remainder = sum % 11;
  let firstDigit = remainder < 2 ? 0 : 11 - remainder;

  // Calcula segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF[i]) * (11 - i);
  }
  remainder = sum % 11;
  let secondDigit = remainder < 2 ? 0 : 11 - remainder;

  // Valida se os dígitos verificadores estão corretos
  return (
    firstDigit === parseInt(cleanCPF[9]) &&
    secondDigit === parseInt(cleanCPF[10])
  );
};

/**
 * Busca se um telefone já está em uso por outro CPF
 * @param {string} telefone - Telefone formatado ou não
 * @param {string} cpfAtual - CPF atual (para comparar)
 * @returns {Promise<{exists: boolean, cpfDiferente: boolean, registro: object|null}>}
 */
export const checkPhoneUsedByOtherCPF = async (telefone, cpfAtual) => {
  try {
    const cleanPhone = telefone.replace(/\D/g, '');
    const cleanCPF = cpfAtual.replace(/\D/g, '');

    // Buscar qualquer registro com este telefone
    const { data, error } = await supabase
      .from('solicitacoes')
      .select('*')
      .eq('telefone', cleanPhone)
      .order('data_criacao', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Erro ao validar telefone:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return {
        exists: false,
        cpfDiferente: false,
        registro: null,
      };
    }

    const registro = data[0];
    const cpfRegistro = (registro.cpf || '').replace(/\D/g, '');

    return {
      exists: true,
      cpfDiferente: cpfRegistro !== cleanCPF,
      registro,
    };
  } catch (error) {
    console.error('Erro em checkPhoneUsedByOtherCPF:', error);
    throw error;
  }
};

/**
 * Verifica se passou 30 dias desde a última solicitação com o mesmo CPF ou telefone
 * @param {string} cpf - CPF do usuário
 * @param {string} telefone - Telefone do usuário
 * @returns {Promise<{canReapply: boolean, daysRemaining: number, lastRequest: object|null}>}
 */
export const check30DaysRule = async (cpf, telefone) => {
  try {
    const cleanCPF = cpf.replace(/\D/g, '');
    const cleanPhone = telefone.replace(/\D/g, '');

    // Buscar registro mais recente com mesmo CPF
    const { data: cpfData, error: cpfError } = await supabase
      .from('solicitacoes')
      .select('data_criacao')
      .eq('cpf', cleanCPF)
      .order('data_criacao', { ascending: false })
      .limit(1);

    if (cpfError) throw cpfError;

    // Buscar registro mais recente com mesmo telefone
    const { data: phoneData, error: phoneError } = await supabase
      .from('solicitacoes')
      .select('data_criacao')
      .eq('telefone', cleanPhone)
      .order('data_criacao', { ascending: false })
      .limit(1);

    if (phoneError) throw phoneError;

    // Usar o mais recente entre CPF e telefone
    let lastRequest = null;
    let lastDate = null;

    if (cpfData && cpfData.length > 0) {
      lastRequest = cpfData[0];
      lastDate = new Date(cpfData[0].data_criacao);
    }

    if (phoneData && phoneData.length > 0) {
      const phoneDate = new Date(phoneData[0].data_criacao);
      if (!lastDate || phoneDate > lastDate) {
        lastDate = phoneDate;
        lastRequest = phoneData[0];
      }
    }

    if (!lastDate) {
      return {
        canReapply: true,
        daysRemaining: 0,
        lastRequest: null,
      };
    }

    // Calcular dias decorridos
    const now = new Date();
    const diffTime = Math.abs(now - lastDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const daysRemaining = Math.max(0, 30 - diffDays);
    const canReapply = daysRemaining === 0;

    return {
      canReapply,
      daysRemaining,
      lastRequest,
    };
  } catch (error) {
    console.error('Erro em check30DaysRule:', error);
    throw error;
  }
};

/**
 * Realiza validações completas antes do envio
 * Retorna objeto com erros ou null se tudo estiver OK
 * @param {object} formData - Dados do formulário
 * @returns {Promise<{valid: boolean, errors: object}>}
 */
export const validateFormBeforeSubmit = async (formData) => {
  const errors = {};

  // 1. Validar CPF
  if (!isValidCPF(formData.cpf)) {
    errors.cpf = 'CPF inválido';
  }

  // Se CPF é inválido, não prosseguir com outras validações
  if (errors.cpf) {
    return { valid: false, errors };
  }

  try {
    // 2. Validar telefone único (não pode estar com outro CPF)
    const phoneCheck = await checkPhoneUsedByOtherCPF(
      formData.telefone,
      formData.cpf
    );

    if (phoneCheck.exists && phoneCheck.cpfDiferente) {
      errors.telefone =
        'Este telefone já foi utilizado e não pode ser usado com outro CPF';
      return { valid: false, errors };
    }

    // 3. Validar regra de 30 dias
    const rule30Days = await check30DaysRule(formData.cpf, formData.telefone);

    if (!rule30Days.canReapply) {
      errors.submit = `Você já possui uma solicitação recente. Aguarde ${rule30Days.daysRemaining} dia(s) para realizar uma nova.`;
      return { valid: false, errors };
    }
  } catch (error) {
    console.error('Erro ao validar formulário:', error);
    errors.submit =
      'Erro ao validar dados. Por favor, tente novamente mais tarde.';
    return { valid: false, errors };
  }

  return { valid: true, errors: {} };
};

/**
 * Função auxiliar para formatação de CPF sem caracteres especiais
 * @param {string} cpf
 * @returns {string}
 */
export const cleanCPF = (cpf) => {
  return cpf.replace(/\D/g, '');
};

/**
 * Função auxiliar para formatação de telefone sem caracteres especiais
 * @param {string} telefone
 * @returns {string}
 */
export const cleanPhone = (telefone) => {
  return telefone.replace(/\D/g, '');
};

/**
 * Valida se um CPF está bloqueado por regra de 30 dias
 * Retorna informações para a validação em tempo real
 * @param {string} cpf - CPF do usuário
 * @returns {Promise<{blocked: boolean, daysRemaining: number, lastRequest: object|null}>}
 */
export const checkCPFBlocking30Days = async (cpf) => {
  try {
    const cleanedCPF = cleanCPF(cpf);

    if (cleanedCPF.length !== 11) {
      return { blocked: false, daysRemaining: 0, lastRequest: null };
    }

    // Buscar registro mais recente com este CPF
    const { data, error } = await supabase
      .from('solicitacoes')
      .select('data_criacao')
      .eq('cpf', cleanedCPF)
      .order('data_criacao', { ascending: false })
      .limit(1);

    if (error) throw error;

    if (!data || data.length === 0) {
      return { blocked: false, daysRemaining: 0, lastRequest: null };
    }

    const lastDate = new Date(data[0].data_criacao);
    const now = new Date();
    const diffTime = Math.abs(now - lastDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.max(0, 30 - diffDays);
    const blocked = daysRemaining > 0;

    return {
      blocked,
      daysRemaining,
      lastRequest: data[0],
    };
  } catch (error) {
    console.error('Erro em checkCPFBlocking30Days:', error);
    // Não bloquear por erro - deixar usuário tentar
    return { blocked: false, daysRemaining: 0, lastRequest: null };
  }
};

/**
 * Valida se um telefone está disponível (não está com outro CPF)
 * @param {string} telefone - Telefone do usuário
 * @param {string} cpfAtual - CPF atual para comparação
 * @returns {Promise<{available: boolean, usedByCPF: string|null}>}
 */
export const checkPhoneAvailability = async (telefone, cpfAtual) => {
  try {
    const cleanedPhone = cleanPhone(telefone);
    const cleanedCPF = cleanCPF(cpfAtual);

    if (cleanedPhone.length < 10) {
      return { available: true, usedByCPF: null };
    }

    // Buscar registro com este telefone
    const { data, error } = await supabase
      .from('solicitacoes')
      .select('cpf')
      .eq('telefone', cleanedPhone)
      .order('data_criacao', { ascending: false })
      .limit(1);

    if (error) throw error;

    if (!data || data.length === 0) {
      return { available: true, usedByCPF: null };
    }

    const usedCPF = (data[0].cpf || '').replace(/\D/g, '');
    const isSameCPF = usedCPF === cleanedCPF;

    return {
      available: isSameCPF, // Disponível se é o mesmo CPF
      usedByCPF: !isSameCPF ? usedCPF : null,
    };
  } catch (error) {
    console.error('Erro em checkPhoneAvailability:', error);
    // Não bloquear por erro - deixar usuário tentar
    return { available: true, usedByCPF: null };
  }
};

/**
 * Cria debounce para função
 * @param {Function} func - Função a ser debounceada
 * @param {number} delay - Delay em ms
 * @returns {Function}
 */
export const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
};
