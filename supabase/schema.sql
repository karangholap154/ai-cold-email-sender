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

-- Unique index to guarantee one active resume per user in v1
create unique index if not exists idx_resume_user_id on public.resume(user_id);

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
end $$;

-- Indices for user queries, searching, and duplicate checking
create index if not exists idx_sent_emails_user_id on public.sent_emails(user_id);
create index if not exists idx_sent_emails_hr_email on public.sent_emails(user_id, hr_email);
create index if not exists idx_sent_emails_company_name on public.sent_emails(user_id, company_name);
create index if not exists idx_sent_emails_created_at on public.sent_emails(user_id, created_at desc);

-- 5. Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.resume enable row level security;
alter table public.sent_emails enable row level security;

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

-- 6. Supabase Storage Bucket for resumes
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
-- 7. Sender Signature Migration on public.profiles
-- ==============================================================================
alter table public.profiles
  add column if not exists full_name text,
  add column if not exists sign_off text default 'Best regards,',
  add column if not exists portfolio_url text,
  add column if not exists github_url text,
  add column if not exists linkedin_url text,
  add column if not exists phone text,
  add column if not exists custom_signature text;

