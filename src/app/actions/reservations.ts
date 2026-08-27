"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { calculatePrice } from "@/lib/booking";
import type { ParkingLot, Reservation } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";

function availableSpots(data: unknown) {
  if (typeof data === "number") return data;
  if (Array.isArray(data) && data.length > 0) {
    const value = data[0];
    if (typeof value === "number") return value;
    if (value && typeof value === "object") return Number(Object.values(value)[0]);
  }
  if (data && typeof data === "object") return Number(Object.values(data)[0]);
  return 0;
}

export async function createReservation(input: {
  parkingLotId: string;
  vehiclePlate: string;
  vehicleType: string;
  startTime: string;
  endTime: string;
}): Promise<{ error: string } | never> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Debes iniciar sesión para reservar." };

  const start = new Date(input.startTime);
  const end = new Date(input.endTime);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return { error: "El rango horario no es válido." };
  }
  if (start.getTime() < Date.now() - 60_000) {
    return { error: "La hora de llegada no puede estar en el pasado." };
  }

  const plate = input.vehiclePlate.trim().toUpperCase();
  if (!/^[A-Z0-9-]{5,8}$/.test(plate)) {
    return { error: "Ingresa una placa válida de 5 a 8 caracteres." };
  }

  const { data: lotData, error: lotError } = await supabase
    .from("parking_lots")
    .select("*")
    .eq("id", input.parkingLotId)
    .eq("is_active", true)
    .single();
  const lot = lotData as ParkingLot | null;

  if (lotError || !lot) return { error: "El parqueadero ya no está disponible." };
  if (!lot.vehicle_types.includes(input.vehicleType)) {
    return { error: "Ese tipo de vehículo no es admitido en este parqueadero." };
  }

  const { data: spotsData, error: spotsError } = await supabase.rpc("get_available_spots", {
    p_lot_id: input.parkingLotId,
    p_start: start.toISOString(),
    p_end: end.toISOString(),
  });

  if (spotsError) return { error: "No pudimos verificar la disponibilidad." };
  if (availableSpots(spotsData) <= 0) {
    return { error: "El último cupo acaba de ocuparse. Elige otro horario." };
  }

  const totalPrice = calculatePrice(
    start.toISOString(),
    end.toISOString(),
    lot.price_per_hour,
    lot.price_per_day
  );
  const { data: reservationData, error: insertError } = await supabase
    .from("reservations")
    .insert({
      user_id: user.id,
      parking_lot_id: lot.id,
      vehicle_plate: plate,
      vehicle_type: input.vehicleType,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      status: "confirmed",
      total_price: totalPrice,
    })
    .select("*")
    .single();
  const reservation = reservationData as Reservation | null;

  if (insertError || !reservation) {
    return { error: "No pudimos crear la reserva. Intenta de nuevo." };
  }

  revalidatePath("/reservas");
  redirect(`/reserva/${reservation.id}`);
}

export async function cancelReservation(reservationId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión." };

  const { data } = await supabase
    .from("reservations")
    .select("*")
    .eq("id", reservationId)
    .eq("user_id", user.id)
    .single();
  const reservation = data as Reservation | null;

  if (!reservation) return { error: "No encontramos esta reserva." };
  if (reservation.status !== "confirmed") return { error: "Esta reserva ya no se puede cancelar." };
  if (new Date(reservation.start_time) <= new Date()) {
    return { error: "No puedes cancelar una reserva que ya comenzó." };
  }

  const { error } = await supabase
    .from("reservations")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
    .eq("id", reservationId)
    .eq("user_id", user.id);

  if (error) return { error: "No pudimos cancelar la reserva." };

  revalidatePath("/reservas");
  revalidatePath(`/reserva/${reservationId}`);
  return { error: null };
}
