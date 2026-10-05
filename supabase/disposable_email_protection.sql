-- ==============================================================================
-- 11. Disposable Email & Spam Protection for Supabase Auth
-- ==============================================================================

-- 1. Create table of blocked disposable email domains
create table if not exists public.blocked_email_domains (
  domain text primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS (admin / service role only, read-only for public if needed)
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
  -- Extract domain from email (user@domain.com -> domain.com)
  email_domain := lower(split_part(new.email, '@', 2));

  -- Reject if domain exists in the blocked list
  if exists (select 1 from public.blocked_email_domains where domain = email_domain) then
    raise exception 'Temporary and disposable email addresses are not permitted. Please sign up with your personal or work email.'
      using errcode = '23514';
  end if;

  -- Keyword heuristic check for dynamic disposable domains
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

-- 4. Attach trigger to auth.users
drop trigger if exists tr_check_user_email_domain on auth.users;
create trigger tr_check_user_email_domain
  before insert on auth.users
  for each row
  execute function public.check_user_email_domain();

-- 5. Auto-cleanup function to purge abandoned unconfirmed accounts
-- Removes unconfirmed signups older than 24 hours (cascades to public.profiles)
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

-- 6. (Optional) If pg_cron is enabled in your Supabase project, schedule daily midnight cleanup:
-- select cron.schedule(
--   'purge-unconfirmed-users-daily',
--   '0 0 * * *',
--   $$select public.purge_unconfirmed_users();$$
-- );
