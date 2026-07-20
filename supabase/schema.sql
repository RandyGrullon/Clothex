-- Klozet — esquema completo. Pégalo en el SQL Editor de Supabase y ejecuta.

-- Perfiles (medidas del dueño)
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  gender text,
  height_cm numeric,
  weight_kg numeric,
  chest_cm numeric,
  waist_cm numeric,
  hips_cm numeric,
  shirt_size text,
  pants_size text,
  shoe_size text,
  model_front_url text,
  model_side_url text,
  model_back_url text,
  created_at timestamptz not null default now()
);

-- Prendas
create table if not exists public.garments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  category text not null check (category in ('top','bottom','outerwear','dress','shoes','accessory')),
  subtype text,
  material text,
  pattern text,
  fit text,
  colors jsonb not null default '[]',
  styles jsonb not null default '[]',
  seasons jsonb not null default '[]',
  description text,
  image_url text,
  cutout_url text,
  created_at timestamptz not null default now()
);
create index if not exists garments_user_idx on public.garments (user_id, created_at desc);

-- Outfits
create table if not exists public.outfits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  style text not null,
  reason text,
  garment_ids uuid[] not null default '{}',
  score int,
  created_at timestamptz not null default now()
);
create index if not exists outfits_user_idx on public.outfits (user_id, created_at desc);

-- RLS: cada usuario solo ve y toca lo suyo
alter table public.profiles enable row level security;
alter table public.garments enable row level security;
alter table public.outfits enable row level security;

drop policy if exists "profiles own" on public.profiles;
create policy "profiles own" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "garments own" on public.garments;
create policy "garments own" on public.garments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "outfits own" on public.outfits;
create policy "outfits own" on public.outfits
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Storage: el bucket "garments" ya existe (público para lectura).
-- Cada usuario sube solo dentro de su carpeta.
drop policy if exists "garments upload own" on storage.objects;
create policy "garments upload own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'garments' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "garments delete own" on storage.objects;
create policy "garments delete own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'garments' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "garments read" on storage.objects;
create policy "garments read" on storage.objects
  for select using (bucket_id = 'garments');
