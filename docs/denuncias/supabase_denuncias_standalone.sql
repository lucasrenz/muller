-- =========================================================
-- SUPABASE STANDALONE - CANAL DE DENUNCIAS
-- =========================================================
-- Use este arquivo em um projeto Supabase separado, dedicado ao
-- modulo de denuncias.
--
-- Inclui:
-- - Tabelas do canal de denuncias
-- - Funcoes RPC usadas pelo frontend
-- - Triggers de protocolo, resposta inicial, logs e updated_at
-- - RLS/policies para formulario publico, consulta publica e painel autenticado
-- - Bucket de storage "denuncias-anexos"
-- - Tabela minima "usuarios_sistema" para login do painel juridico/admin
--
-- Observacao:
-- O primeiro usuario criado no Supabase Auth vira "admin" automaticamente.
-- Usuarios seguintes podem ser ajustados para "juridico" pela tabela
-- usuarios_sistema ou pela RPC criar_perfil_usuario.

begin;

-- =========================================================
-- 0) EXTENSOES
-- =========================================================

create extension if not exists pgcrypto;

-- =========================================================
-- 1) HELPERS GERAIS
-- =========================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =========================================================
-- 2) AUTENTICACAO MINIMA DO PAINEL
-- =========================================================

create table if not exists public.usuarios_sistema (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  nome text not null,
  email text not null,
  tipo text not null default 'juridico',
  ativo boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),

  constraint usuarios_sistema_tipo_check
    check (lower(trim(tipo)) in ('admin', 'juridico', 'financeiro', 'rh'))
);

create index if not exists idx_usuarios_sistema_auth_user_id
  on public.usuarios_sistema (auth_user_id);

create index if not exists idx_usuarios_sistema_tipo
  on public.usuarios_sistema (tipo);

drop trigger if exists trg_usuarios_sistema_updated_at on public.usuarios_sistema;
create trigger trg_usuarios_sistema_updated_at
before update on public.usuarios_sistema
for each row
execute function public.set_updated_at();

alter table public.usuarios_sistema enable row level security;

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
      and lower(trim(u.tipo)) = 'admin'
  );
$$;

create or replace function public.get_meu_perfil(p_auth_user_id uuid default auth.uid())
returns public.usuarios_sistema
language sql
stable
security definer
set search_path = public
as $$
  select u.*
  from public.usuarios_sistema u
  where u.auth_user_id = p_auth_user_id
    and u.auth_user_id = auth.uid()
  limit 1;
$$;

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
  v_tipo text := lower(trim(coalesce(p_tipo, 'juridico')));
  v_result public.usuarios_sistema;
begin
  if not public.eh_admin_logado() then
    raise exception 'Apenas administradores podem criar perfis.';
  end if;

  if p_auth_user_id is null then
    raise exception 'auth_user_id e obrigatorio.';
  end if;

  if trim(coalesce(p_nome, '')) = '' then
    raise exception 'nome e obrigatorio.';
  end if;

  if trim(coalesce(p_email, '')) = '' then
    raise exception 'email e obrigatorio.';
  end if;

  if v_tipo not in ('admin', 'juridico', 'financeiro', 'rh') then
    raise exception 'tipo invalido: %, use admin/juridico/financeiro/rh.', p_tipo;
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
    ativo = excluded.ativo,
    updated_at = now()
  returning * into v_result;

  return v_result;
end;
$$;

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
  v_tipo := lower(trim(coalesce(new.raw_user_meta_data ->> 'tipo', 'juridico')));

  if v_tipo not in ('admin', 'juridico', 'financeiro', 'rh') then
    v_tipo := 'juridico';
  end if;

  select exists (
    select 1
    from public.usuarios_sistema u
    where lower(trim(u.tipo)) = 'admin'
      and coalesce(u.ativo, true) = true
  ) into v_tem_admin;

  -- Bootstrap: o primeiro usuario do projeto vira admin.
  if not v_tem_admin then
    v_tipo := 'admin';
  elsif v_tipo = 'admin' then
    v_tipo := 'juridico';
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
      when lower(trim(public.usuarios_sistema.tipo)) = 'admin' then public.usuarios_sistema.tipo
      else excluded.tipo
    end,
    ativo = public.usuarios_sistema.ativo,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists trg_sync_auth_user_to_usuarios_sistema on auth.users;
create trigger trg_sync_auth_user_to_usuarios_sistema
after insert on auth.users
for each row
execute function public.sync_auth_user_to_usuarios_sistema();

