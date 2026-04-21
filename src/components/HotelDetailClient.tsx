"use client";

import DismissibleNotice from "@/components/DismissibleNotice";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { HotelItem } from "@/interface";
import { useDismissibleNotice } from "@/libs/useDismissibleNotice";
import DateRangeToolbar from "./DateRangeToolbar";
import Arrow from "./Arrow";
import { calculateNights, getTodayIsoDate } from "@/libs/bookingStorage";
import { createBooking } from "@/libs/bookingsApi";
import HotelReviews from "./HotelReviews";
import {
  buildDateRangeHref,
  createDateRangeSearchParams,
  getDateRangeFromSearchParams,
  normalizeDateRange,
} from "@/libs/dateRangeParams";

interface HotelDetailClientProps {
  hotel: HotelItem;
}

const BOOKING_ARMING_DELAY_MS = 2000;

function generateRandomRoomNumber() {
  return String(Math.floor(Math.random() * 999) + 1).padStart(3, "0");
}

function formatTagLabel(value: string) {
  return value
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function HotelDetailClient({ hotel }: HotelDetailClientProps) {
  const { data: session, update } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const today = getTodayIsoDate();
  const urlDateRange = getDateRangeFromSearchParams(
    searchParams,
    today,
    session?.user,
  );
  const [fromDate, setFromDate] = useState(urlDateRange.checkIn);
  const [toDate, setToDate] = useState(urlDateRange.checkOut);
  const [guestsAdult, setGuestsAdult] = useState(urlDateRange.guestsAdult);
  const [guestsChild, setGuestsChild] = useState(urlDateRange.guestsChild);
  const [bookingState, setBookingState] = useState<
    "idle" | "arming" | "submitting"
  >("idle");
  const { notice, showNotice, dismissNotice } = useDismissibleNotice();
  const bookingTimerRef = useRef<number | null>(null);
  const hotelId = hotel.id || hotel._id;
  const allTags = Array.from(
    new Set(
      [
        ...(hotel.specializations?.location ?? []),
        ...(hotel.specializations?.facility ?? []),
        ...(hotel.specializations?.accessibility ?? []),
      ]
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  );
  const nights = Math.max(1, calculateNights(fromDate, toDate));
  const total = hotel.price * nights;
  const isAdmin = session?.user?.role === "admin";
  const bookingStatusLabel =
    bookingState === "arming"
      ? "Click to Cancel"
      : bookingState === "submitting"
        ? "Sending to backend..."
        : "";
  const bookingSearchParams = useMemo(() => {
    const nextParams = createDateRangeSearchParams(new URLSearchParams(), {
      checkIn: fromDate,
      checkOut: toDate,
      guestsAdult,
      guestsChild,
    });
    nextParams.set("hotelId", hotelId);
    nextParams.set("venue", hotel.name);
    return nextParams;
  }, [fromDate, guestsAdult, guestsChild, hotel.name, hotelId, toDate]);
  const callbackUrl = useMemo(
    () => `${pathname}?${bookingSearchParams.toString()}`,
    [bookingSearchParams, pathname],
  );

  useEffect(() => {
    setFromDate(urlDateRange.checkIn);
    setToDate(urlDateRange.checkOut);
    setGuestsAdult(urlDateRange.guestsAdult);
    setGuestsChild(urlDateRange.guestsChild);
  }, [
    urlDateRange.checkIn,
    urlDateRange.checkOut,
    urlDateRange.guestsAdult,
    urlDateRange.guestsChild,
  ]);

  useEffect(() => {
    return () => {
      if (bookingTimerRef.current !== null) {
        window.clearTimeout(bookingTimerRef.current);
      }
    };
  }, []);

  const syncToolbarState = (
    nextCheckIn: string,
    nextCheckOut: string,
    nextGuestsAdult: number,
    nextGuestsChild: number,
  ) => {
    const normalizedRange = normalizeDateRange(
      nextCheckIn,
      nextCheckOut,
      today,
      nextGuestsAdult,
      nextGuestsChild,
    );

    setFromDate(normalizedRange.checkIn);
    setToDate(normalizedRange.checkOut);
    setGuestsAdult(normalizedRange.guestsAdult);
    setGuestsChild(normalizedRange.guestsChild);

    const nextSearchParams = createDateRangeSearchParams(
      searchParams,
      normalizedRange,
    );

    router.replace(`${pathname}?${nextSearchParams.toString()}`, {
      scroll: false,
    });
  };

  const handleCancelBooking = () => {
    if (bookingTimerRef.current !== null) {
      window.clearTimeout(bookingTimerRef.current);
      bookingTimerRef.current = null;
    }

    setBookingState("idle");
  };

  const handleBook = () => {
    dismissNotice(true);

    if (!session?.user?.token) {
      router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
      return;
    }

    if (bookingState === "arming") {
      handleCancelBooking();
      return;
    }

    if (bookingState === "submitting") {
      return;
    }

    const roomNumber = generateRandomRoomNumber();
    setBookingState("arming");

    bookingTimerRef.current = window.setTimeout(async () => {
      bookingTimerRef.current = null;
      setBookingState("submitting");

      try {
        await createBooking(hotelId, session.user.token, {
          startDate: fromDate,
          nights,
          roomNumber,
          guestsAdult,
          guestsChild,
        });
        await update({
          user: {
            ...session.user,
            defaultGuestsAdult: guestsAdult,
            defaultGuestsChild: guestsChild,
          },
        }).catch(() => null);

        router.push("/mybooking?booked=1");
        router.refresh();
      } catch (submitError) {
        showNotice({
          type: "error",
          message:
            submitError instanceof Error
              ? submitError.message
              : "Booking service unavailable.",
        });
        setBookingState("idle");
      }
    }, BOOKING_ARMING_DELAY_MS);
  };

  return (
    <main className="figma-page py-6 sm:py-8">
      <div className="figma-shell">
        <DateRangeToolbar
          fromDate={fromDate}
          toDate={toDate}
          guestsAdult={guestsAdult}
          guestsChild={guestsChild}
          onFromDateChange={(value) => {
            syncToolbarState(value, toDate, guestsAdult, guestsChild);
          }}
          onToDateChange={(value) => {
            syncToolbarState(fromDate, value, guestsAdult, guestsChild);
          }}
          onGuestsAdultChange={(value) => {
            syncToolbarState(fromDate, toDate, value, guestsChild);
          }}
          onGuestsChildChange={(value) => {
            syncToolbarState(fromDate, toDate, guestsAdult, value);
          }}
        />

        <section className="mt-8 border border-[rgba(171,25,46,0.08)] bg-[rgba(255,245,244,0.45)] p-5 sm:p-10">
          <div className="grid gap-8 xl:grid-cols-[1.4fr_0.86fr]">
            <div>
              <div className="aspect-[896/400] overflow-hidden bg-[#efe3d8]">
                {hotel.imgSrc ? (
                  <img
                    src={hotel.imgSrc}
                    alt={hotel.name}
                    fetchPriority="high"
                    className="block h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center font-figma-copy text-[2rem] text-[var(--figma-ink-soft)]">
                    Some photo
                  </div>
                )}
              </div>

              <h1 className="mt-6 font-figma-copy text-[2.7rem] leading-none text-[var(--figma-ink)] sm:text-[3.75rem]">
                {hotel.name}
              </h1>

              <p className="mt-4 max-w-[56rem] font-figma-copy text-[1.25rem] leading-[1.45] text-[var(--figma-ink-soft)] sm:text-[1.55rem]">
                {hotel.description}
              </p>

              <p className="mt-5 flex items-start gap-3 font-figma-copy text-[1.2rem] text-[var(--figma-ink)] sm:text-[1.45rem]">
                <span className="pb-1 text-[var(--figma-red)]">+</span>
                <span>{hotel.address}</span>
              </p>

              {allTags.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {allTags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-[#AB192E] px-3 py-[0.35rem] font-figma-nav text-[0.9rem] tracking-[0.03em] text-[#FBEFDF] shadow-[0_4px_4px_rgba(0,0,0,0.15)] sm:text-[1rem]"
                    >
                      {formatTagLabel(tag)}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="flex flex-col justify-between gap-8">
              <div className="space-y-5 font-figma-copy text-[1.4rem] text-[var(--figma-ink)] sm:text-[1.7rem]">
                <div className="flex items-center justify-between gap-6">
                  <span>Price :</span>
                  <span>${hotel.price.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between gap-6">
                  <span>Night :</span>
                  <span>{nights}</span>
                </div>
                <div className="flex items-center justify-between gap-6">
                  <span>Total :</span>
                  <span>${total.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex min-h-[1.75rem] items-center justify-center">
                    {bookingStatusLabel ? (
                      <p
                        className={`text-center font-figma-copy text-[1.05rem] sm:text-[1.15rem] ${
                          bookingState === "arming"
                            ? "text-[var(--figma-red)]"
                            : "text-[var(--figma-ink-soft)]"
                        }`}
                      >
                        {bookingStatusLabel}
                      </p>
                    ) : null}
                  </div>

                  <div
                    className={`h-[6px] overflow-hidden rounded-full ${
                      bookingState === "arming"
                        ? "bg-[rgba(171,25,46,0.12)]"
                        : "bg-transparent"
                    }`}
                  >
                    {bookingState === "arming" ? (
                      <div
                        className="figma-booking-progress h-full w-full rounded-full"
                        style={{
                          animationDuration: `${BOOKING_ARMING_DELAY_MS}ms`,
                        }}
                      />
                    ) : null}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleBook}
                  disabled={bookingState === "submitting"}
                  className="figma-button figma-button-prominent flex h-[4.5rem] w-full font-figma-nav text-[2rem]"
                >
                  {bookingState === "idle"
                    ? "BOOK"
                    : bookingState === "arming"
                      ? "CANCEL"
                      : "BOOKING"}
                </button>

                <div className="flex items-center justify-between gap-3">
                  <Link
                    href={buildDateRangeHref("/hotel", {
                      checkIn: fromDate,
                      checkOut: toDate,
                      guestsAdult,
                      guestsChild,
                    })}
                    className="figma-text-action inline-flex items-center gap-2 font-figma-copy text-[1.35rem] text-[var(--figma-red)]"
                  >
                    <span>
                      <Arrow direction="left" />
                    </span>
                    <span>Go Back</span>
                  </Link>

                  {isAdmin ? (
                    <div className="flex items-center gap-2">
                      <Link href={`/hotel/${hotelId}/update`}>
                        <button className="flex h-10 w-10 items-center justify-center bg-red-700 text-white shadow transition-colors hover:bg-red-800 cursor-pointer">
                          <img
                            src="/edit.svg"
                            alt="Edit icon"
                            className="h-[18px] w-[18px]"
                          />
                        </button>
                      </Link>

                      <Link
                        href={`/hotel/deleteHotel?id=${hotelId}&name=${encodeURIComponent(hotel.name)}`}
                      >
                        <button className="flex h-10 w-10 items-center justify-center bg-red-700 text-white shadow transition-colors hover:bg-red-800 cursor-pointer">
                          <img
                            src="/delete.svg"
                            alt="Delete icon"
                            className="h-[18px] w-[18px]"
                          />
                        </button>
                      </Link>
                    </div>
                  ) : null}
                </div>

                <DismissibleNotice notice={notice} onClose={dismissNotice} />
              </div>
            </div>
          </div>
        </section>
      </div>
      <div className="figma-shell">
        <HotelReviews hotelId={hotelId} />
      </div>
    </main>
  );
}
