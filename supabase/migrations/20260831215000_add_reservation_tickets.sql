alter table public.reservations
  add column ticket_token uuid not null default gen_random_uuid() unique;

create or replace function public.get_guest_ticket_token(p_id uuid, p_guest_token text)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select r.ticket_token
  from public.reservations r
  where r.id = p_id
    and r.guest_token_hash = extensions.digest(p_guest_token, 'sha256')
$$;

create or replace function public.get_reservation_ticket(p_ticket_token uuid)
returns table (
  confirmation_code text,
  status text,
  start_time timestamptz,
  end_time timestamptz,
  vehicle_plate text,
  vehicle_type text,
  lot_name text,
  lot_address text
)
language sql
stable
security definer
set search_path = public
as $$
  select r.confirmation_code, r.status, r.start_time, r.end_time,
    r.vehicle_plate, r.vehicle_type, l.name, l.address
  from public.reservations r
  join public.parking_lots l on l.id = r.parking_lot_id
  where r.ticket_token = p_ticket_token
$$;

revoke all on function public.get_guest_ticket_token(uuid, text) from public;
revoke all on function public.get_reservation_ticket(uuid) from public;
grant execute on function public.get_guest_ticket_token(uuid, text) to anon, authenticated;
grant execute on function public.get_reservation_ticket(uuid) to anon, authenticated;
