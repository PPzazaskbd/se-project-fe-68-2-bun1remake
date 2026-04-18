import CardPanel from "@/components/CardPanel";
import getHotels from "@/libs/getHotels";

export const dynamic = "force-dynamic";

export default async function HotelsPage() {
  const hotelsJson = await getHotels({ noStore: true }).catch(() => ({
    success: false,
    count: 0,
    data: [],
  }));

  return <CardPanel hotelsJson={hotelsJson} />;
}
