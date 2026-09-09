create table public.companies (
  id uuid primary key default gen_random_uuid(), name text not null,
  nit text unique, contact_email text not null, contact_phone text,
  created_at timestamptz not null default now()
);
create table public.company_members (
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner','staff')),
  primary key (company_id,user_id)
);
create table public.parking_spots (
  id uuid primary key default gen_random_uuid(), parking_lot_id uuid not null references public.parking_lots(id) on delete cascade,
  code text not null, vehicle_type text not null default 'car', is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (parking_lot_id,code)
);
alter table public.parking_lots add column company_id uuid references public.companies(id) on delete set null;
alter table public.reservations add column parking_spot_id uuid references public.parking_spots(id) on delete set null, add column checked_in_at timestamptz, add column checked_out_at timestamptz;
create index parking_lots_company_idx on public.parking_lots(company_id);
create index parking_spots_lot_idx on public.parking_spots(parking_lot_id);
create index reservations_spot_active_idx on public.reservations(parking_spot_id) where status = 'active';

create or replace function public.current_user_company_ids() returns setof uuid language sql stable security definer set search_path = public as $$
  select company_id from public.company_members where user_id = auth.uid()
$$;
create or replace function public.sync_lot_total_spots() returns trigger language plpgsql security definer set search_path = public as $$
declare lot_id uuid := coalesce(new.parking_lot_id,old.parking_lot_id); active_spots integer; begin
  select count(*) into active_spots from public.parking_spots where parking_lot_id=lot_id and is_active;
  if exists(select 1 from public.parking_spots where parking_lot_id=lot_id) and active_spots = 0 then
    raise exception 'Un parqueadero debe conservar al menos una plaza activa';
  end if;
  update public.parking_lots set total_spots=active_spots where id=lot_id and exists(select 1 from public.parking_spots where parking_lot_id=lot_id);
  return coalesce(new,old);
end $$;

alter table public.companies enable row level security; alter table public.company_members enable row level security; alter table public.parking_spots enable row level security;
create policy "Miembros ven sus empresas" on public.companies for select using (id in (select public.current_user_company_ids()));
create policy "Miembros actualizan sus empresas" on public.companies for update using (id in (select public.current_user_company_ids())) with check (id in (select public.current_user_company_ids()));
create policy "Miembros ven su equipo" on public.company_members for select using (company_id in (select public.current_user_company_ids()));
create policy "Dueños ven sus lotes" on public.parking_lots for select using (company_id in (select public.current_user_company_ids()));
create policy "Empresas crean lotes" on public.parking_lots for insert with check (company_id in (select public.current_user_company_ids()));
create policy "Empresas editan lotes" on public.parking_lots for update using (company_id in (select public.current_user_company_ids())) with check (company_id in (select public.current_user_company_ids()));
create policy "Empresas eliminan lotes" on public.parking_lots for delete using (company_id in (select public.current_user_company_ids()));
create policy "Empresas administran plazas" on public.parking_spots for all using (parking_lot_id in (select id from public.parking_lots where company_id in (select public.current_user_company_ids()))) with check (parking_lot_id in (select id from public.parking_lots where company_id in (select public.current_user_company_ids())));
create policy "Empresas ven reservas" on public.reservations for select using (parking_lot_id in (select id from public.parking_lots where company_id in (select public.current_user_company_ids())));
create policy "Empresas operan reservas" on public.reservations for update using (parking_lot_id in (select id from public.parking_lots where company_id in (select public.current_user_company_ids()))) with check (parking_lot_id in (select id from public.parking_lots where company_id in (select public.current_user_company_ids())));

