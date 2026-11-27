alter table public.projects
  add column if not exists operation_type text not null default 'compra',
  add column if not exists business_type text not null default '';

alter table public.projects
  add constraint chk_projects_operation_type
  check (operation_type in ('compra', 'venta'));
