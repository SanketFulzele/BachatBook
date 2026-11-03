-- ============================================================================
-- Bachat Book · Migration 00009 · Cycle activation
-- ----------------------------------------------------------------------------
-- Starting a Bhishi cycle previously required several independent inserts from
-- the browser (cycle, chit order, installments, obligations). That is not
-- atomic: a failed request could leave a half-generated schedule.
--
-- This migration adds one SECURITY DEFINER function that performs the whole
-- workflow in a single transaction:
--   1. validates that the caller is an administrator,
--   2. validates the chit order against active group members,
--   3. creates the active cycle with contribution snapshots,
--   4. stores the chit order,
--   5. generates one monthly installment per member,
--   6. generates one contribution obligation per member per installment,
--   7. marks the group active and appends an audit entry.
-- ============================================================================

create or replace function public.activate_cycle(
  target_group_id uuid,
  cycle_name text,
  cycle_start_date date,
  chit_order jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_group public.bhishi_groups%rowtype;
  v_cycle_id uuid;
  v_member_count integer;
  v_valid_count integer;
  v_distinct_members integer;
  v_distinct_chits integer;
  v_min_chit integer;
  v_max_chit integer;
begin
  if not public.is_admin() then
    raise exception 'Only administrators may start a cycle'
      using errcode = '42501';
  end if;

  select * into v_group
  from public.bhishi_groups
  where id = target_group_id;

  if not found then
    raise exception 'Group not found'
      using errcode = '23503';
  end if;

  if v_group.status = 'archived' then
    raise exception 'Archived groups cannot start a cycle'
      using errcode = '23514';
  end if;

  if exists (
    select 1 from public.cycles
    where group_id = target_group_id and status = 'active'
  ) then
    raise exception 'This group already has an active cycle'
      using errcode = '23505';
  end if;

  if cycle_name is null or length(btrim(cycle_name)) = 0 then
    raise exception 'Cycle name is required'
      using errcode = '23514';
  end if;

  if cycle_start_date is null then
    raise exception 'Cycle start date is required'
      using errcode = '23514';
  end if;

  if chit_order is null or jsonb_typeof(chit_order) <> 'array' then
    raise exception 'Chit order must be a JSON array'
      using errcode = '23514';
  end if;

  select
    count(*),
    count(distinct e.member_id),
    count(distinct e.chit_number),
    min(e.chit_number),
    max(e.chit_number)
  into
    v_valid_count,
    v_distinct_members,
    v_distinct_chits,
    v_min_chit,
    v_max_chit
  from jsonb_to_recordset(chit_order) as e(member_id uuid, chit_number integer)
  join public.group_members gm
    on gm.group_id = target_group_id
   and gm.member_id = e.member_id
   and gm.status = 'active'
  join public.members m
    on m.id = e.member_id
   and m.is_active = true;

  if v_valid_count <> jsonb_array_length(chit_order) then
    raise exception 'Every chit must belong to an active member of this group'
      using errcode = '23514';
  end if;

  if v_valid_count < 2 then
    raise exception 'A cycle needs at least two active members'
      using errcode = '23514';
  end if;

  if v_distinct_members <> v_valid_count or v_distinct_chits <> v_valid_count then
    raise exception 'Each member and chit number may appear only once'
      using errcode = '23514';
  end if;

  if v_min_chit <> 1 or v_max_chit <> v_valid_count then
    raise exception 'Chit numbers must run from 1 to the number of members'
      using errcode = '23514';
  end if;

  v_member_count := v_valid_count;

  insert into public.cycles (
    group_id,
    name,
    start_date,
    contribution_amount_snapshot,
    collection_day_snapshot,
    total_members,
    duration_months,
    status
  ) values (
    target_group_id,
    btrim(cycle_name),
    cycle_start_date,
    v_group.contribution_amount,
    v_group.collection_day,
    v_member_count,
    v_member_count,
    'active'
  )
  returning id into v_cycle_id;

  insert into public.cycle_members (cycle_id, member_id, chit_number)
  select v_cycle_id, e.member_id, e.chit_number
  from jsonb_to_recordset(chit_order) as e(member_id uuid, chit_number integer);

  insert into public.installments (
    cycle_id,
    installment_number,
    scheduled_date,
    recipient_member_id,
    expected_amount
  )
  select
    v_cycle_id,
    n,
    (cycle_start_date + make_interval(months => n - 1))::date,
    (
      select e.member_id
      from jsonb_to_recordset(chit_order) as e(member_id uuid, chit_number integer)
      where e.chit_number = n
    ),
    v_group.contribution_amount
  from generate_series(1, v_member_count) as n;

  insert into public.contribution_obligations (
    installment_id,
    member_id,
    expected_amount
  )
  select i.id, cm.member_id, v_group.contribution_amount
  from public.installments i
  join public.cycle_members cm on cm.cycle_id = i.cycle_id
  where i.cycle_id = v_cycle_id;

  update public.bhishi_groups
  set
    status = 'active',
    start_date = coalesce(start_date, cycle_start_date)
  where id = target_group_id;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, new_values)
  values (
    public.current_profile_id(),
    'cycle.activated',
    'cycle',
    v_cycle_id,
    jsonb_build_object(
      'group_id', target_group_id,
      'members', v_member_count,
      'start_date', cycle_start_date
    )
  );

  return v_cycle_id;
end;
$$;

comment on function public.activate_cycle(uuid, text, date, jsonb) is
  'Admin-only, atomic cycle start: validates chit order, creates the cycle, installments and obligations.';

revoke execute on function public.activate_cycle(uuid, text, date, jsonb) from public;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant execute on function public.activate_cycle(uuid, text, date, jsonb) to authenticated;
  end if;
end
$$;
