import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getSupabaseClientByModule, getSupabaseClientByPath } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const AuthContext = createContext(undefined);

const getAuthSupabase = (moduleName) => (
  moduleName ? getSupabaseClientByModule(moduleName) : getSupabaseClientByPath()
);

const fetchUserProfile = async (userId, supabaseClient) => {
  try {
    try {
      const { data, error } = await supabaseClient.rpc('get_meu_perfil', {
        p_auth_user_id: userId,
      });

      if (!error && data) return data;
    } catch (rpcError) {
      // Fallback abaixo quando a RPC nao existir no banco.
    }

    const { data: profileData, error: profileError } = await supabaseClient
      .from('usuarios_sistema')
      .select('*')
      .eq('auth_user_id', userId)
      .single();

    if (profileError) {
      console.warn('Perfil nao encontrado:', profileError.message);
      return null;
    }

    return profileData;
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
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
    if (!userId) {
      setPerfil(null);
      return null;
    }

    const supabaseClient = getAuthSupabase(moduleName);
    const profile = await fetchUserProfile(userId, supabaseClient);

    if (!profile) return null;

    if (!profile.ativo) {
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
    return profile;
  }, [authModule, toast]);

  useEffect(() => {
    const supabaseClient = getAuthSupabase();

    const getSession = async () => {
      try {
        const { data, error } = await supabaseClient.auth.getSession();
        if (error) throw error;

        const session = data?.session;

        if (session?.user) {
          setCurrentUser(session.user);
          await carregarPerfil(session.user.id, null);
        } else {
          setCurrentUser(null);
          setPerfil(null);
        }
      } catch (error) {
        console.error('Auth session error:', error);
        toast({
          variant: 'destructive',
          title: 'Erro de autenticacao',
          description: 'Nao foi possivel verificar a sessao atual.',
        });
      } finally {
        setLoading(false);
      }
    };

    getSession();

    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
      async (event, session) => {
        try {
          if (session?.user) {
            setCurrentUser(session.user);
            await carregarPerfil(session.user.id, null);
          } else {
            setCurrentUser(null);
            setPerfil(null);
          }
        } catch (error) {
          console.error('Auth state change error:', error);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [carregarPerfil, toast]);

  const login = useCallback(async (email, password, moduleName = null) => {
    if (!email?.trim() || !password) {
      const validationError = new Error('Email e senha sao obrigatorios.');
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
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      setAuthModule(loginModule);
      const profile = await carregarPerfil(data.user?.id, loginModule);

      if (!profile) {
        await supabaseClient.auth.signOut();
        return { error: new Error('Perfil de usuario nao encontrado') };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Login error:', error);
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

    try {
      const { error } = await supabaseClient.auth.signOut();
      if (error) throw error;
      setCurrentUser(null);
      setPerfil(null);
    } catch (error) {
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
