-- ============================================================================
-- Bachat Book · Migration 00019 · Cycle completion and next-cycle eligibility
-- ----------------------------------------------------------------------------
-- Bhishi cycles complete when every contributing installment has been paid and
-- every installment has a non-voided payout. That transition is now automatic
-- and runs inside the same transaction as the payment/payout that triggers it.
--
-- Creating a new cycle (draft or direct activation) is refused while any
-- previous non-cancelled cycle in the group is not completed.
-- ============================================================================

begin;

create or replace function public.cycle_ready_to_complete(target_cycle_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_installment_ids uuid[];
  v_installment_id uuid;
begin
  select array_agg(i.id) into v_installment_ids
  from public.installments i
  where i.cycle_id = target_cycle_id;

  if v_installment_ids is null or cardinality(v_installment_ids) = 0 then
    return false;
  end if;

  -- Every obligation must be fully covered by non-voided payments.
  foreach v_installment_id in array v_installment_ids loop
    if exists (
      select 1
      from public.contribution_obligations o
      where o.installment_id = v_installment_id
        and coalesce((
          select sum(p.amount)
          from public.payments p
          where p.installment_id = o.installment_id
            and p.member_id = o.member_id
            and p.is_voided = false
        ), 0) < o.expected_amount
    ) then
      return false;
    end if;

    -- Each installment must have a non-voided payout.
    if not exists (
      select 1
      from public.payouts p
      where p.installment_id = v_installment_id
        and p.is_voided = false
    ) then
      return false;
    end if;
  end loop;

  return true;
end;
$$;

comment on function public.cycle_ready_to_complete(uuid) is
  'Returns true when every obligation for the cycle is covered by payments and every installment has a non-voided payout.';

revoke execute on function public.cycle_ready_to_complete(uuid) from public;

create or replace function public.try_complete_cycle(target_cycle_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cycle public.cycles%rowtype;
begin
  if not public.is_admin() then
    raise exception 'Only administrators may complete a cycle'
      using errcode = '42501';
  end if;

  select * into v_cycle from public.cycles where id = target_cycle_id for update;
  if not found then
    raise exception 'Cycle not found'
      using errcode = '23503';
  end if;

  if v_cycle.status <> 'active' then
    return false;
  end if;

  if not public.cycle_ready_to_complete(target_cycle_id) then
    return false;
  end if;

  update public.cycles
  set status = 'completed',
      updated_at = now()
  where id = target_cycle_id
    and status = 'active';

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, new_values)
  values (
    public.current_profile_id(),
    'cycle.completed',
    'cycle',
    target_cycle_id,
    jsonb_build_object('group_id', v_cycle.group_id, 'name', v_cycle.name)
  );

  return true;
end;
$$;

comment on function public.try_complete_cycle(uuid) is
  'Admin-only. Marks an active cycle completed once all contributions and payouts are finished; appends a cycle.completed audit event.';

revoke execute on function public.try_complete_cycle(uuid) from public;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant execute on function public.cycle_ready_to_complete(uuid) to authenticated;
    grant execute on function public.try_complete_cycle(uuid) to authenticated;
  end if;
end
$$;

-- Prevent new cycle creation while any non-cancelled cycle in the group is unfinished.
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
    raise exception 'Only administrators may create a cycle draft'
      using errcode = '42501';
  end if;

  select * into v_group from public.bhishi_groups where id = target_group_id for update;
  if not found then
    raise exception 'Group not found'
      using errcode = '23503';
  end if;

  if v_group.status = 'archived' then
    raise exception 'Archived groups cannot start a cycle'
      using errcode = '23514';
  end if;

  if exists (
    select 1
    from public.cycles
    where group_id = target_group_id
      and status in ('draft', 'active')
  ) then
    raise exception 'This group already has a draft or active cycle'
      using errcode = '23505';
  end if;

  if exists (
    select 1
    from public.cycles c
    where c.group_id = target_group_id
      and c.status not in ('cancelled', 'completed')
      and exists (
        select 1
        from public.contribution_obligations o
        join public.installments i on i.id = o.installment_id
        where i.cycle_id = c.id
          and coalesce((
            select sum(p.amount)
            from public.payments p
            where p.installment_id = o.installment_id
              and p.member_id = o.member_id
              and p.is_voided = false
          ), 0) < o.expected_amount
      )
  ) then
    raise exception 'The previous cycle has outstanding contributions; complete it before starting a new one'
      using errcode = '23514';
  end if;

  if exists (
    select 1
    from public.cycles c
    where c.group_id = target_group_id
      and c.status not in ('cancelled', 'completed')
      and exists (
        select 1
        from public.installments i
        where i.cycle_id = c.id
          and not exists (
            select 1
            from public.payouts p
            where p.installment_id = i.id
              and p.is_voided = false
          )
      )
  ) then
    raise exception 'The previous cycle has pending payouts; complete it before starting a new one'
      using errcode = '23514';
  end if;

  if cycle_name is null or length(btrim(cycle_name)) = 0 then
    raise exception 'Cycle name is required'
      using errcode = '23514';
  end if;

  if cycle_start_date is null then
    raise exception 'Cycle start date is required'
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

  select count(*) into v_member_count
  from public.group_members gm
  join public.members m on m.id = gm.member_id and m.is_active = true
  where gm.group_id = target_group_id and gm.status = 'active';

  if v_member_count < 2 then
    raise exception 'At least two active members are required to start a cycle'
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
  select
    v_cycle_id,
    m.id,
    row_number() over (order by m.full_name, m.id)
  from public.members m
  join public.group_members gm
    on gm.member_id = m.id
   and gm.group_id = target_group_id
   and gm.status = 'active'
  where m.is_active = true;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, new_values)
  values (
    public.current_profile_id(),
    'cycle.draft_created',
    'cycle',
    v_cycle_id,
    jsonb_build_object('group_id', target_group_id, 'members', v_member_count)
  );

  return v_cycle_id;
