-- Spaceship: the players' profiles on Supabase.
-- Run in the Supabase project: SQL Editor -> New query -> paste all of this -> Run. (Safe to run again.)
-- Each player signs in with their email (a code sent by Supabase); a player can read and change only their own row.

create table if not exists public.profiles (
  email      text primary key,                 -- the player's email (lower case)
  fleet      text[] not null,                  -- their 3 ships (ship ids)
  active     text,                             -- the one they fly
  kills      integer not null default 0,       -- ships they have shot down
  money      integer not null default 0,       -- coins won by beating other players
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "read own profile" on public.profiles;
drop policy if exists "add own profile" on public.profiles;
drop policy if exists "change own profile" on public.profiles;
create policy "read own profile" on public.profiles
  for select using (lower(auth.jwt() ->> 'email') = email);
create policy "add own profile" on public.profiles
  for insert with check (lower(auth.jwt() ->> 'email') = email);
create policy "change own profile" on public.profiles
  for update using (lower(auth.jwt() ->> 'email') = email);

-- ---------------------------------------------------------------------------------------------
-- The players' money and purchases (added later: run this part too, once; running it again is harmless).
-- One row per signed-in player: the game's whole "bank" as JSON — coins for each ship, minerals and metals, the shields
-- and extra weapon bought for each ship, ships bought for good and rented. Only its owner can read or change it.
create table if not exists public.banks (
  email      text primary key,                  -- the player's email (lower case)
  bank       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.banks enable row level security;

drop policy if exists "read own bank" on public.banks;
drop policy if exists "add own bank" on public.banks;
drop policy if exists "change own bank" on public.banks;
create policy "read own bank" on public.banks
  for select using (lower(auth.jwt() ->> 'email') = email);
create policy "add own bank" on public.banks
  for insert with check (lower(auth.jwt() ->> 'email') = email);
create policy "change own bank" on public.banks
  for update using (lower(auth.jwt() ->> 'email') = email);
