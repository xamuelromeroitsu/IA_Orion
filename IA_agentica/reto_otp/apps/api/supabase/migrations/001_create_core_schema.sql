-- 001_create_core_schema.sql
-- Esquema base del MVP. Las políticas que usan is_demo_allowed() son temporales:
-- en producción se eliminan y se exige JWT con rol en app_metadata.

create or replace function public.current_role()
returns text
language sql
stable
set search_path = ''
as $$
  select coalesce(
    nullif(nullif(current_setting('request.jwt.claims', true), '')::jsonb -> 'app_metadata' ->> 'role', ''),
    'cargador'
  );
$$;

create or replace function public.is_demo_allowed()
returns boolean
language sql
stable
set search_path = ''
as $$
  select auth.uid() is null;
$$;

create or replace function public.can_read()
returns boolean
language sql
stable
set search_path = ''
as $$
  select public.current_role() in ('cargador', 'revisor', 'aprobador', 'auditor')
    or public.is_demo_allowed();
$$;

create or replace function public.can_write()
returns boolean
language sql
stable
set search_path = ''
as $$
  select public.current_role() in ('cargador', 'revisor')
    or public.is_demo_allowed();
$$;

create or replace function public.can_approve()
returns boolean
language sql
stable
set search_path = ''
as $$
  select public.current_role() = 'aprobador'
    or public.is_demo_allowed();
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.guard_evaluation_approval()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not public.can_approve()
     and (new.approved_by is distinct from old.approved_by
          or (new.status = 'aprobado' and old.status <> 'aprobado')) then
    raise exception 'solo el rol aprobador puede aprobar una evaluación'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

create table public.projects (
  id uuid not null default gen_random_uuid(),
  name text not null,
  description text,
  location text,
  budget_reference_usd numeric(14,2),
  currency char(3) not null default 'USD',
  status text not null default 'recepcion',
  owner_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pk_projects primary key (id),
  constraint chk_projects_currency check (currency ~ '^[A-Z]{3}$'),
  constraint chk_projects_status check (status in ('recepcion', 'evaluacion', 'revision_comite', 'adjudicado', 'cerrado'))
);

create index idx_projects_status on public.projects(status);
create index idx_projects_owner_id on public.projects(owner_id);

create table public.project_documents (
  id uuid not null default gen_random_uuid(),
  project_id uuid not null,
  file_name text not null,
  mime text not null,
  kind text not null default 'requerimientos',
  size_bytes bigint,
  storage_path text,
  sha256 text,
  iv bytea,
  tag bytea,
  extracted_text text,
  sheets jsonb,
  uploaded_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pk_project_documents primary key (id),
  constraint fk_project_documents_project_id foreign key (project_id) references public.projects(id) on delete cascade,
  constraint uq_project_documents_storage_path unique (storage_path),
  constraint chk_project_documents_kind check (kind in ('requerimientos', 'propuesta', 'evidencia', 'otro')),
  constraint chk_project_documents_size_bytes check (size_bytes is null or size_bytes >= 0)
);

create index idx_project_documents_project_id on public.project_documents(project_id);
create index idx_project_documents_sha256 on public.project_documents(sha256);
create index idx_project_documents_uploaded_by on public.project_documents(uploaded_by);

create table public.suppliers (
  id uuid not null default gen_random_uuid(),
  fiscal_id text not null,
  name text not null,
  location text,
  contact text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pk_suppliers primary key (id),
  constraint uq_suppliers_fiscal_id unique (fiscal_id)
);

create index idx_suppliers_name on public.suppliers(name);

create table public.evaluations (
  id uuid not null default gen_random_uuid(),
  project_id uuid not null,
  status text not null default 'en_curso',
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  ranking jsonb not null default '[]'::jsonb,
  comparison jsonb not null default '[]'::jsonb,
  summary text,
  recommended_id text,
  exchange_rate numeric(14,4),
  exchange_rate_date date,
  reviewed_by uuid,
  review_notes text,
  approved_by uuid,
  created_by uuid,
  commit_hash text,
  repository text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pk_evaluations primary key (id),
  constraint fk_evaluations_project_id foreign key (project_id) references public.projects(id) on delete cascade,
  constraint chk_evaluations_status check (status in ('en_curso', 'en_revision', 'aprobado', 'rechazado')),
  constraint chk_evaluations_exchange_rate check (exchange_rate is null or exchange_rate > 0)
);

