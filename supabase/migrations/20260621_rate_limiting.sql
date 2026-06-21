-- ONYX MUN — database-level rate limiting & duplicate protection
-- Run in Supabase Dashboard → SQL Editor (or via supabase db push)

-- Track submission attempts (optional audit; API also rate-limits)
create table if not exists public.submission_guard_log (
    id uuid primary key default gen_random_uuid(),
    guard_key text not null,
    table_name text not null,
    created_at timestamptz not null default now()
);

create index if not exists submission_guard_log_key_time_idx
    on public.submission_guard_log (guard_key, created_at desc);

alter table public.submission_guard_log enable row level security;

-- Generic rate-limit trigger function (email per table, 1 hour window)
create or replace function public.enforce_application_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    email_count integer;
    phone_count integer;
    txn_count integer;
    norm_email text;
    norm_phone text;
begin
    norm_email := lower(trim(coalesce(NEW.email, '')));
    norm_phone := regexp_replace(coalesce(NEW.phone, ''), '[^0-9]', '', 'g');

    if norm_email <> '' then
        execute format(
            'select count(*) from public.%I where lower(trim(email)) = $1 and submitted_at > now() - interval ''1 hour''',
            TG_TABLE_NAME
        ) into email_count using norm_email;

        if email_count >= 3 then
            raise exception 'Rate limit exceeded. Please wait before submitting again.'
                using errcode = 'P0001';
        end if;
    end if;

    if length(norm_phone) >= 10 then
        execute format(
            'select count(*) from public.%I where regexp_replace(coalesce(phone, ''''), ''[^0-9]'', '''', ''g'') = $1 and submitted_at > now() - interval ''1 hour''',
            TG_TABLE_NAME
        ) into phone_count using norm_phone;

        if phone_count >= 3 then
            raise exception 'Rate limit exceeded. Please wait before submitting again.'
                using errcode = 'P0001';
        end if;
    end if;

    if TG_TABLE_NAME in ('delegate_applications', 'oc_applications', 'priority_applications')
       and coalesce(NEW.transaction_id, '') <> '' then
        execute format(
            'select count(*) from public.%I where transaction_id = $1',
            TG_TABLE_NAME
        ) into txn_count using NEW.transaction_id;

        if txn_count >= 1 then
            raise exception 'This UPI transaction ID has already been used.'
                using errcode = '23505';
        end if;
    end if;

    return NEW;
end;
$$;

-- Attach triggers (idempotent)
drop trigger if exists delegate_applications_rate_limit on public.delegate_applications;
create trigger delegate_applications_rate_limit
    before insert on public.delegate_applications
    for each row execute function public.enforce_application_rate_limit();

drop trigger if exists oc_applications_rate_limit on public.oc_applications;
create trigger oc_applications_rate_limit
    before insert on public.oc_applications
    for each row execute function public.enforce_application_rate_limit();

drop trigger if exists eb_applications_rate_limit on public.eb_applications;
create trigger eb_applications_rate_limit
    before insert on public.eb_applications
    for each row execute function public.enforce_application_rate_limit();

drop trigger if exists priority_applications_rate_limit on public.priority_applications;
create trigger priority_applications_rate_limit
    before insert on public.priority_applications
    for each row execute function public.enforce_application_rate_limit();

-- Performance indexes for rate-limit queries
create index if not exists delegate_applications_email_submitted_idx
    on public.delegate_applications (lower(trim(email)), submitted_at desc);

create index if not exists oc_applications_email_submitted_idx
    on public.oc_applications (lower(trim(email)), submitted_at desc);

create unique index if not exists delegate_applications_transaction_id_unique
    on public.delegate_applications (transaction_id)
    where transaction_id is not null and transaction_id <> '';

create unique index if not exists oc_applications_transaction_id_unique
    on public.oc_applications (transaction_id)
    where transaction_id is not null and transaction_id <> '';

create unique index if not exists priority_applications_transaction_id_unique
    on public.priority_applications (transaction_id)
    where transaction_id is not null and transaction_id <> '';
