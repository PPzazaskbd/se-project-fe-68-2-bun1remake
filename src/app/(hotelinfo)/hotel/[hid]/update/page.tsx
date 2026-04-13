"use client";

import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import HotelWizard from "@/components/HotelWizard";
import { HotelItem } from "@/interface";
import { HotelPayload, updateHotel } from "@/libs/hotelsAdminApi";
import { buildBackendUrl } from "@/libs/backendApiBase";

export default function UpdateHotelPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const hid = typeof params.hid === "string" ? params.hid : "";

  const [hotel, setHotel] = useState<HotelItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const token = session?.user?.token || "";
  const role = session?.user?.role || "";
  const isAdmin = role === "admin" || session?.user?.email === "admin@example.com";

  useEffect(() => {
    if (!hid) return;
    fetch(buildBackendUrl(`/hotels/${encodeURIComponent(hid)}`), { cache: "no-store" })
      .then((r) => r.json())
      .then((data: { data?: HotelItem }) => setHotel(data.data ?? null))
      .catch(() => setHotel(null))
      .finally(() => setIsLoading(false));
  }, [hid]);

  if (status === "loading" || isLoading) {
    return (
      <main className="figma-page flex items-center justify-center">
        <p className="font-figma-copy text-[1.5rem] text-[var(--figma-ink-soft)]">Loading...</p>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="figma-page flex items-center justify-center px-6">
        <p className="font-figma-copy text-[1.75rem] text-[var(--figma-red)]">Access denied.</p>
      </main>
    );
  }

  if (!hotel) {
    return (
      <main className="figma-page flex items-center justify-center px-6">
        <p className="font-figma-copy text-[1.75rem] text-[var(--figma-red)]">Hotel not found.</p>
      </main>
    );
  }

  const initialData: Partial<HotelPayload> = {
    name: hotel.name,
    address: hotel.address,
    district: hotel.district,
    province: hotel.province,
    postalcode: hotel.postalcode,
    region: hotel.region,
    tel: hotel.tel,
    description: hotel.description,
    imgSrc: hotel.imgSrc ?? "",
    price: hotel.price,
    tags: hotel.tags ?? [],
  };

  const handleSubmit = async (data: HotelPayload) => {
    setIsSaving(true);
    try {
      await updateHotel(hid, token, data);
      router.push("/admin/hotels");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <HotelWizard
      mode="update"
      initialData={initialData}
      onSubmit={handleSubmit}
      isSaving={isSaving}
    />
  );
}
