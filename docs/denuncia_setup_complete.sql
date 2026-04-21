-- Complete setup for Denúncias module
-- Creates tables, functions, triggers and RLS policies.
-- WARNING: run in Supabase SQL Editor; review before executing.

-- 0) Ensure extension
create extension if not exists pgcrypto;

-- =========================================================
-- 1) Utility: set updated_at
-- =========================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =========================================================
-- 2) Protocolo and Código geradores
-- =========================================================
create or replace function public.gerar_protocolo_denuncia()
returns text
language plpgsql
as $$
declare
  ano_atual text := to_char(now(), 'YYYY');
  sequencial integer;
  protocolo_gerado text;
begin
  select coalesce(max((regexp_replace(protocolo, '^.*-(\\d+)$', '\\1'))::integer),0) + 1
    into sequencial
  from public.denuncias
  where to_char(created_at, 'YYYY') = ano_atual;

  protocolo_gerado := 'DEN-' || ano_atual || '-' || lpad(sequencial::text, 6, '0');

  -- evita colisões em cenários concorrentes
  while exists (select 1 from public.denuncias where protocolo = protocolo_gerado) loop
    sequencial := sequencial + 1;
    protocolo_gerado := 'DEN-' || ano_atual || '-' || lpad(sequencial::text, 6, '0');
  end loop;

  return protocolo_gerado;
end;
$$;

create or replace function public.gerar_codigo_acesso_denuncia(tamanho integer default 8)
returns text
language plpgsql
as $$
declare
  caracteres text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  resultado text := '';
  i integer;
begin
  for i in 1..tamanho loop
    resultado := resultado || substr(caracteres, floor(random() * length(caracteres) + 1)::integer, 1);
  end loop;
  return resultado;
end;
$$;

-- =========================================================
-- 3) TABELA PRINCIPAL: denuncias
-- =========================================================
create table if not exists public.denuncias (
  id uuid primary key default gen_random_uuid(),

  protocolo text not null unique default public.gerar_protocolo_denuncia(),
  codigo_acesso text not null default public.gerar_codigo_acesso_denuncia(8),

  anonimo boolean not null default true,

  nome_denunciante text,
  email_denunciante text,
  telefone_denunciante text,

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

  constraint chk_denuncias_status
    check (status in (
      'nova', 'triagem', 'em_analise', 'em_investigacao', 'aguardando_informacoes', 'concluida', 'arquivada'
    )),

  constraint chk_denuncias_prioridade
    check (prioridade in ('baixa','normal','alta','critica')),

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

create index if not exists idx_denuncias_protocolo on public.denuncias (protocolo);
create index if not exists idx_denuncias_status on public.denuncias (status);
create index if not exists idx_denuncias_prioridade on public.denuncias (prioridade);
create index if not exists idx_denuncias_created_at on public.denuncias (created_at desc);

-- updated_at trigger
drop trigger if exists trg_denuncias_updated_at on public.denuncias;
create trigger trg_denuncias_updated_at
before update on public.denuncias
for each row
execute function public.set_updated_at();

-- =========================================================
-- 4) TABELA: denuncia_notas_internas
-- =========================================================
create table if not exists public.denuncia_notas_internas (
  id uuid primary key default gen_random_uuid(),
  denuncia_id uuid not null references public.denuncias(id) on delete cascade,

  usuario_id uuid,
  usuario_nome text,
  setor text,

  nota text not null,

  created_at timestamp with time zone not null default now()
);
create index if not exists idx_denuncia_notas_internas_denuncia_id on public.denuncia_notas_internas (denuncia_id);
create index if not exists idx_denuncia_notas_internas_created_at on public.denuncia_notas_internas (created_at desc);

-- =========================================================
-- 5) TABELA: denuncia_publicacoes
-- =========================================================
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
create index if not exists idx_denuncia_publicacoes_denuncia_id on public.denuncia_publicacoes (denuncia_id);
create index if not exists idx_denuncia_publicacoes_publicado_em on public.denuncia_publicacoes (publicado_em desc);

