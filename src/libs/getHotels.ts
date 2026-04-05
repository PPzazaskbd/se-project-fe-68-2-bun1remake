import { HotelJson } from "../interface";
import { buildBackendUrl } from "@/libs/backendApiBase";

interface GetHotelsOptions {
  noStore?: boolean;
}

export default async function getHotels(options?: GetHotelsOptions) {
  const response = await fetch(
    buildBackendUrl("/hotels"),
    options?.noStore ? { cache: "no-store" } : { next: { revalidate: 60 } },
  );

  if (!response.ok) {
    throw new Error("Failed to fetch hotels");
  }

  const data = await response.json();

  return data as HotelJson;
}
