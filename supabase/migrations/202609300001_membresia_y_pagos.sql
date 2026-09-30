-- Membresía premium, tirada de prueba, pagos de MercadoPago y control de profundizaciones.

alter table public.profiles
    add column if not exists trial_reading_used boolean not null default false;

-- Pagos: una fila por pago de MercadoPago. El campo product permite vender otros
-- productos a futuro (por ejemplo, un manual) con el mismo circuito.
create table if not exists public.payments (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    product text not null,
    provider text not null default 'mercadopago',
    provider_payment_id text not null,
    status text not null,
    amount numeric(12, 2) not null,
    currency text not null default 'ARS',
    days_granted integer not null default 0,
    approved_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (provider, provider_payment_id)
);

alter table public.payments enable row level security;

create policy "users_can_read_own_payments"
on public.payments for select
to authenticated
using ((select auth.uid()) = user_id);

-- Lecturas generadas: permiten profundizar una sola vez y sin que el navegador
-- pueda enviar texto arbitrario al modelo.
create table if not exists public.readings (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    oracle text not null check (oracle in ('tarot', 'runas')),
    question text not null default '',
    symbols text[] not null default '{}',
    source text not null check (source in ('ritual', 'trial', 'premium')),
    deepened boolean not null default false,
    created_at timestamptz not null default now()
);

create index if not exists readings_user_created_idx on public.readings (user_id, created_at desc);

alter table public.readings enable row level security;

create policy "users_can_read_own_readings"
on public.readings for select
to authenticated
using ((select auth.uid()) = user_id);

-- Reserva una tirada: premium con cupo diario, o la única tirada de prueba.
-- Devuelve la fuente usada ('premium' | 'trial') o el motivo del rechazo.
create or replace function public.claim_reading(p_user_id uuid, p_daily_limit integer)
returns table (allowed boolean, source text, reason text)
language plpgsql
security definer set search_path = ''
as $$
declare
    perfil public.profiles%rowtype;
    affected_rows integer;
    argentina_today date := (timezone('America/Argentina/Buenos_Aires', now()))::date;
begin
    insert into public.profiles (user_id) values (p_user_id) on conflict (user_id) do nothing;
    select * into perfil from public.profiles where user_id = p_user_id for update;

    if perfil.membership_until is not null and perfil.membership_until > now() then
        insert into public.daily_usage (user_id, usage_date, paid_reading_count)
        values (p_user_id, argentina_today, 1)
        on conflict (user_id, usage_date)
        do update set
            paid_reading_count = public.daily_usage.paid_reading_count + 1,
            updated_at = now()
        where public.daily_usage.paid_reading_count < p_daily_limit;

        get diagnostics affected_rows = row_count;
        if affected_rows = 1 then
            return query select true, 'premium'::text, null::text;
        else
            return query select false, null::text, 'DAILY_LIMIT'::text;
        end if;
        return;
    end if;

    if not perfil.trial_reading_used then
        update public.profiles
        set trial_reading_used = true, updated_at = now()
        where user_id = p_user_id;
        return query select true, 'trial'::text, null::text;
        return;
    end if;

    return query select false, null::text, 'PREMIUM_REQUIRED'::text;
end;
$$;

-- Devuelve la tirada si la generación falló.
create or replace function public.release_reading(p_user_id uuid, p_source text)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
    if p_source = 'premium' then
        update public.daily_usage
        set paid_reading_count = greatest(paid_reading_count - 1, 0),
            updated_at = now()
        where user_id = p_user_id
          and usage_date = (timezone('America/Argentina/Buenos_Aires', now()))::date;
    elsif p_source = 'trial' then
        update public.profiles
        set trial_reading_used = false, updated_at = now()
        where user_id = p_user_id;
    end if;
end;
$$;

create or replace function public.record_reading(
    p_user_id uuid, p_oracle text, p_question text, p_symbols text[], p_source text
)
returns uuid
language sql
security definer set search_path = ''
as $$
    insert into public.readings (user_id, oracle, question, symbols, source)
    values (p_user_id, p_oracle, p_question, p_symbols, p_source)
    returning id;
$$;

-- Marca la lectura como profundizada (una sola vez) y devuelve su contexto.
create or replace function public.claim_deepening(p_user_id uuid, p_reading_id uuid)
returns table (oracle text, question text, symbols text[])
language sql
security definer set search_path = ''
as $$
    update public.readings
    set deepened = true
    where id = p_reading_id
      and user_id = p_user_id
      and not deepened
    returning oracle, question, symbols;