end;
$$;

-- Keep ACTIVATING_A_DRAFT the same, but make create_cycle_draft consistent: the draft status
-- remains the only path to starting a new cycle. Activation re-checks the group status and the
-- outstanding-obligations/payouts rules before populating obligations.

-- Reuse try_complete_cycle inside payment and payout paths so cycles auto-complete.
create or replace function public.record_payment(
  target_obligation_id uuid,
  payment_amount numeric,
  target_payment_date date,
  target_payment_method public.payment_method,
  payment_reference text default null,
  payment_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_obligation public.contribution_obligations%rowtype;
  v_paid numeric;
  v_payment_id uuid;
  v_cycle_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Only administrators may record payments'
      using errcode = '42501';
  end if;

  if target_obligation_id is null then
    raise exception 'Choose a contribution obligation'
      using errcode = '23514';
  end if;

  if payment_amount is null
     or payment_amount <= 0
     or payment_amount > 9999999999.99
     or payment_amount <> round(payment_amount, 2) then
    raise exception 'Payment amount must be positive and have at most two decimal places'
      using errcode = '23514';
  end if;

  if target_payment_date is null then
    raise exception 'Payment date is required'
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

  if length(coalesce(payment_reference, '')) > 80
     or length(coalesce(payment_notes, '')) > 200 then
    raise exception 'Payment reference or note is too long'
      using errcode = '23514';
  end if;

  select * into v_obligation
  from public.contribution_obligations
  where id = target_obligation_id
  for update;

  if not found then
    raise exception 'Contribution obligation not found'
      using errcode = '23503';
  end if;

  select coalesce(sum(p.amount), 0)
  into v_paid
  from public.payments p
  where p.installment_id = v_obligation.installment_id
    and p.member_id = v_obligation.member_id
    and p.is_voided = false;

  if payment_amount > v_obligation.expected_amount - v_paid then
    raise exception 'Payment exceeds the outstanding amount of %',
      greatest(v_obligation.expected_amount - v_paid, 0)
      using errcode = '23514';
  end if;

  select i.cycle_id into v_cycle_id
  from public.installments i
  where i.id = v_obligation.installment_id;

  v_payment_id := public.current_profile_id();

  insert into public.payments (
    installment_id,
    member_id,
    amount,
    payment_date,
    payment_method,
    reference_number,
    notes,
    recorded_by
  ) values (
    v_obligation.installment_id,
    v_obligation.member_id,
    payment_amount,
    target_payment_date,
    target_payment_method,
    nullif(btrim(payment_reference), ''),
    nullif(btrim(payment_notes), ''),
    v_payment_id
  )
  returning id into v_payment_id;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, new_values)
  values (
    public.current_profile_id(),
    'payment.recorded',
    'payment',
    v_payment_id,
    jsonb_build_object(
      'installment_id', v_obligation.installment_id,
      'member_id', v_obligation.member_id,
      'amount', payment_amount,
      'payment_date', target_payment_date,
      'payment_method', target_payment_method
    )
  );

  perform public.try_complete_cycle(v_cycle_id);

  return v_payment_id;
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
  v_cycle_id uuid;
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

  select i.recipient_member_id, i.cycle_id
  into v_recipient_member_id, v_cycle_id
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

  perform public.try_complete_cycle(v_cycle_id);

  return v_payout_id;
