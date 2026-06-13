-- ============================================================
-- Campaign Tracker by GIE — Shared TEAM workspace + roles
-- Run this ONCE in Supabase → SQL Editor → New query → Run.
-- (Run AFTER supabase-schema.sql, or on its own — they're independent.)
--
-- Model (pragmatic):
--   * team_state  : ONE shared row ('main') holding the whole app state JSON.
--                   Everyone on the team reads/writes the SAME workspace.
--   * team_members: the access allow-list + role per email.
--                   Only the ADMIN email can add/remove members or change roles.
--                   Anyone NOT in this list cannot read/write team_state (RLS).
--
-- The "members can't create a workspace" rule is enforced in the app UI
-- (a member can't gain admin without the admin's password). True per-row
-- DB enforcement would need a relational redesign (workspaces as rows).
-- ============================================================

-- ---- IMPORTANT: set your admin email here (must match the app's ADMIN_EMAIL) ----
-- portfoliog1eee@gmail.com

-- ============ team_members (allow-list + roles) ============
create table if not exists public.team_members (
  email     text primary key,
  name      text,
  role      text not null default 'Member',   -- Owner | Admin | Member | Viewer
  added_at  timestamptz not null default now()
);

alter table public.team_members enable row level security;

drop policy if exists "tm read"        on public.team_members;
drop policy if exists "tm admin write" on public.team_members;

-- any signed-in user may read the member list (needed to render the team)
create policy "tm read"
  on public.team_members for select
  using (auth.role() = 'authenticated');

-- only the admin email may add / update / delete members
create policy "tm admin write"
  on public.team_members for all
  using      ((auth.jwt() ->> 'email') = 'portfoliog1eee@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'portfoliog1eee@gmail.com');

-- seed the admin/owner so they can access immediately
insert into public.team_members (email, name, role)
values ('portfoliog1eee@gmail.com', 'Gie', 'Owner')
on conflict (email) do update set role = 'Owner';

-- ============ team_state (single shared workspace blob) ============
create table if not exists public.team_state (
  id         text primary key default 'main',
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.team_state enable row level security;

drop policy if exists "ts member read"  on public.team_state;
drop policy if exists "ts member write" on public.team_state;

-- a user may READ the shared workspace only if their email is on the team
create policy "ts member read"
  on public.team_state for select
  using (exists (
    select 1 from public.team_members m
    where m.email = (auth.jwt() ->> 'email')
  ));

-- a team member may WRITE the shared workspace (collaboration).
-- (workspace-creation restriction is enforced in the app UI, not here)
create policy "ts member write"
  on public.team_state for all
  using      (exists (select 1 from public.team_members m where m.email = (auth.jwt() ->> 'email')))
  with check (exists (select 1 from public.team_members m where m.email = (auth.jwt() ->> 'email')));

-- ------------------------------------------------------------
-- SETUP NOTES
-- 1. Authentication → Providers → Email: turn OFF "Confirm email"
--    so invited members can sign up + sign in instantly (demo-friendly).
-- 2. Invited members: just need to "Create account" in the app with the
--    SAME email you invited. They then load the shared team workspace.
-- 3. To change the admin email, replace portfoliog1eee@gmail.com in BOTH
--    policies above AND ADMIN_EMAIL in app.js.
-- ------------------------------------------------------------
