-- ==============================================================================
-- Migration: Add Composite Scaling Indexes for Sent Emails & Activity Tracking
-- ==============================================================================
-- These indexes accelerate the primary queries executed across Vina:
-- 1. Monthly quota and 24-hour daily safety limit checks (getUserSendCounts).
-- 2. Case-insensitive duplicate recipient email checks.
-- 3. Fast lookup of sent emails by Message-ID and Thread-ID for reply tracking.
-- ==============================================================================

-- 1. Composite index for monthly & daily limit queries
-- Covers: WHERE user_id = $1 AND status = 'sent' AND created_at >= $2
create index if not exists idx_sent_emails_user_status_created 
  on public.sent_emails(user_id, status, created_at desc);

-- 2. Functional index for case-insensitive duplicate recipient lookups
-- Covers: WHERE user_id = $1 AND lower(hr_email) = lower($2)
create index if not exists idx_sent_emails_user_lower_hr_email 
  on public.sent_emails(user_id, lower(hr_email));

-- 3. Index for Gmail message & thread ID lookups during IMAP synchronization
create index if not exists idx_sent_emails_gmail_message_id 
  on public.sent_emails(gmail_message_id)
  where gmail_message_id is not null;

create index if not exists idx_sent_emails_gmail_thread_id 
  on public.sent_emails(gmail_thread_id)
  where gmail_thread_id is not null;
