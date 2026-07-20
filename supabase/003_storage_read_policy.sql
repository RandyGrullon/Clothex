-- Klozet — endurece la lectura del bucket "garments".
-- Antes: cualquier anónimo con la clave pública podía LISTAR todos los
-- archivos del bucket (incluidas tus fotos de modelo). Esta política limita
-- el listado/lectura vía API a la carpeta del propio usuario autenticado.
-- (Las URLs públicas directas siguen funcionando: el bucket es público.)
-- Pégalo en el SQL Editor de Supabase y ejecuta.

drop policy if exists "garments read" on storage.objects;
create policy "garments read" on storage.objects
  for select to authenticated
  using (bucket_id = 'garments' and (storage.foldername(name))[1] = auth.uid()::text);
