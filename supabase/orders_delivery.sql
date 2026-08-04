-- ============================================================================
-- GlowMoon - dostawa przez RCON (kolumny dla tabeli orders)
-- Uruchom ten skrypt W Supabase Dashboard -> SQL Editor -> New query -> Run
-- (dopiero PO uruchomieniu orders.sql - dodaje nowe kolumny)
-- ============================================================================

alter table public.orders
  add column if not exists delivered boolean not null default false;

alter table public.orders
  add column if not exists delivered_at timestamptz;

alter table public.orders
  add column if not exists delivery_log jsonb not null default '[]'::jsonb;