drop policy if exists usuarios_sistema_select_own_or_admin on public.usuarios_sistema;
create policy usuarios_sistema_select_own_or_admin
  on public.usuarios_sistema
  for select
  to authenticated
  using (auth_user_id = auth.uid() or public.eh_admin_logado());

drop policy if exists usuarios_sistema_update_admin on public.usuarios_sistema;
create policy usuarios_sistema_update_admin
  on public.usuarios_sistema
  for update
  to authenticated
  using (public.eh_admin_logado())
  with check (public.eh_admin_logado());

drop policy if exists usuarios_sistema_insert_admin on public.usuarios_sistema;
create policy usuarios_sistema_insert_admin
  on public.usuarios_sistema
  for insert
  to authenticated
  with check (public.eh_admin_logado());

-- Backfill caso ja existam usuarios em Auth antes de rodar este SQL.
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
  ),
  lower(trim(coalesce(au.email, ''))),
  'juridico',
  true
from auth.users au
left join public.usuarios_sistema us
  on us.auth_user_id = au.id
where us.auth_user_id is null;

with sem_admin as (
  select not exists (
    select 1
    from public.usuarios_sistema u
    where lower(trim(u.tipo)) = 'admin'
      and coalesce(u.ativo, true) = true
  ) as precisa
),
candidato as (
  select us.auth_user_id
  from public.usuarios_sistema us
  where coalesce(us.ativo, true) = true
  order by us.created_at asc
  limit 1
)
update public.usuarios_sistema us
set tipo = 'admin',
    updated_at = now()
where us.auth_user_id = (select auth_user_id from candidato)
  and (select precisa from sem_admin) = true;

-- =========================================================
-- 3) FUNCOES DE PROTOCOLO E CODIGO DE ACESSO
-- =========================================================

create or replace function public.gerar_protocolo_denuncia()
returns text
language plpgsql
set search_path = public
as $$
declare
  ano_atual text := to_char(now(), 'YYYY');
  protocolo_gerado text;
begin
  loop
    protocolo_gerado := ano_atual || '-' || lpad(floor(random() * 10000)::int::text, 4, '0');

    exit when not exists (
      select 1
      from public.denuncias
      where protocolo = protocolo_gerado
    );
  end loop;

  return protocolo_gerado;
end;
$$;

create or replace function public.gerar_codigo_acesso_denuncia()
returns text
language plpgsql
set search_path = public
as $$
begin
  return lpad(floor(random() * 1000000)::int::text, 6, '0');
end;
$$;

-- =========================================================
-- 4) TABELAS DO CANAL DE DENUNCIAS
-- =========================================================

create table if not exists public.denuncias (
  id uuid primary key default gen_random_uuid(),

  protocolo text not null unique default public.gerar_protocolo_denuncia(),
  codigo_acesso text not null default public.gerar_codigo_acesso_denuncia(),

  anonimo boolean not null default true,

  nome_denunciante text,
  email_denunciante text,
  telefone_denunciante text,

  vinculo_grupo text,

  tipo_ocorrencia text not null,
  descricao text not null,

  data_ocorrencia date,
  local_ocorrencia text,

  envolvidos text,
  testemunhas text,

  status text not null default 'nova',
  prioridade text not null default 'normal',

  resposta_publica_atual text,
  data_publicacao_resposta timestamp with time zone,

  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),

  constraint chk_denuncias_tipo_ocorrencia
    check (tipo_ocorrencia in ('assedio', 'fraude', 'corrupcao', 'outros')),

  constraint chk_denuncias_vinculo_grupo
    check (
      vinculo_grupo is null
      or vinculo_grupo in ('colaborador', 'terceirizado', 'fornecedor', 'cliente', 'outro')
    ),

  constraint chk_denuncias_status
    check (status in (
      'nova',
      'triagem',
      'em_analise',
      'em_investigacao',
      'aguardando_informacoes',
      'concluida',
      'arquivada'
    )),

  constraint chk_denuncias_prioridade
    check (prioridade in ('baixa', 'normal', 'alta', 'critica')),

  constraint chk_denuncias_identificacao
    check (
      anonimo = true
      or (
        coalesce(trim(nome_denunciante), '') <> ''
        or coalesce(trim(email_denunciante), '') <> ''
        or coalesce(trim(telefone_denunciante), '') <> ''
      )
    )
);

alter table public.denuncias
  add column if not exists vinculo_grupo text;

