-- `designers` has RLS enabled but zero policies (confirmed via
-- `supabase db query --linked` against pg_policies) — meaning every
-- operation was blocked except via the service role. The signup API route
-- already writes via service role (bypassing RLS), but the dashboard reads
-- via the normal cookie-authenticated client, which needs an explicit policy.
-- Owner-only for now, not public — the whiteboard/meeting notes describe a
-- public designer directory as a later feature, same as /brands is for
-- brands today (see brands_select_public in the brands migration).

drop policy if exists "designers_select_own" on public.designers;
create policy "designers_select_own" on public.designers
  for select using (auth.uid() = designer_uuid);

drop policy if exists "designers_insert_own" on public.designers;
create policy "designers_insert_own" on public.designers
  for insert with check (auth.uid() = designer_uuid);

drop policy if exists "designers_update_own" on public.designers;
create policy "designers_update_own" on public.designers
  for update using (auth.uid() = designer_uuid) with check (auth.uid() = designer_uuid);
