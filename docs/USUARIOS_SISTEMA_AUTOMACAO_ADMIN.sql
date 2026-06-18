-- =========================================================
-- Automacao de usuarios_sistema + papel admin (Supabase)
-- Data: 2026-05-19
-- =========================================================
-- Objetivos:
-- 1) Criar perfil em public.usuarios_sistema automaticamente ao cadastrar em auth.users.
-- 2) Garantir bootstrap do primeiro admin (primeiro usuario vira admin).
-- 3) Permitir criar perfis via RPC apenas para admin autenticado.
-- 4) Evitar dependencias de insercao manual em usuarios_sistema no fluxo futuro.

-- =========================================================
-- PRE-REQUISITOS
-- =========================================================
-- Tabela public.usuarios_sistema precisa conter ao menos:
-- - auth_user_id uuid unique
-- - nome text
-- - email text
-- - tipo text
-- - ativo boolean
--
-- Caso sua coluna tipo tenha constraint sem 'admin', ajuste antes:
-- Exemplo (adapte ao nome real da constraint no seu banco):
--   alter table public.usuarios_sistema
--   drop constraint if exists usuarios_sistema_tipo_check;
--   alter table public.usuarios_sistema
--   add constraint usuarios_sistema_tipo_check
--   check (lower(tipo) in ('admin','rh','financeiro','juridico'));

-- =========================================================
-- HOTFIX: garante constraint de tipo com suporte a admin
-- =========================================================
do $$
declare
  r record;
begin
  -- Remove checks que referenciam a coluna tipo para recriar no formato canonico.
  for r in
    select c.conname
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'usuarios_sistema'
      and c.contype = 'c'
      and pg_get_constraintdef(c.oid) ilike '%tipo%'
  loop
    execute format('alter table public.usuarios_sistema drop constraint if exists %I', r.conname);
  end loop;

  -- Normaliza valores antigos para evitar falha ao recriar a check constraint.
  update public.usuarios_sistema
  set tipo = case
    when lower(trim(coalesce(tipo, ''))) in ('admin', 'rh', 'financeiro', 'juridico') then lower(trim(tipo))
    when lower(trim(coalesce(tipo, ''))) in ('jurídico') then 'juridico'
    else 'financeiro'
  end;

  alter table public.usuarios_sistema
    add constraint usuarios_sistema_tipo_check
    check (lower(trim(coalesce(tipo, ''))) in ('admin', 'rh', 'financeiro', 'juridico'));
end
$$;

-- =========================================================
-- FUNCAO: verifica se sessao atual e admin
-- =========================================================
create or replace function public.eh_admin_logado()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.usuarios_sistema u
    where u.auth_user_id = auth.uid()
      and coalesce(u.ativo, true) = true
      and lower(u.tipo) = 'admin'
  );
$$;

grant execute on function public.eh_admin_logado() to authenticated;

-- =========================================================
-- FUNCAO RPC: criar/atualizar perfil (somente admin)
-- =========================================================
create or replace function public.criar_perfil_usuario(
  p_auth_user_id uuid,
  p_nome text,
  p_email text,
  p_tipo text
)
returns public.usuarios_sistema
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tipo text := lower(trim(coalesce(p_tipo, '')));
  v_result public.usuarios_sistema;
  v_is_admin boolean := public.eh_admin_logado();
begin
  if p_auth_user_id is null then
    raise exception 'auth_user_id e obrigatorio';
  end if;

  if trim(coalesce(p_nome, '')) = '' then
    raise exception 'nome e obrigatorio';
  end if;

  if trim(coalesce(p_email, '')) = '' then
    raise exception 'email e obrigatorio';
  end if;

  if v_tipo not in ('admin', 'rh', 'financeiro', 'juridico') then
    raise exception 'tipo invalido: %, use admin/rh/financeiro/juridico', p_tipo;
  end if;

  if not v_is_admin then
    raise exception 'Apenas administradores podem criar perfis';
  end if;

  insert into public.usuarios_sistema (
    auth_user_id,
    nome,
    email,
    tipo,
    ativo
  )
  values (
    p_auth_user_id,
    trim(p_nome),
    lower(trim(p_email)),
    v_tipo,
    true
  )
  on conflict (auth_user_id)
  do update set
    nome = excluded.nome,
    email = excluded.email,
    tipo = excluded.tipo,
    ativo = excluded.ativo
  returning * into v_result;

  return v_result;
