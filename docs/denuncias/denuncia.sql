-- ExtensÃµes Ãºteis
create extension if not exists pgcrypto;

-- =========================================================
-- 1) FUNÃ‡ÃƒO PARA UPDATED_AT
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
-- 2) FUNÃ‡ÃƒO PARA GERAR PROTOCOLO
-- Formato: 2026-1234
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

-- =========================================================
-- 3) FUNÃ‡ÃƒO PARA GERAR CÃ“DIGO DE ACESSO
-- Exemplo: 483920
-- =========================================================
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
-- 4) TABELA PRINCIPAL: DENUNCIAS
-- =========================================================
create table if not exists public.denuncias (
  id uuid primary key default gen_random_uuid(),

  protocolo text not null unique default public.gerar_protocolo_denuncia(),
  codigo_acesso text not null default public.gerar_codigo_acesso_denuncia(),

  anonimo boolean not null default true,

  -- se quiser permitir denÃºncia identificada
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
    check (prioridade in (
      'baixa',
      'normal',
      'alta',
      'critica'
    )),

  constraint chk_denuncias_vinculo_grupo
    check (
      vinculo_grupo is null
      or vinculo_grupo in ('colaborador', 'terceirizado', 'fornecedor', 'cliente', 'outro')
    ),

  constraint chk_denuncias_identificacao
    check (
      anonimo = true
      or
      (
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

create index if not exists idx_denuncias_protocolo on public.denuncias (protocolo);
create index if not exists idx_denuncias_status on public.denuncias (status);
create index if not exists idx_denuncias_prioridade on public.denuncias (prioridade);
create index if not exists idx_denuncias_created_at on public.denuncias (created_at desc);

create trigger trg_denuncias_updated_at
before update on public.denuncias
for each row
execute function public.set_updated_at();

-- =========================================================
-- 5) TABELA DE NOTAS INTERNAS
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

create index if not exists idx_denuncia_notas_internas_denuncia_id
  on public.denuncia_notas_internas (denuncia_id);

create index if not exists idx_denuncia_notas_internas_created_at
  on public.denuncia_notas_internas (created_at desc);

-- =========================================================
-- 6) TABELA DE PUBLICAÃ‡Ã•ES AO DENUNCIANTE
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

create index if not exists idx_denuncia_publicacoes_denuncia_id
  on public.denuncia_publicacoes (denuncia_id);

create index if not exists idx_denuncia_publicacoes_publicado_em
  on public.denuncia_publicacoes (publicado_em desc);

-- =========================================================
-- 7) TABELA DE ANEXOS
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

  constraint chk_denuncia_anexos_enviado_por
    check (enviado_por in ('denunciante', 'interno'))
);

create index if not exists idx_denuncia_anexos_denuncia_id
  on public.denuncia_anexos (denuncia_id);

-- =========================================================
-- 8) TABELA DE LOGS / AUDITORIA
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

create index if not exists idx_denuncia_logs_denuncia_id
  on public.denuncia_logs (denuncia_id);

create index if not exists idx_denuncia_logs_created_at
  on public.denuncia_logs (created_at desc);

-- =========================================================
-- 9) TRIGGERS DE CRIAÃ‡ÃƒO DA DENÃšNCIA
--
-- Problema: um BEFORE INSERT nÃ£o pode inserir em tabelas filhas
-- via FK pois o registro pai ainda nÃ£o existe.
-- SoluÃ§Ã£o: dois triggers separados:
--   a) BEFORE INSERT â†’ apenas modifica NEW (campos da prÃ³pria linha)
--   b) AFTER INSERT  â†’ insere nos filhos (denuncia_logs, denuncia_publicacoes)
-- =========================================================

-- 9a) BEFORE: preenche os campos da prÃ³pria linha
create or replace function public.set_campos_criacao_denuncia()
returns trigger
language plpgsql
as $$
begin
  new.resposta_publica_atual := 'Sua denÃºncia foi recebida com sucesso e serÃ¡ analisada pela equipe responsÃ¡vel.';
  new.data_publicacao_resposta := now();
  return new;
end;
$$;

drop trigger if exists trg_set_campos_criacao_denuncia on public.denuncias;

create trigger trg_set_campos_criacao_denuncia
before insert on public.denuncias
for each row
execute function public.set_campos_criacao_denuncia();

