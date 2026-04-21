import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bokzppkliweaauagnrsu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJva3pwcGtsaXdlYWF1YWducnN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5Njk2MDAsImV4cCI6MjA4NjU0NTYwMH0.xrm6OjuWmOeOi-20sLjf7Ew2mLruqxWm6ut73ydj8FI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function insertOperators() {
  try {
    const { data, error } = await supabase
      .from('operadores')
      .insert([
        { codigo: 'OP001', nome: 'João Silva' },
        { codigo: 'OP002', nome: 'Maria Santos' },
        { codigo: 'OP003', nome: 'Carlos Oliveira' },
      ])
      .select();

    if (error) {
      console.error('Erro ao inserir operadores:', error);
    } else {
      console.log('Operadores inseridos com sucesso:', data);
    }
  } catch (error) {
    console.error('Erro:', error);
  }
}

insertOperators();
