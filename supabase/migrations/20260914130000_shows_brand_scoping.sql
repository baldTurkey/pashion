-- The `shows` table (pre-existing, no prior migration history for it) has
-- no brand association at all, so every brand dashboard page querying it
-- (My Shows, the overview page, show detail) returns every brand's shows.
-- Add brand_id and lock reads/writes to the owning brand, mirroring the
-- products_*_own_brand policies added for the products table.
alter table public.shows
  add column if not exists brand_id uuid null references public.brands (brand_uuid);

alter table public.shows enable row level security;

drop policy if exists "shows_select_own_brand" on public.shows;
create policy "shows_select_own_brand" on public.shows
  for select using (
    exists (
      select 1
      from public.brands
      where brands.account_id = auth.uid()
        and brands.brand_uuid = shows.brand_id
    )
  );

drop policy if exists "shows_insert_own_brand" on public.shows;
create policy "shows_insert_own_brand" on public.shows
  for insert with check (
    exists (
      select 1
      from public.brands
      where brands.account_id = auth.uid()
        and brands.brand_uuid = shows.brand_id
    )
  );

drop policy if exists "shows_update_own_brand" on public.shows;
create policy "shows_update_own_brand" on public.shows
  for update using (
    exists (
      select 1
      from public.brands
      where brands.account_id = auth.uid()
        and brands.brand_uuid = shows.brand_id
    )
  ) with check (
    exists (
      select 1
      from public.brands
      where brands.account_id = auth.uid()
        and brands.brand_uuid = shows.brand_id
    )
  );

drop policy if exists "shows_delete_own_brand" on public.shows;
create policy "shows_delete_own_brand" on public.shows
  for delete using (
    exists (
      select 1
      from public.brands
      where brands.account_id = auth.uid()
        and brands.brand_uuid = shows.brand_id
    )
  );
