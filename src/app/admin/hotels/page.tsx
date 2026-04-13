"use client";

import DismissibleNotice from "@/components/DismissibleNotice";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { HotelItem } from "@/interface";
import { useDismissibleNotice } from "@/libs/useDismissibleNotice";
import { deleteHotel } from "@/libs/hotelsAdminApi";
import { buildBackendUrl } from "@/libs/backendApiBase";
import Arrow from "@/components/Arrow";

export default function AdminHotelsPage() {
  const { data: session, status } = useSession();
  const token = session?.user?.token || "";
  const role = session?.user?.role || "";

  const [hotels, setHotels] = useState<HotelItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const { notice, showNotice, dismissNotice } = useDismissibleNotice();

  const isAdmin = role === "admin" || session?.user?.email === "admin@example.com";

  useEffect(() => {
    if (status === "loading") return;
    if (!isAdmin) return;

    fetch(buildBackendUrl("/hotels"), { cache: "no-store" })
      .then((r) => r.json())
      .then((data: { data?: HotelItem[] }) => {
        setHotels(data.data ?? []);
      })
      .catch(() => setHotels([]))
      .finally(() => setIsLoading(false));
  }, [isAdmin, status]);

  const handleDelete = async (hotelId: string) => {
    if (!token) return;

    try {
      await deleteHotel(hotelId, token);
      setHotels((prev) => prev.filter((h) => h._id !== hotelId && h.id !== hotelId));
      setConfirmDeleteId(null);
    } catch (err) {
      showNotice({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to delete hotel.",
      });
      setConfirmDeleteId(null);
    }
  };

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

  return (
    <main className="figma-page py-10 sm:py-12">
      <div className="figma-shell">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-figma-copy text-[2.6rem] text-[var(--figma-ink)] sm:text-[3rem]">
            Hotel Management
          </h1>
          <div className="flex items-center gap-4">
            <Link
              href="/hotel/create"
              className="figma-button px-5 py-3 font-figma-nav text-[1.3rem]"
            >
              + ADD HOTEL
            </Link>
            <Link
              href="/admin"
              className="figma-text-action flex items-center gap-2 font-figma-copy text-[1.2rem] text-[var(--figma-red)]"
            >
              <Arrow direction="left" />
              Bookings
            </Link>
          </div>
        </div>

        <DismissibleNotice notice={notice} onClose={dismissNotice} className="mb-6" />

        {/* Hotel list */}
        {isLoading ? (
          <p className="font-figma-copy text-[1.4rem] text-[var(--figma-ink-soft)]">
            Loading hotels...
          </p>
        ) : hotels.length === 0 ? (
          <p className="font-figma-copy text-[1.4rem] text-[var(--figma-ink-soft)]">
            No hotels yet.
          </p>
        ) : (
          <div className="space-y-4">
            {hotels.map((hotel) => {
              const hotelId = hotel._id || hotel.id || "";
              const isConfirming = confirmDeleteId === hotelId;

              return (
                <article
                  key={hotelId}
                  className="border border-[rgba(171,25,46,0.08)] bg-[#fff8f3] p-4 sm:p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <p className="font-figma-copy text-[1.65rem] text-[var(--figma-ink)]">
                        {hotel.name}
                      </p>
                      <p className="font-figma-copy text-[1.15rem] text-[var(--figma-ink-soft)]">
                        {hotel.address}, {hotel.province}
                      </p>
                      <p className="font-figma-copy text-[1.15rem] text-[var(--figma-ink)]">
                        ${hotel.price.toLocaleString()} / night
                      </p>
                      {(hotel.tags ?? []).length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {(hotel.tags ?? []).map((tag) => (
                            <span
                              key={tag}
                              className="border border-[rgba(171,25,46,0.15)] px-2 py-0.5 font-figma-copy text-[0.95rem] text-[var(--figma-ink-soft)]"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>

                    <div className="flex gap-2">
                      <Link
                        href={`/hotel/${hotelId}/update`}
                        className="figma-button px-4 py-2 font-figma-nav text-[1.1rem]"
                      >
                        EDIT
                      </Link>

                      {isConfirming ? (
                        <div className="flex items-center gap-2">
                          <span className="font-figma-copy text-[1.05rem] text-[var(--figma-red)]">
                            Confirm?
                          </span>
                          <button
                            type="button"
                            onClick={() => void handleDelete(hotelId)}
                            className="figma-button px-3 py-2 font-figma-nav text-[1rem]"
                          >
                            YES
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="figma-button-secondary px-3 py-2 font-figma-nav text-[1rem]"
                          >
                            NO
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(hotelId)}
                          className="figma-button-secondary px-4 py-2 font-figma-nav text-[1.1rem]"
                        >
                          DELETE
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
