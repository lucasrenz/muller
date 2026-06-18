/**
 * Serviço de autenticação compartilhado entre todos os sistemas
 * Centraliza login, logout e verificação de permissões por módulo
 */
import { supabase } from './supabaseCliente';

/**
 * Mapeamento de módulos para os tipos de usuário permitidos
 */
export const MODULOS = {
  cartao: ['financeiro'],
  denuncias: ['juridico'],
  vagas: ['rh'],
  principal: ['financeiro', 'rh', 'juridico'],
};

/**
 * Rota padrão por tipo de usuário
 */
export const rotaPorTipo = (tipo) => {
  switch (tipo) {
    case 'financeiro': return '/cartao/painel';
    case 'rh':         return '/vagas/painel';
    case 'juridico':   return '/denuncias/painel';
    default:           return '/';
  }
};

/**
 * Login padrão por tipo de usuário (para qual sistema redirecionar)
 */
export const loginPorTipo = (tipo) => {
  switch (tipo) {
    case 'financeiro': return '/cartao/login';
    case 'rh':         return '/vagas/login';
    case 'juridico':   return '/denuncias/login';
    default:           return '/cartao/login';
  }
};

/**
 * Verifica se o tipo de usuário tem permissão para o módulo informado
 */
export const temPermissaoNoModulo = (tipo, modulo) => {
  if (!tipo || !modulo) return false;
  const permitidos = MODULOS[modulo] || [];
  return permitidos.includes(tipo);
};

/**
 * Busca o perfil do usuário na tabela usuarios_sistema
 */
export const buscarPerfil = async (userId) => {
  if (!userId) return null;
  try {
    // Tenta RPC primeiro
    try {
      const { data, error } = await supabase.rpc('get_meu_perfil', {
        p_auth_user_id: userId,
      });
      if (!error && data) return data;
    } catch (_) {}

    // Fallback: leitura direta
    const { data, error } = await supabase
      .from('usuarios_sistema')
      .select('*')
      .eq('auth_user_id', userId)
      .single();

    if (error) return null;
    return data;
  } catch {
    return null;
  }
};

/**
 * Realiza login com email e senha
 */
export const fazerLogin = async (email, senha) => {
  if (!email?.trim() || !senha) {
    return { error: new Error('Email e senha são obrigatórios.') };
  }
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password: senha,
  });
  if (error) return { error };
  return { data };
};

/**
 * Realiza logout
 */
export const fazerLogout = async () => {
  await supabase.auth.signOut();
};
