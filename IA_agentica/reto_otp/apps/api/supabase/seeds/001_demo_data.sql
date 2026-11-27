-- Datos de prueba del MVP. Sin credenciales reales: el usuario demo no tiene contraseña.
-- Los IDs fijos permiten repetir la carga con `supabase db reset`.

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-4000-8000-000000000001',
  'authenticated',
  'authenticated',
  'demo@orion.local',
  '',
  now(),
  '{"provider":"email","providers":["email"],"role":"cargador"}'::jsonb,
  '{"name":"Usuario Demo"}'::jsonb,
  now(),
  now()
)
on conflict (id) do nothing;

insert into public.projects (
  id,
  name,
  description,
  location,
  budget_reference_usd,
  currency,
  status,
  owner_id
)
values (
  '00000000-0000-4000-8000-000000000010',
  'Laboratorio de computación - demo',
  'Proyecto de muestra para recorrer el flujo completo del MVP.',
  'Caracas, Venezuela',
  85000.00,
  'USD',
  'recepcion',
  '00000000-0000-4000-8000-000000000001'
)
on conflict (id) do nothing;

insert into public.suppliers (
  id,
  fiscal_id,
  name,
  location,
  contact
)
values (
  '00000000-0000-4000-8000-000000000020',
  'DEMO-0001',
  'Proveedor Demo S.A.',
  'Caracas, Venezuela',
  'contacto@proveedor-demo.local'
)
on conflict (id) do nothing;

insert into public.project_documents (
  id,
  project_id,
  file_name,
  mime,
  kind,
  size_bytes,
  storage_path,
  sha256,
  uploaded_by
)
values (
  '00000000-0000-4000-8000-000000000030',
  '00000000-0000-4000-8000-000000000010',
  'requerimientos_demo.txt',
  'text/plain',
  'requerimientos',
  128,
  'demo/requerimientos_demo.txt',
  repeat('0', 64),
  '00000000-0000-4000-8000-000000000001'
)
on conflict (id) do nothing;

insert into public.evaluations (
  id,
  project_id,
  status,
  started_at,
  ranking,
  comparison,
  summary,
  created_by
)
values (
  '00000000-0000-4000-8000-000000000040',
  '00000000-0000-4000-8000-000000000010',
  'en_curso',
  now(),
  '[]'::jsonb,
  '[]'::jsonb,
  'Evaluación de demostración sin resultados reales.',
  '00000000-0000-4000-8000-000000000001'
)
on conflict (id) do nothing;

insert into public.audit_log (
  id,
  project_id,
  user_id,
  action,
  entity,
  entity_id,
  metadata
)
values (
  '00000000-0000-4000-8000-000000000050',
  '00000000-0000-4000-8000-000000000010',
  '00000000-0000-4000-8000-000000000001',
  'project_created',
  'projects',
  '00000000-0000-4000-8000-000000000010',
  '{"demo":true}'::jsonb
)
on conflict (id) do nothing;
