/**
 * Utilitários para transformação de estrutura de respostas do questionário
 * Suporta migração de formato plano para array estruturado com contexto da pergunta
 */

/**
 * Monta array estruturado de respostas com contexto completo
 * Transforma: { pergunta_1: "valor" } → [{ id, pergunta, tipo, resposta }]
 * 
 * @param {Object} respostasBrutas - Objeto plano com chaves pergunta_X
 * @param {Object} estruturaQuestionario - Estrutura do questionário contendo campos
 * @returns {Array} Array com respostas estruturadas ou array vazio se inválido
 */
export function montarRespostasJsonEstruturado(respostasBrutas, estruturaQuestionario) {
  if (!respostasBrutas || !estruturaQuestionario) {
    return [];
  }

  try {
    // Se estruturaQuestionario tem estrutura_json, parsear primeiro
    let campos = [];
    if (estruturaQuestionario.estrutura_json) {
      const parsed = JSON.parse(estruturaQuestionario.estrutura_json);
      campos = parsed.campos || [];
    } else {
      // Fallback para estrutura direta
      campos = estruturaQuestionario.campos || [];
    }

    return campos.map(campo => ({
      id: campo.id,
      pergunta: campo.label || campo.titulo || campo.id,
      resposta: respostasBrutas[campo.id] || null
    }));
  } catch (error) {
    console.error('Erro ao montar respostas estruturadas:', error);
    return [];
  }
}

/**
 * Normaliza respostas independente do formato (antigo ou novo)
 * Detecta automaticamente o formato e converte para array estruturado
 * Suporta leitura de AMBOS os formatos para backward compatibility
 * 
 * @param {string|Object} respostasJson - JSON string ou objeto de respostas
 * @param {Object} estruturaQuestionario - Estrutura do questionário
 * @returns {Array} Array normalizado com respostas estruturadas
 */
export function normalizarRespostas(respostasJson, estruturaQuestionario) {
  if (!respostasJson || !estruturaQuestionario) {
    return [];
  }

  try {
    let respostasObj = respostasJson;

    // Se for string JSON, fazer parse
    if (typeof respostasJson === 'string') {
      respostasObj = JSON.parse(respostasJson);
    }

    // CASO 1: Já é array (novo formato)
    if (Array.isArray(respostasObj)) {
      return respostasObj;
    }

    // CASO 2: É objeto (formato antigo) - converter para array estruturado
    if (typeof respostasObj === 'object') {
      return montarRespostasJsonEstruturado(respostasObj, estruturaQuestionario);
    }

    return [];
  } catch (error) {
    console.error('Erro ao normalizar respostas:', error);
    return [];
  }
}

/**
 * Extrai respostas em formato plano (para compatibilidade ou leitura simples)
 * Converte ao contrário: [{ resposta }] → { pergunta_1: "valor" }
 * 
 * @param {Array} respostasEstruturadas - Array de respostas estruturadas
 * @returns {Object} Objeto plano com chaves pergunta_X
 */
export function extrairRespostasPlanas(respostasEstruturadas) {
  if (!Array.isArray(respostasEstruturadas)) {
    return {};
  }

  return respostasEstruturadas.reduce((acc, item) => {
    acc[item.id] = item.resposta;
    return acc;
  }, {});
}

/**
 * Valida se as respostas estão completas (sem null ou undefined)
 * 
 * @param {Array} respostasEstruturadas - Array de respostas estruturadas
 * @returns {boolean} True se todas as respostas têm valor
 */
export function validarRespostasCompletas(respostasEstruturadas) {
  if (!Array.isArray(respostasEstruturadas)) {
    return false;
  }

  return respostasEstruturadas.every(item => 
    item.resposta !== null && 
    item.resposta !== undefined && 
    (Array.isArray(item.resposta) ? item.resposta.length > 0 : String(item.resposta).trim().length > 0)
  );
}

/**
 * Filtra respostas por tipo de campo
 * 
 * @param {Array} respostasEstruturadas - Array de respostas estruturadas
 * @param {string} tipo - Tipo de campo (text, textarea, radio, checkbox, etc)
 * @returns {Array} Respostas filtradas pelo tipo
 */
export function filtrarRespostasPorTipo(respostasEstruturadas, tipo) {
  if (!Array.isArray(respostasEstruturadas)) {
    return [];
  }

  return respostasEstruturadas.filter(item => item.tipo === tipo);
}

/**
 * Formata respostas para exibição em texto simples
 * Útil para envios por email, logs, etc
 * 
 * @param {Array} respostasEstruturadas - Array de respostas estruturadas
 * @returns {string} String formatada com todas as respostas
 */
export function formatarRespostasParaTexto(respostasEstruturadas) {
  if (!Array.isArray(respostasEstruturadas)) {
    return '';
  }

  return respostasEstruturadas
    .map(item => {
      const resposta = Array.isArray(item.resposta) 
        ? item.resposta.join(', ') 
        : item.resposta;
      return `${item.pergunta}: ${resposta}`;
    })
    .join('\n');
}
