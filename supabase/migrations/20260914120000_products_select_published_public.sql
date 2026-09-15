-- "products_select_own_brand" (20260806133000) only lets a brand see its own
-- rows. That's correct for the brand dashboard, but it also means customer-
-- facing pages (storefront, product detail, marketplace) querying products
-- with the anon/user client get zero rows for every brand that isn't the
-- signed-in brand — RLS policies are OR'd together, so add a policy that
-- opens up read access to anyone for already-published listings.
drop policy if exists "products_select_published" on public.products;
create policy "products_select_published" on public.products
  for select using (listing_status = 'published');