create index idx_evaluations_project_id on public.evaluations(project_id);
create index idx_evaluations_status on public.evaluations(status);
create index idx_evaluations_approved_by on public.evaluations(approved_by);

create table public.proposals (
  id uuid not null default gen_random_uuid(),
  evaluation_id uuid not null,
  supplier_id uuid,
  file_name text not null,
  identifier text not null,
  storage_path text,
  iv bytea,
  tag bytea,
  mime text,
  processed_at timestamptz,
  currency char(3) not null default 'USD',
  declared_total numeric(14,2),
  real_total numeric(14,2),
  decision text not null default 'pendiente',
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pk_proposals primary key (id),
  constraint fk_proposals_evaluation_id foreign key (evaluation_id) references public.evaluations(id) on delete cascade,
  constraint fk_proposals_supplier_id foreign key (supplier_id) references public.suppliers(id) on delete set null,
  constraint uq_proposals_evaluation_id_identifier unique (evaluation_id, identifier),
  constraint chk_proposals_currency check (currency ~ '^[A-Z]{3}$'),
  constraint chk_proposals_decision check (decision in ('pendiente', 'aceptada', 'descartada'))
);

create index idx_proposals_evaluation_id on public.proposals(evaluation_id);
create index idx_proposals_supplier_id on public.proposals(supplier_id);
create index idx_proposals_decision on public.proposals(decision);

create table public.proposal_items (
  id uuid not null default gen_random_uuid(),
  proposal_id uuid not null,
  description text not null,
  qty numeric(14,2) not null default 1,
  unit_price numeric(14,2) not null default 0,
  currency char(3) not null default 'USD',
  subtotal_declared numeric(14,2),
  subtotal_calculated numeric(14,2),
  reference_price_usd numeric(14,2),
  source_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pk_proposal_items primary key (id),
  constraint fk_proposal_items_proposal_id foreign key (proposal_id) references public.proposals(id) on delete cascade,
  constraint chk_proposal_items_qty check (qty > 0),
  constraint chk_proposal_items_unit_price check (unit_price >= 0),
  constraint chk_proposal_items_currency check (currency ~ '^[A-Z]{3}$')
);

create index idx_proposal_items_proposal_id on public.proposal_items(proposal_id);

create table public.findings (
  id uuid not null default gen_random_uuid(),
  proposal_id uuid not null,
  type text not null,
  severity text not null default 'media',
  detail text not null,
  evidence text,
  amount_impact numeric(14,2),
  currency char(3) not null default 'USD',
  source_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pk_findings primary key (id),
  constraint fk_findings_proposal_id foreign key (proposal_id) references public.proposals(id) on delete cascade,
  constraint chk_findings_type check (type in ('aritmetica', 'alcance', 'compatibilidad', 'sobreprecio', 'injection', 'moneda', 'otro')),
  constraint chk_findings_severity check (severity in ('baja', 'media', 'alta', 'critica')),
  constraint chk_findings_currency check (currency ~ '^[A-Z]{3}$')
);

create index idx_findings_proposal_id on public.findings(proposal_id);
create index idx_findings_type on public.findings(type);
create index idx_findings_severity on public.findings(severity);

create table public.document_analyses (
  id uuid not null default gen_random_uuid(),
  project_id uuid,
  document_id uuid,
  supplier text,
  currency char(3) not null default 'USD',
  declared_total numeric(14,2),
  calculated_total numeric(14,2),
  real_total_usd numeric(14,2),
  tco_usd numeric(14,2),
  summary text,
  conclusion text,
  pros jsonb not null default '[]'::jsonb,
  cons jsonb not null default '[]'::jsonb,
  fine_print jsonb not null default '[]'::jsonb,
  items jsonb not null default '[]'::jsonb,
  findings jsonb not null default '[]'::jsonb,
  confidence numeric(5,4),
  source text not null default 'gemini',
  analyzed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pk_document_analyses primary key (id),
  constraint fk_document_analyses_project_id foreign key (project_id) references public.projects(id) on delete cascade,
  constraint fk_document_analyses_document_id foreign key (document_id) references public.project_documents(id) on delete cascade,
  constraint chk_document_analyses_currency check (currency ~ '^[A-Z]{3}$'),
  constraint chk_document_analyses_confidence check (confidence is null or (confidence >= 0 and confidence <= 1)),
  constraint chk_document_analyses_source check (source in ('gemini', 'deterministic'))
);

create index idx_document_analyses_project_id on public.document_analyses(project_id);
create index idx_document_analyses_document_id on public.document_analyses(document_id);
create index idx_document_analyses_source on public.document_analyses(source);
create index idx_document_analyses_analyzed_at on public.document_analyses(analyzed_at);

