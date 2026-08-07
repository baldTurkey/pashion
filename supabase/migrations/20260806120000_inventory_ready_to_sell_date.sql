alter table public.inventory
add column if not exists ready_to_sell_date date null;

alter table public.inventory
add column if not exists size_breakdown jsonb null;

alter table public.inventory
add column if not exists supply text[] null;

alter table public.products
add column if not exists supply text[] null;