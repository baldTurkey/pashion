drop policy if exists "products_insert_own_brand" on public.products;
create policy "products_insert_own_brand" on public.products
  for insert with check (
    exists (
      select 1
      from public.brands
      where brands.account_id = auth.uid()
        and brands.brand_uuid = products.brand_id
        and brands.stripe_account_id is not null
        and brands.stripe_payouts_enabled = true
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
        and (
          products.listing_status is distinct from 'published'
          or (
            brands.stripe_account_id is not null
            and brands.stripe_payouts_enabled = true
          )
        )
    )
  );

drop policy if exists "products_select_published" on public.products;
create policy "products_select_published" on public.products
  for select using (
    listing_status = 'published'
    and exists (
      select 1
      from public.brands
      where brands.brand_uuid = products.brand_id
        and brands.stripe_account_id is not null
        and brands.stripe_payouts_enabled = true
    )
  );