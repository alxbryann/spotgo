export type ParkingLot = {
  id: string;
  name: string;
  description: string | null;
  address: string;
  lat: number;
  lng: number;
  price_per_hour: number;
  price_per_day: number | null;
  total_spots: number;
  is_24h: boolean;
  opens_at: string | null;
  closes_at: string | null;
  amenities: string[];
  vehicle_types: string[];
  rating: number | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
};

export type NearbyLot = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  price_per_hour: number;
  price_per_day: number | null;
  total_spots: number;
  available_spots: number;
  is_24h: boolean;
  opens_at: string | null;
  closes_at: string | null;
  amenities: string[];
  vehicle_types: string[];
  rating: number | null;
  image_url: string | null;
  distance_m: number;
};

export type ReservationStatus = "confirmed" | "active" | "completed" | "cancelled";

export type Reservation = {
  id: string;
  user_id: string | null;
  parking_lot_id: string;
  vehicle_plate: string;
  vehicle_type: string;
  start_time: string;
  end_time: string;
  status: ReservationStatus;
  total_price: number;
  confirmation_code: string;
  created_at: string;
  cancelled_at: string | null;
};

export type ReservationWithLot = Reservation & {
  parking_lots: Pick<ParkingLot, "id" | "name" | "address" | "lat" | "lng" | "image_url">;
};

// Minimal Database type so @supabase/ssr generics resolve without full codegen.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Database = any;

export const AMENITY_LABELS: Record<string, string> = {
  covered: "Techado",
  security: "Vigilancia 24/7",
  ev_charging: "Carga eléctrica",
  valet: "Valet parking",
  car_wash: "Lavado de autos",
  disabled_access: "Acceso PMR",
};

export const VEHICLE_LABELS: Record<string, string> = {
  car: "Carro",
  motorcycle: "Moto",
  suv: "Camioneta",
  van: "Furgón",
};
