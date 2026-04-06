import CardPanel from "@/components/CardPanel";
import getHotels from "@/libs/getHotels";

export default async function HotelsPage() {
  const hotelsJson = await getHotels();

  return <CardPanel hotelsJson={hotelsJson} />;
}
