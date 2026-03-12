-- Support feedback table for dashboard users to contact Traverum
create table if not exists public.support_feedback (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  sender_email text not null,
  user_id uuid references public.users(id) on delete set null,
  partner_id uuid references public.partners(id) on delete set null,
  message text not null,
  status text not null default 'new',
  attachment_paths jsonb not null default '[]'::jsonb
);

-- RLS: table is backend-only (service role inserts/reads)
alter table public.support_feedback enable row level security;

-- No policies for anon/authenticated — only service role can access
