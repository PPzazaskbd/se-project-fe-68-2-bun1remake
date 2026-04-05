import { SingleHotelJson } from "@/interface";
import { buildBackendUrl } from "@/libs/backendApiBase";

export default async function getHotel(hid: string) {
  try {
    const response = await fetch(buildBackendUrl(`/hotels/${encodeURIComponent(vid)}`), {
      cache: "no-store",
    });

    let data: unknown;
    try {
      data = await response.json();
    } catch {
      throw new Error(`Failed to parse hotel response (status ${response.status})`);
    }

    if (!response.ok) {
      const message =
        typeof data === "object" &&
        data !== null &&
        "message" in data &&
        typeof (data as { message?: unknown }).message === "string"
          ? (data as { message: string }).message
          : `Failed to fetch hotel (status ${response.status})`;
      throw new Error(message);
    }

    return data as SingleHotelJson;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch hotel: ${error.message}`);
    }
    throw new Error("Failed to fetch hotel: Unknown error");
  }
}
