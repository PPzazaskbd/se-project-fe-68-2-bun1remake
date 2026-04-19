import CardPanel from "@/components/CardPanel";
import getHotels from "@/libs/getHotels";

export default async function HotelsPage() {
  const hotelsJson = await getHotels().catch(() => ({
    success: false,
    count: 0,
    data: [],
  }));

  return <CardPanel hotelsJson={hotelsJson} />;
}
