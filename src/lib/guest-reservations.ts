import type { ReservationWithLot } from "@/lib/database.types";

export type GuestReservationRow = Omit<ReservationWithLot, "parking_lots"> & {
  lot_name: string;
  lot_address: string;
  lot_lat: number;
  lot_lng: number;
  lot_image_url: string | null;
};

export function toReservationWithLot(row: GuestReservationRow): ReservationWithLot {
  return {
    id: row.id,
    user_id: row.user_id,
    parking_lot_id: row.parking_lot_id,
    vehicle_plate: row.vehicle_plate,
    vehicle_type: row.vehicle_type,
    start_time: row.start_time,
    end_time: row.end_time,
    status: row.status,
    total_price: row.total_price,
    confirmation_code: row.confirmation_code,
    created_at: row.created_at,
    cancelled_at: row.cancelled_at,
    parking_lots: {
      id: row.parking_lot_id,
      name: row.lot_name,
      address: row.lot_address,
      lat: row.lot_lat,
      lng: row.lot_lng,
      image_url: row.lot_image_url,
    },
  };
}
