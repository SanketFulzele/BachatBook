-- ============================================================================
-- Bachat Book · Migration 00013 · Secure payout recording and voiding
-- ----------------------------------------------------------------------------
-- Payout recipients are derived from installments and all writes are handled
-- by admin-only transactional functions.
-- ============================================================================

begin;

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
      'payment_method', target_payment_method
    )
  );

  return v_payout_id;
end;
$$;

comment on function public.record_payout(uuid, numeric, date, public.payment_method, text) is
  'Admin-only atomic payout recording; derives and locks the installment recipient.';

create or replace function public.void_payout(
  target_payout_id uuid,
  void_reason text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_payout public.payouts%rowtype;
  v_profile_id uuid;
  v_voided_at timestamptz;
begin
  if not public.is_admin() then
    raise exception 'Only administrators may void payouts'
      using errcode = '42501';
  end if;

  if void_reason is null or length(btrim(void_reason)) = 0 then
    raise exception 'A reason is required to void a payout'
      using errcode = '23514';
  end if;

  if length(btrim(void_reason)) > 200 then
    raise exception 'The void reason must be 200 characters or fewer'
      using errcode = '23514';
  end if;

  select * into v_payout
  from public.payouts
  where id = target_payout_id
  for update;

  if not found then
    raise exception 'Payout not found'
      using errcode = '23503';
  end if;

  if v_payout.is_voided then
    raise exception 'Payout is already voided'
      using errcode = '23514';
  end if;

  v_profile_id := public.current_profile_id();
  v_voided_at := now();

  update public.payouts
  set
    is_voided = true,
    voided_at = v_voided_at,
    voided_by = v_profile_id,
    correction_reason = btrim(void_reason)
  where id = target_payout_id;

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
    'payout.voided',
    'payout',
    target_payout_id,
    jsonb_build_object('is_voided', false),
    jsonb_build_object(
      'is_voided', true,
      'voided_at', v_voided_at,
      'correction_reason', btrim(void_reason)
    )
  );

  return target_payout_id;
end;
$$;

comment on function public.void_payout(uuid, text) is
  'Admin-only atomic payout voiding; preserves the transaction and requires a reason.';

revoke execute on function public.record_payout(uuid, numeric, date, public.payment_method, text)
  from public;
revoke execute on function public.void_payout(uuid, text) from public;

grant execute on function public.record_payout(uuid, numeric, date, public.payment_method, text)
  to authenticated;
grant execute on function public.void_payout(uuid, text) to authenticated;

-- Prevent direct Data API writes from bypassing recipient checks or audit logs.
revoke insert, update on public.payouts from public, authenticated;

commit;
