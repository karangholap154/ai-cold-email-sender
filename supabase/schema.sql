-- ==============================================================================
-- AI Cold Email Sender: Supabase Database Schema & Storage Setup
-- ==============================================================================

-- Enable UUID generation extension if not present
create extension if not exists "uuid-ossp";

-- 1. Create email_status enum
do $$ begin
  create type email_status as enum ('sent', 'failed', 'draft');
exception
  when duplicate_object then null;
end $$;

-- 2. Create resume table (latest-wins pattern or single row)
create table if not exists public.resume (
  id uuid primary key default gen_random_uuid(),
  file_url text not null,
  file_name text,
  skills_summary text default '',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Trigger to automatically update updated_at timestamp on resume
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_resume_updated_at on public.resume;
create trigger set_resume_updated_at
  before update on public.resume
  for each row
  execute function public.handle_updated_at();

-- 3. Create sent_emails table
create table if not exists public.sent_emails (
  id uuid primary key default gen_random_uuid(),
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

-- Indices for fast searching and duplicate checking
create index if not exists idx_sent_emails_hr_email on public.sent_emails(hr_email);
create index if not exists idx_sent_emails_company_name on public.sent_emails(company_name);
create index if not exists idx_sent_emails_created_at on public.sent_emails(created_at desc);

-- 4. Enable Row Level Security (RLS)
alter table public.resume enable row level security;
alter table public.sent_emails enable row level security;

-- For personal single-user app: allow authenticated or service_role access
-- If using client-side queries with anon key or backend server routes with service_role key:
create policy "Allow all access to resume"
  on public.resume
  for all
  using (true)
  with check (true);

create policy "Allow all access to sent_emails"
  on public.sent_emails
  for all
  using (true)
  with check (true);

-- 5. Set up Supabase Storage Bucket for resumes
insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', false)
on conflict (id) do nothing;

-- Storage RLS policy for the resumes bucket
create policy "Allow all operations on resumes bucket"
  on storage.objects
  for all
  using (bucket_id = 'resumes')
  with check (bucket_id = 'resumes');
