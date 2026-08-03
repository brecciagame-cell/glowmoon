-- ============================================================================
-- GlowMoon - tabela zamówień dla Supabase
-- Uruchom ten skrypt w Supabase Dashboard -> SQL Editor -> New query -> Run
-- ============================================================================

create table if not exists public.orders (
  id bigint generated always as identity primary key,
  order_id text not null unique,
  cashbill_payment_id text,
  status text not null default 'pending',
  nickname text not null,
  email text,
  items jsonb not null default '[]'::jsonb,
  amount numeric not null,
  currency text not null default 'PLN',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Bezpieczenstwo: blokujemy dostep kluczem anonimowym.
-- Backend uzywa klucza service_role, ktory omija RLS - wiec nic sie nie psuje,
-- a nikt niepowolany nie dostanie sie do danych z poziomu frontendu.
alter table public.orders enable row level security;
