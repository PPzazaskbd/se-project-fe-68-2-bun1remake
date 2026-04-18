import { buildBackendUrl } from "@/libs/backendApiBase";
import { HotelItem, SingleHotelJson } from "@/interface";

export type UpdateHotelPayload = Partial<Omit<HotelItem, "_id" | "id" | "__v">>;

export async function updateHotel(
  hotelId: string,
  payload: UpdateHotelPayload,
  token: string,
): Promise<SingleHotelJson> {
  const response = await fetch(
    buildBackendUrl(`/hotels/${encodeURIComponent(hotelId)}`),
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    },
  );

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.message || `Failed to update hotel (status ${response.status})`;
    throw new Error(message);
  }

  return data as SingleHotelJson;
}
