import supabase from './customSupabaseClient';

/**
 * Serviço centralizado para operações Supabase na página RH
 * Usa exatamente as tabelas e colunas reais do banco
 */

/**
 * Buscar todas as inscrições com dados relacionados
 * Traz inscrições + dados de cargo + dados de loja
 */
export const fetchInscricoes = async () => {
  try {
    const { data, error } = await supabase
      .from('inscricoes')
      .select(`
        id,
        nome_completo,
        cpf,
        cidade,
        data_nascimento,
        disponibilidade_horario,
        email,
        telefone_1,
        telefone_2,
        como_conheceu,
        vaga_id,
        loja_id,
        cargo_id,
        status,
        banco_talentos,
        score,
        respostas_json,
        created_at,
        cargos:cargo_id(id, nome, descricao, ativo),
        lojas:loja_id(id, nome, cidade, endereco, ativo)
      `);

    if (error) throw error;

    // Normalizar relacionamentos (Supabase retorna arrays, precisamos do primeiro elemento)
    const normalized = data.map(i => ({
      ...i,
      cargos: Array.isArray(i.cargos) ? i.cargos[0] : i.cargos,
      lojas: Array.isArray(i.lojas) ? i.lojas[0] : i.lojas,
    }));

    return { data: normalized, error: null };
  } catch (error) {
    console.error('Erro ao buscar inscrições:', error);
    return { data: null, error };
  }
};

/**
 * Buscar lojas ativas
 */
export const fetchLojas = async () => {
  try {
    const { data, error } = await supabase
      .from('lojas')
      .select('id, nome, cidade, endereco, ativo')
      .eq('ativo', true);

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Erro ao buscar lojas:', error);
    return { data: null, error };
  }
};

/**
 * Buscar cargos ativos
 */
export const fetchCargos = async () => {
  try {
    const { data, error } = await supabase
      .from('cargos')
      .select('id, nome, descricao, ativo')
      .eq('ativo', true);

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Erro ao buscar cargos:', error);
    return { data: null, error };
  }
};

/**
 * Buscar questionários ativos
 */
export const fetchQuestionarios = async () => {
  try {
    const { data, error } = await supabase
      .from('questionarios')
      .select('id, nome, estrutura_json, ativo')
      .eq('ativo', true);

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Erro ao buscar questionários:', error);
    return { data: null, error };
  }
};

/**
 * Buscar todos os questionários incluindo inativos para administração
 */
export const fetchQuestionariosAdmin = async () => {
  try {
    const { data, error } = await supabase
      .from('questionarios')
      .select('id, nome, estrutura_json, ativo, created_at');

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Erro ao buscar questionários (admin):', error);
    return { data: null, error };
  }
};

/**
 * Buscar vagas
 */
export const fetchVagas = async () => {
  try {
    const { data, error } = await supabase
      .from('vagas')
      .select('id, loja_id, cargo_id, questionario_id, quantidade, status, data_abertura, data_fechamento');

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Erro ao buscar vagas:', error);
    return { data: null, error };
  }
};

/**
 * Atualizar status de uma inscrição
 */
export const updateInscricaoStatus = async (inscricaoId, novoStatus) => {
  try {
    const { data, error } = await supabase
      .from('inscricoes')
      .update({ status: novoStatus })
      .eq('id', inscricaoId)
      .select();

    if (error) throw error;
    return { data: data?.[0] || null, error: null };
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    return { data: null, error };
  }
};

/**
 * Marcar/desmarcar inscrição como banco de talentos
 */
export const updateBancoTalentos = async (inscricaoId, isBancoTalentos) => {
  try {
    const { data, error } = await supabase
      .from('inscricoes')
      .update({ banco_talentos: isBancoTalentos })
      .eq('id', inscricaoId)
      .select();

    if (error) throw error;
    return { data: data?.[0] || null, error: null };
  } catch (error) {
    console.error('Erro ao atualizar banco de talentos:', error);
    return { data: null, error };
  }
};

/**
 * Buscar inscrição por ID com todos os dados relacionados
 */
