-- Klozet — fotos del modelo (dueño) para el probador/try-on.
-- Pégalo en el SQL Editor de Supabase y ejecuta (además del schema.sql base).

alter table public.profiles
  add column if not exists model_front_url text,
  add column if not exists model_side_url text,
  add column if not exists model_back_url text;