-- 9b) AFTER: insere nos filhos (pai jÃ¡ existe na tabela)
create or replace function public.log_criacao_denuncia()
returns trigger
language plpgsql
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
    'DenÃºncia registrada no sistema.',
    case
      when new.anonimo then 'DenÃºncia anÃ´nima'
      else coalesce(new.nome_denunciante, 'Denunciante identificado')
    end
  );

  insert into public.denuncia_publicacoes (
    denuncia_id,
    titulo,
    mensagem,
    visivel_denunciante
  )
  values (
    new.id,
    'DenÃºncia recebida',
    'Sua denÃºncia foi recebida com sucesso e serÃ¡ analisada pela equipe responsÃ¡vel.',
    true
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
-- 10) FUNÃ‡ÃƒO AUXILIAR PARA PUBLICAR RESPOSTA OFICIAL
-- JÃ¡ grava em publicaÃ§Ãµes, atualiza denÃºncia e cria log
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
language plpgsql
as $$
begin
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
    p_titulo,
    p_mensagem,
    p_visivel_denunciante,
    now()
  );

  if p_visivel_denunciante then
    update public.denuncias
    set
      resposta_publica_atual = p_mensagem,
      data_publicacao_resposta = now(),
      status = coalesce(p_novo_status, status)
    where id = p_denuncia_id;
  elsif p_novo_status is not null then
    update public.denuncias
    set status = p_novo_status
    where id = p_denuncia_id;
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
      when p_visivel_denunciante then coalesce(p_titulo, 'Resposta publicada ao denunciante')
      else coalesce(p_titulo, 'PublicaÃ§Ã£o interna registrada')
    end,
    p_usuario_id,
    p_usuario_nome
  );
end;
$$;

-- =========================================================
-- 11) FUNÃ‡ÃƒO AUXILIAR PARA ADICIONAR NOTA INTERNA
-- =========================================================
create or replace function public.adicionar_nota_interna_denuncia(
  p_denuncia_id uuid,
  p_nota text,
  p_usuario_id uuid default null,
  p_usuario_nome text default null,
  p_setor text default null
)
returns void
language plpgsql
as $$
begin
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
    p_nota
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
    left(p_nota, 300),
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
    raise exception 'DenÃºncia nÃ£o encontrada: %', p_denuncia_id;
  end if;

  v_status_final := coalesce(p_status, v_status_atual);
  v_prioridade_final := coalesce(p_prioridade, v_prioridade_atual);

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
    ) values (
      p_denuncia_id,
      'denuncia_atualizada',
      array_to_string(v_log, ' | '),
      p_usuario_id,
      p_usuario_nome
    );
  end if;
end;
$$;

-- =========================================================
-- 12) ROW LEVEL SECURITY (RLS)
-- =========================================================

-- denuncias: qualquer visitante (anon) pode criar; leitura bloqueada
alter table public.denuncias enable row level security;

drop policy if exists "anon_insert_denuncias" on public.denuncias;
create policy "anon_insert_denuncias"
  on public.denuncias
  for insert
  to anon
  with check (true);

-- Leitura e ediÃ§Ã£o apenas para usuÃ¡rios autenticados (gestores RH/financeiro)
drop policy if exists "auth_select_denuncias" on public.denuncias;
create policy "auth_select_denuncias"
  on public.denuncias
  for select
  to authenticated
  using (true);

drop policy if exists "auth_update_denuncias" on public.denuncias;
create policy "auth_update_denuncias"
  on public.denuncias
  for update
  to authenticated
  using (true);

-- denuncia_anexos: anon pode inserir (logo apÃ³s criar a denÃºncia)
alter table public.denuncia_anexos enable row level security;

drop policy if exists "anon_insert_denuncia_anexos" on public.denuncia_anexos;
create policy "anon_insert_denuncia_anexos"
  on public.denuncia_anexos
  for insert
  to anon
  with check (true);

drop policy if exists "auth_select_denuncia_anexos" on public.denuncia_anexos;
create policy "auth_select_denuncia_anexos"
  on public.denuncia_anexos
  for select
  to authenticated
  using (true);

-- denuncia_logs: apenas leitura autenticada (escrita feita via trigger/funÃ§Ã£o SECURITY DEFINER)
alter table public.denuncia_logs enable row level security;

drop policy if exists "auth_select_denuncia_logs" on public.denuncia_logs;
create policy "auth_select_denuncia_logs"
  on public.denuncia_logs
  for select
  to authenticated
  using (true);

-- denuncia_publicacoes: leitura autenticada; anon nÃ£o acessa
alter table public.denuncia_publicacoes enable row level security;

drop policy if exists "auth_select_denuncia_publicacoes" on public.denuncia_publicacoes;
create policy "auth_select_denuncia_publicacoes"
  on public.denuncia_publicacoes
  for select
  to authenticated
  using (true);

-- denuncia_notas_internas: apenas autenticado
alter table public.denuncia_notas_internas enable row level security;

drop policy if exists "auth_all_denuncia_notas_internas" on public.denuncia_notas_internas;
create policy "auth_all_denuncia_notas_internas"
  on public.denuncia_notas_internas
  for all
  to authenticated
  using (true);

-- =========================================================
-- 13) FUNÃ‡Ã•ES DE TRIGGER COM SECURITY DEFINER
-- As funÃ§Ãµes de trigger que escrevem em tabelas filhas precisam
-- de SECURITY DEFINER para bypassar RLS ao serem chamadas por anon
-- =========================================================
alter function public.log_criacao_denuncia() security definer;
alter function public.set_campos_criacao_denuncia() security definer;
alter function public.publicar_resposta_denuncia(uuid, text, text, uuid, text, text, boolean) security definer;
alter function public.adicionar_nota_interna_denuncia(uuid, text, uuid, text, text) security definer;
alter function public.atualizar_denuncia_operacao(uuid, text, text, uuid, text) security definer;


