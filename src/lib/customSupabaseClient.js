import { createClient } from '@supabase/supabase-js';

const legacySupabaseUrl = 'https://bokzppkliweaauagnrsu.supabase.co';
const legacySupabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJva3pwcGtsaXdlYWF1YWducnN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5NjAwLCJleHAiOjIwODY1NDU2MDB9.xrm6OjuWmOeOi-20sLjf7Ew2mLruqxWm6ut73ydj8FI';

const viteEnv = import.meta.env;
const getEnv = (key, fallback = '') => viteEnv[key] || fallback;

const clientCache = globalThis.__GRUPO_MULLER_SUPABASE_CLIENTS__ ||= {};

const logSupabase = (event, payload = {}) => {
  console.log(`[SUPABASE_CLIENT] ${event}`, {
    path: typeof window !== 'undefined' ? window.location.pathname : '',
    at: new Date().toISOString(),
    ...payload,
  });
};

const getSafeConfig = (moduleKey, url, anonKey) => ({
  moduleKey,
  url,
  hasAnonKey: Boolean(anonKey),
  anonKeyLength: anonKey?.length || 0,
});

const createNamedClient = (moduleKey, url, anonKey) => {
  const cacheKey = `${moduleKey}:${url}:${anonKey}`;

  if (clientCache[cacheKey]) {
    logSupabase('cache-hit', getSafeConfig(moduleKey, url, anonKey));
    return clientCache[cacheKey];
  }

  logSupabase('create-client', getSafeConfig(moduleKey, url, anonKey));

  clientCache[cacheKey] = createClient(url, anonKey, {
    auth: {
      storageKey: `grupo-muller-${moduleKey}-auth`,
    },
  });

  return clientCache[cacheKey];
};

const createLazyNamedClient = (moduleKey, url, anonKey) => {
  let client = null;

  const getClient = () => {
    client ||= createNamedClient(moduleKey, url, anonKey);
    return client;
  };

  return new Proxy({}, {
    get(_target, property) {
      if (property === 'then') return undefined;

      const value = getClient()[property];
      return typeof value === 'function' ? value.bind(getClient()) : value;
    },
    set(_target, property, value) {
      getClient()[property] = value;
      return true;
    },
    has(_target, property) {
      return property in getClient();
    },
    ownKeys() {
      return Reflect.ownKeys(getClient());
    },
    getOwnPropertyDescriptor(_target, property) {
      return Object.getOwnPropertyDescriptor(getClient(), property);
    },
  });
};

const financeiroUrl = getEnv('VITE_SUPABASE_FINANCEIRO_URL', getEnv('VITE_SUPABASE_URL', legacySupabaseUrl));
const financeiroAnonKey = getEnv('VITE_SUPABASE_FINANCEIRO_ANON_KEY', getEnv('VITE_SUPABASE_ANON_KEY', legacySupabaseAnonKey));

const vagasUrl = getEnv('VITE_SUPABASE_VAGAS_URL', financeiroUrl);
const vagasAnonKey = getEnv('VITE_SUPABASE_VAGAS_ANON_KEY', financeiroAnonKey);

const denunciasUrl = getEnv('VITE_SUPABASE_DENUNCIAS_URL', financeiroUrl);
const denunciasAnonKey = getEnv('VITE_SUPABASE_DENUNCIAS_ANON_KEY', financeiroAnonKey);

export const supabaseFinanceiro = createLazyNamedClient('financeiro', financeiroUrl, financeiroAnonKey);
export const supabaseVagas = createLazyNamedClient('vagas', vagasUrl, vagasAnonKey);
export const supabaseDenuncias = createLazyNamedClient('denuncias', denunciasUrl, denunciasAnonKey);

export const getSupabaseClientByModule = (moduleName = 'financeiro') => {
  const normalizedModule = (moduleName || '').toLowerCase().trim();
  logSupabase('select-by-module', { moduleName, normalizedModule });

  switch (normalizedModule) {
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
  let selectedModule = 'financeiro';

  if (path.startsWith('/denuncias') || path.startsWith('/denuncia') || path.startsWith('/consultar-denuncia') || path.startsWith('/operator-juridico')) {
    selectedModule = 'denuncias';
    logSupabase('select-by-path', { path, selectedModule });
    return supabaseDenuncias;
  }

  if (path.startsWith('/vagas') || path.startsWith('/operator-rh')) {
    selectedModule = 'vagas';
    logSupabase('select-by-path', { path, selectedModule });
    return supabaseVagas;
  }

  logSupabase('select-by-path', { path, selectedModule });
  return supabaseFinanceiro;
};

const customSupabaseClient = supabaseFinanceiro;

export default customSupabaseClient;

export {
  customSupabaseClient,
  customSupabaseClient as supabase,
};
