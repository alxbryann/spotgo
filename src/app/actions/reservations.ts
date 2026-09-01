"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ensureGuestToken, readGuestToken } from "@/lib/guest-session";
import { createClient } from "@/lib/supabase/server";

export async function createReservation(input: {
  parkingLotId: string;
  vehiclePlate: string;
  vehicleType: string;
  startTime: string;
  endTime: string;
}): Promise<{ error: string } | never> {
  const supabase = await createClient();

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

  const guestToken = await ensureGuestToken();
  const { data, error } = await supabase.rpc("create_guest_reservation", {
    p_lot_id: input.parkingLotId,
    p_vehicle_plate: plate,
    p_vehicle_type: input.vehicleType,
    p_start: start.toISOString(),
    p_end: end.toISOString(),
    p_guest_token: guestToken,
  });

  if (error || typeof data !== "string") {
    if (error?.message.includes("No hay cupos")) {
      return { error: "El último cupo acaba de ocuparse. Elige otro horario." };
    }
    return { error: "No pudimos confirmar la reserva. Revisa los datos e intenta de nuevo." };
  }

  revalidatePath("/reservas");
  redirect(`/reserva/${data}`);
}

export async function cancelReservation(reservationId: string) {
  const guestToken = await readGuestToken();
  if (!guestToken) return { error: "No encontramos reservas en este navegador." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("cancel_guest_reservation", {
    p_id: reservationId,
    p_guest_token: guestToken,
  });

  if (error || data !== true) return { error: "Esta reserva ya no se puede cancelar." };

  revalidatePath("/reservas");
  revalidatePath(`/reserva/${reservationId}`);
  return { error: null };
}
