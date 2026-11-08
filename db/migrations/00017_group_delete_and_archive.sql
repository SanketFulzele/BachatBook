-- ============================================================================
-- Bachat Book · Migration 00017 · Safe group deletion and archival
-- ----------------------------------------------------------------------------
-- Empty groups may be permanently deleted after a server-side history check.
-- Groups with cycles or financial records are archived instead. All lifecycle
-- changes are transactional, admin-only and recorded in the append-only audit
-- log. Existing cycles and financial rows are never deleted.
-- ============================================================================

begin;

-- Group lifecycle changes must use the trusted RPCs below. Group settings may
-- still be edited directly by administrators, but clients cannot set status.
revoke update on public.bhishi_groups from authenticated;
grant update (name, description, contribution_amount, collection_day, start_date)
  on public.bhishi_groups to authenticated;

-- All cycle structure is created/changed through the existing atomic
-- SECURITY DEFINER workflows, never through direct Data API writes.
revoke insert, update on
  public.cycles,
  public.cycle_members,
  public.installments,
  public.contribution_obligations
from authenticated;

create or replace function public.assert_group_not_archived(target_group_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status public.group_status;
begin
  select g.status
    into v_status
    from public.bhishi_groups g
   where g.id = target_group_id
     for key share;

  if not found then
    raise exception 'Group not found'
      using errcode = '23503';
  end if;

  if v_status = 'archived' then
    raise exception 'Archived groups cannot accept new activity'
      using errcode = '23514';
  end if;
end;
$$;

revoke all on function public.assert_group_not_archived(uuid) from public;

create or replace function public.guard_archived_group_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_group_id uuid;
begin
  if tg_table_name = 'group_members' or tg_table_name = 'cycles' then
    v_group_id := new.group_id;
  else
    select c.group_id
      into v_group_id
      from public.installments i
      join public.cycles c on c.id = i.cycle_id
     where i.id = new.installment_id;
  end if;

  perform public.assert_group_not_archived(v_group_id);
  return new;
end;
$$;

revoke all on function public.guard_archived_group_insert() from public;

create trigger group_members_reject_archived_group_insert
  before insert on public.group_members
  for each row execute function public.guard_archived_group_insert();

create trigger cycles_reject_archived_group_insert
  before insert on public.cycles
  for each row execute function public.guard_archived_group_insert();

create trigger payments_reject_archived_group_insert
  before insert on public.payments
  for each row execute function public.guard_archived_group_insert();

create trigger payouts_reject_archived_group_insert
  before insert on public.payouts
  for each row execute function public.guard_archived_group_insert();

create or replace function public.archive_group(target_group_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid;
  v_group public.bhishi_groups%rowtype;
begin
  v_actor_id := public.current_profile_id();
  if v_actor_id is null or not public.is_admin() then
    raise exception 'An active administrator session is required'
      using errcode = '42501';
  end if;

  if target_group_id is null then
    raise exception 'A target group is required'
      using errcode = '22023';
  end if;

  select g.*
    into v_group
    from public.bhishi_groups g
   where g.id = target_group_id
     for update;

  if not found then
    raise exception 'Group not found'
      using errcode = 'P0002';
  end if;

  if v_group.status = 'archived' then
    return v_group.id;
  end if;

  update public.bhishi_groups
     set status = 'archived'
   where id = target_group_id;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, old_values, new_values)
  values (
    v_actor_id,
    'group.archived',
    'bhishi_group',
    target_group_id,
    pg_catalog.to_jsonb(v_group),
    pg_catalog.jsonb_build_object('status', 'archived')
  );

  return target_group_id;
end;
$$;

comment on function public.archive_group(uuid) is
  'Admin-only atomic group archival. Preserves all memberships, cycles, transactions and audit history.';

create or replace function public.delete_empty_group(
  target_group_id uuid,
  confirmation_name text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid;
  v_group public.bhishi_groups%rowtype;
begin
  v_actor_id := public.current_profile_id();
  if v_actor_id is null or not public.is_admin() then
    raise exception 'An active administrator session is required'
      using errcode = '42501';
  end if;

  if target_group_id is null then
    raise exception 'A target group is required'
      using errcode = '22023';
  end if;

  select g.*
    into v_group
    from public.bhishi_groups g
   where g.id = target_group_id
     for update;

  if not found then
    raise exception 'Group not found'
      using errcode = 'P0002';
  end if;

  if confirmation_name is distinct from v_group.name then
    raise exception 'Type the exact group name to confirm deletion'
      using errcode = '23514';
  end if;

  if exists (
    select 1
      from public.cycles c
     where c.group_id = target_group_id
  ) or exists (
    select 1
      from public.payments p
      join public.installments i on i.id = p.installment_id
      join public.cycles c on c.id = i.cycle_id
     where c.group_id = target_group_id
  ) or exists (
    select 1
      from public.payouts p
      join public.installments i on i.id = p.installment_id
      join public.cycles c on c.id = i.cycle_id
     where c.group_id = target_group_id
  ) then
    raise exception 'Groups with cycle or financial history cannot be deleted; archive the group instead'
      using errcode = '23514';
  end if;

  delete from public.group_members
   where group_id = target_group_id;

  delete from public.bhishi_groups
   where id = target_group_id;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, old_values)
  values (
    v_actor_id,
    'group.deleted',
    'bhishi_group',
    target_group_id,
    pg_catalog.to_jsonb(v_group)
  );

  return target_group_id;
end;
$$;

comment on function public.delete_empty_group(uuid, text) is
  'Admin-only atomic deletion for groups with no cycles or financial history; removes memberships and writes an audit record.';

revoke all on function public.archive_group(uuid) from public;
revoke all on function public.delete_empty_group(uuid, text) from public;
grant execute on function public.archive_group(uuid) to authenticated;
grant execute on function public.delete_empty_group(uuid, text) to authenticated;

-- Defense in depth: no direct client deletes, even if a broad grant was added
-- outside the baseline migrations.
revoke delete on
  public.bhishi_groups,
  public.group_members,
  public.cycles,
  public.cycle_members,
  public.installments,
  public.contribution_obligations,
  public.payments,
  public.payouts,
  public.audit_logs
from public, authenticated;

commit;
