"use server";

import { deleteHotel } from "@/libs/deleteHotel";
import { createHotel } from "@/libs/createHotel";
import { invalidateHotelData } from "@/libs/hotelCache";
import { CreateHotelPayload } from "./createHotel";

export async function deleteHotelRecache(hotelId: string, token: string) {
  await deleteHotel(hotelId, token);

  invalidateHotelData();
  return { ok: true as const };
}

export async function createHotelRecache(form : CreateHotelPayload, token: string) {
  await createHotel(form, token);

  invalidateHotelData();
  return { ok: true as const };
}

// TODO : update hotel recache, which will call the update hotel api and then invalidate the cache
// skeleton code 
// export default function updateHotelRecache() {

//   invalidateHotelData();
//   return { ok: true as const };
// }