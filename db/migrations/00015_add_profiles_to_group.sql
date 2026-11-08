-- Trusted, transactional operation that links existing registered profiles to
-- a Bhishi group. The calling admin's identity is derived from the JWT; no
-- caller-supplied identity or role is trusted. The operation:
--
--   * requires an active administrator;
--   * rejects an archived or missing target group; and
--   * either links one or more existing profiles to the group or raises an
--     error without modifying any data.
--
-- Behaviour details:
--
--   * Reuses the existing `members` row linked to a profile (by
--     `profile_id`); when the profile has no member row yet, one is created
--     from the profile's current name/email/phone. No duplicate profiles or
--     authentication accounts are created.
--   * Inserts into `group_members` idempotently: a profile already in the
--     group is reused, never duplicated.
--   * Appends an audit log entry atomically with the membership changes.
--
-- This migration is additive; applied migrations are not modified.

begin;

create or replace function public.add_profiles_to_group(
  target_group_id uuid,
  target_profile_ids uuid[]
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := public.current_profile_id();
  v_profile_id uuid;
  v_member_id uuid;
  v_added integer := 0;
  v_profile record;
begin
  if v_actor_id is null or not public.is_admin() then
    raise exception 'An active administrator session is required'
      using errcode = '42501';
  end if;

  if target_group_id is null then
    raise exception 'A target group is required'
      using errcode = '22023';
  end if;

  if target_profile_ids is null
     or pg_catalog.array_length(target_profile_ids, 1) is null then
    raise exception 'Select at least one registered member to add'
      using errcode = '22023';
  end if;

  if not exists (
    select 1
      from public.bhishi_groups g
     where g.id = target_group_id
       and g.status <> 'archived'
  ) then
    raise exception 'The target group was not found or is archived'
      using errcode = 'P0002';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(1701190064);

  foreach v_profile_id in array target_profile_ids loop
    select p.id, p.full_name, p.phone, p.email
      into v_profile
      from public.profiles p
     where p.id = v_profile_id
       and p.is_active
     for update;

    if not found then
      raise exception 'One of the selected accounts is missing or is inactive'
        using errcode = 'P0002';
    end if;

    select m.id
      into v_member_id
      from public.members m
     where m.profile_id = v_profile_id
     for update;

    if v_member_id is null then
      insert into public.members (full_name, phone, email, profile_id)
      values (v_profile.full_name, v_profile.phone, v_profile.email, v_profile_id)
      returning id into v_member_id;
    end if;

    insert into public.group_members (group_id, member_id, status)
    values (target_group_id, v_member_id, 'active')
    on conflict (group_id, member_id) do nothing;

    if found then
      v_added := v_added + 1;
    end if;
  end loop;

  if v_added > 0 then
    insert into public.audit_logs (
      actor_id, action, entity_type, entity_id, new_values
    )
    values (
      v_actor_id,
      'group_members_added',
      'bhishi_group',
      target_group_id,
      pg_catalog.jsonb_build_object(
        'profile_ids', pg_catalog.to_jsonb(target_profile_ids),
        'added', v_added
      )
    );
  end if;

  return v_added;
end;
$$;

comment on function public.add_profiles_to_group(uuid, uuid[]) is
  'Links existing registered profiles to a Bhishi group atomically: reuses or creates the linked member row, inserts group_members idempotently and appends an audit log. Requires an active administrator.';

revoke execute on function public.add_profiles_to_group(uuid, uuid[]) from public;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant execute on function public.add_profiles_to_group(uuid, uuid[]) to authenticated;
  end if;
end
$$;

commit;
