"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import HotelWizard from "@/components/HotelWizard";
import { createHotel, HotelPayload } from "@/libs/hotelsAdminApi";

export default function CreateHotelPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  const token = session?.user?.token || "";
  const role = session?.user?.role || "";
  const isAdmin = role === "admin" || session?.user?.email === "admin@example.com";

  if (status === "loading") {
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

  const handleSubmit = async (data: HotelPayload) => {
    setIsSaving(true);
    try {
      await createHotel(token, data);
      router.push("/admin/hotels");
    } finally {
      setIsSaving(false);
    }
  };

  return <HotelWizard mode="create" onSubmit={handleSubmit} isSaving={isSaving} />;
}