end;
$$;

-- activate_cycle_draft must reject activating a new cycle while any previous cycle is unfinished.
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
    select 1
    from public.cycles c
    where c.group_id = v_cycle.group_id
      and c.id <> target_cycle_id
      and c.status not in ('cancelled', 'completed')
      and (
        exists (
          select 1
          from public.contribution_obligations o
          join public.installments i on i.id = o.installment_id
          where i.cycle_id = c.id
            and coalesce((
              select sum(p.amount)
              from public.payments p
              where p.installment_id = o.installment_id
                and p.member_id = o.member_id
                and p.is_voided = false
            ), 0) < o.expected_amount
        )
        or exists (
          select 1
          from public.installments i
          where i.cycle_id = c.id
            and not exists (
              select 1
              from public.payouts p
              where p.installment_id = i.id
                and p.is_voided = false
            )
        )
      )
  ) then
    raise exception 'A previous cycle has outstanding contributions or pending payouts; complete it before starting a new one'
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

  if v_distinct_chits <> v_member_count or v_min_chit <> 1 or v_max_chit <> v_member_count then
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

create or replace function public.record_group_payment(
  target_group_id uuid,
  target_obligation_id uuid,
  payment_amount numeric,
  target_payment_date date,
  target_payment_method public.payment_method,
  payment_reference text default null,
  payment_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_oblig_group_match boolean;
  v_obligation public.contribution_obligations%rowtype;
  v_paid numeric;
  v_payment_id uuid;
  v_profile_id uuid;
  v_cycle_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Only administrators may record payments'
      using errcode = '42501';
  end if;

  if target_group_id is null then
    raise exception 'A target group is required'
      using errcode = '22023';
  end if;

  select true into v_oblig_group_match
  from public.installments i
  join public.cycles c on c.id = i.cycle_id
  join public.contribution_obligations o on o.installment_id = i.id
  where o.id = target_obligation_id
    and c.group_id = target_group_id;

  if not found then
    raise exception 'This contribution does not belong to the requested group'
      using errcode = '23514';
  end if;

  if target_obligation_id is null then
    raise exception 'Choose a contribution obligation'
      using errcode = '23514';
  end if;

  if payment_amount is null
     or payment_amount <= 0
     or payment_amount > 9999999999.99
     or payment_amount <> round(payment_amount, 2) then
    raise exception 'Payment amount must be positive and have at most two decimal places'
      using errcode = '23514';
  end if;

  if target_payment_date is null then
    raise exception 'Payment date is required'
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

  if length(coalesce(payment_reference, '')) > 80
     or length(coalesce(payment_notes, '')) > 200 then
    raise exception 'Payment reference or note is too long'
      using errcode = '23514';
  end if;

  select * into v_obligation
  from public.contribution_obligations
  where id = target_obligation_id
  for update;

  if not found then
    raise exception 'Contribution obligation not found'
      using errcode = '23503';
  end if;

  select coalesce(sum(p.amount), 0)
  into v_paid
  from public.payments p
  where p.installment_id = v_obligation.installment_id
    and p.member_id = v_obligation.member_id
    and p.is_voided = false;

  if payment_amount > v_obligation.expected_amount - v_paid then
    raise exception 'Payment exceeds the outstanding amount of %',
      greatest(v_obligation.expected_amount - v_paid, 0)
      using errcode = '23514';
  end if;

  v_profile_id := public.current_profile_id();

  select i.cycle_id into v_cycle_id
  from public.installments i
  where i.id = v_obligation.installment_id;

  insert into public.payments (
    installment_id,
    member_id,
    amount,
    payment_date,
    payment_method,
    reference_number,
    notes,
    recorded_by
  ) values (
    v_obligation.installment_id,
    v_obligation.member_id,
    payment_amount,
    target_payment_date,
    target_payment_method,
    nullif(btrim(payment_reference), ''),
    nullif(btrim(payment_notes), ''),
    v_profile_id
  )
  returning id into v_payment_id;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, new_values)
  values (
    v_profile_id,
    'payment.recorded',
    'payment',
    v_payment_id,
    jsonb_build_object(
      'installment_id', v_obligation.installment_id,
      'member_id', v_obligation.member_id,
      'group_id', target_group_id,
      'amount', payment_amount,
      'payment_date', target_payment_date,
      'payment_method', target_payment_method
    )
  );

  perform public.try_complete_cycle(v_cycle_id);

  return v_payment_id;
end;
$$;

commit;
