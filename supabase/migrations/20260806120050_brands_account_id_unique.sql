-- listings.brand_id needs to reference brands.account_id as a foreign key,
-- which requires a unique constraint on the referenced column. The app
-- already enforces "one brand per account" at the insert layer, so this just codifies that invariant in the DB.

alter table public.brands
  add constraint brands_account_id_key unique (account_id);