create table public.rate_cache (
  id uuid not null default gen_random_uuid(),
  currency char(3) not null,
  rate_usd numeric(14,4) not null,
  source text not null,
  fetched_at timestamptz not null default now(),
  effective_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pk_rate_cache primary key (id),
  constraint uq_rate_cache_currency_effective_date unique (currency, effective_date),
  constraint chk_rate_cache_currency check (currency ~ '^[A-Z]{3}$'),
  constraint chk_rate_cache_rate_usd check (rate_usd > 0)
);

create index idx_rate_cache_currency on public.rate_cache(currency);
create index idx_rate_cache_effective_date on public.rate_cache(effective_date);

create table public.audit_log (
  id uuid not null default gen_random_uuid(),
  project_id uuid,
  user_id uuid,
  action text not null,
  entity text,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pk_audit_log primary key (id),
  constraint fk_audit_log_project_id foreign key (project_id) references public.projects(id) on delete cascade
);

create index idx_audit_log_project_id on public.audit_log(project_id);
create index idx_audit_log_user_id on public.audit_log(user_id);
create index idx_audit_log_action on public.audit_log(action);
create index idx_audit_log_created_at on public.audit_log(created_at);

create table public.chat_messages (
  id uuid not null default gen_random_uuid(),
  project_id uuid not null,
  user_id uuid,
  role text not null,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pk_chat_messages primary key (id),
  constraint fk_chat_messages_project_id foreign key (project_id) references public.projects(id) on delete cascade,
  constraint chk_chat_messages_role check (role in ('user', 'assistant', 'system'))
);

create index idx_chat_messages_project_id on public.chat_messages(project_id);
create index idx_chat_messages_created_at on public.chat_messages(created_at);

create trigger trg_projects_updated_at before update on public.projects
  for each row execute function public.touch_updated_at();
create trigger trg_project_documents_updated_at before update on public.project_documents
  for each row execute function public.touch_updated_at();
create trigger trg_suppliers_updated_at before update on public.suppliers
  for each row execute function public.touch_updated_at();
create trigger trg_evaluations_updated_at before update on public.evaluations
  for each row execute function public.touch_updated_at();
create trigger trg_evaluations_guard_approval before update on public.evaluations
  for each row execute function public.guard_evaluation_approval();
create trigger trg_proposals_updated_at before update on public.proposals
  for each row execute function public.touch_updated_at();
create trigger trg_proposal_items_updated_at before update on public.proposal_items
  for each row execute function public.touch_updated_at();
create trigger trg_findings_updated_at before update on public.findings
  for each row execute function public.touch_updated_at();
create trigger trg_document_analyses_updated_at before update on public.document_analyses
  for each row execute function public.touch_updated_at();
create trigger trg_rate_cache_updated_at before update on public.rate_cache
  for each row execute function public.touch_updated_at();
create trigger trg_audit_log_updated_at before update on public.audit_log
  for each row execute function public.touch_updated_at();
create trigger trg_chat_messages_updated_at before update on public.chat_messages
  for each row execute function public.touch_updated_at();

alter table public.projects enable row level security;
alter table public.project_documents enable row level security;
alter table public.suppliers enable row level security;
alter table public.evaluations enable row level security;
alter table public.proposals enable row level security;
alter table public.proposal_items enable row level security;
alter table public.findings enable row level security;
alter table public.document_analyses enable row level security;
alter table public.rate_cache enable row level security;
alter table public.audit_log enable row level security;
alter table public.chat_messages enable row level security;

create policy sel_projects_read on public.projects
  for select to anon, authenticated using (public.can_read());
create policy ins_projects_write on public.projects
  for insert to anon, authenticated with check (public.can_write());
create policy upd_projects_write on public.projects
  for update to anon, authenticated using (public.can_write()) with check (public.can_write());
create policy del_projects_write on public.projects
  for delete to anon, authenticated using (public.can_write());

create policy sel_project_documents_read on public.project_documents
  for select to anon, authenticated using (public.can_read());
create policy ins_project_documents_write on public.project_documents
  for insert to anon, authenticated with check (public.can_write());
create policy upd_project_documents_write on public.project_documents
  for update to anon, authenticated using (public.can_write()) with check (public.can_write());
create policy del_project_documents_write on public.project_documents
  for delete to anon, authenticated using (public.can_write());

