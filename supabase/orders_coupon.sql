-- ============================================================================
-- GlowMoon - kupon rabatowy przypisany do zamowienia
-- Uruchom ten skrypt W Supabase Dashboard -> SQL Editor -> New query -> Run
-- (dopiero PO uruchomieniu orders.sql - dodaje nowa kolumne)
-- ============================================================================

alter table public.orders
  add column if not exists coupon_code text;