do $$
begin
  alter table public.denuncias
    add constraint chk_denuncias_vinculo_grupo
    check (
      vinculo_grupo is null
      or vinculo_grupo in ('colaborador', 'terceirizado', 'fornecedor', 'cliente', 'outro')
    );
exception
  when duplicate_object then null;
end;
$$;

create index if not exists idx_denuncias_protocolo
  on public.denuncias (protocolo);

create index if not exists idx_denuncias_codigo_acesso
  on public.denuncias (codigo_acesso);

create index if not exists idx_denuncias_status
  on public.denuncias (status);

create index if not exists idx_denuncias_prioridade
  on public.denuncias (prioridade);

create index if not exists idx_denuncias_tipo_ocorrencia
  on public.denuncias (tipo_ocorrencia);

create index if not exists idx_denuncias_created_at
  on public.denuncias (created_at desc);

drop trigger if exists trg_denuncias_updated_at on public.denuncias;
create trigger trg_denuncias_updated_at
before update on public.denuncias
for each row
execute function public.set_updated_at();

create table if not exists public.denuncia_notas_internas (
  id uuid primary key default gen_random_uuid(),
  denuncia_id uuid not null references public.denuncias(id) on delete cascade,

  usuario_id uuid,
  usuario_nome text,
  setor text,

  nota text not null,

  created_at timestamp with time zone not null default now()
);

create index if not exists idx_denuncia_notas_internas_denuncia_id
  on public.denuncia_notas_internas (denuncia_id);

create index if not exists idx_denuncia_notas_internas_created_at
  on public.denuncia_notas_internas (created_at desc);

create table if not exists public.denuncia_publicacoes (
  id uuid primary key default gen_random_uuid(),
  denuncia_id uuid not null references public.denuncias(id) on delete cascade,

  usuario_id uuid,
  usuario_nome text,

  titulo text,
  mensagem text not null,

  visivel_denunciante boolean not null default true,
  publicado_em timestamp with time zone not null default now()
);

create index if not exists idx_denuncia_publicacoes_denuncia_id
  on public.denuncia_publicacoes (denuncia_id);

create index if not exists idx_denuncia_publicacoes_publicado_em
  on public.denuncia_publicacoes (publicado_em desc);

create table if not exists public.denuncia_anexos (
  id uuid primary key default gen_random_uuid(),
  denuncia_id uuid not null references public.denuncias(id) on delete cascade,

  nome_arquivo text not null,
  url_arquivo text not null,
  tipo_arquivo text,
  tamanho_bytes bigint,

  enviado_por text not null default 'denunciante',
  created_at timestamp with time zone not null default now(),

  constraint chk_denuncia_anexos_enviado_por
    check (enviado_por in ('denunciante', 'interno'))
);

create index if not exists idx_denuncia_anexos_denuncia_id
  on public.denuncia_anexos (denuncia_id);

create table if not exists public.denuncia_logs (
  id uuid primary key default gen_random_uuid(),
  denuncia_id uuid not null references public.denuncias(id) on delete cascade,

  acao text not null,
  detalhes text,

  usuario_id uuid,
  usuario_nome text,

  created_at timestamp with time zone not null default now()
);

create index if not exists idx_denuncia_logs_denuncia_id
  on public.denuncia_logs (denuncia_id);

create index if not exists idx_denuncia_logs_created_at
  on public.denuncia_logs (created_at desc);

-- =========================================================
-- 5) TRIGGERS E RPCS DO FLUXO DE DENUNCIAS
-- =========================================================

create or replace function public.set_campos_criacao_denuncia()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.resposta_publica_atual := coalesce(
    new.resposta_publica_atual,
    'Sua denuncia foi recebida com sucesso e sera analisada pela equipe responsavel.'
  );
  new.data_publicacao_resposta := coalesce(new.data_publicacao_resposta, now());
  return new;
end;
$$;

drop trigger if exists trg_set_campos_criacao_denuncia on public.denuncias;
create trigger trg_set_campos_criacao_denuncia
before insert on public.denuncias
for each row
execute function public.set_campos_criacao_denuncia();

create or replace function public.log_criacao_denuncia()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.denuncia_logs (
    denuncia_id,
    acao,
    detalhes,
    usuario_nome
  )
  values (
    new.id,
    'denuncia_criada',
    'Denuncia registrada no sistema.',
    case
      when new.anonimo then 'Denuncia anonima'
      else coalesce(new.nome_denunciante, 'Denunciante identificado')
    end
  );

  insert into public.denuncia_publicacoes (
    denuncia_id,
    titulo,
    mensagem,
    visivel_denunciante,
    publicado_em
  )
  values (
    new.id,
    'Denuncia recebida',
    'Sua denuncia foi recebida com sucesso e sera analisada pela equipe responsavel.',
    true,
    now()
  );

  return new;
