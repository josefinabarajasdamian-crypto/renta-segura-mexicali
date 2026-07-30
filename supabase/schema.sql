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
  source text,
  needs_review boolean not null default false,
  created_at timestamptz not null default now()
);

-- Si la tabla ya existía de una versión anterior de este script (sin la
-- columna images), se agrega aquí y se rellena con la foto que ya tenía.
alter table public.properties add column if not exists images text[] not null default '{}';
alter table public.properties add column if not exists source text;
alter table public.properties add column if not exists needs_review boolean not null default false;

-- Permite guardar price = NULL cuando la IA no pudo detectar un precio
-- confiable en la publicación importada (antes se guardaba 0).
alter table public.properties alter column price drop not null;

-- Datos extra de publicaciones importadas: link al post original de
-- Facebook, fecha real de publicación (no de importación), y grupo de
-- origen — útiles para revisar antes de publicar.
alter table public.properties add column if not exists source_url text;
alter table public.properties add column if not exists posted_at timestamptz;
alter table public.properties add column if not exists source_group text;

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
  source text,
  created_at timestamptz not null default now()
);

alter table public.demands add column if not exists source text;
alter table public.demands add column if not exists needs_review boolean not null default false;
alter table public.demands add column if not exists source_url text;
alter table public.demands add column if not exists posted_at timestamptz;
alter table public.demands add column if not exists source_group text;

-- Permite guardar budget = NULL cuando no se detectó un presupuesto claro
-- en la publicación importada (antes se guardaba el texto "No especificado").
alter table public.demands alter column budget drop not null;

-- ============================================================
-- Tabla: landmarks — puntos de referencia para el buscador ("cerca del
-- Hospital General", "por Plaza Cachanilla") que la gente usa en vez de
-- nombres formales de colonia. "alias" es lo que alguien escribiría,
-- "zone_keyword" es el texto que debe buscar dentro de zone/location de
-- las propiedades. Agrega más filas aquí mismo en Supabase cuando
-- quieras — no requiere ningún cambio de código.
-- ============================================================
create table if not exists public.landmarks (
  id uuid primary key default gen_random_uuid(),
  alias text not null,
  zone_keyword text not null,
  created_at timestamptz not null default now()
);

alter table public.landmarks enable row level security;

drop policy if exists "landmarks_public_select" on public.landmarks;
create policy "landmarks_public_select" on public.landmarks
  for select to anon, authenticated using (true);

-- Set inicial pequeño y conservador — amplíalo tú misma según lo que la
-- gente realmente busque (talleres, escuelas, IMSS específicos, etc.),
-- agregando filas directamente en el editor de tablas de Supabase.
insert into public.landmarks (alias, zone_keyword)
select * from (values
  ('Hospital General', 'Centro'),
  ('Plaza Cachanilla', 'Centro'),
  ('Parque Vicente Guerrero', 'Centro'),
  ('Zona Río', 'Nueva'),
  ('Nueva Mexicali', 'Nueva')
) as seed(alias, zone_keyword)
where not exists (
  select 1 from public.landmarks l where l.alias = seed.alias
);

-- ============================================================
-- Tabla: import_requests — historial de extracciones lanzadas desde
-- /dashboard/revision (una fila por cada clic en "Ejecutar extracción").
-- El webhook de Apify lee la más reciente para saber hasta qué fecha
-- quedarse (el actor solo soporta un límite inferior de forma nativa) y
-- para etiquetar cada propiedad/solicitud con a qué extracción pertenece
-- (properties.import_batch_id / demands.import_batch_id).
-- ============================================================
create table if not exists public.import_requests (
  id uuid primary key default gen_random_uuid(),
  from_date date,
  to_date date,
  created_at timestamptz not null default now()
);

alter table public.import_requests enable row level security;

-- Solo lectura para usuarios logueados (la pantalla de revisión ya está
-- protegida por el middleware); solo el service role puede insertar.
drop policy if exists "import_requests_select_authenticated" on public.import_requests;
create policy "import_requests_select_authenticated" on public.import_requests
  for select to authenticated using (true);

-- ============================================================
-- Perfiles de usuario (Supabase Auth)
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role text not null default 'inquilino' check (role in ('propietario', 'agente', 'inquilino')),
  is_verified boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- Vista pública con solo los datos seguros de mostrar de cada usuario
-- (nombre, rol, verificado) — NUNCA el teléfono. Al ser una vista normal
-- (sin security_invoker), no hereda las políticas RLS de profiles, así
-- que cualquiera puede consultarla para ver "de quién es" una propiedad,
-- como el perfil de un autor en una publicación de Facebook.
create or replace view public.profiles_public as
select id, full_name, role, is_verified from public.profiles;

grant select on public.profiles_public to anon, authenticated;

-- Crea el perfil automáticamente cuando alguien se registra en Supabase Auth.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, role)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone',
    coalesce(new.raw_user_meta_data->>'role', 'inquilino')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Dueño de cada publicación (properties.user_id / demands.user_id)
