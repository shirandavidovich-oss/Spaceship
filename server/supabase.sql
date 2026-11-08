-- Spaceship: the players' profiles on Supabase.
-- Run once in the Supabase project: SQL Editor -> New query -> paste all of this -> Run.
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

create policy "read own profile" on public.profiles
  for select using (lower(auth.jwt() ->> 'email') = email);
create policy "add own profile" on public.profiles
  for insert with check (lower(auth.jwt() ->> 'email') = email);
create policy "change own profile" on public.profiles
  for update using (lower(auth.jwt() ->> 'email') = email);