end;
$$;

revoke execute on function public.criar_perfil_usuario(uuid, text, text, text) from anon;
grant execute on function public.criar_perfil_usuario(uuid, text, text, text) to authenticated;

-- =========================================================
-- TRIGGER: sincroniza auth.users -> usuarios_sistema
-- =========================================================
create or replace function public.sync_auth_user_to_usuarios_sistema()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nome text;
  v_email text;
  v_tipo text;
  v_tem_admin boolean;
begin
  v_nome := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'nome'), ''),
    split_part(coalesce(new.email, ''), '@', 1),
    'Usuario'
  );

  v_email := lower(trim(coalesce(new.email, '')));
  v_tipo := lower(trim(coalesce(new.raw_user_meta_data ->> 'tipo', 'financeiro')));

  if v_tipo not in ('admin', 'rh', 'financeiro', 'juridico') then
    v_tipo := 'financeiro';
  end if;

  select exists (
    select 1
    from public.usuarios_sistema u
    where lower(u.tipo) = 'admin'
      and coalesce(u.ativo, true) = true
  ) into v_tem_admin;

  -- Bootstrap: primeiro usuario do sistema vira admin automaticamente.
  if not v_tem_admin then
    v_tipo := 'admin';
  elsif v_tipo = 'admin' then
    -- Sem bootstrap, ninguem se promove a admin por metadata.
    v_tipo := 'financeiro';
  end if;

  insert into public.usuarios_sistema (
    auth_user_id,
    nome,
    email,
    tipo,
    ativo
  )
  values (
    new.id,
    v_nome,
    v_email,
    v_tipo,
    true
  )
  on conflict (auth_user_id)
  do update set
    nome = excluded.nome,
    email = excluded.email,
    tipo = case
      when lower(public.usuarios_sistema.tipo) = 'admin' then public.usuarios_sistema.tipo
      else excluded.tipo
    end,
    ativo = public.usuarios_sistema.ativo;

  return new;
end;
$$;

drop trigger if exists trg_sync_auth_user_to_usuarios_sistema on auth.users;
create trigger trg_sync_auth_user_to_usuarios_sistema
after insert on auth.users
for each row
execute function public.sync_auth_user_to_usuarios_sistema();

-- =========================================================
-- BACKFILL: cria perfis faltantes para usuarios antigos
-- =========================================================
insert into public.usuarios_sistema (
  auth_user_id,
  nome,
  email,
  tipo,
  ativo
)
select
  au.id,
  coalesce(
    nullif(trim(au.raw_user_meta_data ->> 'nome'), ''),
    split_part(coalesce(au.email, ''), '@', 1),
    'Usuario'
  ) as nome,
  lower(trim(coalesce(au.email, ''))) as email,
  'financeiro' as tipo,
  true as ativo
from auth.users au
left join public.usuarios_sistema us
  on us.auth_user_id = au.id
where us.auth_user_id is null;

-- Se nao existir nenhum admin ativo, promove o usuario mais antigo para admin.
with sem_admin as (
  select not exists (
    select 1
    from public.usuarios_sistema u
    where lower(u.tipo) = 'admin'
      and coalesce(u.ativo, true) = true
  ) as precisa
), candidato as (
  select us.auth_user_id
  from public.usuarios_sistema us
  where coalesce(us.ativo, true) = true
  order by us.auth_user_id
  limit 1
)
update public.usuarios_sistema us
set tipo = 'admin'
where us.auth_user_id = (select auth_user_id from candidato)
  and (select precisa from sem_admin) = true;

-- =========================================================
-- FIM
-- =========================================================
