create table if not exists public.profiles (
    user_id uuid primary key references auth.users(id) on delete cascade,
    display_name text not null default '',
    plan text not null default 'free' check (plan in ('free', 'premium')),
    membership_until timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "users_can_read_own_profile"
on public.profiles for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "users_can_update_own_profile"
on public.profiles for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
    insert into public.profiles (user_id, display_name)
    values (new.id, coalesce(new.raw_user_meta_data ->> 'nombre', ''))
    on conflict (user_id) do nothing;
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create table if not exists public.daily_usage (
    user_id uuid not null references auth.users(id) on delete cascade,
    usage_date date not null,
    daily_ritual_count integer not null default 0 check (daily_ritual_count between 0 and 1),
    paid_reading_count integer not null default 0 check (paid_reading_count >= 0),
    updated_at timestamptz not null default now(),
    primary key (user_id, usage_date)
);

alter table public.daily_usage enable row level security;

create policy "users_can_read_own_usage"
on public.daily_usage for select
to authenticated
using ((select auth.uid()) = user_id);

create or replace function public.claim_daily_ritual(p_user_id uuid)
returns boolean
language plpgsql
security definer set search_path = ''
as $$
declare
    affected_rows integer;
    argentina_today date := (timezone('America/Argentina/Buenos_Aires', now()))::date;
begin
    insert into public.daily_usage (user_id, usage_date, daily_ritual_count)
    values (p_user_id, argentina_today, 1)
    on conflict (user_id, usage_date)
    do update set
        daily_ritual_count = public.daily_usage.daily_ritual_count + 1,
        updated_at = now()
    where public.daily_usage.daily_ritual_count < 1;

    get diagnostics affected_rows = row_count;
    return affected_rows = 1;
end;
$$;

create or replace function public.release_daily_ritual(p_user_id uuid)
returns void
language sql
security definer set search_path = ''
as $$
    update public.daily_usage
    set daily_ritual_count = greatest(daily_ritual_count - 1, 0),
        updated_at = now()
    where user_id = p_user_id
      and usage_date = (timezone('America/Argentina/Buenos_Aires', now()))::date;
$$;

create or replace function public.get_daily_access(p_user_id uuid)
returns table (ritual_used integer, paid_readings_used integer)
language sql
security definer set search_path = ''
as $$
    select
        coalesce(daily_ritual_count, 0) as ritual_used,
        coalesce(paid_reading_count, 0) as paid_readings_used
    from (values (1)) as seed(value)
    left join public.daily_usage
      on user_id = p_user_id
     and usage_date = (timezone('America/Argentina/Buenos_Aires', now()))::date;
$$;

revoke all on function public.claim_daily_ritual(uuid) from public, anon, authenticated;
revoke all on function public.release_daily_ritual(uuid) from public, anon, authenticated;
revoke all on function public.get_daily_access(uuid) from public, anon, authenticated;
grant execute on function public.claim_daily_ritual(uuid) to service_role;
grant execute on function public.release_daily_ritual(uuid) to service_role;
grant execute on function public.get_daily_access(uuid) to service_role;
