-- ============================================================
-- Lokaal Leads - runtime schema (Supabase / Postgres)
-- Config per klant leeft in de repo (/config/clients). Supabase bevat
-- alleen RUNTIME-data, geattribueerd per client_slug.
-- Draai dit in de Supabase SQL Editor (of via de CLI).
-- ============================================================

create extension if not exists pgcrypto;

-- ---------- events: elk inkomend signaal wordt eerst een event ----------
create table if not exists public.events (
  id          uuid primary key default gen_random_uuid(),
  client_slug text not null,
  type        text not null,            -- 'lead' (nu); later 'missed_call','inbound_message','review'
  source      text not null,            -- 'form' | 'chat' (nu)
  dedup_key   text not null,
  payload     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  unique (client_slug, dedup_key)       -- idempotentie
);
create index if not exists events_client_created_idx
  on public.events (client_slug, created_at desc);

-- ---------- leads: afgeleid uit lead-events ----------
create table if not exists public.leads (
  id          uuid primary key default gen_random_uuid(),
  client_slug text not null,
  event_id    uuid references public.events(id) on delete cascade,
  source      text not null,            -- 'form' | 'chat'
  name        text,
  phone       text,
  message     text,
  created_at  timestamptz not null default now()
);
create index if not exists leads_client_created_idx
  on public.leads (client_slug, created_at desc);

-- ---------- review_requests ----------
create table if not exists public.review_requests (
  id          uuid primary key default gen_random_uuid(),
  client_slug text not null,
  phone       text,
  channel     text,
  status      text,
  sent_at     timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists review_requests_client_created_idx
  on public.review_requests (client_slug, created_at desc);

-- ---------- deliveries: log van elke meldingspoging ----------
create table if not exists public.deliveries (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid references public.events(id) on delete cascade,
  channel    text not null,
  target     text,
  status     text not null,             -- 'sent' | 'failed'
  error      text,
  attempts   int not null default 1,
  created_at timestamptz not null default now()
);
create index if not exists deliveries_event_idx on public.deliveries (event_id);

-- ============================================================
-- Row Level Security
-- Serverroutes gebruiken de SERVICE ROLE, die RLS volledig omzeilt.
-- RLS aanzetten sluit de publieke anon-key volledig buiten (veilige default).
-- De policies hieronder zijn gekeyd op client_slug voor toekomstige, per-klant
-- ingelogde toegang (bv. een klant-dashboard met een client-scoped JWT). Ze zijn
-- dormant zolang je nog geen client-scoped tokens uitgeeft.
-- ============================================================
alter table public.events          enable row level security;
alter table public.leads           enable row level security;
alter table public.review_requests enable row level security;
alter table public.deliveries      enable row level security;

create policy "client reads own events" on public.events
  for select to authenticated
  using (client_slug = (auth.jwt() ->> 'client_slug'));

create policy "client reads own leads" on public.leads
  for select to authenticated
  using (client_slug = (auth.jwt() ->> 'client_slug'));

create policy "client reads own review_requests" on public.review_requests
  for select to authenticated
  using (client_slug = (auth.jwt() ->> 'client_slug'));

-- deliveries heeft geen client_slug-kolom; koppel via het bijbehorende event.
create policy "client reads own deliveries" on public.deliveries
  for select to authenticated
  using (
    exists (
      select 1 from public.events e
      where e.id = deliveries.event_id
        and e.client_slug = (auth.jwt() ->> 'client_slug')
    )
  );
