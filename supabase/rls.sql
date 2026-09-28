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
  txn_number text not null unique,
  amount numeric not null default 0,
  screenshot_url text,
  status text not null default 'pending',
  auto_verified boolean not null default false,
  created_at timestamptz not null default now()
);

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
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, case when new.raw_user_meta_data->>'role' = 'vendor' then 'vendor' else 'customer' end)
  on conflict (id) do update set email = excluded.email;

  if new.raw_user_meta_data->>'role' = 'vendor'
     and nullif(new.raw_user_meta_data->>'slug', '') is not null then
    insert into public.tenants (owner_id, owner_name, store_name, slug, whatsapp_number)
    values (
      new.id,
      coalesce(new.raw_user_meta_data->>'store_name', 'متجر جديد'),
      coalesce(new.raw_user_meta_data->>'store_name', 'متجر جديد'),
      lower(new.raw_user_meta_data->>'slug'),
      new.raw_user_meta_data->>'whatsapp'
    )
    on conflict (owner_id) do nothing;
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
create policy profiles_self_access on public.profiles for all to authenticated
using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());

drop policy if exists tenants_public_read on public.tenants;
create policy tenants_public_read on public.tenants for select to anon, authenticated
using (status = 'active' or owner_id = auth.uid() or public.is_admin());
drop policy if exists tenants_owner_insert on public.tenants;
create policy tenants_owner_insert on public.tenants for insert to authenticated
with check (owner_id = auth.uid() or public.is_admin());
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

drop policy if exists orders_public_insert on public.orders;
create policy orders_public_insert on public.orders for insert to anon, authenticated
with check (tenant_id is not null);
drop policy if exists orders_tenant_read on public.orders;
create policy orders_tenant_read on public.orders for select to authenticated
using (public.owns_tenant(tenant_id) or public.is_admin());
drop policy if exists orders_tenant_update on public.orders;
create policy orders_tenant_update on public.orders for update to authenticated
using (public.owns_tenant(tenant_id) or public.is_admin()) with check (public.owns_tenant(tenant_id) or public.is_admin());

drop policy if exists subscriptions_tenant_access on public.subscriptions;
create policy subscriptions_tenant_access on public.subscriptions for all to authenticated
using (public.owns_tenant(tenant_id) or public.is_admin())
with check (public.owns_tenant(tenant_id) or public.is_admin());

drop policy if exists payment_transactions_tenant_access on public.payment_transactions;
create policy payment_transactions_tenant_access on public.payment_transactions for all to authenticated
using (public.owns_tenant(tenant_id) or public.is_admin())
with check (public.owns_tenant(tenant_id) or public.is_admin());

drop policy if exists renew_requests_tenant_access on public.renew_requests;
create policy renew_requests_tenant_access on public.renew_requests for all to authenticated
using (public.owns_tenant(tenant_id) or public.is_admin())
with check (public.owns_tenant(tenant_id) or public.is_admin());
