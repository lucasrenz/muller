import { createClient } from '@supabase/supabase-js';

const legacySupabaseUrl = 'https://bokzppkliweaauagnrsu.supabase.co';
const legacySupabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJva3pwcGtsaXdlYWF1YWducnN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5NjAwLCJleHAiOjIwODY1NDU2MDB9.xrm6OjuWmOeOi-20sLjf7Ew2mLruqxWm6ut73ydj8FI';

const viteEnv = import.meta.env;
const getEnv = (key, fallback = '') => viteEnv[key] || fallback;

const createNamedClient = (moduleKey, url, anonKey) =>
  createClient(url, anonKey, {
    auth: {
      storageKey: `grupo-muller-${moduleKey}-auth`,
    },
  });

const financeiroUrl = getEnv('VITE_SUPABASE_FINANCEIRO_URL', getEnv('VITE_SUPABASE_URL', legacySupabaseUrl));
const financeiroAnonKey = getEnv('VITE_SUPABASE_FINANCEIRO_ANON_KEY', getEnv('VITE_SUPABASE_ANON_KEY', legacySupabaseAnonKey));

const vagasUrl = getEnv('VITE_SUPABASE_VAGAS_URL', financeiroUrl);
const vagasAnonKey = getEnv('VITE_SUPABASE_VAGAS_ANON_KEY', financeiroAnonKey);

const denunciasUrl = getEnv('VITE_SUPABASE_DENUNCIAS_URL', financeiroUrl);
const denunciasAnonKey = getEnv('VITE_SUPABASE_DENUNCIAS_ANON_KEY', financeiroAnonKey);

export const supabaseFinanceiro = createNamedClient('financeiro', financeiroUrl, financeiroAnonKey);
export const supabaseVagas = createNamedClient('vagas', vagasUrl, vagasAnonKey);
export const supabaseDenuncias = createNamedClient('denuncias', denunciasUrl, denunciasAnonKey);

export const getSupabaseClientByModule = (moduleName = 'financeiro') => {
  switch ((moduleName || '').toLowerCase().trim()) {
    case 'denuncias':
    case 'juridico':
      return supabaseDenuncias;
    case 'vagas':
    case 'rh':
      return supabaseVagas;
    case 'cartao':
    case 'financeiro':
    default:
      return supabaseFinanceiro;
  }
};

export const getSupabaseClientByPath = (path = window.location.pathname) => {
  if (path.startsWith('/denuncias') || path.startsWith('/denuncia') || path.startsWith('/consultar-denuncia') || path.startsWith('/operator-juridico')) {
    return supabaseDenuncias;
  }

  if (path.startsWith('/vagas') || path.startsWith('/operator-rh')) {
    return supabaseVagas;
  }

  return supabaseFinanceiro;
};

const customSupabaseClient = supabaseFinanceiro;

export default customSupabaseClient;

export {
  customSupabaseClient,
  customSupabaseClient as supabase,
};