end;
$$;

drop trigger if exists trg_log_criacao_denuncia on public.denuncias;
create trigger trg_log_criacao_denuncia
after insert on public.denuncias
for each row
execute function public.log_criacao_denuncia();

create or replace function public.publicar_resposta_denuncia(
  p_denuncia_id uuid,
  p_titulo text,
  p_mensagem text,
  p_usuario_id uuid default null,
  p_usuario_nome text default null,
  p_novo_status text default null,
  p_visivel_denunciante boolean default true
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if trim(coalesce(p_mensagem, '')) = '' then
    raise exception 'A mensagem da publicacao e obrigatoria.';
  end if;

  if p_novo_status is not null and p_novo_status not in (
    'nova',
    'triagem',
    'em_analise',
    'em_investigacao',
    'aguardando_informacoes',
    'concluida',
    'arquivada'
  ) then
    raise exception 'Status invalido: %', p_novo_status;
  end if;

  insert into public.denuncia_publicacoes (
    denuncia_id,
    usuario_id,
    usuario_nome,
    titulo,
    mensagem,
    visivel_denunciante,
    publicado_em
  )
  values (
    p_denuncia_id,
    p_usuario_id,
    p_usuario_nome,
    nullif(trim(coalesce(p_titulo, '')), ''),
    trim(p_mensagem),
    p_visivel_denunciante,
    now()
  );

  if p_visivel_denunciante then
    update public.denuncias
    set
      resposta_publica_atual = trim(p_mensagem),
      data_publicacao_resposta = now(),
      status = coalesce(p_novo_status, status)
    where id = p_denuncia_id;
  elsif p_novo_status is not null then
    update public.denuncias
    set status = p_novo_status
    where id = p_denuncia_id;
  end if;

  if not found then
    raise exception 'Denuncia nao encontrada: %', p_denuncia_id;
  end if;

  insert into public.denuncia_logs (
    denuncia_id,
    acao,
    detalhes,
    usuario_id,
    usuario_nome
  )
  values (
    p_denuncia_id,
    'resposta_publicada',
    case
      when p_visivel_denunciante then coalesce(nullif(trim(coalesce(p_titulo, '')), ''), 'Resposta publicada ao denunciante')
      else coalesce(nullif(trim(coalesce(p_titulo, '')), ''), 'Publicacao interna registrada')
    end,
    p_usuario_id,
    p_usuario_nome
  );
end;
$$;

create or replace function public.adicionar_nota_interna_denuncia(
  p_denuncia_id uuid,
  p_nota text,
  p_usuario_id uuid default null,
  p_usuario_nome text default null,
  p_setor text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if trim(coalesce(p_nota, '')) = '' then
    raise exception 'A nota interna e obrigatoria.';
  end if;

  insert into public.denuncia_notas_internas (
    denuncia_id,
    usuario_id,
    usuario_nome,
    setor,
    nota
  )
  values (
    p_denuncia_id,
    p_usuario_id,
    p_usuario_nome,
    p_setor,
    trim(p_nota)
  );

  insert into public.denuncia_logs (
    denuncia_id,
    acao,
    detalhes,
    usuario_id,
    usuario_nome
  )
  values (
    p_denuncia_id,
    'nota_interna_adicionada',
    left(trim(p_nota), 300),
    p_usuario_id,
    p_usuario_nome
  );
end;
$$;

create or replace function public.atualizar_denuncia_operacao(
  p_denuncia_id uuid,
  p_status text default null,
  p_prioridade text default null,
  p_usuario_id uuid default null,
  p_usuario_nome text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status_atual text;
  v_prioridade_atual text;
  v_status_final text;
  v_prioridade_final text;
  v_log text[] := '{}';
begin
  select status, prioridade
    into v_status_atual, v_prioridade_atual
  from public.denuncias
  where id = p_denuncia_id
  for update;

  if not found then
    raise exception 'Denuncia nao encontrada: %', p_denuncia_id;
  end if;

  v_status_final := coalesce(p_status, v_status_atual);
  v_prioridade_final := coalesce(p_prioridade, v_prioridade_atual);

  if v_status_final not in (
    'nova',
    'triagem',
    'em_analise',
    'em_investigacao',
    'aguardando_informacoes',
    'concluida',
    'arquivada'
  ) then
    raise exception 'Status invalido: %', v_status_final;
  end if;

  if v_prioridade_final not in ('baixa', 'normal', 'alta', 'critica') then
    raise exception 'Prioridade invalida: %', v_prioridade_final;
  end if;

  update public.denuncias
  set
    status = v_status_final,
    prioridade = v_prioridade_final,
    updated_at = now()
  where id = p_denuncia_id;

  if v_status_final is distinct from v_status_atual then
    v_log := array_append(v_log, format('Status: %s -> %s', coalesce(v_status_atual, 'null'), v_status_final));
  end if;

  if v_prioridade_final is distinct from v_prioridade_atual then
    v_log := array_append(v_log, format('Prioridade: %s -> %s', coalesce(v_prioridade_atual, 'null'), v_prioridade_final));
  end if;

  if array_length(v_log, 1) is not null then
    insert into public.denuncia_logs (
      denuncia_id,
      acao,
      detalhes,
      usuario_id,
      usuario_nome
    )
    values (
      p_denuncia_id,
      'denuncia_atualizada',
      array_to_string(v_log, ' | '),
      p_usuario_id,
      p_usuario_nome
    );
  end if;
end;
$$;

-- RPC opcional mais segura para consulta publica.
-- O frontend atual usa select direto nas tabelas, mas esta RPC fica pronta
-- caso voce queira migrar a consulta publica depois.
create or replace function public.consultar_denuncia_publica(
  p_protocolo text,
  p_codigo_acesso text
)
returns table (
  id uuid,
  protocolo text,
  status text,
  tipo_ocorrencia text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  resposta_publica_atual text,
  data_publicacao_resposta timestamp with time zone,
  anonimo boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    d.id,
    d.protocolo,
    d.status,
    d.tipo_ocorrencia,
    d.created_at,
    d.updated_at,
    d.resposta_publica_atual,
    d.data_publicacao_resposta,
    d.anonimo
  from public.denuncias d
  where d.protocolo = upper(trim(p_protocolo))
    and d.codigo_acesso = upper(trim(p_codigo_acesso))
  limit 1;
$$;

-- =========================================================
-- 6) STORAGE - BUCKET DE ANEXOS
-- =========================================================

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'denuncias-anexos',
  'denuncias-anexos',
  true,
  10485760,
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'audio/mpeg',
    'audio/mp3'
  ]
)
on conflict (id)
do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists storage_denuncias_anexos_insert_anon on storage.objects;
create policy storage_denuncias_anexos_insert_anon
  on storage.objects
  for insert
  to anon
  with check (bucket_id = 'denuncias-anexos');

drop policy if exists storage_denuncias_anexos_insert_auth on storage.objects;
create policy storage_denuncias_anexos_insert_auth
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'denuncias-anexos');

