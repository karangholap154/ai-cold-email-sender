-- ==============================================================================
-- AI Cold Email Sender: Supabase Database Schema & Multi-User Setup
-- ==============================================================================

-- Enable UUID generation extension if not present
create extension if not exists "uuid-ossp";

-- 1. Create email_status enum
do $$ begin
  create type email_status as enum ('sent', 'failed', 'draft');
exception
  when duplicate_object then null;
end $$;

-- 2. Create profiles table (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  stripe_customer_id text,
  stripe_subscription_status text,
  current_period_end timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Trigger to automatically update updated_at timestamp on profiles
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.handle_updated_at();

-- Auto-create profile trigger on auth.users signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill any existing auth.users into profiles if running migration later
insert into public.profiles (id)
select id from auth.users
on conflict (id) do nothing;

-- 3. Create or migrate resume table
create table if not exists public.resume (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  file_url text not null,
  file_name text,
  skills_summary text default '',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add user_id column if resume table already existed without it
do $$ begin
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'resume' and column_name = 'user_id'
  ) then
    alter table public.resume add column user_id uuid references public.profiles(id) on delete cascade;
  end if;
end $$;

drop trigger if exists set_resume_updated_at on public.resume;
create trigger set_resume_updated_at
  before update on public.resume
  for each row
  execute function public.handle_updated_at();

-- Multi-resume support columns
do $$ begin
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'resume' and column_name = 'label'
  ) then
    alter table public.resume add column label text default 'Primary Résumé';
  end if;

  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'resume' and column_name = 'is_default'
  ) then
    alter table public.resume add column is_default boolean default true;
  end if;

  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'resume' and column_name = 'file_size'
  ) then
    alter table public.resume add column file_size integer;
  end if;
end $$;

-- Keep exactly one default resume per user, including existing migrated data.
with ranked_defaults as (
  select id,
         row_number() over (
           partition by user_id
           order by updated_at desc, created_at desc, id desc
         ) as row_number
  from public.resume
  where is_default = true
)
update public.resume
set is_default = false
where id in (
  select id from ranked_defaults where row_number > 1
);

create unique index if not exists idx_one_default_resume_per_user
  on public.resume(user_id)
  where is_default = true;

create or replace function public.enforce_resume_limit()
returns trigger as $$
declare
  user_plan text;
  resume_count integer;
begin
  select plan into user_plan
  from public.profiles
  where id = new.user_id;

  select count(*) into resume_count
  from public.resume
  where user_id = new.user_id;

  if user_plan = 'pro' and resume_count >= 3 then
    raise exception 'Pro accounts can have up to 3 resume versions';
  elsif coalesce(user_plan, 'free') <> 'pro' and resume_count >= 1 then
    raise exception 'Free accounts can have only 1 resume version';
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists enforce_resume_limit_before_insert on public.resume;
create trigger enforce_resume_limit_before_insert
  before insert on public.resume
  for each row
  execute function public.enforce_resume_limit();

-- Drop legacy unique index if present and create standard index on user_id
drop index if exists public.idx_resume_user_id;
create index if not exists idx_resume_user_id on public.resume(user_id);

-- 4. Create or migrate sent_emails table
create table if not exists public.sent_emails (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  jd_text text not null,
  hr_email text not null,
  company_name text,
  role_title text,
  generated_subject text not null,
  generated_body text not null,
  final_subject text not null,
  final_body text not null,
  status email_status default 'sent' not null,
  error_message text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add user_id column if sent_emails table already existed without it
do $$ begin
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'sent_emails' and column_name = 'user_id'
  ) then
    alter table public.sent_emails add column user_id uuid references public.profiles(id) on delete cascade;
  end if;

  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'sent_emails' and column_name = 'resume_id'
  ) then
    alter table public.sent_emails add column resume_id uuid references public.resume(id) on delete set null;
  end if;
end $$;

