create extension if not exists pgcrypto;

create table public.parking_lots (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  address text not null,
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  price_per_hour integer not null check (price_per_hour > 0),
  price_per_day integer check (price_per_day > 0),
  total_spots integer not null check (total_spots > 0),
  is_24h boolean not null default false,
  opens_at time,
  closes_at time,
  amenities text[] not null default '{}',
  vehicle_types text[] not null default '{car,motorcycle}',
  rating numeric(2,1) check (rating between 0 and 5),
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint parking_lots_schedule_check check (is_24h or (opens_at is not null and closes_at is not null))
);

create table public.reservations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  parking_lot_id uuid not null references public.parking_lots(id) on delete restrict,
  vehicle_plate text not null check (vehicle_plate ~ '^[A-Z0-9-]{5,8}$'),
  vehicle_type text not null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  status text not null default 'confirmed' check (status in ('confirmed', 'active', 'completed', 'cancelled')),
  total_price integer not null check (total_price > 0),
  confirmation_code text not null unique default upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 8)),
  created_at timestamptz not null default now(),
  cancelled_at timestamptz,
  constraint reservation_time_check check (end_time > start_time),
  constraint reservation_cancelled_check check ((status = 'cancelled') = (cancelled_at is not null))
);

create index parking_lots_active_coordinates_idx on public.parking_lots (is_active, lat, lng);
create index reservations_overlap_idx on public.reservations (parking_lot_id, start_time, end_time) where status in ('confirmed', 'active');
create index reservations_user_start_idx on public.reservations (user_id, start_time desc);

create or replace function public.get_available_spots(p_lot_id uuid, p_start timestamptz, p_end timestamptz)
returns integer language sql stable security definer set search_path = public as $$
  select greatest(0, l.total_spots - count(r.id)::integer)
  from parking_lots l
  left join reservations r on r.parking_lot_id = l.id
    and r.status in ('confirmed', 'active')
    and r.start_time < p_end and r.end_time > p_start
  where l.id = p_lot_id and l.is_active
  group by l.total_spots
$$;

create or replace function public.search_nearby_lots(
  p_lat double precision, p_lng double precision, p_radius_m integer,
  p_start timestamptz, p_end timestamptz
)
returns table (
  id uuid, name text, address text, lat double precision, lng double precision,
  price_per_hour integer, price_per_day integer, total_spots integer, available_spots integer,
  is_24h boolean, opens_at time, closes_at time, amenities text[], vehicle_types text[],
  rating numeric, image_url text, distance_m double precision
) language sql stable security definer set search_path = public as $$
  with nearby as (
    select l.*, 6371000 * acos(least(1, greatest(-1,
      cos(radians(p_lat)) * cos(radians(l.lat)) * cos(radians(l.lng) - radians(p_lng))
      + sin(radians(p_lat)) * sin(radians(l.lat))
    ))) as meters
    from parking_lots l where l.is_active
  )
  select n.id, n.name, n.address, n.lat, n.lng, n.price_per_hour, n.price_per_day,
    n.total_spots, public.get_available_spots(n.id, p_start, p_end), n.is_24h, n.opens_at,
    n.closes_at, n.amenities, n.vehicle_types, n.rating, n.image_url, n.meters
  from nearby n where n.meters <= p_radius_m order by n.meters
$$;

create or replace function public.reserve_only_if_available()
returns trigger language plpgsql security definer set search_path = public as $$
declare available integer;
begin
  perform 1 from public.parking_lots where id = new.parking_lot_id and is_active for update;
  if not found then raise exception 'El parqueadero no está disponible'; end if;
  select public.get_available_spots(new.parking_lot_id, new.start_time, new.end_time) into available;
  if available <= 0 then raise exception 'No hay cupos disponibles'; end if;
  return new;
end;
$$;

create trigger reservations_capacity_check
before insert on public.reservations for each row execute function public.reserve_only_if_available();

alter table public.parking_lots enable row level security;
alter table public.reservations enable row level security;

create policy "Public can see active parking lots" on public.parking_lots for select using (is_active);
create policy "Users can see their reservations" on public.reservations for select using (auth.uid() = user_id);
create policy "Users can create their reservations" on public.reservations for insert with check (auth.uid() = user_id);
create policy "Users can cancel their reservations" on public.reservations for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant execute on function public.get_available_spots(uuid, timestamptz, timestamptz) to anon, authenticated;
grant execute on function public.search_nearby_lots(double precision, double precision, integer, timestamptz, timestamptz) to anon, authenticated;

insert into public.parking_lots (name, description, address, lat, lng, price_per_hour, price_per_day, total_spots, is_24h, opens_at, closes_at, amenities, vehicle_types, rating) values
  ('Parking Zona T', 'Parqueadero cubierto cerca de restaurantes y comercio.', 'Calle 82 #12-45, Bogotá', 4.6689, -74.0540, 9000, 54000, 24, true, null, null, '{covered,security,ev_charging}', '{car,motorcycle,suv}', 4.8),
  ('Lote Seguro 93', 'Acceso amplio y vigilancia permanente.', 'Carrera 15 #93-18, Bogotá', 4.6782, -74.0528, 7500, 45000, 16, false, '06:00', '22:00', '{covered,security,car_wash}', '{car,motorcycle,suv,van}', 4.6),
  ('Parqueadero Centro Internacional', 'Ideal para diligencias en el centro financiero.', 'Carrera 7 #32-16, Bogotá', 4.6160, -74.0697, 6500, 39000, 32, true, null, null, '{security,disabled_access}', '{car,motorcycle,suv}', 4.5);
