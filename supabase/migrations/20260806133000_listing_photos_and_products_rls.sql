insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'listing-photos',
  'listing-photos',
  true,
  10485760,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "listing_photos_select_public" on storage.objects;
create policy "listing_photos_select_public" on storage.objects
  for select using (bucket_id = 'listing-photos');

drop policy if exists "listing_photos_insert_own_folder" on storage.objects;
create policy "listing_photos_insert_own_folder" on storage.objects
  for insert with check (
    bucket_id = 'listing-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "listing_photos_update_own_folder" on storage.objects;
create policy "listing_photos_update_own_folder" on storage.objects
  for update using (
    bucket_id = 'listing-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

alter table public.products
  add column if not exists brand_id uuid null references public.brands (brand_uuid);

alter table public.products enable row level security;

drop policy if exists "products_select_own_brand" on public.products;
create policy "products_select_own_brand" on public.products
  for select using (
    exists (
      select 1
      from public.brands
      where brands.account_id = auth.uid()
        and brands.brand_uuid = products.brand_id
    )
  );

drop policy if exists "products_insert_own_brand" on public.products;
create policy "products_insert_own_brand" on public.products
  for insert with check (
    exists (
      select 1
      from public.brands
      where brands.account_id = auth.uid()
        and brands.brand_uuid = products.brand_id
    )
  );

drop policy if exists "products_update_own_brand" on public.products;
create policy "products_update_own_brand" on public.products
  for update using (
    exists (
      select 1
      from public.brands
      where brands.account_id = auth.uid()
        and brands.brand_uuid = products.brand_id
    )
  ) with check (
    exists (
      select 1
      from public.brands
      where brands.account_id = auth.uid()
        and brands.brand_uuid = products.brand_id
    )
  );

drop policy if exists "products_delete_own_brand" on public.products;
create policy "products_delete_own_brand" on public.products
  for delete using (
    exists (
      select 1
      from public.brands
      where brands.account_id = auth.uid()
        and brands.brand_uuid = products.brand_id
    )
  );