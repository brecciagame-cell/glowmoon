-- Kolejka dostaw dla pluginu GlowMoonDelivery (tryb "pull").
-- Po opłaceniu zamówienia backend odkłada komendy (np. `case give <nick> <klucz> <ilość>`)
-- do tej tabeli, a plugin na serwerze Minecraft pobiera je przez GET /api/delivery/poll
-- i potwierdza wykonanie przez POST /api/delivery/ack.
-- Działa to nawet wtedy, gdy hosting Minecraft blokuje port RCON z internetu.

create table if not exists public.delivery_queue (
  id uuid primary key default gen_random_uuid(),
  order_id text not null,
  command text not null,
  item_name text,
  status text not null default 'pending'
    check (status in ('pending', 'in_progress', 'done', 'failed')),
  attempts integer not null default 0,
  ack_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Jedna kolejka na (zamówienie + komenda) -> enqueue jest idempotentne
create unique index if not exists delivery_queue_order_command_uidx
  on public.delivery_queue (order_id, command);

create index if not exists delivery_queue_status_idx
  on public.delivery_queue (status);

create index if not exists delivery_queue_order_idx
  on public.delivery_queue (order_id);