drop policy if exists storage_denuncias_anexos_select_public on storage.objects;
create policy storage_denuncias_anexos_select_public
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'denuncias-anexos');

-- =========================================================
-- 7) RLS - TABELAS DE DENUNCIAS
-- =========================================================

alter table public.denuncias enable row level security;
alter table public.denuncia_notas_internas enable row level security;
alter table public.denuncia_publicacoes enable row level security;
alter table public.denuncia_anexos enable row level security;
alter table public.denuncia_logs enable row level security;

-- Formulario publico: visitantes podem criar denuncias.
drop policy if exists denuncias_insert_anon on public.denuncias;
create policy denuncias_insert_anon
  on public.denuncias
  for insert
  to anon
  with check (true);

drop policy if exists denuncias_insert_auth on public.denuncias;
create policy denuncias_insert_auth
  on public.denuncias
  for insert
  to authenticated
  with check (true);

-- Consulta publica: necessaria para o frontend atual, que consulta a tabela
-- filtrando por protocolo + codigo_acesso. Para uma versao mais restrita,
-- migre o frontend para a RPC consultar_denuncia_publica e remova esta policy.
drop policy if exists denuncias_select_anon_consulta_publica on public.denuncias;
create policy denuncias_select_anon_consulta_publica
  on public.denuncias
  for select
  to anon
  using (true);

-- Painel autenticado.
drop policy if exists denuncias_select_auth on public.denuncias;
create policy denuncias_select_auth
  on public.denuncias
  for select
  to authenticated
  using (true);

