-- ============================================================================
-- Bachat Book · Migration 00012 · Secure payment recording and voiding
-- ----------------------------------------------------------------------------
-- All payment writes go through admin-only transactional functions. A row lock
-- on the obligation serializes partial payments and prevents over-collection.
-- ============================================================================

begin;

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
  v_profile_id uuid;
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
      'amount', payment_amount,
      'payment_date', target_payment_date,
      'payment_method', target_payment_method
    )
  );

  return v_payment_id;
end;
$$;

comment on function public.record_payment(uuid, numeric, date, public.payment_method, text, text) is
  'Admin-only atomic payment recording; locks the obligation and rejects amounts above its outstanding balance.';

create or replace function public.void_payment(
  target_payment_id uuid,
  void_reason text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_payment public.payments%rowtype;
  v_profile_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Only administrators may void payments'
      using errcode = '42501';
  end if;

  if void_reason is null or length(btrim(void_reason)) = 0 then
    raise exception 'A reason is required to void a payment'
      using errcode = '23514';
  end if;

  if length(btrim(void_reason)) > 200 then
    raise exception 'The void reason must be 200 characters or fewer'
      using errcode = '23514';
  end if;

  select * into v_payment
  from public.payments
  where id = target_payment_id
  for update;

  if not found then
    raise exception 'Payment not found'
      using errcode = '23503';
  end if;

  if v_payment.is_voided then
    raise exception 'Payment is already voided'
      using errcode = '23514';
  end if;

  perform 1
  from public.contribution_obligations
  where installment_id = v_payment.installment_id
    and member_id = v_payment.member_id
  for update;

  v_profile_id := public.current_profile_id();

  update public.payments
  set
    is_voided = true,
    voided_at = now(),
    voided_by = v_profile_id,
    correction_reason = btrim(void_reason)
  where id = target_payment_id;

  insert into public.audit_logs (
    actor_id,
    action,
    entity_type,
    entity_id,
    old_values,
    new_values
  )
  values (
    v_profile_id,
    'payment.voided',
    'payment',
    target_payment_id,
    jsonb_build_object('is_voided', false),
    jsonb_build_object(
      'is_voided', true,
      'voided_at', now(),
      'correction_reason', btrim(void_reason)
    )
  );

  return target_payment_id;
end;
$$;

comment on function public.void_payment(uuid, text) is
  'Admin-only atomic payment voiding; preserves the transaction and requires a reason.';

revoke execute on function public.record_payment(uuid, numeric, date, public.payment_method, text, text)
  from public;
revoke execute on function public.void_payment(uuid, text) from public;

grant execute on function public.record_payment(uuid, numeric, date, public.payment_method, text, text)
  to authenticated;
grant execute on function public.void_payment(uuid, text) to authenticated;

-- Members may see only their own transactions. Admins retain full ledger access.
drop policy payments_select_accessible on public.payments;

create policy payments_select_own_or_admin
  on public.payments
  for select
  to authenticated
  using (
    public.is_admin()
    or exists (
      select 1
      from public.members m
      where m.id = payments.member_id
        and m.profile_id = public.current_profile_id()
    )
  );

-- The RPCs are the only Data API write path. This prevents direct inserts,
-- edits, or voids from bypassing amount validation, row locking and audit logs.
revoke insert, update on public.payments from authenticated;

commit;
