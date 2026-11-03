-- ============================================================================
-- Bachify · Migration 00001 · Enumerated types
-- ----------------------------------------------------------------------------
-- All enum values are lowercase snake_case so they map 1:1 to TypeScript
-- string unions in src/types/database.types.ts.
--
-- Migrations are append-only: never edit a migration that has been applied.
-- Create a new numbered migration instead.
-- ============================================================================

create type public.user_role as enum ('admin', 'member');

comment on type public.user_role is
  'Application role. Stored on public.profiles and never trusted from the client.';

create type public.group_status as enum ('draft', 'active', 'completed', 'archived');

comment on type public.group_status is
  'Lifecycle of a Bhishi group. Groups are archived, never hard-deleted.';

create type public.cycle_status as enum ('draft', 'active', 'completed', 'cancelled');

comment on type public.cycle_status is
  'Lifecycle of one savings cycle (one full rotation of payouts).';

create type public.membership_status as enum ('active', 'inactive', 'removed');

comment on type public.membership_status is
  'Membership state of a member inside a group. Removal is non-destructive.';

create type public.payment_method as enum ('cash', 'upi', 'bank_transfer', 'other');

comment on type public.payment_method is
  'How a contribution or payout was settled.';
