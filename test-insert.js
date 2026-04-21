import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bokzppkliweaauagnrsu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJva3pwcGtsaXdlYWF1YWducnN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5Njk2MDAsImV4cCI6MjA4NjU0NTYwMH0.xrm6OjuWmOeOi-20sLjf7Ew2mLruqxWm6ut73ydj8FI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function insertTestRequest() {
  try {
    const { data, error } = await supabase
      .from('solicitacoes')
      .insert([
        {
          nome_completo: 'João Silva',
          telefone: '11999999999',
          cpf: '12345678900',
          rua: 'Rua das Flores',
          numero: '123',
          bairro: 'Centro',
          cidade: 'São Paulo',
          status: 'aguardando_documentacao', // Novo status
          limite: 'R$ 5.000,00',
          data_criacao: new Date().toISOString(),
          data_atualizacao: new Date().toISOString(),
        }
      ])
      .select();

    if (error) {
      console.error('Erro ao inserir:', error);
    } else {
      console.log('Solicitação inserida com sucesso:', data);
    }
  } catch (error) {
    console.error('Erro:', error);
  }
}

insertTestRequest();
