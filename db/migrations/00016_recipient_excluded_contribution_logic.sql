-- ============================================================================
-- Bachat Book · Migration 00016 · Recipient-excluded contribution model
-- ----------------------------------------------------------------------------
-- The recipient of an installment does not pay the contribution for that
-- installment. Obligations are generated for the other participating members
-- only. Recording a payout is refused while required contributions remain
-- outstanding.
-- ============================================================================

begin;

-- Rebuild once: the remaining cycle activation and collection paths change.
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
    public.cycle_installment_due_date(
      cycle_start_date,
      v_group.collection_day,
      n
    ),
    (
      select e.member_id
      from jsonb_to_recordset(chit_order) as e(member_id uuid, chit_number integer)
      where e.chit_number = n
    ),
    v_group.contribution_amount * (v_member_count - 1)
  from generate_series(1, v_member_count) as n;

  insert into public.contribution_obligations (
    installment_id,
    member_id,
    expected_amount
  )
  select i.id, cm.member_id, v_group.contribution_amount
  from public.installments i
  join public.cycle_members cm on cm.cycle_id = i.cycle_id
  where i.cycle_id = v_cycle_id
    and cm.member_id <> i.recipient_member_id;

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

  if v_cycle.duration_months <> v_member_count then
    raise exception 'Cycle duration must match its participating member count'
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

create or replace function public.record_payout(
  target_installment_id uuid,
  payout_amount numeric,
  target_payout_date date,
  target_payment_method public.payment_method,
  payout_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_recipient_member_id uuid;
  v_payout_id uuid;
  v_profile_id uuid;
  v_expected numeric(12,2);
  v_collected numeric(12,2);
begin
  if not public.is_admin() then
    raise exception 'Only administrators may record payouts'
      using errcode = '42501';
  end if;

  if target_installment_id is null then
    raise exception 'Choose an installment'
      using errcode = '23514';
  end if;

  if payout_amount is null
     or payout_amount <= 0
     or payout_amount > 9999999999.99
     or payout_amount <> round(payout_amount, 2) then
    raise exception 'Payout amount must be positive and have at most two decimal places'
      using errcode = '23514';
  end if;

  if target_payout_date is null then
    raise exception 'Payout date is required'
      using errcode = '23514';
  end if;

  if target_payment_method is null
     or target_payment_method not in (
       'cash'::public.payment_method,
       'upi'::public.payment_method,
       'bank_transfer'::public.payment_method
     ) then
    raise exception 'Choose Cash, UPI or Bank Transfer'
      using errcode = '23514';
  end if;

  if length(coalesce(payout_notes, '')) > 200 then
    raise exception 'Payout note must be 200 characters or fewer'
      using errcode = '23514';
  end if;

  select i.recipient_member_id
  into v_recipient_member_id
  from public.installments i
  where i.id = target_installment_id
  for update;

  if not found then
    raise exception 'Installment not found'
      using errcode = '23503';
  end if;

  if v_recipient_member_id is null then
    raise exception 'Installment has no scheduled recipient'
      using errcode = '23514';
  end if;

  if exists (
    select 1
    from public.payouts p
    where p.installment_id = target_installment_id
      and p.is_voided = false
  ) then
    raise exception 'This installment already has an active payout'
      using errcode = '23505';
  end if;

  select
    coalesce(sum(co.expected_amount), 0),
    coalesce(sum(pay.amount), 0)
  into
    v_expected,
    v_collected
  from public.contribution_obligations co
  left join public.payments pay
    on pay.installment_id = co.installment_id
   and pay.member_id = co.member_id
   and pay.is_voided = false
  where co.installment_id = target_installment_id;

  if v_expected > 0 and v_collected < v_expected then
    raise exception 'All required contributions must be received before recording the payout'
      using errcode = '23514';
  end if;

  v_profile_id := public.current_profile_id();

  insert into public.payouts (
    installment_id,
    recipient_member_id,
    amount,
    payout_date,
    payment_method,
    notes,
    recorded_by
  ) values (
    target_installment_id,
    v_recipient_member_id,
    payout_amount,
    target_payout_date,
    target_payment_method,
    nullif(btrim(payout_notes), ''),
    v_profile_id
  )
  returning id into v_payout_id;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, new_values)
  values (
    v_profile_id,
    'payout.recorded',
    'payout',
    v_payout_id,
    jsonb_build_object(
      'installment_id', target_installment_id,
      'recipient_member_id', v_recipient_member_id,
      'amount', payout_amount,
      'payout_date', target_payout_date,
      'payment_method', target_payment_method,
      'expected_total', v_expected,
      'collected_total', v_collected
    )
  );

  return v_payout_id;
end;
$$;

comment on function public.record_payout(uuid, numeric, date, public.payment_method, text) is
  'Admin-only atomic payout recording; derives and locks the installment recipient; requires outstanding contributions to be cleared.';

commit;
