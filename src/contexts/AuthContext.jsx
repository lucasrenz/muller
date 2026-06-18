import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getSupabaseClientByModule, getSupabaseClientByPath } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const AuthContext = createContext(undefined);
const AUTH_TIMEOUT_MS = 20000;
const AUTH_DEBUG = true;

const getCurrentPath = () => (typeof window !== 'undefined' ? window.location.pathname : '');

const maskEmail = (email = '') => {
  const [name, domain] = String(email).split('@');
  if (!domain) return email ? '***' : '';
  return `${name.slice(0, 2)}***@${domain}`;
};

const getSafeUser = (user) => user ? ({
  id: user.id,
  email: maskEmail(user.email),
}) : null;

const getSafeSession = (session) => session ? ({
  hasSession: true,
  user: getSafeUser(session.user),
  expiresAt: session.expires_at,
}) : { hasSession: false };

const authLog = (event, payload = {}) => {
  if (!AUTH_DEBUG) return;
  console.log(`[AUTH] ${event}`, {
    path: getCurrentPath(),
    at: new Date().toISOString(),
    ...payload,
  });
};

const authWarn = (event, payload = {}) => {
  if (!AUTH_DEBUG) return;
  console.warn(`[AUTH] ${event}`, {
    path: getCurrentPath(),
    at: new Date().toISOString(),
    ...payload,
  });
};

const authError = (event, error, payload = {}) => {
  console.error(`[AUTH] ${event}`, {
    path: getCurrentPath(),
    at: new Date().toISOString(),
    message: error?.message || String(error),
    error,
    ...payload,
  });
};

const getAuthSupabase = (moduleName) => (
  moduleName ? getSupabaseClientByModule(moduleName) : getSupabaseClientByPath()
);

const withTimeout = (promise, message, label) => {
  let timeoutId;
  const startedAt = Date.now();

  authLog(`${label}:start`);

  const timeout = new Promise((_, reject) => {
    timeoutId = window.setTimeout(() => reject(new Error(message)), AUTH_TIMEOUT_MS);
  });

  return Promise.race([promise, timeout])
    .then((result) => {
      authLog(`${label}:success`, { durationMs: Date.now() - startedAt });
      return result;
    })
    .catch((error) => {
      authError(`${label}:error`, error, { durationMs: Date.now() - startedAt });
      throw error;
    })
    .finally(() => window.clearTimeout(timeoutId));
};

