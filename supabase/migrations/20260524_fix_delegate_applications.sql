-- Run in Supabase Dashboard → SQL Editor
-- Fixes 400 errors: missing columns + RLS for delegate_applications

-- 1) Add columns the Round 1 form sends (safe if they already exist)
alter table public.delegate_applications
    add column if not exists transaction_id text,
    add column if not exists fee_amount integer not null default 2699,
    add column if not exists application_type text not null default 'delegate',
    add column if not exists status text not null default 'pending',
    add column if not exists admin_notes text,
    add column if not exists is_best boolean not null default false,
    add column if not exists allocated_committee text,
    add column if not exists allocated_portfolio text,
    add column if not exists submitted_at timestamptz not null default now(),
    add column if not exists created_at timestamptz not null default now();

-- 2) If the table does not exist yet, use this instead (comment out section 1 first):
-- create table public.delegate_applications (
--     id uuid primary key default gen_random_uuid(),
--     full_name text not null,
--     email text not null,
--     phone text not null,
--     institution text not null,
--     preference_1 text not null,
--     preference_2 text not null,
--     preference_3 text not null,
--     mun_experience text not null,
--     previous_muns text,
--     motivation text not null,
--     additional_info text,
--     referral_source text not null,
--     queries_feedback text,
--     transaction_id text not null,
--     fee_amount integer not null default 2699,
--     application_type text not null default 'delegate',
--     status text not null default 'pending',
--     admin_notes text,
--     is_best boolean not null default false,
--     allocated_committee text,
--     allocated_portfolio text,
--     submitted_at timestamptz not null default now(),
--     created_at timestamptz not null default now()
-- );

-- 3) Row Level Security (public form + admin dashboard use anon key)
alter table public.delegate_applications enable row level security;

drop policy if exists "Allow public delegate application inserts" on public.delegate_applications;
drop policy if exists "Allow anon delegate application reads" on public.delegate_applications;
drop policy if exists "Allow anon delegate application updates" on public.delegate_applications;
drop policy if exists "Allow anon delegate application deletes" on public.delegate_applications;

create policy "Allow public delegate application inserts"
    on public.delegate_applications
    for insert
    to anon
    with check (true);

create policy "Allow anon delegate application reads"
    on public.delegate_applications
    for select
    to anon
    using (true);

create policy "Allow anon delegate application updates"
    on public.delegate_applications
    for update
    to anon
    using (true)
    with check (true);

create policy "Allow anon delegate application deletes"
    on public.delegate_applications
    for delete
    to anon
    using (true);
