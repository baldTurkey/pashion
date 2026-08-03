insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('brand-logos', 'brand-logos', true, 5242880, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "brand_logos_select_public" on storage.objects;
create policy "brand_logos_select_public" on storage.objects
  for select using (bucket_id = 'brand-logos');

drop policy if exists "brand_logos_insert_own_folder" on storage.objects;
create policy "brand_logos_insert_own_folder" on storage.objects
  for insert with check (bucket_id = 'brand-logos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "brand_logos_update_own_folder" on storage.objects;
create policy "brand_logos_update_own_folder" on storage.objects
  for update using (bucket_id = 'brand-logos' and (storage.foldername(name))[1] = auth.uid()::text);
