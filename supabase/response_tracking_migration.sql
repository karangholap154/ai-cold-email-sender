-- ==============================================================================
-- Migration: Response Tracking & IMAP Reply Detection
-- ==============================================================================
-- Adds response status and timestamp to public.sent_emails, creates index,
-- and grants update RLS policy for authenticated owners.

-- 1. Add response tracking columns to sent_emails (idempotent)
do $$ begin
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'sent_emails' and column_name = 'is_responded'
  ) then
    alter table public.sent_emails add column is_responded boolean default false;
  end if;

  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'sent_emails' and column_name = 'responded_at'
  ) then
    alter table public.sent_emails add column responded_at timestamp with time zone;
  end if;
end $$;

-- 2. Index for fast lookup of pending vs responded sent emails
create index if not exists idx_sent_emails_responded 
  on public.sent_emails(user_id, is_responded, status);

-- 3. Allow authenticated users to update their own sent emails (for manual mark/unmark)
drop policy if exists "Users can update own sent emails" on public.sent_emails;
create policy "Users can update own sent emails"
  on public.sent_emails for update
  to authenticated
  using (auth.uid() = user_id);