export const fetchInscricaoById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('inscricoes')
      .select(`
        id,
        nome_completo,
        cpf,
        cidade,
        data_nascimento,
        disponibilidade_horario,
        email,
        telefone_1,
        telefone_2,
        como_conheceu,
        vaga_id,
        loja_id,
        cargo_id,
        status,
        banco_talentos,
        score,
        respostas_json,
        created_at,
        cargos:cargo_id(id, nome, descricao, ativo),
        lojas:loja_id(id, nome, cidade, endereco, ativo),
        vagas:vaga_id(id, quantidade, status, data_abertura, data_fechamento, questionario_id, questionarios:questionario_id(id, nome, estrutura_json, ativo))
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    // Normalizar relacionamentos
    const normalized = {
      ...data,
      cargos: Array.isArray(data.cargos) ? data.cargos[0] : data.cargos,
      lojas: Array.isArray(data.lojas) ? data.lojas[0] : data.lojas,
      vagas: Array.isArray(data.vagas) ? data.vagas[0] : data.vagas,
    };

    // Normalizar questionários dentro de vagas
    if (normalized.vagas && normalized.vagas.questionarios) {
      normalized.vagas.questionarios = Array.isArray(normalized.vagas.questionarios)
        ? normalized.vagas.questionarios[0]
        : normalized.vagas.questionarios;
    }

    return { data: normalized, error: null };
  } catch (error) {
    console.error('Erro ao buscar inscrição:', error);
    return { data: null, error };
  }
};

/**
 * Buscar vagas ativas com relacionamentos completos (para página pública)
 */
export const fetchVagasPublicas = async () => {
  try {
    // Primeiro testar sem relacionamentos para diagnóstico
    const { data: dataSimples, error: errorSimples } = await supabase
      .from('vagas')
      .select('*')
      .eq('status', 'aberta');

    console.log('VAGAS SIMPLES:', dataSimples);
    console.log('ERRO SIMPLES:', errorSimples);

    // Agora com relacionamentos
    const { data, error } = await supabase
      .from('vagas')
      .select(`
        id,
        quantidade,
        status,
        data_abertura,
        data_fechamento,
        created_at,
        loja_id,
        cargo_id,
        questionario_id,
        lojas (
          id,
          nome,
          cidade
        ),
        cargos (
          id,
          nome,
          descricao
        )
      `)
      .eq('status', 'aberta')
      .order('created_at', { ascending: false });

    console.log('VAGAS ENCONTRADAS:', data);
    console.log('ERRO VAGAS:', error);

    if (error) throw error;

    // Normalizar relacionamentos
    const normalized = data.map(vaga => ({
      ...vaga,
      lojas: Array.isArray(vaga.lojas) ? vaga.lojas[0] : vaga.lojas,
      cargos: Array.isArray(vaga.cargos) ? vaga.cargos[0] : vaga.cargos,
    }));

    console.log('VAGAS NORMALIZADAS:', normalized);

    return { data: normalized, error: null };
  } catch (error) {
    console.error('Erro ao buscar vagas públicas:', error);
    return { data: null, error };
  }
};

/**
 * Criar nova inscrição
 */
export const createInscricao = async (inscricaoData) => {
  try {
    const { data, error } = await supabase
      .from('inscricoes')
      .insert([inscricaoData])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Erro ao criar inscrição:', error);
    return { data: null, error };
  }
};

// ==========================================
// CRUD LOJAS
// ==========================================

/**
 * Criar nova loja
 */
export const createLoja = async (lojaData) => {
  try {
    const { data, error } = await supabase
      .from('lojas')
      .insert([{
        nome: lojaData.nome,
        cidade: lojaData.cidade,
        endereco: lojaData.endereco,
        ativo: true,
      }])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Erro ao criar loja:', error);
    return { data: null, error };
  }
};

/**
 * Atualizar loja
 */
export const updateLoja = async (lojaId, lojaData) => {
  try {
    const { data, error } = await supabase
      .from('lojas')
      .update({
        nome: lojaData.nome,
        cidade: lojaData.cidade,
        endereco: lojaData.endereco,
      })
      .eq('id', lojaId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Erro ao atualizar loja:', error);
    return { data: null, error };
  }
};

/**
 * Alternar status ativo da loja
 */
export const toggleLojaAtivo = async (lojaId, ativo) => {
  try {
    const { data, error } = await supabase
      .from('lojas')
      .update({ ativo })
      .eq('id', lojaId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Erro ao alterar status da loja:', error);
    return { data: null, error };
  }
};

// ==========================================
// CRUD CARGOS
// ==========================================

/**
 * Criar novo cargo
 */
export const createCargo = async (cargoData) => {
  try {
    const { data, error } = await supabase
      .from('cargos')
      .insert([{
        nome: cargoData.nome,
        descricao: cargoData.descricao,
        ativo: true,
      }])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Erro ao criar cargo:', error);
    return { data: null, error };
  }
};

/**
 * Atualizar cargo
 */
export const updateCargo = async (cargoId, cargoData) => {
  try {
    const { data, error } = await supabase
      .from('cargos')
      .update({
        nome: cargoData.nome,
        descricao: cargoData.descricao,
      })
      .eq('id', cargoId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Erro ao atualizar cargo:', error);
    return { data: null, error };
  }
};

/**
 * Alternar status ativo do cargo
 */
export const toggleCargoAtivo = async (cargoId, ativo) => {
  try {
    const { data, error } = await supabase
      .from('cargos')
      .update({ ativo })
      .eq('id', cargoId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Erro ao alterar status do cargo:', error);
    return { data: null, error };
  }
};

// ==========================================
// CRUD QUESTIONÁRIOS
// ==========================================

/**
 * Criar novo questionário
 */
export const createQuestionario = async (questionarioData) => {
  try {
    // Validar JSON da estrutura
    if (questionarioData.estrutura_json) {
      JSON.parse(questionarioData.estrutura_json);
    }

    const { data, error } = await supabase
      .from('questionarios')
      .insert([{
        nome: questionarioData.nome,
        estrutura_json: questionarioData.estrutura_json || '[]',
        ativo: true,
      }])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Erro ao criar questionário:', error);
    return { data: null, error };
  }
};

/**
 * Atualizar questionário
 */
export const updateQuestionario = async (questionarioId, questionarioData) => {
  try {
    // Validar JSON da estrutura
    if (questionarioData.estrutura_json) {
      JSON.parse(questionarioData.estrutura_json);
    }

    const { data, error } = await supabase
      .from('questionarios')
      .update({
        nome: questionarioData.nome,
        estrutura_json: questionarioData.estrutura_json,
      })
      .eq('id', questionarioId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Erro ao atualizar questionário:', error);
    return { data: null, error };
  }
};

/**
 * Alternar status ativo do questionário
 */
export const toggleQuestionarioAtivo = async (questionarioId, ativo) => {
  try {
    const { data, error } = await supabase
      .from('questionarios')
      .update({ ativo })
      .eq('id', questionarioId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Erro ao alterar status do questionário:', error);
    return { data: null, error };
  }
};

// ==========================================
// CRUD VAGAS
// ==========================================

/**
 * Criar nova vaga
 */
export const createVaga = async (vagaData) => {
  try {
    const { data, error } = await supabase
      .from('vagas')
      .insert([{
        loja_id: vagaData.loja_id,
        cargo_id: vagaData.cargo_id,
        questionario_id: vagaData.questionario_id,
        quantidade: vagaData.quantidade,
        status: 'aberta',
        data_abertura: new Date().toISOString(),
        data_fechamento: vagaData.data_fechamento,
      }])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Erro ao criar vaga:', error);
    return { data: null, error };
  }
};

/**
 * Atualizar vaga
 */
export const updateVaga = async (vagaId, vagaData) => {
  try {
    const { data, error } = await supabase
      .from('vagas')
      .update({
        loja_id: vagaData.loja_id,
        cargo_id: vagaData.cargo_id,
        questionario_id: vagaData.questionario_id,
        quantidade: vagaData.quantidade,
        data_fechamento: vagaData.data_fechamento,
      })
      .eq('id', vagaId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Erro ao atualizar vaga:', error);
    return { data: null, error };
  }
};

/**
 * Alternar status da vaga
 */
export const toggleVagaStatus = async (vagaId, status) => {
  try {
    const updateData = { status };
    
    // Se fechando a vaga, definir data_fechamento
    if (status === 'fechada') {
      updateData.data_fechamento = new Date().toISOString();
    }
    
    // Se reabrindo, limpar data_fechamento
    if (status === 'aberta') {
      updateData.data_fechamento = null;
    }

    const { data, error } = await supabase
      .from('vagas')
      .update(updateData)
      .eq('id', vagaId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Erro ao alterar status da vaga:', error);
    return { data: null, error };
  }
};

/**
 * Buscar questionário associado a uma vaga
 */
export const fetchQuestionarioByVagaId = async (vagaId) => {
  try {
    // Primeiro, buscar a vaga para obter o questionario_id
    const { data: vaga, error: vagaError } = await supabase
      .from('vagas')
      .select('questionario_id')
      .eq('id', vagaId)
      .single();

    if (vagaError) throw vagaError;

    if (!vaga.questionario_id) {
      return { data: null, error: 'Vaga não possui questionário associado' };
    }

    // Depois, buscar o questionário
    const { data: questionario, error: qError } = await supabase
      .from('questionarios')
      .select('id, nome, estrutura_json, ativo')
      .eq('id', vaga.questionario_id)
      .eq('ativo', true)
      .single();

    if (qError) throw qError;

    return { data: questionario, error: null };
  } catch (error) {
    console.error('Erro ao buscar questionário por vaga:', error);
    return { data: null, error };
  }
};

export default {
  fetchInscricoes,
  fetchLojas,
  fetchCargos,
  fetchQuestionarios,
  fetchVagas,
  fetchVagasPublicas,
  updateInscricaoStatus,
  updateBancoTalentos,
  fetchInscricaoById,
  fetchQuestionarioByVagaId,
  createInscricao,
  // CRUD Lojas
  createLoja,
  updateLoja,
  toggleLojaAtivo,
  // CRUD Cargos
  createCargo,
  updateCargo,
  toggleCargoAtivo,
  // CRUD Questionários
  createQuestionario,
  updateQuestionario,
  toggleQuestionarioAtivo,
  // CRUD Vagas
  createVaga,
  updateVaga,
  toggleVagaStatus,
};