create or replace function public.create_company_with_owner(p_name text,p_nit text,p_email text,p_phone text) returns uuid language plpgsql security definer set search_path=public as $$ declare c uuid; begin
 if auth.uid() is null then raise exception 'Debes iniciar sesión'; end if; if length(trim(p_name)) < 2 then raise exception 'Nombre de empresa inválido'; end if;
 insert into public.companies(name,nit,contact_email,contact_phone) values(trim(p_name),nullif(trim(p_nit),''),lower(trim(p_email)),nullif(trim(p_phone),'')) returning id into c;
 insert into public.company_members(company_id,user_id,role) values(c,auth.uid(),'owner'); return c; end $$;
create or replace function public.lookup_reservation_for_desk(p_lot_id uuid,p_code text) returns table(id uuid,vehicle_plate text,vehicle_type text,start_time timestamptz,end_time timestamptz,status text,confirmation_code text,total_price integer) language sql stable security definer set search_path=public as $$
 select r.id,r.vehicle_plate,r.vehicle_type,r.start_time,r.end_time,r.status,r.confirmation_code,r.total_price from public.reservations r where r.parking_lot_id=p_lot_id and p_lot_id in(select id from public.parking_lots where company_id in(select public.current_user_company_ids())) and (r.confirmation_code=upper(trim(p_code)) or r.ticket_token::text=trim(regexp_replace(p_code,'.*/',''))) limit 1 $$;
create or replace function public.checkin_reservation(p_reservation_id uuid,p_spot_id uuid) returns boolean language plpgsql security definer set search_path=public as $$ declare r public.reservations%rowtype; begin
 select * into r from public.reservations where id=p_reservation_id for update; if not found or r.parking_lot_id not in(select id from public.parking_lots where company_id in(select public.current_user_company_ids())) then raise exception 'Reserva no autorizada'; end if;
 if r.status <> 'confirmed' then raise exception 'La reserva no está pendiente'; end if; if now() < r.start_time-interval '2 hours' or now() > r.end_time then raise exception 'La reserva está fuera de su ventana de ingreso'; end if;
 if not exists(select 1 from public.parking_spots s where s.id=p_spot_id and s.parking_lot_id=r.parking_lot_id and s.is_active) or exists(select 1 from public.reservations where parking_spot_id=p_spot_id and status='active') then raise exception 'La plaza no está disponible'; end if;
 update public.reservations set status='active',parking_spot_id=p_spot_id,checked_in_at=now() where id=r.id; return true; end $$;
create or replace function public.checkout_reservation(p_reservation_id uuid) returns boolean language plpgsql security definer set search_path=public as $$ begin
 update public.reservations set status='completed',checked_out_at=now() where id=p_reservation_id and status='active' and parking_lot_id in(select id from public.parking_lots where company_id in(select public.current_user_company_ids())); if not found then raise exception 'No se puede marcar la salida'; end if; return true; end $$;
