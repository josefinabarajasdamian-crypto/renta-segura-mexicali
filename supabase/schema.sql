-- Renta Segura Mexicali — esquema inicial de Supabase
-- Ejecuta este script completo en: Supabase Dashboard → SQL Editor → New query

create extension if not exists pgcrypto;

-- ============================================================
-- Tabla: properties
-- ============================================================
create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  image text not null default '',
  price numeric not null default 0,
  title text not null default '',
  location text not null default '',
  zone text not null default '',
  tags text[] not null default '{}',
  whatsapp text not null default '',
  status text not null default 'Disponible'
    check (status in ('Disponible', 'En Trato', 'Rentado')),
  property_type text,
  deposit numeric,
  contract_duration text,
  bedrooms int,
  bathrooms int,
  parking text,
  cooling_type text,
  cooling_units text,
  electricity_rate text,
  pets_policy text,
  description text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Tabla: demands (Muro de Demandas)
-- ============================================================
create table if not exists public.demands (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Usuario Anónimo',
  anonymous boolean not null default false,
  message text not null default '',
  budget text not null default '',
  zone text not null default '',
  tenants text not null default '1',
  created_at timestamptz not null default now()
);

-- ============================================================
-- Row Level Security
-- Prototipo sin autenticación de usuarios: se permite lectura y
-- escritura pública (rol anon). Antes de un lanzamiento real,
-- reemplaza estas políticas por reglas atadas a auth.uid().
-- ============================================================
alter table public.properties enable row level security;
alter table public.demands enable row level security;

drop policy if exists "properties_public_select" on public.properties;
create policy "properties_public_select" on public.properties
  for select to anon, authenticated using (true);

drop policy if exists "properties_public_insert" on public.properties;
create policy "properties_public_insert" on public.properties
  for insert to anon, authenticated with check (true);

drop policy if exists "properties_public_update" on public.properties;
create policy "properties_public_update" on public.properties
  for update to anon, authenticated using (true) with check (true);

drop policy if exists "properties_public_delete" on public.properties;
create policy "properties_public_delete" on public.properties
  for delete to anon, authenticated using (true);

drop policy if exists "demands_public_select" on public.demands;
create policy "demands_public_select" on public.demands
  for select to anon, authenticated using (true);

drop policy if exists "demands_public_insert" on public.demands;
create policy "demands_public_insert" on public.demands
  for insert to anon, authenticated with check (true);

-- ============================================================
-- Realtime: publica los cambios de estas tablas
-- ============================================================
alter publication supabase_realtime add table public.properties;
alter publication supabase_realtime add table public.demands;

-- ============================================================
-- Datos semilla (las 3 propiedades y 3 demandas de ejemplo)
-- ============================================================
insert into public.properties
  (image, price, title, location, zone, tags, whatsapp, status, bedrooms, bathrooms, cooling_type)
values
  ('/images/depto-uabc.png', 6500, 'Departamento 2 Recámaras a 5 min de UABC Central',
   'Fracc. Villafontana, cerca de UABC', 'UABC Central',
   array['2 Minisplits', 'Servicios Incluidos', 'Acepta Mascotas'], '526861234567',
   'Disponible', 2, 1, 'Minisplit Inverter'),
  ('/images/casa-prohogar.png', 8900, 'Casa 3 Recámaras con cochera en Prohogar',
   'Col. Pro Hogar, Mexicali', 'Prohogar',
   array['3 Recámaras', 'Cochera Techada', 'Patio Amplio'], '526862345678',
   'En Trato', 3, 2, 'Minisplit Inverter'),
  ('/images/studio-palaco.png', 4800, 'Studio amueblado ideal para 1 persona en Palaco',
   'Zona Palaco, Mexicali', 'Palaco',
   array['Amueblado', '1 Minisplit', 'Wifi Incluido'], '526863456789',
   'Rentado', 1, 1, 'Minisplit Inverter')
on conflict do nothing;

insert into public.demands (name, anonymous, message, budget, zone, tenants)
values
  ('Carlos M.', false,
   'Busco departamento de 4,000 a 6,000 por la Zona Industrial. Somos pareja sin niños, ambos trabajamos y tenemos comprobante de ingresos.',
   '$6k max', 'Industrial', '2'),
  ('Usuario Anónimo', true,
   'Estudiante de UABC busca cuarto o studio cerca del campus por menos de $3,500. Tranquilo, sin fiestas, pago puntual cada mes.',
   '$3.5k max', 'UABC', '1'),
  ('Familia Rosales', false,
   'Necesitamos casa de 3 recámaras con patio en Prohogar o Nueva. Presupuesto hasta $9,000, tenemos un perro pequeño. Buscamos contrato de un año.',
   '$9k max', 'Prohogar', '4')
on conflict do nothing;
