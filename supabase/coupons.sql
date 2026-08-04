-- ============================================================================
-- GlowMoon - tabela kuponow rabatowych (Supabase)
-- Uruchom ten skrypt w Supabase Dashboard -> SQL Editor -> New query -> Run
-- ============================================================================

create table if not exists public.coupons (
  id bigint generated always as identity primary key,
  code text not null unique,
  discount integer not null check (discount > 0 and discount <= 100),
  max_uses integer,          -- NULL = bez limitu uzyc
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Bezpieczenstwo: dostep tylko przez backend (service_role), nie z frontendu.
alter table public.coupons enable row level security;

-- Przykładowe kupony startowe (mozesz je edytowac/usunac w panelu admina).
-- 'TEST' zastepuje stary hardcoded kod 'test' (10%).
insert into public.coupons (code, discount, max_uses, active)
values
  ('TEST', 10, null, true),
  ('WELCOME10', 10, 100, true),
  ('SVIP20', 20, 50, true)
on conflict (code) do nothing;
