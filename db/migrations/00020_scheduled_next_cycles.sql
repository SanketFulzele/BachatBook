-- ============================================================================
-- Bachat Book · Migration 00020 · Scheduled next cycles
-- ----------------------------------------------------------------------------
-- A single draft per group may be prepared while another cycle is active.
-- Drafts remain financially inert until their India-local start date and every
-- earlier cycle has completed. pg_cron runs the transition in the database.
-- ============================================================================

begin;

create extension if not exists pg_cron;

create or replace function public.create_scheduled_cycle(
  target_group_id uuid,
  cycle_name text,
  cycle_start_date date,
  contribution_amount numeric,
  collection_day integer,
  participating_member_ids uuid[]
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
  v_end_date date;
begin
  if not public.is_admin() then
    raise exception 'Only administrators may create a cycle'
      using errcode = '42501';
  end if;

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
    where group_id = target_group_id and status = 'draft'
  ) then
    raise exception 'A next cycle is already scheduled for this group'
      using errcode = '23505';
  end if;
  if cycle_name is null or length(btrim(cycle_name)) = 0 then
    raise exception 'Cycle name is required'
      using errcode = '23514';
  end if;
  if cycle_start_date is null
     or cycle_start_date < (pg_catalog.now() at time zone 'Asia/Kolkata')::date then
    raise exception 'Cycle start date cannot be in the past'
      using errcode = '23514';
  end if;
  if contribution_amount is null
     or contribution_amount <= 0
     or contribution_amount > 9999999999.99
     or contribution_amount <> round(contribution_amount, 2) then
    raise exception 'Contribution amount must be positive and have at most two decimal places'
      using errcode = '23514';
  end if;
  if collection_day is null or collection_day < 1 or collection_day > 31 then
    raise exception 'Collection day must be between 1 and 31'
      using errcode = '23514';
  end if;
  if participating_member_ids is null
     or cardinality(participating_member_ids) < 2
     or cardinality(participating_member_ids) <> (
       select count(distinct member_id)
       from unnest(participating_member_ids) as selected(member_id)
     ) then
    raise exception 'Select at least two different participating members'
      using errcode = '23514';
  end if;

  select count(*) into v_member_count
  from public.group_members gm
  join public.members m on m.id = gm.member_id and m.is_active
  where gm.group_id = target_group_id
    and gm.status = 'active'
    and gm.member_id = any(participating_member_ids);

  if v_member_count <> cardinality(participating_member_ids) then
    raise exception 'Every selected member must be active in this group'
      using errcode = '23514';
  end if;

  v_end_date := public.cycle_installment_due_date(
    cycle_start_date,
    collection_day,
    v_member_count
  );

  if exists (
    select 1
    from public.cycles c
    where c.group_id = target_group_id
      and c.status <> 'cancelled'
      and cycle_start_date <= public.cycle_installment_due_date(
        c.start_date,
        c.collection_day_snapshot,
        c.duration_months
      )
      and c.start_date <= v_end_date
  ) then
    raise exception 'Cycle dates overlap another cycle; choose a start date after the previous scheduled period'
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
  select v_cycle_id, selected.member_id, selected.position::integer
  from unnest(participating_member_ids) with ordinality
    as selected(member_id, position);

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, new_values)
  values (
    public.current_profile_id(),
    'cycle.scheduled',
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

comment on function public.create_scheduled_cycle(uuid, text, date, numeric, integer, uuid[]) is
  'Admin-only: creates a financially inert next-cycle draft with selected active members, rejecting overlapping periods.';

create or replace function public.update_scheduled_cycle(
  target_cycle_id uuid,
  cycle_name text,
  cycle_start_date date,
  contribution_amount numeric,
  collection_day integer,
  participating_member_ids uuid[]
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cycle public.cycles%rowtype;
  v_group public.bhishi_groups%rowtype;
  v_member_count integer;
  v_end_date date;
begin
  if not public.is_admin() then
    raise exception 'Only administrators may edit a scheduled cycle'
      using errcode = '42501';
  end if;
  if target_cycle_id is null then
    raise exception 'Choose a scheduled cycle'
      using errcode = '23514';
  end if;

  select * into v_cycle from public.cycles where id = target_cycle_id;
  if not found then
    raise exception 'Cycle not found'
      using errcode = '23503';
  end if;

  select * into v_group
  from public.bhishi_groups
  where id = v_cycle.group_id
  for update;

  select * into v_cycle
  from public.cycles
  where id = target_cycle_id
  for update;

  if v_cycle.status <> 'draft' then
    raise exception 'Only a scheduled cycle can be edited'
      using errcode = '23514';
  end if;
  if v_group.status = 'archived' then
    raise exception 'Archived groups cannot edit a cycle'
      using errcode = '23514';
  end if;
  if exists (select 1 from public.installments where cycle_id = target_cycle_id) then
    raise exception 'A cycle with generated installments cannot be edited'
      using errcode = '23514';
  end if;
  if cycle_name is null or length(btrim(cycle_name)) = 0 then
    raise exception 'Cycle name is required'
      using errcode = '23514';
  end if;
  if cycle_start_date is null
     or cycle_start_date < (pg_catalog.now() at time zone 'Asia/Kolkata')::date then
    raise exception 'Cycle start date cannot be in the past'
      using errcode = '23514';
  end if;
  if contribution_amount is null
     or contribution_amount <= 0
     or contribution_amount > 9999999999.99
     or contribution_amount <> round(contribution_amount, 2) then
    raise exception 'Contribution amount must be positive and have at most two decimal places'
      using errcode = '23514';
  end if;
  if collection_day is null or collection_day < 1 or collection_day > 31 then
    raise exception 'Collection day must be between 1 and 31'
      using errcode = '23514';
  end if;
  if participating_member_ids is null
     or cardinality(participating_member_ids) < 2
     or cardinality(participating_member_ids) <> (
       select count(distinct member_id)
       from unnest(participating_member_ids) as selected(member_id)
     ) then
    raise exception 'Select at least two different participating members'
      using errcode = '23514';
  end if;

  select count(*) into v_member_count
  from public.group_members gm
  join public.members m on m.id = gm.member_id and m.is_active
  where gm.group_id = v_cycle.group_id
    and gm.status = 'active'
    and gm.member_id = any(participating_member_ids);

  if v_member_count <> cardinality(participating_member_ids) then
    raise exception 'Every selected member must be active in this group'
      using errcode = '23514';
  end if;

  v_end_date := public.cycle_installment_due_date(
    cycle_start_date,
    collection_day,
    v_member_count
  );

  if exists (
    select 1
    from public.cycles c
    where c.group_id = v_cycle.group_id
      and c.id <> target_cycle_id
      and c.status <> 'cancelled'
      and cycle_start_date <= public.cycle_installment_due_date(
        c.start_date,
        c.collection_day_snapshot,
        c.duration_months
      )
      and c.start_date <= v_end_date
  ) then
    raise exception 'Cycle dates overlap another cycle; choose a start date after the previous scheduled period'
      using errcode = '23514';
  end if;

  update public.cycles
  set name = btrim(cycle_name),
      start_date = cycle_start_date,
      contribution_amount_snapshot = contribution_amount,
      collection_day_snapshot = collection_day,
      total_members = v_member_count,
      duration_months = v_member_count,
      updated_at = pg_catalog.now()
  where id = target_cycle_id;

  delete from public.cycle_members
  where cycle_id = target_cycle_id
    and member_id <> all(participating_member_ids);

  update public.cycle_members
  set chit_number = chit_number + 100000
  where cycle_id = target_cycle_id;

  insert into public.cycle_members (cycle_id, member_id, chit_number)
  select target_cycle_id, selected.member_id, selected.position::integer
  from unnest(participating_member_ids) with ordinality
    as selected(member_id, position)
  where not exists (
    select 1 from public.cycle_members cm
    where cm.cycle_id = target_cycle_id and cm.member_id = selected.member_id
  );

  update public.cycle_members
  set chit_number = chit_number + 200000
  where cycle_id = target_cycle_id;

  update public.cycle_members cm
  set chit_number = selected.position::integer
  from unnest(participating_member_ids) with ordinality
    as selected(member_id, position)
  where cm.cycle_id = target_cycle_id and cm.member_id = selected.member_id;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, new_values)
  values (
    public.current_profile_id(),
    'cycle.schedule_updated',
    'cycle',
    target_cycle_id,
    jsonb_build_object(
      'start_date', cycle_start_date,
      'contribution_amount', contribution_amount,
      'collection_day', collection_day,
      'members', v_member_count
    )
  );

  return target_cycle_id;
end;
$$;

comment on function public.update_scheduled_cycle(uuid, text, date, numeric, integer, uuid[]) is
  'Admin-only: edits schedule and participating members before a draft cycle has generated installments.';

revoke all on function public.create_scheduled_cycle(uuid, text, date, numeric, integer, uuid[]) from public;
revoke all on function public.update_scheduled_cycle(uuid, text, date, numeric, integer, uuid[]) from public;

create or replace function public.activate_scheduled_cycle_internal(
  target_cycle_id uuid,
  audit_actor_id uuid,
  as_of_date date default null
)
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
  v_end_date date;
  v_today date := coalesce(
    as_of_date,
    (pg_catalog.now() at time zone 'Asia/Kolkata')::date
  );
begin
  select * into v_cycle from public.cycles where id = target_cycle_id;
  if not found then
    raise exception 'Cycle not found'
      using errcode = '23503';
  end if;

  select * into v_group
  from public.bhishi_groups
  where id = v_cycle.group_id
  for update;

  select * into v_cycle
  from public.cycles
  where id = target_cycle_id
  for update;

  if v_cycle.status <> 'draft' then
    raise exception 'Only a scheduled cycle can be activated'
      using errcode = '23514';
  end if;
  if v_group.status = 'archived' then
    raise exception 'Archived groups cannot start a cycle'
      using errcode = '23514';
  end if;
  if v_cycle.start_date > v_today then
    raise exception 'This cycle is scheduled and cannot activate before its start date'
      using errcode = '23514';
  end if;
  if exists (
    select 1 from public.cycles
    where group_id = v_cycle.group_id and status = 'active'
  ) then
    raise exception 'The current cycle must be completed before the scheduled cycle can activate'
      using errcode = '23514';
  end if;
  if exists (
    select 1 from public.cycles c
    where c.group_id = v_cycle.group_id
      and c.id <> target_cycle_id
      and c.start_date < v_cycle.start_date
      and c.status not in ('completed', 'cancelled')
  ) then
    raise exception 'A previous cycle is incomplete; resolve its payments and payouts before activation'
      using errcode = '23514';
  end if;

  v_end_date := public.cycle_installment_due_date(
    v_cycle.start_date,
    v_cycle.collection_day_snapshot,
    v_cycle.duration_months
  );
  if exists (
    select 1 from public.cycles c
    where c.group_id = v_cycle.group_id
      and c.id <> target_cycle_id
      and c.status <> 'cancelled'
      and v_cycle.start_date <= public.cycle_installment_due_date(
        c.start_date,
        c.collection_day_snapshot,
        c.duration_months
      )
      and c.start_date <= v_end_date
  ) then
    raise exception 'This cycle overlaps another cycle and cannot be activated'
      using errcode = '23514';
  end if;
  if exists (select 1 from public.installments where cycle_id = target_cycle_id) then
    raise exception 'Installments already exist for this cycle'
      using errcode = '23505';
  end if;

  select count(*), count(distinct chit_number), min(chit_number), max(chit_number)
  into v_member_count, v_distinct_chits, v_min_chit, v_max_chit
  from public.cycle_members
  where cycle_id = target_cycle_id;

  if v_member_count < 2 or v_cycle.duration_months <> v_member_count then
    raise exception 'Cycle duration must match at least two participating members'
      using errcode = '23514';
  end if;
  if v_distinct_chits <> v_member_count or v_min_chit <> 1 or v_max_chit <> v_member_count then
    raise exception 'Chit numbers must run from 1 to the number of participating members'
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
   and m.is_active
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
    public.cycle_installment_due_date(
      v_cycle.start_date,
      v_cycle.collection_day_snapshot,
      n
    ),
    (
      select cm.member_id
      from public.cycle_members cm
      where cm.cycle_id = target_cycle_id
        and cm.chit_number = n
    ),
    v_cycle.contribution_amount_snapshot * (v_member_count - 1)
  from generate_series(1, v_cycle.duration_months) as n;

  insert into public.contribution_obligations (
    installment_id,
    member_id,
    expected_amount
  )
  select i.id, cm.member_id, v_cycle.contribution_amount_snapshot
  from public.installments i
  join public.cycle_members cm on cm.cycle_id = i.cycle_id
  where i.cycle_id = target_cycle_id
    and cm.member_id <> i.recipient_member_id;

  update public.cycles
  set status = 'active', updated_at = pg_catalog.now()
  where id = target_cycle_id;

  update public.bhishi_groups
  set status = 'active', start_date = coalesce(start_date, v_cycle.start_date)
  where id = v_cycle.group_id;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, new_values)
  values (
    audit_actor_id,
    'cycle.activated',
    'cycle',
    target_cycle_id,
    jsonb_build_object(
      'group_id', v_cycle.group_id,
      'members', v_member_count,
      'start_date', v_cycle.start_date,
      'contribution_amount', v_cycle.contribution_amount_snapshot,
      'collection_day', v_cycle.collection_day_snapshot,
      'activation_source', case when audit_actor_id is null then 'scheduler' else 'admin' end
    )
  );

  return target_cycle_id;
