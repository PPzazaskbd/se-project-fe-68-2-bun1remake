import { HotelItem } from "@/interface";

export interface HotelPayload {
  name: string;
  address: string;
  district: string;
  province: string;
  postalcode: string;
  region: string;
  tel: string;
  description: string;
  imgSrc?: string;
  price: number;
  tags?: string[];
}

function getErrorMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== "object") return fallback;
  const p = payload as { message?: string; msg?: string; error?: string };
  return p.message || p.msg || p.error || fallback;
}

async function parseJson(response: Response) {
  try {
    return (await response.json()) as unknown;
  } catch {
    return null;
  }
}

export async function createHotel(token: string, body: HotelPayload) {
  const response = await fetch("/api/hotels", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const payload = await parseJson(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(payload, "Failed to create hotel."));
  }

  return payload as { success: boolean; data: HotelItem };
}

export async function updateHotel(hotelId: string, token: string, body: Partial<HotelPayload>) {
  const response = await fetch(`/api/hotels/${encodeURIComponent(hotelId)}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const payload = await parseJson(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(payload, "Failed to update hotel."));
  }

  return payload as { success: boolean; data: HotelItem };
}

export async function deleteHotel(hotelId: string, token: string) {
  const response = await fetch(`/api/hotels/${encodeURIComponent(hotelId)}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const payload = await parseJson(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(payload, "Failed to delete hotel."));
  }
}
