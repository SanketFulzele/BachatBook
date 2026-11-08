-- ============================================================================
-- Bachat Book · Migration 00018 · Group-scoped payment recording
-- ----------------------------------------------------------------------------
-- The existing `record_payment` remains the global write path used by the
-- global Payments page. This migration adds a trusted sibling that also scopes
-- the obligation to an expected group, so UI flows opened from a specific
-- group cannot accidentally record another group's contribution even if the
-- client payload is manipulated.
-- ============================================================================

begin;

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
begin
  if not public.is_admin() then
    raise exception 'Only administrators may record payments'
      using errcode = '42501';
  end if;

  if target_group_id is null then
    raise exception 'A target group is required'
      using errcode = '22023';
  end if;

  select true
  into v_oblig_group_match
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

  return v_payment_id;
end;
$$;

comment on function public.record_group_payment(uuid, uuid, numeric, date, public.payment_method, text, text) is
  'Admin-only atomic payment recording that also verifies the obligation belongs to the requested group; locks the obligation and rejects amounts above its outstanding balance.';

revoke execute on function public.record_group_payment(uuid, uuid, numeric, date, public.payment_method, text, text)
  from public;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant execute on function public.record_group_payment(uuid, uuid, numeric, date, public.payment_method, text, text)
      to authenticated;
  end if;
end
$$;

commit;