$$;

create or replace function public.release_deepening(p_user_id uuid, p_reading_id uuid)
returns void
language sql
security definer set search_path = ''
as $$
    update public.readings
    set deepened = false
    where id = p_reading_id and user_id = p_user_id;
$$;

-- Registra un pago de forma idempotente y ajusta la membresía cuando cambia de estado.
-- Devuelve true si la membresía fue modificada por esta llamada.
create or replace function public.apply_payment(
    p_user_id uuid,
    p_product text,
    p_provider_payment_id text,
    p_status text,
    p_amount numeric,
    p_currency text,
    p_days integer
)
returns boolean
language plpgsql
security definer set search_path = ''
as $$
declare
    estado_anterior text;
    dias_otorgados integer;
    pago_id uuid;
begin
    insert into public.profiles (user_id) values (p_user_id) on conflict (user_id) do nothing;
    perform 1 from public.profiles where user_id = p_user_id for update;

    select id, status, days_granted into pago_id, estado_anterior, dias_otorgados
    from public.payments
    where provider = 'mercadopago' and provider_payment_id = p_provider_payment_id
    for update;

    if pago_id is null then
        insert into public.payments (user_id, product, provider_payment_id, status, amount, currency, days_granted, approved_at)
        values (p_user_id, p_product, p_provider_payment_id, p_status, p_amount, p_currency, p_days,
                case when p_status = 'approved' then now() end);
    elsif estado_anterior = p_status then
        return false;
    else
        update public.payments
        set status = p_status,
            approved_at = coalesce(approved_at, case when p_status = 'approved' then now() end),
            updated_at = now()
        where id = pago_id;
    end if;

    if p_status = 'approved' and estado_anterior is distinct from 'approved' and p_days > 0 then
        update public.profiles
        set plan = 'premium',
            membership_until = greatest(coalesce(membership_until, now()), now()) + make_interval(days => p_days),
            updated_at = now()
        where user_id = p_user_id;
        return true;
    end if;

    if estado_anterior = 'approved' and p_status in ('refunded', 'charged_back', 'cancelled') and dias_otorgados > 0 then
        update public.profiles
        set membership_until = membership_until - make_interval(days => dias_otorgados),
            plan = case when membership_until - make_interval(days => dias_otorgados) > now() then 'premium' else 'free' end,
            updated_at = now()
        where user_id = p_user_id;
        return true;
    end if;

    return false;
end;
$$;

create or replace function public.get_account_status(p_user_id uuid)
returns table (
    membership_until timestamptz,
    trial_reading_used boolean,
    ritual_used integer,
    paid_readings_used integer
)
language sql
security definer set search_path = ''
as $$
    select
        p.membership_until,
        coalesce(p.trial_reading_used, false),
        coalesce(u.daily_ritual_count, 0),
        coalesce(u.paid_reading_count, 0)
    from (values (1)) as seed(value)
    left join public.profiles p on p.user_id = p_user_id
    left join public.daily_usage u
      on u.user_id = p_user_id
     and u.usage_date = (timezone('America/Argentina/Buenos_Aires', now()))::date;
$$;

revoke all on function public.claim_reading(uuid, integer) from public, anon, authenticated;
revoke all on function public.release_reading(uuid, text) from public, anon, authenticated;
revoke all on function public.record_reading(uuid, text, text, text[], text) from public, anon, authenticated;
revoke all on function public.claim_deepening(uuid, uuid) from public, anon, authenticated;
revoke all on function public.release_deepening(uuid, uuid) from public, anon, authenticated;
revoke all on function public.apply_payment(uuid, text, text, text, numeric, text, integer) from public, anon, authenticated;
revoke all on function public.get_account_status(uuid) from public, anon, authenticated;
grant execute on function public.claim_reading(uuid, integer) to service_role;
grant execute on function public.release_reading(uuid, text) to service_role;
grant execute on function public.record_reading(uuid, text, text, text[], text) to service_role;
grant execute on function public.claim_deepening(uuid, uuid) to service_role;
grant execute on function public.release_deepening(uuid, uuid) to service_role;
grant execute on function public.apply_payment(uuid, text, text, text, numeric, text, integer) to service_role;
grant execute on function public.get_account_status(uuid) to service_role;

-- La política existente permitía que un usuario editara su propio perfil completo,
-- incluidos plan y membership_until. Limitamos la edición al nombre visible.
revoke update on public.profiles from authenticated;
grant update (display_name) on public.profiles to authenticated;