-- =========================================================
-- 6) TABELA: denuncia_anexos
-- =========================================================
create table if not exists public.denuncia_anexos (
  id uuid primary key default gen_random_uuid(),
  denuncia_id uuid not null references public.denuncias(id) on delete cascade,

  nome_arquivo text not null,
  url_arquivo text not null,
  tipo_arquivo text,
  tamanho_bytes bigint,

  enviado_por text not null default 'denunciante',
  created_at timestamp with time zone not null default now(),

  constraint chk_denuncia_anexos_enviado_por check (enviado_por in ('denunciante','interno'))
);
create index if not exists idx_denuncia_anexos_denuncia_id on public.denuncia_anexos (denuncia_id);

-- =========================================================
-- 7) TABELA: denuncia_logs
-- =========================================================
create table if not exists public.denuncia_logs (
  id uuid primary key default gen_random_uuid(),
  denuncia_id uuid not null references public.denuncias(id) on delete cascade,

  acao text not null,
  detalhes text,

  usuario_id uuid,
  usuario_nome text,

  created_at timestamp with time zone not null default now()
);
create index if not exists idx_denuncia_logs_denuncia_id on public.denuncia_logs (denuncia_id);
create index if not exists idx_denuncia_logs_created_at on public.denuncia_logs (created_at desc);

-- =========================================================
-- 8) FUNÇÕES DE TRIGGER (seguras)
--   a) BEFORE INSERT: apenas modifica NEW
--   b) AFTER INSERT: insere em logs/publicacoes (SECURITY DEFINER)
-- =========================================================
create or replace function public.set_campos_criacao_denuncia()
returns trigger
security definer
language plpgsql
as $$
begin
  -- Define resposta pública inicial e data
  new.resposta_publica_atual := coalesce(new.resposta_publica_atual, 'Sua denúncia foi recebida com sucesso e será analisada pela equipe responsável.');
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
security definer
language plpgsql
as $$
begin
  -- Insere log
  insert into public.denuncia_logs (
    denuncia_id, acao, detalhes, usuario_nome
  ) values (
    new.id,
    'denuncia_criada',
    'Denúncia registrada no sistema.',
    case when new.anonimo then 'Denúncia anônima' else coalesce(new.nome_denunciante,'Denunciante identificado') end
  );

  -- Insere publicação ao denunciante
  insert into public.denuncia_publicacoes (
    denuncia_id, titulo, mensagem, visivel_denunciante, publicado_em
  ) values (
    new.id,
    'Denúncia recebida',
    'Sua denúncia foi recebida com sucesso e será analisada pela equipe responsável.',
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

-- =========================================================
-- 9) FUNÇÕES AUXILIARES (PUBLICAR RESPOSTA / ADICIONAR NOTA)
-- =========================================================
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
security definer
language plpgsql
as $$
begin
  insert into public.denuncia_publicacoes (
    denuncia_id, usuario_id, usuario_nome, titulo, mensagem, visivel_denunciante, publicado_em
  ) values (
    p_denuncia_id, p_usuario_id, p_usuario_nome, p_titulo, p_mensagem, p_visivel_denunciante, now()
  );

  if p_visivel_denunciante then
    update public.denuncias
    set resposta_publica_atual = p_mensagem,
        data_publicacao_resposta = now(),
        status = coalesce(p_novo_status, status)
    where id = p_denuncia_id;
  elsif p_novo_status is not null then
    update public.denuncias
    set status = p_novo_status
    where id = p_denuncia_id;
  end if;

  insert into public.denuncia_logs (denuncia_id, acao, detalhes, usuario_id, usuario_nome)
  values (
    p_denuncia_id,
    'resposta_publicada',
    case
      when p_visivel_denunciante then coalesce(p_titulo, 'Resposta publicada ao denunciante')
      else coalesce(p_titulo, 'Publicação interna registrada')
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
security definer
language plpgsql
as $$
begin
  insert into public.denuncia_notas_internas (denuncia_id, usuario_id, usuario_nome, setor, nota)
  values (p_denuncia_id, p_usuario_id, p_usuario_nome, p_setor, p_nota);

  insert into public.denuncia_logs (denuncia_id, acao, detalhes, usuario_id, usuario_nome)
  values (p_denuncia_id, 'nota_interna_adicionada', left(p_nota,300), p_usuario_id, p_usuario_nome);
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
security definer
language plpgsql
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
    raise exception 'Denúncia não encontrada: %', p_denuncia_id;
  end if;

  v_status_final := coalesce(p_status, v_status_atual);
  v_prioridade_final := coalesce(p_prioridade, v_prioridade_atual);

  update public.denuncias
  set status = v_status_final,
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
    insert into public.denuncia_logs (denuncia_id, acao, detalhes, usuario_id, usuario_nome)
    values (p_denuncia_id, 'denuncia_atualizada', array_to_string(v_log, ' | '), p_usuario_id, p_usuario_nome);
  end if;
end;
$$;

-- =========================================================
-- 10) Habilitar RLS e criar policies apropriadas
--  - visitantes (anon) podem INSERT em `denuncias` e `denuncia_anexos`
--  - leitura/edição de denuncias é só para authenticated
--  - logs/publicacoes/notas internos: apenas leitura/execução por autenticados
-- =========================================================

