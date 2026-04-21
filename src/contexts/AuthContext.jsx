
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const AuthContext = createContext(undefined);

/**
 * Busca o perfil do usuário na tabela usuarios_sistema
 * Tenta usar RPC get_meu_perfil, com fallback para leitura direta
 */
const fetchUserProfile = async (userId) => {
  try {
    // Tenta usar RPC (se existir)
    try {
      const { data, error } = await supabase.rpc('get_meu_perfil', {
        p_auth_user_id: userId,
      });

      if (!error && data) {
        return data;
      }
    } catch (rpcError) {
      // RPC não existe ou falhou, continua para fallback (não loga erro)
    }

    // Fallback: leitura direta da tabela
    const { data: profileData, error: profileError } = await supabase
      .from('usuarios_sistema')
      .select('*')
      .eq('auth_user_id', userId)
      .single();

    if (profileError) {
      console.warn('Perfil não encontrado:', profileError.message);
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
  const [perfil, setPerfil] = useState(null); // { id, auth_user_id, nome, email, tipo, ativo }
  const [loading, setLoading] = useState(true);

  /**
   * Carrega o perfil do usuário autenticado
   */
  const carregarPerfil = useCallback(async (userId) => {
    if (!userId) {
      setPerfil(null);
      return null;
    }

    const profile = await fetchUserProfile(userId);

    if (profile) {
      // Validar se está ativo
      if (!profile.ativo) {
        await supabase.auth.signOut();
        toast({
          variant: 'destructive',
          title: 'Usuário inativo',
          description: 'Sua conta foi desativada. Contate o administrador.',
        });
        setCurrentUser(null);
        setPerfil(null);
        return null;
      }

      setPerfil(profile);
      return profile;
    }

    return null;
  }, [toast]);

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) throw error;

        const session = data?.session;

        if (session?.user) {
          setCurrentUser(session.user);
          await carregarPerfil(session.user.id);
        } else {
          setCurrentUser(null);
          setPerfil(null);
        }
      } catch (error) {
        console.error('Auth session error:', error);
        toast({
          variant: 'destructive',
          title: 'Erro de autenticação',
          description: 'Não foi possível verificar a sessão atual.',
        });
      } finally {
        setLoading(false);
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          if (session?.user) {
            setCurrentUser(session.user);
            await carregarPerfil(session.user.id);
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

  /**
   * Login com email e senha
   * Após autenticar, busca o perfil do usuário
   */
  const login = useCallback(
    async (email, password) => {
      if (!email?.trim() || !password) {
        const validationError = new Error('Email e senha são obrigatórios.');
        toast({
          variant: 'destructive',
          title: 'Dados incompletos',
          description: validationError.message,
        });
        return { error: validationError };
      }

      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) throw error;

        const profile = await carregarPerfil(data.user?.id);

        if (!profile) {
          await supabase.auth.signOut();
          return {
            error: new Error('Perfil de usuário não encontrado'),
          };
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
    },
    [carregarPerfil, toast]
  );

  /**
   * SignUp com email, senha e dados básicos
   * Cria usuário no Supabase Auth
   * Cria perfil na tabela usuarios_sistema via RPC
   */
  const signup = useCallback(
    async (email, password, nome, tipo) => {
      // Validação
      if (!email?.trim() || !password || !nome?.trim() || !tipo?.trim()) {
        const validationError = new Error('Todos os campos são obrigatórios.');
        toast({
          variant: 'destructive',
          title: 'Dados incompletos',
          description: validationError.message,
        });
        return { error: validationError };
      }

      if (!['rh', 'financeiro', 'juridico'].includes(tipo)) {
        const typeError = new Error('Tipo deve ser "rh", "financeiro" ou "juridico".');
        toast({
          variant: 'destructive',
          title: 'Tipo inválido',
          description: typeError.message,
        });
        return { error: typeError };
      }

      try {
        // 1. Criar usuário no Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });

        if (authError) throw authError;

        const userId = authData.user?.id;
        if (!userId) {
          throw new Error('Falha ao criar usuário no sistema de autenticação');
        }

        // 2. Criar perfil via RPC
        const { data: profileData, error: profileError } = await supabase.rpc(
          'criar_perfil_usuario',
          {
            p_auth_user_id: userId,
            p_nome: nome.trim(),
            p_email: email.trim(),
            p_tipo: tipo,
          }
        );

        if (profileError) {
          // Se o RPC falhar, deletar o usuário do Auth
          await supabase.auth.admin.deleteUser(userId);
          throw profileError;
        }

        // 3. Carregar o perfil criado
        const profile = await carregarPerfil(userId);

        if (!profile) {
          throw new Error('Falha ao carregar o perfil criado');
        }

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
    },
    [carregarPerfil, toast]
  );

  /**
   * Logout
   */
  const logout = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
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
  }, [toast]);

  /**
   * Refresh do perfil (útil para sincronizar mudanças do DB)
   */
  const refreshPerfil = useCallback(async () => {
    if (currentUser?.id) {
      await carregarPerfil(currentUser.id);
    }
  }, [currentUser, carregarPerfil]);

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
