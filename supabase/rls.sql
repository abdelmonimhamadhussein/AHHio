-- AHHio tenant-first Supabase migration.
-- Run this once in Supabase SQL Editor. It is safe to run again.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text,
  role text not null default 'customer' check (role in ('customer', 'vendor', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.plans (
  id text primary key,
  name text not null,
  price numeric not null default 0,
  max_products integer not null default 10,
  max_images integer not null default 10,
  commission_percent numeric not null default 15,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.plans (id, name, price, max_products, max_images, commission_percent)
values
  ('basic', 'مجانية', 0, 10, 10, 15),
  ('pro', 'Pro', 99, 100, 100, 10),
  ('vip', 'VIP', 199, 999999, 999999, 5)
on conflict (id) do update set
  name = excluded.name,
  price = excluded.price,
  max_products = excluded.max_products,
  max_images = excluded.max_images,
  commission_percent = excluded.commission_percent;

alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists city text;
alter table public.profiles add column if not exists store_name text;
alter table public.profiles add column if not exists store_slug text;
alter table public.profiles add column if not exists store_description text;
alter table public.profiles add column if not exists store_address text;
alter table public.profiles add column if not exists store_logo_url text;
alter table public.profiles add column if not exists store_banner_url text;
alter table public.profiles add column if not exists whatsapp text;
alter table public.profiles add column if not exists whatsapp_number text;
alter table public.profiles add column if not exists bank_account text;
alter table public.profiles add column if not exists instagram text;
alter table public.profiles add column if not exists delivery_fee numeric not null default 0;
alter table public.profiles add column if not exists theme_color text default '#E91E63';
alter table public.profiles add column if not exists vendor_status text default 'pending';
alter table public.profiles add column if not exists is_vendor_approved boolean not null default false;
alter table public.profiles add column if not exists requested_plan_id text references public.plans(id);

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users(id) on delete cascade,
  owner_name text,
  store_name text not null,
  slug text not null unique,
  description text,
  city text,
  delivery_fee numeric not null default 0 check (delivery_fee >= 0),
  phone text,
  whatsapp_number text,
  bank_account text,
  instagram text,
  logo_url text,
  banner_url text,
  theme_color text not null default '#E91E63',
  status text not null default 'active' check (status in ('active', 'expired', 'blocked', 'pending')),
  plan text not null default 'basic' references public.plans(id),
  rating numeric not null default 0,
  is_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tenants add column if not exists owner_id uuid references auth.users(id) on delete cascade;
alter table public.tenants add column if not exists plan text references public.plans(id) default 'basic';
alter table public.tenants add column if not exists status text default 'pending';
alter table public.tenants alter column status set default 'pending';
alter table public.tenants add column if not exists whatsapp_number text;
alter table public.tenants add column if not exists logo_url text;
alter table public.tenants add column if not exists banner_url text;
alter table public.tenants add column if not exists theme_color text default '#E91E63';
alter table public.tenants add column if not exists updated_at timestamptz default now();
alter table public.tenants add column if not exists delivery_fee numeric not null default 0 check (delivery_fee >= 0);

create table if not exists public.delivery_agents (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  phone text not null,
  is_active boolean not null default true
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  plan_id text not null references public.plans(id),
  status text not null default 'active' check (status in ('trial', 'active', 'expired', 'cancelled', 'blocked')),
  start_date timestamptz not null default now(),
  end_date timestamptz,
  grace_until timestamptz,
  amount numeric not null default 0,
  created_at timestamptz not null default now(),
  unique (tenant_id)
);

alter table public.subscriptions add column if not exists tenant_id uuid references public.tenants(id) on delete cascade;
alter table public.subscriptions add column if not exists plan_id text references public.plans(id);
alter table public.subscriptions add column if not exists status text default 'active';
alter table public.subscriptions add column if not exists start_date timestamptz default now();
alter table public.subscriptions add column if not exists end_date timestamptz;
alter table public.subscriptions add column if not exists grace_until timestamptz;
alter table public.subscriptions add column if not exists vendor_id uuid;
alter table public.subscriptions alter column vendor_id drop not null;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  name text not null,
  description text,
  category text,
  price numeric not null default 0,
  stock integer not null default 0,
  images jsonb not null default '[]'::jsonb,
  image_url text,
  status text not null default 'active',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.products add column if not exists tenant_id uuid references public.tenants(id) on delete cascade;
alter table public.products add column if not exists images jsonb default '[]'::jsonb;
alter table public.products add column if not exists is_active boolean default true;
alter table public.products add column if not exists status text default 'active';
alter table public.products add column if not exists stock integer default 0;
alter table public.products add column if not exists vendor_id uuid;
alter table public.products alter column vendor_id drop not null;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  customer_name text not null,
  phone text,
  city text,
  address text,
  items jsonb not null default '[]'::jsonb,
  subtotal numeric not null default 0,
  delivery_fee numeric not null default 0,
  tax numeric not null default 0,
  delivery_agent_id uuid references public.delivery_agents(id) on delete set null,
  total numeric not null default 0,
  commission numeric not null default 0,
  tenant_earning numeric not null default 0,
  payment_method text default 'cash',
  payment_txn text,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

alter table public.orders add column if not exists tenant_id uuid references public.tenants(id) on delete restrict;
alter table public.orders add column if not exists subtotal numeric not null default 0;
alter table public.orders add column if not exists delivery_fee numeric not null default 0;
alter table public.orders add column if not exists tax numeric not null default 0;
alter table public.orders add column if not exists delivery_agent_id uuid references public.delivery_agents(id) on delete set null;
alter table public.orders add column if not exists phone text;
alter table public.orders add column if not exists city text;
alter table public.orders add column if not exists commission numeric default 0;
alter table public.orders add column if not exists tenant_earning numeric default 0;
alter table public.orders add column if not exists payment_txn text;
alter table public.orders add column if not exists vendor_id uuid;
alter table public.orders alter column vendor_id drop not null;

create table if not exists public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  requested_plan_id text not null references public.plans(id),
  txn_number text not null unique,
  amount numeric not null default 0,
  screenshot_url text,
  status text not null default 'pending',
  auto_verified boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.payment_transactions add column if not exists requested_plan_id text references public.plans(id);

create table if not exists public.renew_requests (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  transaction_no text not null unique,
  screenshot_url text,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

alter table public.renew_requests add column if not exists tenant_id uuid references public.tenants(id) on delete cascade;
alter table public.renew_requests add column if not exists screenshot_url text;
alter table public.renew_requests add column if not exists vendor_id uuid;
alter table public.renew_requests alter column vendor_id drop not null;

create index if not exists tenants_slug_idx on public.tenants(slug);
create index if not exists products_tenant_idx on public.products(tenant_id);
create index if not exists orders_tenant_idx on public.orders(tenant_id);
create index if not exists delivery_agents_store_idx on public.delivery_agents(store_id);
create index if not exists subscriptions_tenant_idx on public.subscriptions(tenant_id);
create unique index if not exists subscriptions_tenant_unique on public.subscriptions(tenant_id) where tenant_id is not null;

create or replace function public.ensure_free_subscription_for_tenant()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.subscriptions (tenant_id, plan_id, status, start_date, end_date, amount)
  select new.id, new.plan,
    case when plans.price > 0 then 'trial' else 'active' end,
    now(),
    now() + case when plans.price > 0 then interval '3 days' else interval '30 days' end,
    plans.price
  from public.plans
  where plans.id = new.plan
  on conflict (tenant_id) do nothing;
  return new;
end;
$$;

drop trigger if exists ensure_tenant_free_subscription on public.tenants;
create constraint trigger ensure_tenant_free_subscription
after insert on public.tenants
deferrable initially deferred
for each row execute procedure public.ensure_free_subscription_for_tenant();

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.owns_tenant(target_tenant uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.tenants where id = target_tenant and owner_id = auth.uid());
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, role, whatsapp, requested_plan_id)
  values (
    new.id,
    new.email,
    case when new.raw_user_meta_data->>'role' = 'vendor' then 'vendor' else 'customer' end,
    new.raw_user_meta_data->>'whatsapp',
    case
      when new.raw_user_meta_data->>'plan_id' = 'free' then 'basic'
      else coalesce(nullif(trim(new.raw_user_meta_data->>'plan_id'), ''), 'basic')
    end
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.plans enable row level security;
alter table public.tenants enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.delivery_agents enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payment_transactions enable row level security;
alter table public.renew_requests enable row level security;

drop policy if exists plans_public_read on public.plans;
create policy plans_public_read on public.plans for select to anon, authenticated using (is_active = true);

drop policy if exists profiles_self_access on public.profiles;
drop policy if exists profiles_select_self on public.profiles;
create policy profiles_select_self on public.profiles for select to authenticated
using (id = auth.uid() or public.is_admin());
drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self on public.profiles for insert to authenticated
with check ((id = auth.uid() and role in ('customer', 'vendor')) or public.is_admin());
drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles for update to authenticated
using (id = auth.uid() or public.is_admin())
with check ((id = auth.uid() and role in ('customer', 'vendor')) or public.is_admin());
revoke update on public.profiles from anon, authenticated;
grant update (
  full_name, username, avatar_url, phone, city, store_name, store_slug,
  store_description, store_address, store_logo_url, store_banner_url, whatsapp,
  whatsapp_number, bank_account, instagram, delivery_fee, theme_color
) on public.profiles to authenticated;

drop policy if exists tenants_public_read on public.tenants;
create policy tenants_public_read on public.tenants for select to anon, authenticated
using (status = 'active' or owner_id = auth.uid() or public.is_admin());
drop policy if exists tenants_owner_insert on public.tenants;
create policy tenants_owner_insert on public.tenants for insert to authenticated
with check (
  public.is_admin()
  or (
    owner_id = auth.uid()
    and plan = coalesce(nullif(auth.jwt()->'user_metadata'->>'plan_id', ''), 'basic')
    and status = 'pending'
    and is_verified = false
  )
);
drop policy if exists tenants_owner_update on public.tenants;
create policy tenants_owner_update on public.tenants for update to authenticated
using (owner_id = auth.uid() or public.is_admin()) with check (owner_id = auth.uid() or public.is_admin());
drop policy if exists tenants_owner_delete on public.tenants;
create policy tenants_owner_delete on public.tenants for delete to authenticated
using (owner_id = auth.uid() or public.is_admin());

drop policy if exists products_public_read on public.products;
create policy products_public_read on public.products for select to anon, authenticated
using (
  (
    status = 'active'
    and is_active = true
    and exists (
      select 1 from public.tenants
      where id = products.tenant_id and status = 'active'
    )
  )
  or public.owns_tenant(tenant_id)
  or public.is_admin()
);
drop policy if exists products_tenant_insert on public.products;
create policy products_tenant_insert on public.products for insert to authenticated
with check (
  exists (
    select 1 from public.tenants
    where id = products.tenant_id and owner_id = auth.uid() and status = 'active'
  )
  or public.is_admin()
);
drop policy if exists products_tenant_update on public.products;
create policy products_tenant_update on public.products for update to authenticated
using (public.owns_tenant(tenant_id) or public.is_admin())
with check (
  exists (
    select 1 from public.tenants
    where id = products.tenant_id and owner_id = auth.uid() and status = 'active'
  )
  or public.is_admin()
);
drop policy if exists products_tenant_delete on public.products;
create policy products_tenant_delete on public.products for delete to authenticated
using (public.owns_tenant(tenant_id) or public.is_admin());

drop policy if exists delivery_agents_tenant_read on public.delivery_agents;
create policy delivery_agents_tenant_read on public.delivery_agents for select to authenticated
using (public.owns_tenant(store_id) or public.is_admin());
drop policy if exists delivery_agents_tenant_insert on public.delivery_agents;
create policy delivery_agents_tenant_insert on public.delivery_agents for insert to authenticated
with check (public.owns_tenant(store_id) or public.is_admin());
drop policy if exists delivery_agents_tenant_update on public.delivery_agents;
create policy delivery_agents_tenant_update on public.delivery_agents for update to authenticated
using (public.owns_tenant(store_id) or public.is_admin())
with check (public.owns_tenant(store_id) or public.is_admin());
drop policy if exists delivery_agents_tenant_delete on public.delivery_agents;
create policy delivery_agents_tenant_delete on public.delivery_agents for delete to authenticated
using (public.owns_tenant(store_id) or public.is_admin());
grant select, insert, update, delete on public.delivery_agents to authenticated;

drop policy if exists orders_tenant_read on public.orders;
create policy orders_tenant_read on public.orders for select to authenticated
using (public.owns_tenant(tenant_id) or public.is_admin());
drop policy if exists orders_tenant_update on public.orders;
revoke insert, update on public.orders from anon, authenticated;

drop policy if exists subscriptions_tenant_access on public.subscriptions;
drop policy if exists subscriptions_owner_read on public.subscriptions;
create policy subscriptions_owner_read on public.subscriptions for select to authenticated
using (public.owns_tenant(tenant_id) or public.is_admin());
drop policy if exists subscriptions_owner_free_insert on public.subscriptions;
create policy subscriptions_owner_free_insert on public.subscriptions for insert to authenticated
with check (
  public.owns_tenant(tenant_id)
  and plan_id = 'basic'
  and status = 'active'
  and amount = 0
  and end_date >= start_date
  and end_date <= start_date + interval '30 days'
);
grant insert on public.subscriptions to authenticated;
drop policy if exists subscriptions_admin_write on public.subscriptions;
create policy subscriptions_admin_write on public.subscriptions for all to authenticated
using (public.is_admin()) with check (public.is_admin());

drop policy if exists payment_transactions_tenant_access on public.payment_transactions;
drop policy if exists payment_transactions_owner_read on public.payment_transactions;
create policy payment_transactions_owner_read on public.payment_transactions for select to authenticated
using (public.owns_tenant(tenant_id) or public.is_admin());
drop policy if exists payment_transactions_owner_insert on public.payment_transactions;
create policy payment_transactions_owner_insert on public.payment_transactions for insert to authenticated
with check (
  public.owns_tenant(tenant_id)
  and requested_plan_id is not null
  and status = 'pending'
  and auto_verified = false
);
drop policy if exists payment_transactions_admin_write on public.payment_transactions;
create policy payment_transactions_admin_write on public.payment_transactions for all to authenticated
using (public.is_admin()) with check (public.is_admin());

drop policy if exists renew_requests_tenant_access on public.renew_requests;
revoke all on public.renew_requests from anon, authenticated;

revoke update on public.tenants from anon, authenticated;
grant update (
  owner_name, store_name, slug, description, city, phone, whatsapp_number,
  instagram, logo_url, banner_url, theme_color, delivery_fee, updated_at
) on public.tenants to authenticated;
grant insert on public.tenants to authenticated;
revoke select on public.tenants from anon, authenticated;
revoke select (bank_account) on public.tenants from anon, authenticated;
grant select (
  id, owner_id, owner_name, store_name, slug, description, city, delivery_fee,
  phone, whatsapp_number, instagram, logo_url, banner_url, theme_color, status,
  plan, rating, is_verified, created_at, updated_at
) on public.tenants to anon, authenticated;

create or replace function public.create_vendor_store(
  p_store_name text,
  p_store_slug text,
  p_store_description text,
  p_plan_id text
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
  current_profile public.profiles%rowtype;
  selected_plan_id text;
  created_tenant_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if nullif(trim(p_store_name), '') is null
     or nullif(trim(p_store_slug), '') is null
     or length(trim(p_store_slug)) < 3
     or lower(trim(p_store_slug)) !~ '^[a-z0-9-]+$' then
    raise exception 'Invalid store name or slug';
  end if;

  select * into current_profile
  from public.profiles
  where id = current_user_id
  for update;
  if not found or current_profile.role <> 'vendor' then
    raise exception 'Vendor profile not found' using errcode = '42501';
  end if;

  if exists (select 1 from public.tenants where owner_id = current_user_id) then
    raise exception 'This account already has a store';
  end if;

  selected_plan_id := case when p_plan_id = 'free' then 'basic' else p_plan_id end;
  if not exists (
    select 1 from public.plans
    where id = selected_plan_id and is_active = true
  ) then
    raise exception 'Selected plan is unavailable';
  end if;

  insert into public.tenants (
    owner_id, owner_name, store_name, slug, description, whatsapp_number,
    plan, status, is_verified
  )
  values (
    current_user_id,
    coalesce(nullif(trim(current_profile.full_name), ''), nullif(trim(current_profile.name), ''), trim(p_store_name)),
    trim(p_store_name),
    lower(trim(p_store_slug)),
    nullif(trim(p_store_description), ''),
    coalesce(current_profile.whatsapp_number, current_profile.whatsapp),
    selected_plan_id,
    'pending',
    false
  )
  returning id into created_tenant_id;

  update public.profiles
  set store_name = trim(p_store_name),
      store_slug = lower(trim(p_store_slug)),
      store_description = nullif(trim(p_store_description), ''),
      requested_plan_id = selected_plan_id,
      vendor_status = 'pending',
      is_vendor_approved = false
  where id = current_user_id;

  return created_tenant_id;
end;
$$;

revoke all on function public.create_vendor_store(text, text, text, text) from public;
grant execute on function public.create_vendor_store(text, text, text, text) to authenticated;

create or replace function public.place_marketplace_order(
  customer_name text,
  customer_phone text,
  customer_city text,
  customer_address text,
  requested_orders jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  tenant_record public.tenants%rowtype;
  order_record jsonb;
  item_record jsonb;
  product_record record;
  target_tenant uuid;
  requested_items jsonb;
  product_id uuid;
  quantity integer;
  order_items jsonb := '[]'::jsonb;
  orders_result jsonb := '[]'::jsonb;
  order_subtotal numeric := 0;
  delivery_fee numeric := 0;
  order_tax numeric := 0;
  order_total numeric := 0;
  commission_rate numeric := 15;
  order_id uuid;
begin
  if nullif(trim(customer_name), '') is null
     or nullif(trim(customer_phone), '') is null
     or nullif(trim(customer_city), '') is null
     or nullif(trim(customer_address), '') is null then
    raise exception 'Customer details are required';
  end if;

  if coalesce(jsonb_typeof(requested_orders), '') <> 'array'
     or jsonb_array_length(requested_orders) = 0
     or jsonb_array_length(requested_orders) > 20 then
    raise exception 'Invalid order groups';
  end if;

  for order_record in select value from jsonb_array_elements(requested_orders) as requested(value) loop
    target_tenant := (order_record->>'tenant_id')::uuid;
    requested_items := order_record->'items';
    if coalesce(jsonb_typeof(requested_items), '') <> 'array'
       or jsonb_array_length(requested_items) = 0
       or jsonb_array_length(requested_items) > 50 then
      raise exception 'Invalid order items';
    end if;

    order_items := '[]'::jsonb;
    order_subtotal := 0;
    order_total := 0;
    commission_rate := 15;

    select * into tenant_record
    from public.tenants
    where id = target_tenant and status = 'active';
    if not found then
      raise exception 'Store is unavailable';
    end if;
    delivery_fee := coalesce(tenant_record.delivery_fee, 0);
    order_tax := 0;

    for item_record in select value from jsonb_array_elements(requested_items) as item(value) loop
      product_id := (item_record->>'id')::uuid;
      quantity := coalesce((item_record->>'qty')::integer, 1);
      if quantity < 1 or quantity > 100 then
        raise exception 'Invalid product quantity';
      end if;

      select id, name, price into product_record
      from public.products
      where id = product_id
        and tenant_id = target_tenant
        and status = 'active'
        and is_active = true
      for share;
      if not found then
        raise exception 'A product is unavailable';
      end if;

      order_items := order_items || jsonb_build_array(jsonb_build_object(
        'id', product_record.id,
        'product_id', product_record.id,
        'name', product_record.name,
        'price', product_record.price,
        'qty', quantity
      ));
      order_subtotal := order_subtotal + product_record.price * quantity;
    end loop;

    order_total := order_subtotal + delivery_fee + order_tax;

    select coalesce(p.commission_percent, 15) into commission_rate
    from public.subscriptions s
    left join public.plans p on p.id = s.plan_id
    where s.tenant_id = target_tenant
      and s.status in ('active', 'trial')
      and (s.end_date is null or s.end_date > now())
    order by s.end_date desc nulls last
    limit 1;
    commission_rate := coalesce(commission_rate, 15);

    insert into public.orders (
      tenant_id, customer_name, phone, city, address, items, subtotal,
      delivery_fee, tax, total,
      commission, tenant_earning, payment_method, payment_txn, status
    ) values (
      target_tenant, trim(customer_name), trim(customer_phone), trim(customer_city),
      trim(customer_address), order_items, order_subtotal,
      delivery_fee, order_tax, order_total,
      round(order_subtotal * commission_rate / 100, 2),
      order_subtotal - round(order_subtotal * commission_rate / 100, 2),
      'cash', 'cash-' || gen_random_uuid()::text, 'pending'
    ) returning id into order_id;

    orders_result := orders_result || jsonb_build_array(jsonb_build_object(
      'id', order_id,
      'subtotal', order_subtotal,
      'delivery_fee', delivery_fee,
      'tax', order_tax,
      'total', order_total,
      'store_name', tenant_record.store_name,
      'whatsapp_number', tenant_record.whatsapp_number
    ));
  end loop;

  return orders_result;
end;
$$;

revoke all on function public.place_marketplace_order(text, text, text, text, jsonb) from public;
grant execute on function public.place_marketplace_order(text, text, text, text, jsonb) to anon, authenticated;

create or replace function public.assign_order_delivery_agent(target_order uuid, target_agent uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  order_tenant uuid;
begin
  select tenant_id into order_tenant
  from public.orders
  where id = target_order
  for update;
  if not found then
    raise exception 'Order not found';
  end if;

  if not public.is_admin() and not public.owns_tenant(order_tenant) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  if target_agent is not null and not exists (
    select 1
    from public.delivery_agents
    where id = target_agent
      and store_id = order_tenant
      and is_active = true
  ) then
    raise exception 'Delivery agent must be active and belong to the order store';
  end if;

  update public.orders
  set delivery_agent_id = target_agent
  where id = target_order;
end;
$$;

revoke all on function public.assign_order_delivery_agent(uuid, uuid) from public;
grant execute on function public.assign_order_delivery_agent(uuid, uuid) to authenticated;

create or replace function public.auto_assign_order_delivery_agent(target_order uuid, target_agent uuid)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  order_tenant uuid;
  assigned_agent uuid;
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  select tenant_id, delivery_agent_id
  into order_tenant, assigned_agent
  from public.orders
  where id = target_order
  for update;

  if not found then
    raise exception 'Order not found';
  end if;

  if assigned_agent is not null then
    return assigned_agent;
  end if;

  if target_agent is null or not exists (
    select 1
    from public.delivery_agents
    where id = target_agent
      and store_id = order_tenant
      and is_active = true
  ) then
    raise exception 'Delivery agent must be active and belong to the order store';
  end if;

  update public.orders
  set delivery_agent_id = target_agent
  where id = target_order;

  return target_agent;
end;
$$;

revoke all on function public.auto_assign_order_delivery_agent(uuid, uuid) from public;
grant execute on function public.auto_assign_order_delivery_agent(uuid, uuid) to service_role;

create or replace function public.update_order_status(target_order uuid, new_status text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  order_tenant uuid;
  current_status text;
begin
  if new_status not in ('accepted', 'shipped', 'delivered', 'cancelled') then
    raise exception 'Invalid order status';
  end if;

  select tenant_id, status into order_tenant, current_status
  from public.orders where id = target_order;
  if not found then
    raise exception 'Order not found';
  end if;
  if not public.is_admin() and not public.owns_tenant(order_tenant) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  if current_status in ('delivered', 'cancelled') then
    raise exception 'Order is already closed';
  end if;

  update public.orders set status = new_status where id = target_order;
end;
$$;

revoke all on function public.update_order_status(uuid, text) from public;
grant execute on function public.update_order_status(uuid, text) to authenticated;

create or replace function public.review_vendor_payment(target_payment uuid, approve_payment boolean)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  payment_record public.payment_transactions%rowtype;
  plan_price numeric;
  current_end timestamptz;
  next_end timestamptz;
begin
  if not public.is_admin() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  select * into payment_record
  from public.payment_transactions
  where id = target_payment
  for update;
  if not found or payment_record.status <> 'pending' then
    raise exception 'Pending payment not found';
  end if;

  if not approve_payment then
    update public.payment_transactions set status = 'rejected' where id = target_payment;
    return;
  end if;

  select price into plan_price
  from public.plans
  where id = payment_record.requested_plan_id and is_active = true;
  if not found or payment_record.amount < plan_price then
    raise exception 'Payment amount does not cover the requested plan';
  end if;

  select end_date into current_end
  from public.subscriptions
  where tenant_id = payment_record.tenant_id
  for update;
  next_end := greatest(coalesce(current_end, now()), now()) + interval '30 days';

  insert into public.subscriptions (tenant_id, plan_id, status, start_date, end_date, amount)
  values (payment_record.tenant_id, payment_record.requested_plan_id, 'active', now(), next_end, payment_record.amount)
  on conflict (tenant_id) do update set
    plan_id = excluded.plan_id,
    status = 'active',
    start_date = now(),
    end_date = excluded.end_date,
    amount = excluded.amount;

  update public.tenants
  set plan = payment_record.requested_plan_id, status = 'active', updated_at = now()
  where id = payment_record.tenant_id;

  update public.profiles
  set vendor_status = 'approved', is_vendor_approved = true, role = 'vendor'
  where id = (
    select owner_id from public.tenants where id = payment_record.tenant_id
  );

  update public.payment_transactions set status = 'approved' where id = target_payment;
end;
$$;

revoke all on function public.review_vendor_payment(uuid, boolean) from public;
grant execute on function public.review_vendor_payment(uuid, boolean) to authenticated;

create or replace function public.activate_free_subscription()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
  tenant_record public.tenants%rowtype;
  current_end timestamptz;
  next_end timestamptz;
begin
  if current_user_id is null then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  select * into tenant_record
  from public.tenants
  where owner_id = current_user_id
  for update;
  if not found then
    raise exception 'Create your store before activating a subscription';
  end if;

  if not exists (
    select 1 from public.plans
    where id = 'basic' and is_active = true and price = 0
  ) then
    raise exception 'The free plan is unavailable';
  end if;

  select end_date into current_end
  from public.subscriptions
  where tenant_id = tenant_record.id
  for update;

  if tenant_record.status = 'pending' then
    next_end := greatest(coalesce(current_end, now()), now() + interval '30 days');
  else
    next_end := greatest(coalesce(current_end, now()), now()) + interval '30 days';
  end if;

  insert into public.subscriptions (tenant_id, plan_id, status, start_date, end_date, amount)
  values (tenant_record.id, 'basic', 'active', now(), next_end, 0)
  on conflict (tenant_id) do update set
    plan_id = excluded.plan_id,
    status = 'active',
    start_date = now(),
    end_date = excluded.end_date,
    grace_until = null,
    amount = 0;

  update public.tenants
  set plan = 'basic', status = 'active', updated_at = now()
  where id = tenant_record.id;

  update public.profiles
  set requested_plan_id = 'basic',
      vendor_status = 'approved',
      is_vendor_approved = true,
      role = 'vendor'
  where id = current_user_id;
end;
$$;

revoke all on function public.activate_free_subscription() from public;
grant execute on function public.activate_free_subscription() to authenticated;

create or replace function public.update_vendor_status(target_vendor uuid, new_status text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  if new_status not in ('approved', 'rejected', 'blocked') then
    raise exception 'Invalid vendor status';
  end if;

  update public.profiles
  set vendor_status = new_status,
      is_vendor_approved = (new_status = 'approved'),
      role = 'vendor'
  where id = target_vendor and role = 'vendor';
  if not found then
    raise exception 'Vendor profile not found';
  end if;

  update public.tenants
  set status = case when new_status = 'approved' then 'active' else 'blocked' end,
      updated_at = now()
  where owner_id = target_vendor;
end;
$$;

revoke all on function public.update_vendor_status(uuid, text) from public;
grant execute on function public.update_vendor_status(uuid, text) to authenticated;

create or replace function public.refresh_vendor_subscription_status(target_tenant uuid)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  tenant_owner uuid;
  subscription_record public.subscriptions%rowtype;
  resulting_status text;
begin
  select owner_id into tenant_owner
  from public.tenants
  where id = target_tenant;
  if not found then
    raise exception 'Store not found';
  end if;

  if auth.uid() is distinct from tenant_owner and not public.is_admin() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  select * into subscription_record
  from public.subscriptions
  where tenant_id = target_tenant
  for update;

  if found and subscription_record.end_date is not null then
    if subscription_record.end_date <= now()
       and subscription_record.status in ('trial', 'active') then
      update public.subscriptions
      set status = 'expired',
          grace_until = coalesce(grace_until, subscription_record.end_date + interval '3 days')
      where id = subscription_record.id;
      update public.profiles
      set vendor_status = 'expired'
      where id = tenant_owner;
      subscription_record.status := 'expired';
      subscription_record.grace_until := coalesce(
        subscription_record.grace_until,
        subscription_record.end_date + interval '3 days'
      );
    end if;

    if subscription_record.status = 'expired'
       and coalesce(subscription_record.grace_until, subscription_record.end_date + interval '3 days') <= now() then
      update public.subscriptions
      set status = 'blocked'
      where id = subscription_record.id;
      update public.profiles
      set vendor_status = 'blocked'
      where id = tenant_owner;
      update public.tenants
      set status = 'blocked', updated_at = now()
      where id = target_tenant;
    end if;
  end if;

  select vendor_status into resulting_status
  from public.profiles
  where id = tenant_owner;
  return coalesce(resulting_status, 'pending');
end;
$$;

revoke all on function public.refresh_vendor_subscription_status(uuid) from public;
grant execute on function public.refresh_vendor_subscription_status(uuid) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('payment_proofs', 'payment_proofs', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists payment_proofs_owner_read on storage.objects;
create policy payment_proofs_owner_read on storage.objects for select to authenticated
using (bucket_id = 'payment_proofs' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
drop policy if exists payment_proofs_owner_insert on storage.objects;
create policy payment_proofs_owner_insert on storage.objects for insert to authenticated
with check (bucket_id = 'payment_proofs' and (storage.foldername(name))[1] = auth.uid()::text);

do $$
begin
  if to_regclass('public.admins') is not null then
    execute 'alter table public.admins enable row level security';
    execute 'revoke all on table public.admins from anon, authenticated';
  end if;
end;
$$;