-- Enable RLS on all module tables
alter table public.denuncias enable row level security;
alter table public.denuncia_anexos enable row level security;
alter table public.denuncia_logs enable row level security;
alter table public.denuncia_publicacoes enable row level security;
alter table public.denuncia_notas_internas enable row level security;

-- policies for `denuncias`
drop policy if exists anon_insert_denuncias on public.denuncias;
create policy anon_insert_denuncias
  on public.denuncias for insert to anon
  with check (true);

-- permissive extra policies if desired (avoid duplicate conflicting names)
drop policy if exists public_insert_denuncias on public.denuncias;
create policy public_insert_denuncias
  on public.denuncias for insert to authenticated
  with check (true);

-- select/update only for authenticated
drop policy if exists auth_select_denuncias on public.denuncias;
create policy auth_select_denuncias
  on public.denuncias for select to authenticated
  using (true);

drop policy if exists auth_update_denuncias on public.denuncias;
create policy auth_update_denuncias
  on public.denuncias for update to authenticated
  using (true);

-- policies for `denuncia_anexos` (allow anon insert so client can register uploads)
drop policy if exists anon_insert_denuncia_anexos on public.denuncia_anexos;
create policy anon_insert_denuncia_anexos
  on public.denuncia_anexos for insert to anon
  with check (true);

drop policy if exists auth_select_denuncia_anexos on public.denuncia_anexos;
create policy auth_select_denuncia_anexos
  on public.denuncia_anexos for select to authenticated
  using (true);

-- logs/publicacoes/notas: only authenticated select; writes happen via SECURITY DEFINER functions
drop policy if exists auth_select_denuncia_logs on public.denuncia_logs;
create policy auth_select_denuncia_logs
  on public.denuncia_logs for select to authenticated
  using (true);

drop policy if exists auth_select_denuncia_publicacoes on public.denuncia_publicacoes;
create policy auth_select_denuncia_publicacoes
  on public.denuncia_publicacoes for select to authenticated
  using (true);

drop policy if exists auth_all_denuncia_notas_internas on public.denuncia_notas_internas;
create policy auth_all_denuncia_notas_internas
  on public.denuncia_notas_internas for all to authenticated
  using (true)
  with check (true);

-- =========================================================
-- 11) Final notes: indexes already created; functions marked security definer.
-- After executing: ensure Supabase Storage bucket `denuncias-anexos` exists (create via Dashboard).
-- Also add Allowed origins: http://localhost:3000 (or your dev host) in Supabase Settings -> API.
-- =========================================================

-- End of setup
