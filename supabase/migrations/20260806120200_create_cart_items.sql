-- DB-backed cart, replacing the client-only fixture data in
-- src/app/(app)/cart/page.tsx. customer_id references auth.users directly
-- (not public.customers) — customers has no migration history/known schema
-- in this repo, so we depend only on the one thing guaranteed to exist:
-- the Supabase auth user id.

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references auth.users (id) on delete cascade,
  listing_id uuid not null references public.listings (id) on delete cascade,
  quantity integer not null default 1 check (quantity > 0),
  saved_for_later boolean not null default false,
  created_at timestamptz not null default now(),
  unique (customer_id, listing_id)
);

create index if not exists cart_items_customer_id_idx on public.cart_items (customer_id);

alter table public.cart_items enable row level security;

drop policy if exists "cart_items_select_own" on public.cart_items;
create policy "cart_items_select_own" on public.cart_items
  for select using (auth.uid() = customer_id);

drop policy if exists "cart_items_insert_own" on public.cart_items;
create policy "cart_items_insert_own" on public.cart_items
  for insert with check (auth.uid() = customer_id);

drop policy if exists "cart_items_update_own" on public.cart_items;
create policy "cart_items_update_own" on public.cart_items
  for update using (auth.uid() = customer_id) with check (auth.uid() = customer_id);

drop policy if exists "cart_items_delete_own" on public.cart_items;
create policy "cart_items_delete_own" on public.cart_items
  for delete using (auth.uid() = customer_id);
