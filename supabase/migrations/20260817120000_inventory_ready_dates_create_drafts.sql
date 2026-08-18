alter table public.products
  add column if not exists listing_status text not null default 'published'
    check (listing_status in ('draft', 'published'));

alter table public.products
  add column if not exists inventory_id bigint null;

create unique index if not exists products_inventory_id_unique
  on public.products (inventory_id)
  where inventory_id is not null;

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

drop policy if exists "products_select_own_brand" on public.products;
drop policy if exists "products_select_published_or_own_brand" on public.products;
create policy "products_select_published_or_own_brand" on public.products
  for select using (
    products.listing_status = 'published'
    or exists (
      select 1
      from public.brands
      where brands.account_id = auth.uid()
        and brands.brand_uuid = products.brand_id
    )
  );