create policy sel_suppliers_read on public.suppliers
  for select to anon, authenticated using (public.can_read());
create policy ins_suppliers_write on public.suppliers
  for insert to anon, authenticated with check (public.can_write());
create policy upd_suppliers_write on public.suppliers
  for update to anon, authenticated using (public.can_write()) with check (public.can_write());
create policy del_suppliers_write on public.suppliers
  for delete to anon, authenticated using (public.can_write());

create policy sel_evaluations_read on public.evaluations
  for select to anon, authenticated using (public.can_read());
create policy ins_evaluations_write on public.evaluations
  for insert to anon, authenticated with check (public.can_write());
create policy upd_evaluations_write on public.evaluations
  for update to anon, authenticated using (public.can_write() or public.can_approve())
  with check (public.can_write() or public.can_approve());
create policy del_evaluations_write on public.evaluations
  for delete to anon, authenticated using (public.can_write());

create policy sel_proposals_read on public.proposals
  for select to anon, authenticated using (public.can_read());
create policy ins_proposals_write on public.proposals
  for insert to anon, authenticated with check (public.can_write());
create policy upd_proposals_write on public.proposals
  for update to anon, authenticated using (public.can_write()) with check (public.can_write());
create policy del_proposals_write on public.proposals
  for delete to anon, authenticated using (public.can_write());

create policy sel_proposal_items_read on public.proposal_items
  for select to anon, authenticated using (public.can_read());
create policy ins_proposal_items_write on public.proposal_items
  for insert to anon, authenticated with check (public.can_write());
create policy upd_proposal_items_write on public.proposal_items
  for update to anon, authenticated using (public.can_write()) with check (public.can_write());
create policy del_proposal_items_write on public.proposal_items
  for delete to anon, authenticated using (public.can_write());

create policy sel_findings_read on public.findings
  for select to anon, authenticated using (public.can_read());
create policy ins_findings_write on public.findings
  for insert to anon, authenticated with check (public.can_write());
create policy upd_findings_write on public.findings
  for update to anon, authenticated using (public.can_write()) with check (public.can_write());
create policy del_findings_write on public.findings
  for delete to anon, authenticated using (public.can_write());

create policy sel_document_analyses_read on public.document_analyses
  for select to anon, authenticated using (public.can_read());
create policy ins_document_analyses_write on public.document_analyses
  for insert to anon, authenticated with check (public.can_write());
create policy upd_document_analyses_write on public.document_analyses
  for update to anon, authenticated using (public.can_write()) with check (public.can_write());
create policy del_document_analyses_write on public.document_analyses
  for delete to anon, authenticated using (public.can_write());

create policy sel_rate_cache_read on public.rate_cache
  for select to anon, authenticated using (public.can_read());
create policy ins_rate_cache_write on public.rate_cache
  for insert to anon, authenticated with check (public.can_write());
create policy upd_rate_cache_write on public.rate_cache
  for update to anon, authenticated using (public.can_write()) with check (public.can_write());
create policy del_rate_cache_write on public.rate_cache
  for delete to anon, authenticated using (public.can_write());

create policy sel_audit_log_read on public.audit_log
  for select to anon, authenticated using (public.can_read());
create policy ins_audit_log_write on public.audit_log
  for insert to anon, authenticated with check (public.can_write());
create policy upd_audit_log_write on public.audit_log
  for update to anon, authenticated using (public.can_write()) with check (public.can_write());
create policy del_audit_log_write on public.audit_log
  for delete to anon, authenticated using (public.can_write());

create policy sel_chat_messages_read on public.chat_messages
  for select to anon, authenticated using (public.can_read());
create policy ins_chat_messages_write on public.chat_messages
  for insert to anon, authenticated with check (public.can_write());
create policy upd_chat_messages_write on public.chat_messages
  for update to anon, authenticated using (public.can_write()) with check (public.can_write());
create policy del_chat_messages_write on public.chat_messages
  for delete to anon, authenticated using (public.can_write());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents',
  'documents',
  false,
  52428800,
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'text/plain',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]::text[]
)
on conflict (id) do nothing;

create policy sel_storage_objects_documents_read on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'documents' and public.can_read());
create policy ins_storage_objects_documents_write on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'documents' and public.can_write());

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on
  public.projects,
  public.project_documents,
  public.suppliers,
  public.evaluations,
  public.proposals,
  public.proposal_items,
  public.findings,
  public.document_analyses,
  public.rate_cache,
  public.audit_log,
  public.chat_messages
to anon, authenticated;
