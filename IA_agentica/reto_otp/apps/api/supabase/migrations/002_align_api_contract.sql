alter table public.project_documents
  drop constraint if exists chk_project_documents_kind;

alter table public.project_documents
  add constraint chk_project_documents_kind
  check (kind in ('requerimientos', 'propuesta', 'evidencia', 'otro', 'pdf', 'image', 'spreadsheet', 'unknown'));

alter table public.evaluations
  drop constraint if exists chk_evaluations_status;

alter table public.evaluations
  add constraint chk_evaluations_status
  check (status in ('en_curso', 'en_revision', 'aprobado', 'rechazado', 'running', 'completed', 'failed'));

alter table public.document_analyses
  add column if not exists file_name text,
  add column if not exists hidden_costs jsonb not null default '[]'::jsonb,
  add column if not exists warranty_months integer not null default 0,
  add column if not exists injection_detected boolean not null default false,
  add column if not exists scope_complete boolean not null default true,
  add column if not exists discard_reasons jsonb not null default '[]'::jsonb;

alter table public.document_analyses
  drop constraint if exists chk_document_analyses_warranty_months;

alter table public.document_analyses
  add constraint chk_document_analyses_warranty_months check (warranty_months >= 0);

create index if not exists idx_document_analyses_file_name on public.document_analyses(file_name);

alter table public.chat_messages
  add column if not exists sources jsonb not null default '[]'::jsonb;

alter table public.project_documents
  alter column iv type text using encode(iv, 'base64'),
  alter column tag type text using encode(tag, 'base64');

alter table public.proposals
  alter column iv type text using encode(iv, 'base64'),
  alter column tag type text using encode(tag, 'base64');

alter table public.evaluations
  alter column reviewed_by type text using reviewed_by::text,
  alter column approved_by type text using approved_by::text;

update storage.buckets
set allowed_mime_types = array[
  'application/pdf',
  'image/jpeg',
  'image/png',
  'text/plain',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/octet-stream'
]::text[]
where id = 'documents';
