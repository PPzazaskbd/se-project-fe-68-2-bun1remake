import { buildBackendUrl } from "@/libs/backendApiBase";

export async function deleteHotel(hotelId: string, token: string) {
  const response = await fetch(
    buildBackendUrl(`/hotels/${encodeURIComponent(hotelId)}`),
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const payload = await response.json() || null;

  if (!response.ok) {
    const message = payload?.message || "Failed to delete hotel";
    throw new Error(message);
  }
}