drop policy if exists denuncias_update_auth on public.denuncias;
create policy denuncias_update_auth
  on public.denuncias
  for update
  to authenticated
  using (true)
  with check (true);

-- Anexos: visitantes registram anexos apos upload; painel autenticado le.
drop policy if exists denuncia_anexos_insert_anon on public.denuncia_anexos;
create policy denuncia_anexos_insert_anon
  on public.denuncia_anexos
  for insert
  to anon
  with check (enviado_por = 'denunciante');

drop policy if exists denuncia_anexos_insert_auth on public.denuncia_anexos;
create policy denuncia_anexos_insert_auth
  on public.denuncia_anexos
  for insert
  to authenticated
  with check (true);

drop policy if exists denuncia_anexos_select_auth on public.denuncia_anexos;
create policy denuncia_anexos_select_auth
  on public.denuncia_anexos
  for select
  to authenticated
  using (true);

-- Publicacoes: visitante ve somente mensagens marcadas como visiveis.
drop policy if exists denuncia_publicacoes_select_anon_visivel on public.denuncia_publicacoes;
create policy denuncia_publicacoes_select_anon_visivel
  on public.denuncia_publicacoes
  for select
  to anon
  using (visivel_denunciante = true);

drop policy if exists denuncia_publicacoes_select_auth on public.denuncia_publicacoes;
create policy denuncia_publicacoes_select_auth
  on public.denuncia_publicacoes
  for select
  to authenticated
  using (true);

-- Notas e logs: apenas painel autenticado.
drop policy if exists denuncia_notas_select_auth on public.denuncia_notas_internas;
create policy denuncia_notas_select_auth
  on public.denuncia_notas_internas
  for select
  to authenticated
  using (true);

drop policy if exists denuncia_logs_select_auth on public.denuncia_logs;
create policy denuncia_logs_select_auth
  on public.denuncia_logs
  for select
  to authenticated
  using (true);

-- =========================================================
-- 8) GRANTS
-- =========================================================

grant usage on schema public to anon, authenticated;
grant usage on schema storage to anon, authenticated;

grant select on public.usuarios_sistema to authenticated;
grant insert, update on public.usuarios_sistema to authenticated;

grant insert on public.denuncias to anon, authenticated;
grant select (
  id,
  protocolo,
  codigo_acesso,
  status,
  tipo_ocorrencia,
  created_at,
  updated_at,
  resposta_publica_atual,
  data_publicacao_resposta,
  anonimo
) on public.denuncias to anon;
grant select, update on public.denuncias to authenticated;

grant insert on public.denuncia_anexos to anon, authenticated;
grant select on public.denuncia_anexos to authenticated;

grant select on public.denuncia_publicacoes to anon, authenticated;
grant select on public.denuncia_notas_internas to authenticated;
grant select on public.denuncia_logs to authenticated;

revoke execute on function public.criar_perfil_usuario(uuid, text, text, text) from anon;
grant execute on function public.criar_perfil_usuario(uuid, text, text, text) to authenticated;

grant execute on function public.eh_admin_logado() to authenticated;
grant execute on function public.get_meu_perfil(uuid) to authenticated;

revoke execute on function public.publicar_resposta_denuncia(uuid, text, text, uuid, text, text, boolean) from anon;
revoke execute on function public.adicionar_nota_interna_denuncia(uuid, text, uuid, text, text) from anon;
revoke execute on function public.atualizar_denuncia_operacao(uuid, text, text, uuid, text) from anon;

grant execute on function public.publicar_resposta_denuncia(uuid, text, text, uuid, text, text, boolean) to authenticated;
grant execute on function public.adicionar_nota_interna_denuncia(uuid, text, uuid, text, text) to authenticated;
grant execute on function public.atualizar_denuncia_operacao(uuid, text, text, uuid, text) to authenticated;
grant execute on function public.consultar_denuncia_publica(text, text) to anon, authenticated;

commit;

-- =========================================================
-- POS-INSTALACAO
-- =========================================================
-- 1) Rode este SQL no SQL Editor do novo projeto Supabase.
-- 2) Crie o primeiro usuario em Authentication > Users. Ele vira admin.
-- 3) Para o painel de denuncias, crie usuarios com tipo "juridico" ou "admin".
-- 4) Atualize o app para apontar para o novo projeto Supabase:
--    - VITE_SUPABASE_URL
--    - VITE_SUPABASE_ANON_KEY
-- 5) O bucket "denuncias-anexos" sera publico porque o frontend atual usa
--    getPublicUrl para exibir os anexos.


