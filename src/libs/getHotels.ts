import { HotelJson } from "../interface";
import { buildBackendUrl } from "@/libs/backendApiBase";
import { HOTELS_CACHE_TAG } from "@/libs/hotelCache";

interface GetHotelsOptions {
  noStore?: boolean;
}

export default async function getHotels(options?: GetHotelsOptions) {
  const fetchOptions = options?.noStore
    ? { cache: "no-store" as const }
    : {
        cache: "force-cache" as const,
        next: { tags: [HOTELS_CACHE_TAG] },
      };

  const response = await fetch(
    buildBackendUrl("/hotels"),
    fetchOptions,
  );

  if (!response.ok) {
    throw new Error("Failed to fetch hotels");
  }

  const data = await response.json();

  return data as HotelJson;
}