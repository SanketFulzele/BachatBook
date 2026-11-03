-- ============================================================================
-- Bachat Book · Migration 00010 · Cycle drafts and chit order
-- ----------------------------------------------------------------------------
-- Sprint 5 makes cycle setup an explicit, reviewable workflow:
--   1. create_cycle_draft()   creates a draft cycle with contribution and
--                             collection-day snapshots plus all active members.
--   2. set_cycle_chit_order() reorders those members while the cycle is a draft.
--   3. activate_cycle_draft() validates everything and activates the cycle in
--                             one transaction, generating the monthly schedule.
--
-- Historical cycles are never edited: only a draft cycle can be reordered, and
-- activation only inserts new rows. Installments/obligations continue to be
-- generated at activation (Sprint 4 behaviour) because the payment and payout
-- screens depend on them.
-- ============================================================================

-- A group may have at most one draft and at most one active cycle at a time.
-- Inactive/completed cycles are unaffected, so history keeps accumulating.
create unique index cycles_one_active_per_group
  on public.cycles (group_id)
  where status = 'active';

create unique index cycles_one_draft_per_group
  on public.cycles (group_id)
  where status = 'draft';

-- ----------------------------------------------------------------------------
-- create_cycle_draft()
-- Creates the cycle shell and the participating members with a provisional
-- chit order. The admin can review and reorder before activation.
-- ----------------------------------------------------------------------------
create or replace function public.create_cycle_draft(
  target_group_id uuid,
  cycle_name text,
  cycle_start_date date,
  contribution_amount numeric,
  collection_day integer
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
begin
  if not public.is_admin() then
    raise exception 'Only administrators may create a cycle'
      using errcode = '42501';
  end if;

  -- Lock the group so two admins cannot create a draft or activate a cycle
  -- concurrently for the same group.
  select * into v_group
  from public.bhishi_groups
  where id = target_group_id
  for update;

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

  if exists (
    select 1 from public.cycles
    where group_id = target_group_id and status = 'draft'
  ) then
    raise exception 'This group already has a draft cycle'
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

  if contribution_amount is null or contribution_amount <= 0 then
    raise exception 'Monthly contribution must be greater than zero'
      using errcode = '23514';
  end if;

  if collection_day is null or collection_day < 1 or collection_day > 31 then
    raise exception 'Collection day must be between 1 and 31'
      using errcode = '23514';
  end if;

  select count(*) into v_member_count
  from public.group_members gm
  join public.members m on m.id = gm.member_id
  where gm.group_id = target_group_id
    and gm.status = 'active'
    and m.is_active = true;

  if v_member_count < 2 then
    raise exception 'A cycle needs at least two active members'
      using errcode = '23514';
  end if;

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
    contribution_amount,
    collection_day,
    v_member_count,
    v_member_count,
    'draft'
  )
  returning id into v_cycle_id;

  insert into public.cycle_members (cycle_id, member_id, chit_number)
  select v_cycle_id, ranked.member_id, ranked.position
  from (
    select
      gm.member_id,
      row_number() over (order by m.full_name, m.id) as position
    from public.group_members gm
    join public.members m on m.id = gm.member_id
    where gm.group_id = target_group_id
      and gm.status = 'active'
      and m.is_active = true
  ) ranked;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, new_values)
  values (
    public.current_profile_id(),
    'cycle.draft_created',
    'cycle',
    v_cycle_id,
    jsonb_build_object(
      'group_id', target_group_id,
      'members', v_member_count,
      'start_date', cycle_start_date,
      'contribution_amount', contribution_amount,
      'collection_day', collection_day
    )
  );

  return v_cycle_id;
end;
$$;

comment on function public.create_cycle_draft(uuid, text, date, numeric, integer) is
  'Admin-only: creates a draft cycle with contribution/collection-day snapshots and all active members.';

-- ----------------------------------------------------------------------------
-- set_cycle_chit_order()
-- Replaces the order of a draft cycle. The temporary offset avoids colliding
-- with the unique (cycle_id, chit_number) constraint while rows are updated.
-- ----------------------------------------------------------------------------
create or replace function public.set_cycle_chit_order(
  target_cycle_id uuid,
  chit_order jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cycle public.cycles%rowtype;
  v_member_count integer;
  v_valid_count integer;
  v_distinct_members integer;
  v_distinct_chits integer;
  v_min_chit integer;
  v_max_chit integer;
begin
  if not public.is_admin() then
    raise exception 'Only administrators may set the chit order'
      using errcode = '42501';
  end if;

  select * into v_cycle
  from public.cycles
  where id = target_cycle_id
  for update;

  if not found then
    raise exception 'Cycle not found'
      using errcode = '23503';
  end if;

  if v_cycle.status <> 'draft' then
    raise exception 'Only a draft cycle can be reordered'
      using errcode = '23514';
  end if;

  if chit_order is null or jsonb_typeof(chit_order) <> 'array' then
    raise exception 'Chit order must be a JSON array'
      using errcode = '23514';
  end if;

  select count(*) into v_member_count
  from public.cycle_members
  where cycle_id = target_cycle_id;

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
  join public.cycle_members cm
    on cm.cycle_id = target_cycle_id
   and cm.member_id = e.member_id;

  if v_valid_count <> jsonb_array_length(chit_order) then
    raise exception 'Every chit must belong to a participating member of this cycle'
      using errcode = '23514';
  end if;

  if v_valid_count <> v_member_count then
    raise exception 'Every participating member needs exactly one chit position'
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

  update public.cycle_members
  set chit_number = chit_number + 1000000
  where cycle_id = target_cycle_id;

  update public.cycle_members cm
  set chit_number = e.chit_number
  from jsonb_to_recordset(chit_order) as e(member_id uuid, chit_number integer)
  where cm.cycle_id = target_cycle_id
    and cm.member_id = e.member_id;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, new_values)
  values (
    public.current_profile_id(),
    'cycle.chit_order_updated',
    'cycle',
    target_cycle_id,
    jsonb_build_object('chit_order', chit_order)
  );