-- Indices for user queries, searching, and duplicate checking
create index if not exists idx_sent_emails_user_id on public.sent_emails(user_id);
create index if not exists idx_sent_emails_hr_email on public.sent_emails(user_id, hr_email);
create index if not exists idx_sent_emails_company_name on public.sent_emails(user_id, company_name);
create index if not exists idx_sent_emails_created_at on public.sent_emails(user_id, created_at desc);

-- 5. Create gmail_connections table
create table if not exists public.gmail_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  gmail_address text not null,
  refresh_token_encrypted text not null,
  iv text not null,
  tag text not null,
  connected_at timestamptz not null default now(),
  revoked_at timestamptz,
  constraint unique_active_user_connection unique (user_id)
);

create index if not exists idx_gmail_connections_user_id on public.gmail_connections(user_id);

-- 6. Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.resume enable row level security;
alter table public.sent_emails enable row level security;
alter table public.gmail_connections enable row level security;

-- Drop legacy open policies if they exist
drop policy if exists "Allow all access to resume" on public.resume;
drop policy if exists "Allow all access to sent_emails" on public.sent_emails;
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can view own resume" on public.resume;
drop policy if exists "Users can insert own resume" on public.resume;
drop policy if exists "Users can update own resume" on public.resume;
drop policy if exists "Users can delete own resume" on public.resume;
drop policy if exists "Users can view own sent emails" on public.sent_emails;
drop policy if exists "Users can insert own sent emails" on public.sent_emails;
drop policy if exists "Users can view their own gmail connection" on public.gmail_connections;
drop policy if exists "Users can insert their own gmail connection" on public.gmail_connections;
drop policy if exists "Users can update their own gmail connection" on public.gmail_connections;
drop policy if exists "Users can delete their own gmail connection" on public.gmail_connections;

-- Profiles policies
create policy "Users can view own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- Resume policies
create policy "Users can view own resume"
  on public.resume for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own resume"
  on public.resume for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own resume"
  on public.resume for update
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can delete own resume"
  on public.resume for delete
  to authenticated
  using (auth.uid() = user_id);

-- Sent emails policies
create policy "Users can view own sent emails"
  on public.sent_emails for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own sent emails"
  on public.sent_emails for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Gmail connections policies
create policy "Users can view their own gmail connection"
  on public.gmail_connections for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert their own gmail connection"
  on public.gmail_connections for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own gmail connection"
  on public.gmail_connections for update
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can delete their own gmail connection"
  on public.gmail_connections for delete
  to authenticated
  using (auth.uid() = user_id);

-- 7. Supabase Storage Bucket for resumes
insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', false)
on conflict (id) do nothing;

-- Drop legacy storage policy
drop policy if exists "Allow all operations on resumes bucket" on storage.objects;
drop policy if exists "Users can upload their own resume" on storage.objects;
drop policy if exists "Users can read their own resume" on storage.objects;
drop policy if exists "Users can update their own resume" on storage.objects;
drop policy if exists "Users can delete their own resume" on storage.objects;

-- Storage RLS: Users can only upload, read, update, or delete inside resumes/{user_id}/...
create policy "Users can upload their own resume"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'resumes' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can read their own resume"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'resumes' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update their own resume"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'resumes' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete their own resume"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'resumes' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- ==============================================================================
-- 8. Sender Signature Migration on public.profiles
-- ==============================================================================
alter table public.profiles
  add column if not exists full_name text,
  add column if not exists sign_off text default 'Best regards,',
  add column if not exists portfolio_url text,
  add column if not exists github_url text,
  add column if not exists linkedin_url text,
  add column if not exists phone text,
  add column if not exists custom_signature text,
  add column if not exists dodo_customer_id text,
  add column if not exists dodo_subscription_id text;

-- ==============================================================================
-- 9. Follow-Up Correspondence Tracking on public.sent_emails
-- ==============================================================================
alter table public.sent_emails
  add column if not exists email_type text default 'initial' check (email_type in ('initial', 'followup')),
  add column if not exists parent_email_id uuid references public.sent_emails(id) on delete set null;

create index if not exists idx_sent_emails_parent_email_id on public.sent_emails(user_id, parent_email_id);
create index if not exists idx_sent_emails_email_type on public.sent_emails(user_id, email_type);

