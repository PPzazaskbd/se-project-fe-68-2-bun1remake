"use server";

import getHotels from "@/libs/getHotels";

export async function fetchHotelsAction() {
  try {
    const data = await getHotels();
    return data;
  } catch (error) {
    console.error("Action error:", error);
    return { data: [] };
  }
}
