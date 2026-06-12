-- ============================================================
-- Campaign Tracker by GIE — Supabase schema
-- Run this ONCE in Supabase → SQL Editor → New query → Run.
-- Stores each user's whole app state as a single JSON row,
-- protected by Row Level Security (a user can only touch their own row).
-- ============================================================

create table if not exists public.app_state (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.app_state enable row level security;

-- Drop old policies if re-running, then recreate.
drop policy if exists "app_state select own" on public.app_state;
drop policy if exists "app_state insert own" on public.app_state;
drop policy if exists "app_state update own" on public.app_state;
drop policy if exists "app_state delete own" on public.app_state;

create policy "app_state select own"
  on public.app_state for select
  using (auth.uid() = user_id);

create policy "app_state insert own"
  on public.app_state for insert
  with check (auth.uid() = user_id);

create policy "app_state update own"
  on public.app_state for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "app_state delete own"
  on public.app_state for delete
  using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- OPTIONAL (recommended for a smoother demo):
-- In Authentication → Providers → Email, turn OFF "Confirm email"
-- so accounts work instantly without an email round-trip.
-- ------------------------------------------------------------
