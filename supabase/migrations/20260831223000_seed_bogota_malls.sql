-- Semilla de parqueaderos en centros comerciales reales de Bogotá
-- (coordenadas verificadas con Nominatim/OpenStreetMap el 2026-08-31).

insert into public.parking_lots (name, description, address, lat, lng, price_per_hour, price_per_day, total_spots, is_24h, opens_at, closes_at, amenities, vehicle_types, rating) values
  ('Parqueadero Centro Comercial Andino', 'Parqueadero del CC Andino, zona G y Chicó, cerca de la Calle 82.', 'Calle 82 #12-48, Bogotá', 4.6669045, -74.0531123, 7000, 42000, 1200, false, '10:00', '21:00', '{covered,security,ev_charging,disabled_access}', '{car,motorcycle,suv,van}', 4.6),
  ('Parqueadero Plaza de las Américas', 'Parqueadero del CC Plaza de las Américas, Avenida de las Américas con Carrera 71.', 'Avenida de las Américas #6Sur-94, Bogotá', 4.6191423, -74.1351911, 5000, 30000, 3000, false, '10:00', '20:00', '{covered,security,disabled_access,car_wash}', '{car,motorcycle,suv,van}', 4.3),
  ('Parqueadero Unicentro', 'Parqueadero del CC Unicentro, Avenida Carrera 15 con Calle 122.', 'Avenida Carrera 15 #122-25, Bogotá', 4.7021592, -74.0412813, 6000, 36000, 2400, false, '10:00', '21:00', '{covered,security,ev_charging,disabled_access}', '{car,motorcycle,suv,van}', 4.5),
  ('Parqueadero Santafé Bogotá', 'Parqueadero del CC Santafé, Calle 185 al norte de Bogotá.', 'Calle 185 #45-03, Bogotá', 4.7622417, -74.0464092, 6000, 36000, 3600, false, '10:00', '21:00', '{covered,security,ev_charging,disabled_access,car_wash}', '{car,motorcycle,suv,van}', 4.6),
  ('Parqueadero Hayuelos', 'Parqueadero del CC Hayuelos, Ciudad Hayuelos sobre la Avenida Calle 26.', 'Avenida Calle 26 #82-66, Bogotá', 4.6637872, -74.1302286, 5000, 30000, 1600, false, '10:00', '21:00', '{covered,security,disabled_access}', '{car,motorcycle,suv,van}', 4.4);
