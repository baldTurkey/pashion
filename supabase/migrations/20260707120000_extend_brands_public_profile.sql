-- Extends the existing (live, app-created) `brands` table with what the
-- public brand profile page and directory need. Does not recreate the
-- table — no migration history exists yet for its original shape, so this
-- only adds columns/policies on top of whatever is already there.

alter table public.brands
  add column if not exists slug text,
  add column if not exists shipping_range text;

create unique index if not exists brands_slug_key on public.brands (slug);

alter table public.brands enable row level security;

drop policy if exists "brands_select_public" on public.brands;
create policy "brands_select_public" on public.brands
  for select using (true); -- public profile pages need this

drop policy if exists "brands_insert_own" on public.brands;
create policy "brands_insert_own" on public.brands
  for insert with check (auth.uid() = account_id);

drop policy if exists "brands_update_own" on public.brands;
create policy "brands_update_own" on public.brands
  for update using (auth.uid() = account_id) with check (auth.uid() = account_id);
-- No delete policy yet — flagged in the plan as a v1 gap, not needed now.

create or replace function public.brands_generate_slug()
returns trigger language plpgsql as $$
declare
  base_slug text;
  candidate_slug text;
  suffix int := 1;
begin
  if new.slug is not null and length(trim(new.slug)) > 0 then
    return new;
  end if;

  base_slug := trim(both '-' from regexp_replace(lower(new.company_name), '[^a-z0-9]+', '-', 'g'));
  candidate_slug := base_slug;

  while exists (select 1 from public.brands where slug = candidate_slug) loop
    suffix := suffix + 1;
    candidate_slug := base_slug || '-' || suffix;
  end loop;

  new.slug := candidate_slug;
  return new;
end;
$$;

drop trigger if exists brands_before_insert_slug on public.brands;
create trigger brands_before_insert_slug
  before insert on public.brands
  for each row execute function public.brands_generate_slug();
