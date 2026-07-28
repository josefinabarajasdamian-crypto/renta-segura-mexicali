-- Renta Segura Mexicali — esquema inicial de Supabase
-- Ejecuta este script completo en: Supabase Dashboard → SQL Editor → New query
-- Es seguro volver a ejecutarlo (idempotente): no falla ni duplica datos
-- si ya corriste una versión anterior de este script.

create extension if not exists pgcrypto;

-- ============================================================
-- Tabla: properties
-- ============================================================
create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  image text not null default '',
  images text[] not null default '{}',
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

-- Si la tabla ya existía de una versión anterior de este script (sin la
-- columna images), se agrega aquí y se rellena con la foto que ya tenía.
alter table public.properties add column if not exists images text[] not null default '{}';

update public.properties
set images = array[image]
where (images is null or array_length(images, 1) is null) and image is not null and image <> '';

-- ============================================================
-- Storage: bucket público para las fotos de propiedades
-- ============================================================
insert into storage.buckets (id, name, public)
values ('property-images', 'property-images', true)
on conflict (id) do nothing;

drop policy if exists "property_images_public_read" on storage.objects;
create policy "property_images_public_read" on storage.objects
  for select to anon, authenticated using (bucket_id = 'property-images');

drop policy if exists "property_images_public_insert" on storage.objects;
create policy "property_images_public_insert" on storage.objects
  for insert to anon, authenticated with check (bucket_id = 'property-images');

drop policy if exists "property_images_public_delete" on storage.objects;
create policy "property_images_public_delete" on storage.objects
  for delete to anon, authenticated using (bucket_id = 'property-images');

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
-- Realtime: publica los cambios de estas tablas (idempotente)
-- ============================================================
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'properties'
  ) then
    alter publication supabase_realtime add table public.properties;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'demands'
  ) then
    alter publication supabase_realtime add table public.demands;
  end if;
end $$;

-- ============================================================
-- Datos semilla (las 3 propiedades y 3 demandas de ejemplo)
-- Se insertan solo si no existe ya una fila con el mismo título/mensaje.
-- ============================================================
insert into public.properties
  (image, price, title, location, zone, tags, whatsapp, status, bedrooms, bathrooms, cooling_type,
   deposit, contract_duration, parking, pets_policy, electricity_rate, description)
select * from (values
  ('/images/depto-uabc.png', 6500, 'Departamento 2 Recámaras a 5 min de UABC Central',
   'Fracc. Villafontana, cerca de UABC', 'UABC Central',
   array['2 Minisplits', 'Servicios Incluidos', 'Acepta Mascotas'], '526861234567',
   'Disponible', 2, 1, '2 Minisplits Inverter (1.5 Toneladas cada uno)',
   6500, 'Mínimo 6 meses / 1 año', '1 Cajón dentro de privada con reja eléctrica',
   'Acepta gato o perro chico', 'CFE Independiente',
   'Departamento amueblado a 5 minutos de UABC Central. Incluye agua e internet; luz CFE independiente.'),
  ('/images/casa-prohogar.png', 8900, 'Casa 3 Recámaras con cochera en Prohogar',
   'Col. Pro Hogar, Mexicali', 'Prohogar',
   array['3 Recámaras', 'Cochera Techada', 'Patio Amplio'], '526862345678',
   'En Trato', 3, 2, '3 Minisplits Inverter en recámaras y sala',
   8900, 'Mínimo 1 año', 'Cochera techada para 2 autos',
   'Acepta mascotas con patio amplio', 'CFE Independiente',
   'Casa amplia con patio y cochera techada en Prohogar. Incluye agua; luz e internet independientes.'),
  ('/images/studio-palaco.png', 4800, 'Studio amueblado ideal para 1 persona en Palaco',
   'Zona Palaco, Mexicali', 'Palaco',
   array['Amueblado', '1 Minisplit', 'Wifi Incluido'], '526863456789',
   'Rentado', 1, 1, '1 Minisplit Inverter (1 Tonelada)',
   4800, 'Mínimo 6 meses', '1 Cajón techado',
   'No acepta', 'CFE Independiente',
   'Studio amueblado ideal para una persona en Palaco. Incluye agua, internet y wifi.')
) as seed(image, price, title, location, zone, tags, whatsapp, status, bedrooms, bathrooms, cooling_type,
   deposit, contract_duration, parking, pets_policy, electricity_rate, description)
where not exists (
  select 1 from public.properties p where p.title = seed.title
);

-- Completa el arreglo images para cualquier fila (semilla o previa) que
-- todavía no lo tenga, a partir de la foto única en image.
update public.properties
set images = array[image]
where (images is null or array_length(images, 1) is null) and image is not null and image <> '';

-- Si las 3 propiedades semilla ya existían de una corrida anterior del
-- script (sin estos campos), se completan aquí también.
update public.properties p set
  deposit = seed.deposit,
  contract_duration = seed.contract_duration,
  parking = seed.parking,
  pets_policy = seed.pets_policy,
  electricity_rate = seed.electricity_rate,
  description = seed.description
from (values
  ('Departamento 2 Recámaras a 5 min de UABC Central', 6500, 'Mínimo 6 meses / 1 año',
   '1 Cajón dentro de privada con reja eléctrica', 'Acepta gato o perro chico', 'CFE Independiente',
   'Departamento amueblado a 5 minutos de UABC Central. Incluye agua e internet; luz CFE independiente.'),
  ('Casa 3 Recámaras con cochera en Prohogar', 8900, 'Mínimo 1 año',
   'Cochera techada para 2 autos', 'Acepta mascotas con patio amplio', 'CFE Independiente',
   'Casa amplia con patio y cochera techada en Prohogar. Incluye agua; luz e internet independientes.'),
  ('Studio amueblado ideal para 1 persona en Palaco', 4800, 'Mínimo 6 meses',
   '1 Cajón techado', 'No acepta', 'CFE Independiente',
   'Studio amueblado ideal para una persona en Palaco. Incluye agua, internet y wifi.')
) as seed(title, deposit, contract_duration, parking, pets_policy, electricity_rate, description)
where p.title = seed.title and p.deposit is null;

insert into public.demands (name, anonymous, message, budget, zone, tenants)
select * from (values
  ('Carlos M.', false,
   'Busco departamento de 4,000 a 6,000 por la Zona Industrial. Somos pareja sin niños, ambos trabajamos y tenemos comprobante de ingresos.',
   '$6k max', 'Industrial', '2'),
  ('Usuario Anónimo', true,
   'Estudiante de UABC busca cuarto o studio cerca del campus por menos de $3,500. Tranquilo, sin fiestas, pago puntual cada mes.',
   '$3.5k max', 'UABC', '1'),
  ('Familia Rosales', false,
   'Necesitamos casa de 3 recámaras con patio en Prohogar o Nueva. Presupuesto hasta $9,000, tenemos un perro pequeño. Buscamos contrato de un año.',
   '$9k max', 'Prohogar', '4')
) as seed(name, anonymous, message, budget, zone, tenants)
where not exists (
  select 1 from public.demands d where d.message = seed.message
);
