-- Adds real per-listing inventory tracking (products.stock) plus brand-side
-- order fulfillment tracking (order_items.fulfillment_status/tracking_number).
-- products.stock is nullable on purpose: existing listings created through
-- the older /dashboard/brand/listings/new flow never collected a quantity,
-- and NULL is treated everywhere as "untracked / unlimited" rather than 0,
-- so nothing that already exists suddenly looks out of stock.
alter table public.products
  add column if not exists stock integer null check (stock is null or stock >= 0);

-- Atomic decrement, called from the payment webhook once a checkout session
-- is confirmed paid. Doing "read stock, subtract, write it back" from
-- application code races if two orders for the same product complete near
-- simultaneously; this does the subtraction in one database step instead.
-- No-ops for untracked (NULL) stock.
create or replace function public.decrement_product_stock(p_product_id uuid, p_quantity integer)
returns void
language sql
security definer
set search_path = public
as $$
  update public.products
  set stock = greatest(0, stock - p_quantity)
  where product_id = p_product_id
    and stock is not null;
$$;

-- Draft products materialized from `inventory` rows should carry over the
-- brand's real quantity too, not just the per-size `supply` breakdown.
create or replace function public.materialize_due_inventory_drafts()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  created_count integer;
begin
  with inserted as (
    insert into public.products (
      inventory_id,
      brand_id,
      "imageUrl",
      name,
      "currentPrice",
      description,
      style,
      care_info,
      size_guide_url,
      type,
      supply,
      stock,
      listing_status
    )
    select
      inventory.id,
      inventory.brand_id,
      inventory."imageUrl"[1],
      inventory.name,
      inventory."currentPrice",
      inventory.description,
      inventory.style,
      inventory.care_info,
      inventory.size_guide_url,
      inventory.type,
      inventory.supply,
      inventory.stock,
      'draft'
    from public.inventory
    where inventory.ready_to_sell_date <= current_date
      and inventory.ready_to_sell_date is not null
      and not exists (
        select 1
        from public.products
        where products.inventory_id = inventory.id
      )
    on conflict do nothing
    returning id
  )
  select count(*) into created_count from inserted;

  return created_count;
end;
$$;

revoke all on function public.materialize_due_inventory_drafts() from public;
grant execute on function public.materialize_due_inventory_drafts() to anon, authenticated;

-- Order fulfillment tracking. One order can span multiple brands, so this
-- lives per order_item (per brand's share of an order), not per order.
alter table public.order_items
  add column if not exists fulfillment_status text not null default 'unfulfilled'
    check (fulfillment_status in ('unfulfilled', 'shipped')),
  add column if not exists tracking_number text,
  add column if not exists shipped_at timestamptz;

-- order_items previously had no update policy at all (only the service role
-- wrote to it, via the webhook). Brands now need to flip their own rows to
-- "shipped" from the dashboard. RLS can't restrict this to specific columns,
-- so this relies on /api/orders/[itemId]/fulfill being the only client-facing
-- caller, and it only ever sends fulfillment_status/tracking_number/shipped_at.
drop policy if exists "order_items_update_own_brand" on public.order_items;
create policy "order_items_update_own_brand" on public.order_items
  for update using (
    exists (
      select 1 from public.brands b
      where b.brand_uuid = order_items.brand_id and b.account_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.brands b
      where b.brand_uuid = order_items.brand_id and b.account_id = auth.uid()
    )
  );
