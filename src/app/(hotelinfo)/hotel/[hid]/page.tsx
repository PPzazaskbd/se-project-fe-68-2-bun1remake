import HotelDetailClient from "@/components/HotelDetailClient";
import getVenue from "@/libs/getHotel";

export default async function HotelDetailPage({
  params,
}: {
  params: Promise<{ hid: string }>;
}) {
  const { hid } = await params;
  const venueJson = await getVenue(hid);
  const hotel = venueJson.data;

  if (!hotel) {
    return (
      <main className="figma-page flex items-center justify-center px-6">
        <p className="font-figma-copy text-[1.75rem] text-[var(--figma-red)]">
          Hotel not found.
        </p>
      </main>
    );
  }

  return <HotelDetailClient hotel={hotel} />;
}
