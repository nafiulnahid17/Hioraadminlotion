-- HIORA STUDIO • Supabase database schema
-- Run once in the Supabase SQL Editor. Do not put service-role keys in frontend code.
-- Stores orders, customers and interactions for the SEPARATE admin app.
create extension if not exists pgcrypto;

create table if not exists public.hiora_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text not null default 'Team member',
  role text not null default 'agent' check (role in ('admin','agent')),
  created_at timestamptz not null default now()
);

create table if not exists public.hiora_customers (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 120),
  phone text not null check (length(trim(phone)) between 5 and 30),
  email text,
  city text not null default '',
  address text not null default '',
  source text not null default 'Website',
  contact_status text not null default 'New' check (contact_status in ('New','Contacted','No answer','Follow-up','Converted')),
  next_followup_at timestamptz,
  last_contacted_at timestamptz,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hiora_orders (
  id uuid primary key default gen_random_uuid(),
  order_code text not null unique,
  customer_id uuid not null references public.hiora_customers(id) on delete restrict,
  product_name text not null default 'APLB Glutathione Niacinamide Body Lotion 300ml',
  quantity integer not null default 1 check (quantity between 1 and 999),
  unit_price numeric(12,2) not null default 1580 check (unit_price >= 0),
  delivery_charge numeric(12,2) not null default 80 check (delivery_charge >= 0),
  total numeric(12,2) generated always as (quantity * unit_price + delivery_charge) stored,
  payment_method text not null default 'Cash on Delivery' check (payment_method in ('Cash on Delivery','bKash','Nagad')),
  payment_status text not null default 'Unpaid' check (payment_status in ('Unpaid','Pending','Paid','Refunded')),
  status text not null default 'New' check (status in ('New','Confirmed','Packed','Shipped','Delivered','Cancelled')),
  courier text not null default '',
  tracking_number text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hiora_interactions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.hiora_customers(id) on delete cascade,
  order_id uuid references public.hiora_orders(id) on delete set null,
  type text not null default 'Call' check (type in ('Call','WhatsApp','Message','Note')),
  outcome text not null default 'Contacted' check (outcome in ('Contacted','No answer','Follow-up','Converted')),
  notes text not null default '',
  next_followup_at timestamptz,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);

create index if not exists idx_hiora_orders_created on public.hiora_orders(created_at desc);
create index if not exists idx_hiora_orders_status on public.hiora_orders(status);
create index if not exists idx_hiora_orders_customer on public.hiora_orders(customer_id);
create index if not exists idx_hiora_customers_followup on public.hiora_customers(next_followup_at);
create index if not exists idx_hiora_interactions_customer on public.hiora_interactions(customer_id, created_at desc);

create or replace function public.hiora_touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists hiora_customer_touch on public.hiora_customers;
create trigger hiora_customer_touch before update on public.hiora_customers
for each row execute function public.hiora_touch_updated_at();
drop trigger if exists hiora_order_touch on public.hiora_orders;
create trigger hiora_order_touch before update on public.hiora_orders
for each row execute function public.hiora_touch_updated_at();

-- Staff check is SECURITY DEFINER to avoid RLS recursion in membership checks.
create or replace function public.hiora_is_staff() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.hiora_admins where user_id = (select auth.uid()));
$$;
revoke all on function public.hiora_is_staff() from public;
grant execute on function public.hiora_is_staff() to authenticated;

alter table public.hiora_admins enable row level security;
alter table public.hiora_customers enable row level security;
alter table public.hiora_orders enable row level security;
alter table public.hiora_interactions enable row level security;

-- Default deny for anon and for authenticated users without a staff record.
drop policy if exists "Hiora staff can view own role" on public.hiora_admins;
create policy "Hiora staff can view own role" on public.hiora_admins
for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists "Hiora staff manage customers" on public.hiora_customers;
create policy "Hiora staff manage customers" on public.hiora_customers
for all to authenticated using ((select public.hiora_is_staff())) with check ((select public.hiora_is_staff()));

drop policy if exists "Hiora staff manage orders" on public.hiora_orders;
create policy "Hiora staff manage orders" on public.hiora_orders
for all to authenticated using ((select public.hiora_is_staff())) with check ((select public.hiora_is_staff()));

drop policy if exists "Hiora staff manage interactions" on public.hiora_interactions;
create policy "Hiora staff manage interactions" on public.hiora_interactions
for all to authenticated using ((select public.hiora_is_staff())) with check ((select public.hiora_is_staff()));

-- After creating a real user in Supabase Auth > Users, execute the following
-- in SQL Editor, replacing the UUID with that user's Auth UUID:
-- insert into public.hiora_admins (user_id, name, role)
-- values ('YOUR-AUTH-USER-UUID', 'Hiora Admin', 'admin');

-- IMPORTANT: The public checkout page should NOT insert as an authenticated admin.
-- Expose a separate Cloudflare Worker / Supabase Edge Function with server-side
-- validation, spam controls and restrictive credentials for public order intake.
-- Never make the admin data tables anonymous-readable or anonymous-writable.
