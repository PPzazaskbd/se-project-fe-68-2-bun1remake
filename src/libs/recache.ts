"use server";

import { deleteHotel } from "@/libs/deleteHotel";
import { invalidateHotelData } from "@/libs/hotelCache";

export async function deleteHotelRecache(hotelId: string, token: string) {
  await deleteHotel(hotelId, token);

  invalidateHotelData();
  return { ok: true as const };
}