-- ==============================================================================
-- 10. Native Gmail Thread & Message Tracking on public.sent_emails
-- ==============================================================================
alter table public.sent_emails
  add column if not exists gmail_message_id text,
  add column if not exists gmail_thread_id text;

create index if not exists idx_sent_emails_gmail_thread_id on public.sent_emails(user_id, gmail_thread_id);

-- ==============================================================================
-- 11. Disposable Email & Spam Protection for Supabase Auth
-- ==============================================================================

-- 1. Create table of blocked disposable email domains
create table if not exists public.blocked_email_domains (
  domain text primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.blocked_email_domains enable row level security;

-- 2. Seed table with widely used disposable / temporary email domains
insert into public.blocked_email_domains (domain) values
  ('10minutemail.com'),
  ('10minutemail.net'),
  ('10minutemail.org'),
  ('temp-mail.org'),
  ('tempmail.com'),
  ('tempmail.net'),
  ('tempmailaddress.com'),
  ('guerrillamail.com'),
  ('guerrillamail.net'),
  ('guerrillamail.biz'),
  ('guerrillamail.org'),
  ('sharklasers.com'),
  ('grr.la'),
  ('pokemail.net'),
  ('spam4.me'),
  ('mailinator.com'),
  ('mailinator2.com'),
  ('notmailinator.com'),
  ('suremail.info'),
  ('yopmail.com'),
  ('yopmail.fr'),
  ('yopmail.net'),
  ('cool.fr.nf'),
  ('jetable.fr.nf'),
  ('trashmail.com'),
  ('trashmail.net'),
  ('trashmail.me'),
  ('dispostable.com'),
  ('getairmail.com'),
  ('mohmal.com'),
  ('generator.email'),
  ('inboxkitten.com'),
  ('crazymailing.com'),
  ('throwawaymail.com'),
  ('burnermail.io'),
  ('fakeinbox.com'),
  ('mytemp.email'),
  ('mailcatch.com'),
  ('nada.ltd'),
  ('getnada.com'),
  ('tempinbox.com'),
  ('dropmail.me'),
  ('disposablemail.com'),
  ('emailondeck.com'),
  ('hudzer.com'),
  ('aminavin.com'),
  ('bitproy.com'),
  ('caps7.com'),
  ('cwsgear.com'),
  ('deertees.com'),
  ('flakeian.com'),
  ('meshelp.com'),
  ('sssonar.com'),
  ('sweepser.com'),
  ('xiunt.com'),
  ('maxxspace.com')
on conflict (domain) do nothing;

-- 3. Database function to reject disposable domains BEFORE row is inserted into auth.users
create or replace function public.check_user_email_domain()
returns trigger as $$
declare
  email_domain text;
begin
  email_domain := lower(split_part(new.email, '@', 2));

  if exists (select 1 from public.blocked_email_domains where domain = email_domain) then
    raise exception 'Temporary and disposable email addresses are not permitted. Please sign up with your personal or work email.'
      using errcode = '23514';
  end if;

  if email_domain like '%tempmail%'
     or email_domain like '%10minute%'
     or email_domain like '%guerrilla%'
     or email_domain like '%mailinator%'
     or email_domain like '%trashmail%'
     or email_domain like '%dispostable%'
     or email_domain like '%throwaway%'
     or email_domain like '%yopmail%'
     or email_domain like '%sharklaser%' then
    raise exception 'Temporary and disposable email addresses are not permitted. Please sign up with your personal or work email.'
      using errcode = '23514';
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists tr_check_user_email_domain on auth.users;
create trigger tr_check_user_email_domain
  before insert on auth.users
  for each row
  execute function public.check_user_email_domain();

-- 4. Auto-cleanup function to purge abandoned unconfirmed accounts older than 24 hours
create or replace function public.purge_unconfirmed_users()
returns integer as $$
declare
  deleted_count integer;
begin
  delete from auth.users
  where email_confirmed_at is null
    and created_at < (timezone('utc'::text, now()) - interval '24 hours');
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$ language plpgsql security definer;



