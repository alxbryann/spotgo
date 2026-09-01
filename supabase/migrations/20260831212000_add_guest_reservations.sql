alter table public.reservations alter column user_id drop not null;
alter table public.reservations add column guest_token_hash bytea;
alter table public.reservations add constraint reservation_owner_check
  check (user_id is not null or guest_token_hash is not null);

create index reservations_guest_token_idx on public.reservations (guest_token_hash, start_time desc)
  where guest_token_hash is not null;

create or replace function public.create_guest_reservation(
  p_lot_id uuid,
  p_vehicle_plate text,
  p_vehicle_type text,
  p_start timestamptz,
  p_end timestamptz,
  p_guest_token text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  lot public.parking_lots%rowtype;
  normalized_plate text := upper(trim(p_vehicle_plate));
  hours numeric;
  hourly_total integer;
  final_price integer;
  reservation_id uuid;
begin
  if length(p_guest_token) < 32 then raise exception 'Sesión de invitado inválida'; end if;
  if p_end <= p_start or p_start < now() - interval '1 minute' then raise exception 'Horario inválido'; end if;
  if normalized_plate !~ '^[A-Z0-9-]{5,8}$' then raise exception 'Placa inválida'; end if;

  select * into lot from public.parking_lots where id = p_lot_id and is_active;
  if not found then raise exception 'Parqueadero no disponible'; end if;
  if not (p_vehicle_type = any(lot.vehicle_types)) then raise exception 'Tipo de vehículo no admitido'; end if;

  hours := extract(epoch from (p_end - p_start)) / 3600;
  hourly_total := ceil(hours)::integer * lot.price_per_hour;
  final_price := hourly_total;
  if hours >= 8 and lot.price_per_day is not null then
    final_price := least(hourly_total, ceil(hours / 24)::integer * lot.price_per_day);
  end if;

  insert into public.reservations (
    user_id, guest_token_hash, parking_lot_id, vehicle_plate, vehicle_type,
    start_time, end_time, status, total_price
  ) values (
    null, extensions.digest(p_guest_token, 'sha256'), p_lot_id, normalized_plate, p_vehicle_type,
    p_start, p_end, 'confirmed', final_price
  ) returning id into reservation_id;

  return reservation_id;
end;
$$;

create or replace function public.get_guest_reservation(p_id uuid, p_guest_token text)
returns table (
  id uuid, user_id uuid, parking_lot_id uuid, vehicle_plate text, vehicle_type text,
  start_time timestamptz, end_time timestamptz, status text, total_price integer,
  confirmation_code text, created_at timestamptz, cancelled_at timestamptz,
  lot_name text, lot_address text, lot_lat double precision, lot_lng double precision, lot_image_url text
)
language sql
stable
security definer
set search_path = public
as $$
  select r.id, r.user_id, r.parking_lot_id, r.vehicle_plate, r.vehicle_type,
    r.start_time, r.end_time, r.status, r.total_price, r.confirmation_code,
    r.created_at, r.cancelled_at, l.name, l.address, l.lat, l.lng, l.image_url
  from public.reservations r
  join public.parking_lots l on l.id = r.parking_lot_id
  where r.id = p_id and r.guest_token_hash = extensions.digest(p_guest_token, 'sha256')
$$;

create or replace function public.list_guest_reservations(p_guest_token text)
returns table (
  id uuid, user_id uuid, parking_lot_id uuid, vehicle_plate text, vehicle_type text,
  start_time timestamptz, end_time timestamptz, status text, total_price integer,
  confirmation_code text, created_at timestamptz, cancelled_at timestamptz,
  lot_name text, lot_address text, lot_lat double precision, lot_lng double precision, lot_image_url text
)
language sql
stable
security definer
set search_path = public
as $$
  select r.id, r.user_id, r.parking_lot_id, r.vehicle_plate, r.vehicle_type,
    r.start_time, r.end_time, r.status, r.total_price, r.confirmation_code,
    r.created_at, r.cancelled_at, l.name, l.address, l.lat, l.lng, l.image_url
  from public.reservations r
  join public.parking_lots l on l.id = r.parking_lot_id
  where r.guest_token_hash = extensions.digest(p_guest_token, 'sha256')
  order by r.start_time desc
$$;

create or replace function public.cancel_guest_reservation(p_id uuid, p_guest_token text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.reservations
  set status = 'cancelled', cancelled_at = now()
  where id = p_id
    and guest_token_hash = extensions.digest(p_guest_token, 'sha256')
    and status = 'confirmed'
    and start_time > now();
  return found;
end;
$$;

revoke all on function public.create_guest_reservation(uuid, text, text, timestamptz, timestamptz, text) from public;
revoke all on function public.get_guest_reservation(uuid, text) from public;
revoke all on function public.list_guest_reservations(text) from public;
revoke all on function public.cancel_guest_reservation(uuid, text) from public;

grant execute on function public.create_guest_reservation(uuid, text, text, timestamptz, timestamptz, text) to anon, authenticated;
grant execute on function public.get_guest_reservation(uuid, text) to anon, authenticated;
grant execute on function public.list_guest_reservations(text) to anon, authenticated;
grant execute on function public.cancel_guest_reservation(uuid, text) to anon, authenticated;
