-- Atomic inventory decrement, called from the payment webhook. Doing this as
-- "read inventory, subtract, write it back" from application code has a race
-- condition if two orders for the same listing complete at nearly the same
-- time, this does the subtraction in a single database step instead.
create or replace function public.decrement_listing_inventory(p_listing_id uuid, p_quantity integer)
returns void
language sql
security definer
set search_path = public
as $$
  update public.listings
  set inventory = greatest(0, inventory - p_quantity)
  where id = p_listing_id;
$$;
