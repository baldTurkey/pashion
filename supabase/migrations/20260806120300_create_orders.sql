-- orders/order_items: written only by the service role (checkout route
-- creates the pending order; the Stripe webhook flips it to paid and fills
-- in transfer ids), same "service role bypasses RLS for privileged writes"
-- pattern used by the signup routes. Regular users only get read access to
-- their own rows.

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed')),
  stripe_checkout_session_id text unique,
  subtotal_cents integer not null check (subtotal_cents >= 0),
  shipping_name text,
  shipping_address text,
  shipping_city text,
  shipping_region text,
  shipping_postal_code text,
  shipping_country text,
  created_at timestamptz not null default now()
);

create index if not exists orders_customer_id_idx on public.orders (customer_id);

alter table public.orders enable row level security;

drop policy if exists "orders_select_own" on public.orders;
create policy "orders_select_own" on public.orders
  for select using (auth.uid() = customer_id);
-- No insert/update/delete policy for regular users, only the service role
-- (checkout route + webhook) writes here.

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  listing_id uuid not null references public.listings (id),
  -- Denormalized at purchase time: price/brand shouldn't drift if the
  -- listing is edited or deleted later, and this is what the webhook groups
  -- by to split the payout per brand.
  brand_id uuid not null references public.brands (account_id),
  listing_name text not null,
  unit_price_cents integer not null check (unit_price_cents >= 0),
  quantity integer not null check (quantity > 0),
  -- Set once the per-brand Stripe transfer succeeds; also doubles as the
  -- webhook's idempotency marker if checkout.session.completed retries.
  stripe_transfer_id text
);

create index if not exists order_items_order_id_idx on public.order_items (order_id);
create index if not exists order_items_brand_id_idx on public.order_items (brand_id);

alter table public.order_items enable row level security;

drop policy if exists "order_items_select_own_order" on public.order_items;
create policy "order_items_select_own_order" on public.order_items
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and o.customer_id = auth.uid()
    )
  );

drop policy if exists "order_items_select_own_brand" on public.order_items;
create policy "order_items_select_own_brand" on public.order_items
  for select using (auth.uid() = brand_id); -- brands can see what sold
