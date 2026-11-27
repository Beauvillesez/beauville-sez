-- 1) Void free registrations whose 30-day grace period has ended.
--    Safe to call by anyone logged in; it only touches rows that are really past due.
create or replace function void_expired_weddings() returns void
language plpgsql security definer set search_path = public as $$
begin
  update wedding_registrations
     set status = 'void'
   where status = 'confirmed'
     and registration_type = 'free'
     and expires_at is not null
     and expires_at + interval '30 days' < now();
end $$;

-- 2) Free renewal: either party, from 30 days before expiry until the grace period ends.
create or replace function renew_free_wedding(p_id wedding_registrations.id%type) returns void
language plpgsql security definer set search_path = public as $$
declare
  r wedding_registrations%rowtype;
  base timestamptz;
begin
  select * into r from wedding_registrations where id = p_id for update;
  if not found then raise exception 'Registration not found'; end if;
  if auth.uid() is distinct from r.initiator_id and auth.uid() is distinct from r.partner_id then
    raise exception 'Not a party to this registration';
  end if;
  if r.status <> 'confirmed' or r.registration_type <> 'free' then
    raise exception 'Only active free registrations can be renewed';
  end if;
  if r.expires_at is null then raise exception 'No expiry date on record'; end if;
  if now() < r.expires_at - interval '30 days' then raise exception 'Too early to renew'; end if;
  if now() > r.expires_at + interval '30 days' then raise exception 'Grace period has ended'; end if;
  base := greatest(r.expires_at, now());
  update wedding_registrations set expires_at = base + interval '3 months' where id = p_id;
end $$;

revoke all on function void_expired_weddings() from public, anon;
revoke all on function renew_free_wedding(wedding_registrations.id%type) from public, anon;
grant execute on function void_expired_weddings() to authenticated;
grant execute on function renew_free_wedding(wedding_registrations.id%type) to authenticated;
