create table if not exists public.oc_applications (
    id uuid primary key default gen_random_uuid(),
    full_name text not null,
    instagram_account text not null,
    phone text not null,
    email text not null,
    institution text not null,
    grade text not null,
    experience text not null,
    dedication_before_mun text not null check (dedication_before_mun in ('yes', 'no')),
    fee_amount integer not null default 1699,
    transaction_id text not null,
    application_type text not null default 'organising_committee',
    status text not null default 'pending',
    admin_notes text,
    is_best boolean not null default false,
    submitted_at timestamptz not null default now(),
    created_at timestamptz not null default now()
);

alter table public.oc_applications enable row level security;

create policy "Allow public OC application inserts"
on public.oc_applications
for insert
to anon
with check (true);

create policy "Allow anon OC application reads for admin dashboard"
on public.oc_applications
for select
to anon
using (true);

create policy "Allow anon OC application updates for admin dashboard"
on public.oc_applications
for update
to anon
using (true)
with check (true);

create policy "Allow anon OC application deletes for admin dashboard"
on public.oc_applications
for delete
to anon
using (true);