end;
$$;

revoke all on function public.activate_scheduled_cycle_internal(uuid, uuid, date) from public, authenticated;

create or replace function public.activate_cycle_draft(target_cycle_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Only administrators may activate a cycle'
      using errcode = '42501';
  end if;

  return public.activate_scheduled_cycle_internal(
    target_cycle_id,
    public.current_profile_id(),
    null
  );
end;
$$;

comment on function public.activate_cycle_draft(uuid) is
  'Admin-only activation for a due draft cycle with no active or incomplete earlier cycle.';

revoke all on function public.activate_cycle_draft(uuid) from public;

create or replace function public.process_due_scheduled_cycles(as_of_date date default null)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_candidate record;
  v_group public.bhishi_groups%rowtype;
  v_cycle public.cycles%rowtype;
  v_active public.cycles%rowtype;
  v_today date := coalesce(
    as_of_date,
    (pg_catalog.now() at time zone 'Asia/Kolkata')::date
  );
  v_activated integer := 0;
begin
  for v_candidate in
    select c.id, c.group_id
    from public.cycles c
    where c.status = 'draft'
      and c.start_date <= v_today
    order by c.start_date, c.created_at
  loop
    select * into v_group
    from public.bhishi_groups
    where id = v_candidate.group_id
    for update;

    if not found or v_group.status = 'archived' then
      continue;
    end if;

    select * into v_cycle
    from public.cycles
    where id = v_candidate.id
    for update;

    if not found or v_cycle.status <> 'draft' or v_cycle.start_date > v_today then
      continue;
    end if;

    for v_active in
      select * from public.cycles
      where group_id = v_cycle.group_id and status = 'active'
      for update
    loop
      if public.cycle_ready_to_complete(v_active.id) then
        update public.cycles
        set status = 'completed', updated_at = pg_catalog.now()
        where id = v_active.id and status = 'active';

        insert into public.audit_logs (actor_id, action, entity_type, entity_id, new_values)
        values (
          null,
          'cycle.completed',
          'cycle',
          v_active.id,
          jsonb_build_object(
            'group_id', v_active.group_id,
            'name', v_active.name,
            'completion_source', 'scheduler'
          )
        );
      end if;
    end loop;

    if exists (
      select 1 from public.cycles
      where group_id = v_cycle.group_id and status = 'active'
    ) then
      continue;
    end if;

    if exists (
      select 1 from public.cycles c
      where c.group_id = v_cycle.group_id
        and c.id <> v_cycle.id
        and c.start_date < v_cycle.start_date
        and c.status not in ('completed', 'cancelled')
    ) then
      continue;
    end if;

    begin
      perform public.activate_scheduled_cycle_internal(v_cycle.id, null, v_today);
      v_activated := v_activated + 1;
    exception
      when check_violation or unique_violation then
        if not exists (
          select 1 from public.audit_logs
          where action = 'cycle.activation_blocked'
            and entity_type = 'cycle'
            and entity_id = v_cycle.id
        ) then
          insert into public.audit_logs (actor_id, action, entity_type, entity_id, new_values)
          values (
            null,
            'cycle.activation_blocked',
            'cycle',
            v_cycle.id,
            jsonb_build_object(
              'group_id', v_cycle.group_id,
              'start_date', v_cycle.start_date,
              'reason', sqlerrm
            )
          );
        end if;
    end;
  end loop;

  return v_activated;
end;
$$;

comment on function public.process_due_scheduled_cycles(date) is
  'Internal pg_cron job: completes ready active cycles and activates due scheduled cycles only after all earlier cycles complete; an explicit date supports transactional tests.';

revoke all on function public.process_due_scheduled_cycles(date) from public, authenticated;

do $$
declare
  v_job_id bigint;
begin
  select jobid into v_job_id
  from cron.job
  where jobname = 'bachat-book-activate-scheduled-cycles';

  if v_job_id is not null then
    perform cron.unschedule(v_job_id);
  end if;

  perform cron.schedule(
    'bachat-book-activate-scheduled-cycles',
    '*/5 * * * *',
    'select public.process_due_scheduled_cycles();'
  );
end
$$;

grant execute on function public.create_scheduled_cycle(uuid, text, date, numeric, integer, uuid[]) to authenticated;
grant execute on function public.update_scheduled_cycle(uuid, text, date, numeric, integer, uuid[]) to authenticated;
grant execute on function public.activate_cycle_draft(uuid) to authenticated;

commit;
