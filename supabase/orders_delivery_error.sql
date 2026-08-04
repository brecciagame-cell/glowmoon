-- Flaga koncowego bledu dostawy: 1 = wszystkie pozycje nie doszly po maksymalnej liczbie prob
-- (MAX_ATTEMPTS = 5). Frontend pokazuje wtedy "Wystapil problem z dostawa" zamiast wiecznego "Dostarczamy...".
alter table public.orders
  add column if not exists delivery_error boolean not null default false;
