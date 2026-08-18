-- Adds Stripe Connect (Express account) fields to brands. Brands must
-- connect payouts before they're allowed to create a listing, see the
-- listings insert policy in the next migration, which checks
-- stripe_payouts_enabled directly.

alter table public.brands
  add column if not exists stripe_account_id text,
  add column if not exists stripe_payouts_enabled boolean not null default false;
