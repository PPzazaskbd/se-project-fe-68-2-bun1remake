import { revalidatePath, revalidateTag } from "next/cache";

export const HOTELS_CACHE_TAG = "hotels";

export function invalidateHotelData() {
  revalidateTag(HOTELS_CACHE_TAG);
  revalidatePath("/hotel");
}
