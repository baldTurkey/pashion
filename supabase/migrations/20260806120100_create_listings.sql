
-- The listing-creation UI is a later milestone; for now this table
-- is populated by supabase/seed.sql for local testing.

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands (account_id) on delete cascade,
  name text not null,
  description text,
  price_cents integer not null check (price_cents >= 0),
  size text,
  inventory integer not null default 0 check (inventory >= 0),
  image_url text,
  status text not null default 'draft' check (status in ('draft', 'live')),
  created_at timestamptz not null default now()
);

create index if not exists listings_brand_id_idx on public.listings (brand_id);

alter table public.listings enable row level security;

drop policy if exists "listings_select_public" on public.listings;
create policy "listings_select_public" on public.listings
  for select using (status = 'live'); -- cart/checkout/browse need this

drop policy if exists "listings_select_own" on public.listings;
create policy "listings_select_own" on public.listings
  for select using (auth.uid() = brand_id); -- brand can see its own drafts too

-- Hard gate: a brand can only create a listing once Stripe payouts are
-- connected (brands.stripe_payouts_enabled). Enforced here at the data
-- layer, not just in the UI, so it can't be bypassed by calling the API
-- directly.
drop policy if exists "listings_insert_own_with_payouts" on public.listings;
create policy "listings_insert_own_with_payouts" on public.listings
  for insert with check (
    auth.uid() = brand_id
    and exists (
      select 1 from public.brands b
      where b.account_id = brand_id and b.stripe_payouts_enabled = true
    )
  );

drop policy if exists "listings_update_own" on public.listings;
create policy "listings_update_own" on public.listings
  for update using (auth.uid() = brand_id) with check (auth.uid() = brand_id);

drop policy if exists "listings_delete_own" on public.listings;
create policy "listings_delete_own" on public.listings
  for delete using (auth.uid() = brand_id);