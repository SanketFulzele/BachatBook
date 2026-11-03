-- ============================================================================
-- Bachify · Migration 00006 · Enable Row Level Security
-- ----------------------------------------------------------------------------
-- RLS is enabled on every application table. With no matching policy the
-- default answer is "deny", including for the Neon Data API `anonymous` role.
-- Policies are created in 00007.
-- ============================================================================

alter table public.profiles                enable row level security;
alter table public.bhishi_groups           enable row level security;
alter table public.members                 enable row level security;
alter table public.group_members           enable row level security;
alter table public.cycles                  enable row level security;
alter table public.cycle_members           enable row level security;
alter table public.installments            enable row level security;
alter table public.contribution_obligations enable row level security;
alter table public.payments                enable row level security;
alter table public.payouts                 enable row level security;
alter table public.audit_logs              enable row level security;