const fetchUserProfile = async (userId, supabaseClient) => {
  authLog('fetchUserProfile:start', { userId });

  try {
    try {
      const { data, error } = await withTimeout(
        supabaseClient.rpc('get_meu_perfil', {
          p_auth_user_id: userId,
        }),
        'Tempo esgotado ao buscar o perfil do usuario. Verifique a conexao com o Supabase no deploy.',
        'fetchUserProfile:rpc'
      );

      authLog('fetchUserProfile:rpc:result', {
        hasData: Boolean(data),
        error: error?.message || null,
        tipo: data?.tipo,
        ativo: data?.ativo,
      });

      if (!error && data) {
        return data;
      }
    } catch (rpcError) {
      authWarn('fetchUserProfile:rpc:fallback', {
        message: rpcError?.message || String(rpcError),
      });
      // Fallback abaixo quando a RPC nao existir no banco.
    }

    const { data: profileData, error: profileError } = await withTimeout(
      supabaseClient
        .from('usuarios_sistema')
        .select('*')
        .eq('auth_user_id', userId)
        .single(),
      'Tempo esgotado ao buscar o perfil do usuario. Verifique a conexao com o Supabase no deploy.',
      'fetchUserProfile:table'
    );

    authLog('fetchUserProfile:table:result', {
      hasData: Boolean(profileData),
      error: profileError?.message || null,
      tipo: profileData?.tipo,
      ativo: profileData?.ativo,
    });

    if (profileError) {
      console.warn('Perfil nao encontrado:', profileError.message);
      return null;
    }

    return profileData;
  } catch (error) {
    authError('fetchUserProfile:failed', error);
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authModule, setAuthModule] = useState(null);

  const carregarPerfil = useCallback(async (userId, moduleName = authModule) => {
    authLog('carregarPerfil:start', { userId, moduleName: moduleName || 'path' });

    if (!userId) {
      setPerfil(null);
      authWarn('carregarPerfil:no-user');
      return null;
    }

    const supabaseClient = getAuthSupabase(moduleName);
    const profile = await fetchUserProfile(userId, supabaseClient);

    if (!profile) {
      authWarn('carregarPerfil:not-found', { userId, moduleName: moduleName || 'path' });
      return null;
    }

    if (!profile.ativo) {
      authWarn('carregarPerfil:inactive-user', {
        userId,
        tipo: profile.tipo,
      });
      await supabaseClient.auth.signOut();
      toast({
        variant: 'destructive',
        title: 'Usuario inativo',
        description: 'Sua conta foi desativada. Contate o administrador.',
      });
      setCurrentUser(null);
      setPerfil(null);
      return null;
    }

    setPerfil(profile);
    authLog('carregarPerfil:success', {
      userId,
      tipo: profile.tipo,
      ativo: profile.ativo,
      moduleName: moduleName || 'path',
    });
    return profile;
  }, [authModule, toast]);

  useEffect(() => {
    const supabaseClient = getAuthSupabase();
    authLog('sessionEffect:start');

    const getSession = async () => {
      try {
        const { data, error } = await withTimeout(
          supabaseClient.auth.getSession(),
          'Tempo esgotado ao verificar a sessao atual. Verifique a conexao com o Supabase no deploy.',
          'getSession'
        );
        if (error) throw error;

        const session = data?.session;
        authLog('getSession:result', getSafeSession(session));

        if (session?.user) {
          setCurrentUser(session.user);
          await carregarPerfil(session.user.id, null);
        } else {
          setCurrentUser(null);
          setPerfil(null);
        }
      } catch (error) {
        authError('getSession:failed-background-check', error);
      } finally {
        authLog('sessionEffect:loading-false');
        setLoading(false);
      }
    };

    getSession();

    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
      async (event, session) => {
        authLog('onAuthStateChange:event', {
          event,
          session: getSafeSession(session),
        });

        try {
          if (session?.user) {
            setCurrentUser(session.user);
            await carregarPerfil(session.user.id, null);
          } else {
            setCurrentUser(null);
            setPerfil(null);
          }
        } catch (error) {
          authError('onAuthStateChange:failed', error, { event });
        }
      }
    );

    return () => {
      authLog('sessionEffect:cleanup');
      subscription.unsubscribe();
    };
  }, [carregarPerfil, toast]);

  const login = useCallback(async (email, password, moduleName = null) => {
    authLog('login:start', {
      email: maskEmail(email),
      moduleName: moduleName || authModule || 'path',
      hasPassword: Boolean(password),
    });

    if (!email?.trim() || !password) {
      const validationError = new Error('Email e senha sao obrigatorios.');
      authWarn('login:validation-error', { message: validationError.message });
      toast({
        variant: 'destructive',
        title: 'Dados incompletos',
        description: validationError.message,
      });
      return { error: validationError };
    }

    const loginModule = moduleName || authModule;
    const supabaseClient = getAuthSupabase(loginModule);

    try {
      const { data, error } = await withTimeout(
        supabaseClient.auth.signInWithPassword({
          email: email.trim(),
          password,
        }),
        'Tempo esgotado ao autenticar. Verifique se as variaveis VITE_SUPABASE_* foram configuradas no build do deploy.',
        'login:signInWithPassword'
      );

      if (error) throw error;

      authLog('login:auth-success', {
        moduleName: loginModule || 'path',
        user: getSafeUser(data.user),
      });

      setAuthModule(loginModule);
      const profile = await carregarPerfil(data.user?.id, loginModule);

      if (!profile) {
        authWarn('login:profile-not-found-signout', {
          moduleName: loginModule || 'path',
          user: getSafeUser(data.user),
        });
        await supabaseClient.auth.signOut();
        return { error: new Error('Perfil de usuario nao encontrado') };
      }

      authLog('login:success', {
        moduleName: loginModule || 'path',
        user: getSafeUser(data.user),
        tipo: profile.tipo,
      });
      return { data, error: null };
    } catch (error) {
      authError('login:failed', error, {
        email: maskEmail(email),
        moduleName: loginModule || 'path',
      });
      toast({
        variant: 'destructive',
        title: 'Erro ao fazer login',
        description: error.message || 'Algo deu errado',
      });
      return { error };
    }
  }, [authModule, carregarPerfil, toast]);

  const signup = useCallback(async (email, password, nome, tipo, moduleName = null) => {
    if (!email?.trim() || !password || !nome?.trim() || !tipo?.trim()) {
      const validationError = new Error('Todos os campos sao obrigatorios.');
      toast({
        variant: 'destructive',
        title: 'Dados incompletos',
        description: validationError.message,
      });
      return { error: validationError };
    }

    const currentUserType = (perfil?.tipo || '').toLowerCase().trim();
    if (currentUserType !== 'admin') {
      const permissionError = new Error('Apenas administradores podem criar usuarios.');
      toast({
        variant: 'destructive',
        title: 'Acesso negado',
        description: permissionError.message,
      });
      return { error: permissionError };
    }

    if (!['rh', 'financeiro', 'juridico', 'admin'].includes(tipo)) {
      const typeError = new Error('Tipo deve ser "admin", "rh", "financeiro" ou "juridico".');
      toast({
        variant: 'destructive',
        title: 'Tipo invalido',
        description: typeError.message,
      });
      return { error: typeError };
    }

    const signupModule = moduleName || authModule;
    const supabaseClient = getAuthSupabase(signupModule);

    try {
      const { data: authData, error: authError } = await supabaseClient.auth.signUp({
        email: email.trim(),
        password,
      });

      if (authError) throw authError;

      const userId = authData.user?.id;
      if (!userId) throw new Error('Falha ao criar usuario no sistema de autenticacao');

      const { error: profileError } = await supabaseClient.rpc('criar_perfil_usuario', {
        p_auth_user_id: userId,
        p_nome: nome.trim(),
        p_email: email.trim(),
        p_tipo: tipo,
      });

      if (profileError) throw profileError;

      toast({
        title: 'Conta criada com sucesso',
        description: `Bem-vindo, ${nome}!`,
      });

      return { data: authData, error: null };
    } catch (error) {
      console.error('Signup error:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao criar conta',
        description: error.message || 'Algo deu errado',
      });
      return { error };
    }
  }, [authModule, perfil?.tipo, toast]);

  const logout = useCallback(async () => {
    const supabaseClient = getAuthSupabase(authModule);
    authLog('logout:start', { authModule: authModule || 'path' });

    try {
      const { error } = await supabaseClient.auth.signOut();
      if (error) throw error;
      setCurrentUser(null);
      setPerfil(null);
      authLog('logout:success', { authModule: authModule || 'path' });
    } catch (error) {
      authError('logout:failed', error, { authModule: authModule || 'path' });
      toast({
        variant: 'destructive',
        title: 'Erro ao fazer logout',
        description: error.message || 'Algo deu errado',
      });
    }
  }, [authModule, toast]);

  const refreshPerfil = useCallback(async () => {
    if (currentUser?.id) {
      await carregarPerfil(currentUser.id, authModule);
    }
  }, [authModule, currentUser, carregarPerfil]);

  const value = {
    currentUser,
    perfil,
    loading,
    login,
    signup,
    logout,
    refreshPerfil,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