end;
$$;

comment on function public.set_cycle_chit_order(uuid, jsonb) is
  'Admin-only: replaces the chit order of a draft cycle, rejecting duplicates and missing members.';

-- ----------------------------------------------------------------------------
-- activate_cycle_draft()
-- Validates the reviewed draft and activates it atomically. Installments and
-- contribution obligations are generated from the cycle snapshots, so later
-- edits to the group cannot rewrite this history.
-- ----------------------------------------------------------------------------
create or replace function public.activate_cycle_draft(target_cycle_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cycle public.cycles%rowtype;
  v_group public.bhishi_groups%rowtype;
  v_member_count integer;
  v_distinct_chits integer;
  v_min_chit integer;
  v_max_chit integer;
  v_active_members integer;
begin
  if not public.is_admin() then
    raise exception 'Only administrators may activate a cycle'
      using errcode = '42501';
  end if;

  select * into v_cycle
  from public.cycles
  where id = target_cycle_id;

  if not found then
    raise exception 'Cycle not found'
      using errcode = '23503';
  end if;

  -- Lock in a consistent order with create_cycle_draft(): group first, then
  -- the cycle row.
  select * into v_group
  from public.bhishi_groups
  where id = v_cycle.group_id
  for update;

  select * into v_cycle
  from public.cycles
  where id = target_cycle_id
  for update;

  if v_cycle.status <> 'draft' then
    raise exception 'Only a draft cycle can be activated'
      using errcode = '23514';
  end if;

  if v_group.status = 'archived' then
    raise exception 'Archived groups cannot start a cycle'
      using errcode = '23514';
  end if;

  if exists (
    select 1 from public.cycles
    where group_id = v_cycle.group_id
      and status = 'active'
      and id <> target_cycle_id
  ) then
    raise exception 'This group already has an active cycle'
      using errcode = '23505';
  end if;

  select
    count(*),
    count(distinct chit_number),
    min(chit_number),
    max(chit_number)
  into
    v_member_count,
    v_distinct_chits,
    v_min_chit,
    v_max_chit
  from public.cycle_members
  where cycle_id = target_cycle_id;

  if v_member_count < 2 then
    raise exception 'A cycle needs at least two participating members'
      using errcode = '23514';
  end if;

  if v_distinct_chits <> v_member_count
     or v_min_chit <> 1
     or v_max_chit <> v_member_count then
    raise exception 'Chit numbers must run from 1 to the number of members'
      using errcode = '23514';
  end if;

  select count(*) into v_active_members
  from public.cycle_members cm
  join public.group_members gm
    on gm.group_id = v_cycle.group_id
   and gm.member_id = cm.member_id
   and gm.status = 'active'
  join public.members m
    on m.id = cm.member_id
   and m.is_active = true
  where cm.cycle_id = target_cycle_id;

  if v_active_members <> v_member_count then
    raise exception 'Every participating member must still be active in the group'
      using errcode = '23514';
  end if;

  insert into public.installments (
    cycle_id,
    installment_number,
    scheduled_date,
    recipient_member_id,
    expected_amount
  )
  select
    target_cycle_id,
    n,
    (v_cycle.start_date + make_interval(months => n - 1))::date,
    (
      select cm.member_id
      from public.cycle_members cm
      where cm.cycle_id = target_cycle_id
        and cm.chit_number = n
    ),
    v_cycle.contribution_amount_snapshot
  from generate_series(1, v_member_count) as n;

  insert into public.contribution_obligations (
    installment_id,
    member_id,
    expected_amount
  )
  select i.id, cm.member_id, v_cycle.contribution_amount_snapshot
  from public.installments i
  join public.cycle_members cm on cm.cycle_id = i.cycle_id
  where i.cycle_id = target_cycle_id;

  update public.cycles
  set status = 'active'
  where id = target_cycle_id;

  update public.bhishi_groups
  set
    status = 'active',
    start_date = coalesce(start_date, v_cycle.start_date)
  where id = v_cycle.group_id;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, new_values)
  values (
    public.current_profile_id(),
    'cycle.activated',
    'cycle',
    target_cycle_id,
    jsonb_build_object(
      'group_id', v_cycle.group_id,
      'members', v_member_count,
      'start_date', v_cycle.start_date,
      'contribution_amount', v_cycle.contribution_amount_snapshot,
      'collection_day', v_cycle.collection_day_snapshot
    )
  );

  return target_cycle_id;
end;
$$;

comment on function public.activate_cycle_draft(uuid) is
  'Admin-only, atomic activation of a reviewed draft cycle; generates installments and obligations.';

-- ----------------------------------------------------------------------------
-- Execution privileges: authenticated only, never anonymous.
-- ----------------------------------------------------------------------------
revoke execute on function public.create_cycle_draft(uuid, text, date, numeric, integer) from public;
revoke execute on function public.set_cycle_chit_order(uuid, jsonb) from public;
revoke execute on function public.activate_cycle_draft(uuid) from public;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant execute on function public.create_cycle_draft(uuid, text, date, numeric, integer) to authenticated;
    grant execute on function public.set_cycle_chit_order(uuid, jsonb) to authenticated;
    grant execute on function public.activate_cycle_draft(uuid) to authenticated;
  end if;
end
$$;