create or replace function public.lot_dashboard_summary(p_lot_id uuid) returns table(occupied integer,pending integer,revenue integer,cancelled integer) language sql stable security definer set search_path=public as $$ select count(*) filter(where status='active')::int,count(*) filter(where status='confirmed' and (start_time at time zone 'America/Bogota')::date=(now() at time zone 'America/Bogota')::date)::int,coalesce(sum(total_price) filter(where (checked_in_at at time zone 'America/Bogota')::date=(now() at time zone 'America/Bogota')::date),0)::int,count(*) filter(where status='cancelled' and (cancelled_at at time zone 'America/Bogota')::date=(now() at time zone 'America/Bogota')::date)::int from public.reservations where parking_lot_id=p_lot_id and p_lot_id in(select id from public.parking_lots where company_id in(select public.current_user_company_ids())) $$;
create or replace function public.lot_revenue_series(p_lot_id uuid,p_from timestamptz,p_to timestamptz) returns table(day date,revenue integer,reservations integer) language sql stable security definer set search_path=public as $$ select (checked_in_at at time zone 'America/Bogota')::date,coalesce(sum(total_price),0)::int,count(*)::int from public.reservations where parking_lot_id=p_lot_id and status in('active','completed') and checked_in_at between p_from and p_to and p_lot_id in(select id from public.parking_lots where company_id in(select public.current_user_company_ids())) group by 1 order by 1 $$;
create or replace function public.lot_occupancy_by_hour(p_lot_id uuid,p_from timestamptz,p_to timestamptz) returns table(hour integer,occupancy numeric) language sql stable security definer set search_path=public as $$ select extract(hour from (h at time zone 'America/Bogota'))::int,coalesce(avg((select count(*) from public.reservations r where r.parking_lot_id=p_lot_id and r.status in('active','completed') and r.checked_in_at<=h and coalesce(r.checked_out_at,r.end_time)>h)),0) from generate_series(p_from,p_to,interval '1 hour') h where p_lot_id in(select id from public.parking_lots where company_id in(select public.current_user_company_ids())) group by 1 order by 1 $$;
revoke all on function public.current_user_company_ids(),public.create_company_with_owner(text,text,text,text),public.lookup_reservation_for_desk(uuid,text),public.checkin_reservation(uuid,uuid),public.checkout_reservation(uuid),public.lot_dashboard_summary(uuid),public.lot_revenue_series(uuid,timestamptz,timestamptz),public.lot_occupancy_by_hour(uuid,timestamptz,timestamptz) from public;
grant execute on function public.current_user_company_ids(),public.create_company_with_owner(text,text,text,text),public.lookup_reservation_for_desk(uuid,text),public.checkin_reservation(uuid,uuid),public.checkout_reservation(uuid),public.lot_dashboard_summary(uuid),public.lot_revenue_series(uuid,timestamptz,timestamptz),public.lot_occupancy_by_hour(uuid,timestamptz,timestamptz) to authenticated;
-- Supabase concede execute a anon y authenticated con default privileges, así que el
-- `revoke ... from public` de arriba no basta: hay que revocar de anon explícitamente.
revoke all on function public.current_user_company_ids(),public.create_company_with_owner(text,text,text,text),public.lookup_reservation_for_desk(uuid,text),public.checkin_reservation(uuid,uuid),public.checkout_reservation(uuid),public.lot_dashboard_summary(uuid),public.lot_revenue_series(uuid,timestamptz,timestamptz),public.lot_occupancy_by_hour(uuid,timestamptz,timestamptz) from anon;
-- La policy pública de parking_lots evalúa este helper incluso para anon. Con auth.uid()
-- nulo devuelve el conjunto vacío y no revela membresías, pero debe ser ejecutable.
grant execute on function public.current_user_company_ids() to anon;
-- Función de trigger: no debe ser invocable como RPC por nadie.
revoke all on function public.sync_lot_total_spots() from public, anon, authenticated;
insert into public.companies(id,name,contact_email) values('00000000-0000-0000-0000-000000000001','SpotGo Demo','demo@spotgo.co') on conflict do nothing;
update public.parking_lots set company_id='00000000-0000-0000-0000-000000000001' where company_id is null;
-- El ancho del cero a la izquierda se calcula por lote: lpad TRUNCA por la derecha si el
-- texto excede el ancho, así que un ancho fijo de 2 convertiría la plaza 100 en 'A-10'
-- y chocaría contra la 10. Los centros comerciales tienen miles de plazas.
insert into public.parking_spots(parking_lot_id,code,vehicle_type) select l.id,'A-'||lpad(n::text,greatest(2,length(l.total_spots::text)),'0'),'car' from public.parking_lots l cross join lateral generate_series(1,l.total_spots) n where not exists(select 1 from public.parking_spots s where s.parking_lot_id=l.id);

-- El trigger se crea al final del archivo a propósito: dispararlo por cada una de las
-- ~12.700 plazas del seed haría un count(*) por fila (coste cuadrático) y total_spots
-- ya queda correcto al terminar, porque se siembra exactamente esa cantidad.
create trigger parking_spots_sync_total after insert or update or delete on public.parking_spots for each row execute function public.sync_lot_total_spots();
