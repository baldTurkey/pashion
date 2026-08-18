
-- The real "Create Listing" UI doesn't exist yet (separate milestone) — this
-- exists purely so cart/checkout/payouts can be exercised end-to-end before
-- that lands. It seeds a few live listings against whichever brand account
-- was created first.

insert into public.listings (brand_id, name, description, price_cents, size, inventory, status)
select account_id, name, description, price_cents, size, inventory, 'live'
from public.brands, (
  values
    ('Oversized Wool Coat', 'Hand-finished, midweight wool blend.', 24800, 'M', 5),
    ('Cropped Denim Jacket', 'Raw hem, stonewashed.', 9800, 'S', 8),
    ('Silk Slip Dress', 'Bias-cut, four-way stretch silk.', 15800, 'M', 3),
    ('Linen Wide-Leg Trousers', 'Undyed linen, elastic waist.', 8800, 'L', 10)
) as demo_listings (name, description, price_cents, size, inventory)
where public.brands.account_id = (select account_id from public.brands limit 1);
