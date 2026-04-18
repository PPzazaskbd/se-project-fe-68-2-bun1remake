"use server";

import { deleteHotel } from "@/libs/deleteHotel";
import { createHotel } from "@/libs/createHotel";
import { updateHotel, UpdateHotelPayload } from "@/libs/updateHotel";
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

export async function updateHotelRecache(hotelId: string, form: UpdateHotelPayload, token: string) {
  await updateHotel(hotelId, form, token);

  invalidateHotelData();
  return { ok: true as const };
}