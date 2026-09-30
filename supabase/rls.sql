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
  ('pro', 'باقة التاجر', 15000, 100, 100, 10),
  ('vip', 'باقة VIP', 35000, 999999, 999999, 5)
on conflict (id) do update set
  name = excluded.name,
  price = excluded.price,
  max_products = excluded.max_products,
  max_images = excluded.max_images,
  commission_percent = excluded.commission_percent;

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users(id) on delete cascade,
  owner_name text,
  store_name text not null,
  slug text not null unique,
  description text,
  city text,
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
alter table public.tenants add column if not exists status text default 'active';
alter table public.tenants add column if not exists whatsapp_number text;
alter table public.tenants add column if not exists logo_url text;
alter table public.tenants add column if not exists banner_url text;
alter table public.tenants add column if not exists theme_color text default '#E91E63';
alter table public.tenants add column if not exists updated_at timestamptz default now();

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
  total numeric not null default 0,
  commission numeric not null default 0,
  tenant_earning numeric not null default 0,
  payment_method text default 'cash',
  payment_txn text,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

alter table public.orders add column if not exists tenant_id uuid references public.tenants(id) on delete restrict;
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
create index if not exists subscriptions_tenant_idx on public.subscriptions(tenant_id);
create unique index if not exists subscriptions_tenant_unique on public.subscriptions(tenant_id) where tenant_id is not null;

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
declare
  selected_plan_id text;
  selected_plan_price numeric;
  created_tenant_id uuid;
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, case when new.raw_user_meta_data->>'role' = 'vendor' then 'vendor' else 'customer' end)
  on conflict (id) do update set email = excluded.email;

  if new.raw_user_meta_data->>'role' = 'vendor'
     and nullif(new.raw_user_meta_data->>'slug', '') is not null then
    selected_plan_id := coalesce(nullif(trim(new.raw_user_meta_data->>'plan_id'), ''), 'basic');
    select price into selected_plan_price
    from public.plans
    where id = selected_plan_id and is_active = true;

    if not found then
      selected_plan_id := 'basic';
      select price into selected_plan_price
      from public.plans
      where id = selected_plan_id and is_active = true;
    end if;

    insert into public.tenants (owner_id, owner_name, store_name, slug, whatsapp_number, plan)
    values (
      new.id,
      coalesce(new.raw_user_meta_data->>'store_name', 'متجر جديد'),
      coalesce(new.raw_user_meta_data->>'store_name', 'متجر جديد'),
      lower(new.raw_user_meta_data->>'slug'),
      new.raw_user_meta_data->>'whatsapp',
      selected_plan_id
    )
    on conflict (owner_id) do nothing;

    select id into created_tenant_id
    from public.tenants
    where owner_id = new.id;

    insert into public.subscriptions (tenant_id, plan_id, status, start_date, end_date, amount)
    values (
      created_tenant_id,
      selected_plan_id,
      case when selected_plan_price > 0 then 'trial' else 'active' end,
      now(),
      case when selected_plan_price > 0 then now() + interval '3 days' else null end,
      coalesce(selected_plan_price, 0)
    )
    on conflict (tenant_id) do nothing;
  end if;
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

drop policy if exists tenants_public_read on public.tenants;
create policy tenants_public_read on public.tenants for select to anon, authenticated
using (status = 'active' or owner_id = auth.uid() or public.is_admin());
drop policy if exists tenants_owner_insert on public.tenants;
create policy tenants_owner_insert on public.tenants for insert to authenticated
with check (
  public.is_admin()
  or (
    owner_id = auth.uid()
    and plan = 'basic'
    and status = 'active'
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
using ((status = 'active' and is_active = true) or public.owns_tenant(tenant_id) or public.is_admin());
drop policy if exists products_tenant_insert on public.products;
create policy products_tenant_insert on public.products for insert to authenticated
with check (public.owns_tenant(tenant_id) or public.is_admin());
drop policy if exists products_tenant_update on public.products;
create policy products_tenant_update on public.products for update to authenticated
using (public.owns_tenant(tenant_id) or public.is_admin()) with check (public.owns_tenant(tenant_id) or public.is_admin());
drop policy if exists products_tenant_delete on public.products;
create policy products_tenant_delete on public.products for delete to authenticated
using (public.owns_tenant(tenant_id) or public.is_admin());

drop policy if exists orders_tenant_read on public.orders;
create policy orders_tenant_read on public.orders for select to authenticated
using (public.owns_tenant(tenant_id) or public.is_admin());
drop policy if exists orders_tenant_update on public.orders;
revoke insert, update on public.orders from anon, authenticated;

drop policy if exists subscriptions_tenant_access on public.subscriptions;
drop policy if exists subscriptions_owner_read on public.subscriptions;
create policy subscriptions_owner_read on public.subscriptions for select to authenticated
using (public.owns_tenant(tenant_id) or public.is_admin());
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
  owner_name, store_name, description, city, phone, whatsapp_number,
  bank_account, instagram, logo_url, banner_url, theme_color, updated_at
) on public.tenants to authenticated;

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
    order_total := 0;
    commission_rate := 15;

    select * into tenant_record
    from public.tenants
    where id = target_tenant and status = 'active';
    if not found then
      raise exception 'Store is unavailable';
    end if;

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
      order_total := order_total + product_record.price * quantity;
    end loop;

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
      tenant_id, customer_name, phone, city, address, items, total,
      commission, tenant_earning, payment_method, payment_txn, status
    ) values (
      target_tenant, trim(customer_name), trim(customer_phone), trim(customer_city),
      trim(customer_address), order_items, order_total,
      round(order_total * commission_rate / 100, 2),
      order_total - round(order_total * commission_rate / 100, 2),
      'cash', 'cash-' || gen_random_uuid()::text, 'pending'
    ) returning id into order_id;

    orders_result := orders_result || jsonb_build_array(jsonb_build_object(
      'id', order_id,
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

  update public.payment_transactions set status = 'approved' where id = target_payment;
end;
$$;

revoke all on function public.review_vendor_payment(uuid, boolean) from public;
grant execute on function public.review_vendor_payment(uuid, boolean) to authenticated;

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