-- ============================================================
alter table public.properties add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.demands add column if not exists user_id uuid references auth.users(id) on delete set null;

-- ============================================================
-- Row Level Security
-- El Directorio y el Muro siguen siendo públicos para lectura (sin login).
-- Publicar una propiedad requiere sesión iniciada, y solo el dueño
-- (user_id = auth.uid()) puede editar o eliminar la suya. Las propiedades
-- sin dueño (creadas antes de este cambio) quedan editables por cualquier
-- usuario logueado hasta que alguien las reclame.
-- ============================================================
alter table public.properties enable row level security;
alter table public.demands enable row level security;

drop policy if exists "properties_public_select" on public.properties;
create policy "properties_public_select" on public.properties
  for select to anon, authenticated using (true);

drop policy if exists "properties_public_insert" on public.properties;
drop policy if exists "properties_insert_own" on public.properties;
create policy "properties_insert_own" on public.properties
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "properties_public_update" on public.properties;
drop policy if exists "properties_update_own" on public.properties;
create policy "properties_update_own" on public.properties
  for update to authenticated
  using (user_id = auth.uid() or user_id is null)
  with check (user_id = auth.uid() or user_id is null);

drop policy if exists "properties_public_delete" on public.properties;
drop policy if exists "properties_delete_own" on public.properties;
create policy "properties_delete_own" on public.properties
  for delete to authenticated using (user_id = auth.uid() or user_id is null);

drop policy if exists "demands_public_select" on public.demands;
create policy "demands_public_select" on public.demands
  for select to anon, authenticated using (true);

drop policy if exists "demands_public_insert" on public.demands;
create policy "demands_public_insert" on public.demands
  for insert to anon, authenticated with check (true);

-- Permite aprobar/descartar solicitudes importadas (needs_review = true,
-- sin dueño) desde la página de revisión. Igual que con properties, una
-- demanda sin user_id queda editable por cualquier usuario logueado.
drop policy if exists "demands_update_own" on public.demands;
create policy "demands_update_own" on public.demands
  for update to authenticated
  using (user_id = auth.uid() or user_id is null)
  with check (user_id = auth.uid() or user_id is null);

drop policy if exists "demands_delete_own" on public.demands;
create policy "demands_delete_own" on public.demands
  for delete to authenticated using (user_id = auth.uid() or user_id is null);

-- ============================================================
-- Evita duplicados de publicaciones importadas (Apify/Facebook), incluso
-- si el mismo post se procesa dos veces al mismo tiempo. Antes de crear el
-- índice único, se borran los duplicados exactos que ya existan (se queda
-- con el más antiguo de cada uno).
-- ============================================================
delete from public.properties p
using public.properties p2
where p.description is not null
  and p.description = p2.description
  and p.created_at > p2.created_at;

delete from public.demands d
using public.demands d2
where d.message <> ''
  and d.message = d2.message
  and d.created_at > d2.created_at;

create unique index if not exists properties_description_unique on public.properties (description);
create unique index if not exists demands_message_unique on public.demands (message);

-- El mismo volante (imagen) se re-publica a veces con el caption de texto
-- ligeramente distinto (o casi vacío), así que el índice por descripción
-- no siempre lo detecta. WhatsApp + precio es una huella mucho más
-- confiable para "es el mismo anuncio" — se limpia lo que ya existía
-- duplicado y se agrega el mismo tipo de protección a nivel de base de
-- datos (solo cuando sí se detectó un WhatsApp real).
--
-- OJO: un índice único normal NUNCA considera dos NULL como iguales, así
-- que (whatsapp, price) con price NULL (muy común: "Sin precio
-- detectado") dejaba pasar duplicados exactos sin problema. coalesce()
-- convierte ambos NULL en el mismo valor para que sí choquen.
delete from public.properties p
using public.properties p2
where p.whatsapp <> ''
  and p.whatsapp = p2.whatsapp
  and p.price is not distinct from p2.price
  and p.created_at > p2.created_at;

drop index if exists properties_whatsapp_price_unique;
create unique index if not exists properties_whatsapp_price_unique
  on public.properties (whatsapp, coalesce(price, -1))
  where whatsapp <> '';

-- ============================================================
-- Control de extracciones: a qué corrida de Apify pertenece cada
-- propiedad/solicitud importada, para poder verlas agrupadas por
-- extracción en /dashboard/revision.
-- ============================================================
alter table public.properties add column if not exists import_batch_id uuid
  references public.import_requests(id) on delete set null;
alter table public.demands add column if not exists import_batch_id uuid
  references public.import_requests(id) on delete set null;

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
