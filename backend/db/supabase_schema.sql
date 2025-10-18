-- Supabase PostgreSQL schema for ExaltArt
-- Run in Supabase SQL editor

-- Extensions (Supabase usually has these enabled)
create extension if not exists pgcrypto;

-- Users table
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text not null,
  password text,
  role text not null default 'MEMBER' check (role in ('ADMIN','MEMBER')),
  birth_date date,
  photo_url text,
  phone text,
  ministry_entry_date timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_users_role on public.users(role);

-- Events table
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  location text,
  start_time timestamptz not null,
  end_time timestamptz not null,
  author_id uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_events_start_time on public.events(start_time);
create index if not exists idx_events_author on public.events(author_id);

-- Financial Transactions table
create table if not exists public.financial_transactions (
  id uuid primary key default gen_random_uuid(),
  description text not null,
  amount numeric(12,2) not null,
  type text not null check (type in ('INCOME','EXPENSE')),
  category text,
  date date not null,
  proof_url text,
  author_id uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_tx_type on public.financial_transactions(type);
create index if not exists idx_tx_date on public.financial_transactions(date);
create index if not exists idx_tx_author on public.financial_transactions(author_id);

-- Devotional Posts table
create table if not exists public.devotional_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  frequency text not null check (frequency in ('WEEKLY','MONTHLY')),
  published_at timestamptz default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Observations table
create table if not exists public.observations (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  category text,
  published_at timestamptz default now(),
  author_id uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_observations_published_at on public.observations(published_at);
create index if not exists idx_observations_author on public.observations(author_id);
create index if not exists idx_observations_category on public.observations(category);

-- Trigger function to auto-update updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Attach triggers
do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'users_set_updated_at') then
    create trigger users_set_updated_at before update on public.users
      for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'events_set_updated_at') then
    create trigger events_set_updated_at before update on public.events
      for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'tx_set_updated_at') then
    create trigger tx_set_updated_at before update on public.financial_transactions
      for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'devotional_set_updated_at') then
    create trigger devotional_set_updated_at before update on public.devotional_posts
      for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'observations_set_updated_at') then
    create trigger observations_set_updated_at before update on public.observations
      for each row execute function public.set_updated_at();
  end if;
end $$;

-- Storage bucket (create in Supabase Storage UI): 'proofs'
-- Set bucket to public for simple public URLs, or manage signed URLs as needed.

-- Rehearsals table
create table if not exists public.rehearsals (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  date timestamptz not null,
  location text,
  notes text,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_rehearsals_date on public.rehearsals(date);
create index if not exists idx_rehearsals_author on public.rehearsals(created_by);

-- Attendance Records table
create table if not exists public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  rehearsal_id uuid not null references public.rehearsals(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  status text not null check (status in ('PRESENT','ABSENT','LATE')),
  note text,
  marked_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (rehearsal_id, user_id)
);

create index if not exists idx_attendance_rehearsal on public.attendance_records(rehearsal_id);
create index if not exists idx_attendance_user on public.attendance_records(user_id);

-- Attach triggers for updated_at on new tables
do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'rehearsals_set_updated_at') then
    create trigger rehearsals_set_updated_at before update on public.rehearsals
      for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'attendance_set_updated_at') then
    create trigger attendance_set_updated_at before update on public.attendance_records
      for each row execute function public.set_updated_at();
  end if;
end $$;