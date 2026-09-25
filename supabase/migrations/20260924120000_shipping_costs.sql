alter table public.brands
  add column if not exists shipping_address text,
  add column if not exists shipping_longitude double precision,
  add column if not exists shipping_latitude double precision,
  add column if not exists shipping_country_code text;

alter table public.brands
  drop constraint if exists brands_shipping_longitude_check,
  add constraint brands_shipping_longitude_check
    check (shipping_longitude is null or shipping_longitude between -180 and 180),
  drop constraint if exists brands_shipping_latitude_check,
  add constraint brands_shipping_latitude_check
    check (shipping_latitude is null or shipping_latitude between -90 and 90);

alter table public.orders
  add column if not exists shipping_cents integer not null default 0 check (shipping_cents >= 0),
  add column if not exists total_cents integer not null default 0 check (total_cents >= 0),
  add column if not exists shipping_longitude double precision,
  add column if not exists shipping_latitude double precision;

update public.orders
set total_cents = subtotal_cents + shipping_cents
where total_cents = 0;

alter table public.order_items
  add column if not exists shipping_cents integer not null default 0 check (shipping_cents >= 0);

create or replace function public.require_brand_shipping_origin_for_published_product()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.listing_status = 'published' and not exists (
    select 1
    from public.brands
    where brands.brand_uuid = new.brand_id
      and nullif(trim(brands.shipping_address), '') is not null
      and brands.shipping_longitude is not null
      and brands.shipping_latitude is not null
  ) then
    raise exception 'Add a shipping origin address to your brand profile before publishing a listing.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists products_require_shipping_origin on public.products;
create trigger products_require_shipping_origin
  before insert or update of brand_id, listing_status on public.products
  for each row execute function public.require_brand_shipping_origin_for_published_product();

create or replace function public.prevent_removing_active_brand_shipping_origin()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if (
    nullif(trim(new.shipping_address), '') is null
    or new.shipping_longitude is null
    or new.shipping_latitude is null
  ) and exists (
    select 1
    from public.products
    where products.brand_id = new.brand_uuid
      and products.listing_status = 'published'
  ) then
    raise exception 'A shipping origin is required while this brand has published listings.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists brands_keep_active_shipping_origin on public.brands;
create trigger brands_keep_active_shipping_origin
  before update of shipping_address, shipping_longitude, shipping_latitude on public.brands
  for each row execute function public.prevent_removing_active_brand_shipping_origin();