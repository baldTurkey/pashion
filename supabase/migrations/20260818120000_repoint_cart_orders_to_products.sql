-- Cart/orders were originally built against this branch's own `listings`
-- table before the team's real product catalog (public.products, keyed by
-- brand_uuid rather than account_id) was merged in. This repoints
-- cart_items and order_items at products instead, so there's one catalog,
-- not two. The old `listings` table is left in place, unused, rather than
-- dropped, since nothing else depends on removing it.

-- products.product_id needs a unique constraint to be an FK target.
alter table public.products
  add constraint products_product_id_key unique (product_id);

-- cart_items: listing_id -> product_id, FK now points at products.
alter table public.cart_items
  drop constraint if exists cart_items_listing_id_fkey;
alter table public.cart_items
  rename column listing_id to product_id;
alter table public.cart_items
  add constraint cart_items_product_id_fkey
    foreign key (product_id) references public.products (product_id) on delete cascade;
alter table public.cart_items
  drop constraint if exists cart_items_customer_id_listing_id_key;
alter table public.cart_items
  add constraint cart_items_customer_id_product_id_key unique (customer_id, product_id);

-- order_items: listing_id -> product_id, listing_name -> product_name, FK
-- now points at products; brand_id now stores brand_uuid (matching
-- products.brand_id) instead of account_id.
alter table public.order_items
  drop constraint if exists order_items_listing_id_fkey;
alter table public.order_items
  rename column listing_id to product_id;
alter table public.order_items
  add constraint order_items_product_id_fkey
    foreign key (product_id) references public.products (product_id);
alter table public.order_items
  rename column listing_name to product_name;

alter table public.order_items
  drop constraint if exists order_items_brand_id_fkey;
alter table public.order_items
  add constraint order_items_brand_id_fkey
    foreign key (brand_id) references public.brands (brand_uuid);

-- order_items_select_own_brand assumed brand_id === auth.uid() (true only
-- when brand_id stored account_id). Now that it stores brand_uuid, look the
-- owning account up through brands instead.
drop policy if exists "order_items_select_own_brand" on public.order_items;
create policy "order_items_select_own_brand" on public.order_items
  for select using (
    exists (
      select 1 from public.brands b
      where b.brand_uuid = order_items.brand_id and b.account_id = auth.uid()
    )
  );
