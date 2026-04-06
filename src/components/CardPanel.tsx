"use client";

import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { HotelItem, HotelJson } from "@/interface";
import Card from "./Card";
import DateRangeToolbar from "./DateRangeToolbar";
import PaginationControls from "./PaginationControls";
import { getTodayIsoDate } from "@/libs/bookingStorage";
import {
  buildDateRangeHref,
  createDateRangeSearchParams,
  getDateRangeFromSearchParams,
  normalizeDateRange,
} from "@/libs/dateRangeParams";

const ITEMS_PER_PAGE = 4;

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;

  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  );
}

export default function CardPanel({ hotelsJson }: { hotelsJson: HotelJson }) {
  const { data: session } = useSession();
  const hotels = hotelsJson.data ?? [];
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
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  const filteredHotels = useMemo(() => {
    const normalizedTerm = searchTerm.trim().toLowerCase();
    if (!normalizedTerm) return hotels;

    return hotels.filter((hotel) =>
      [hotel.name, hotel.address, hotel.province, hotel.region]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedTerm)),
    );
  }, [hotels, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredHotels.length / ITEMS_PER_PAGE));

  const visibleHotels = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredHotels.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredHotels, page]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

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
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        isEditableTarget(event.target)
      ) {
        return;
      }

      if (event.key === "ArrowLeft" && page > 1) {
        event.preventDefault();
        setPage((current) => Math.max(1, current - 1));
      }

      if (event.key === "ArrowRight" && page < totalPages) {
        event.preventDefault();
        setPage((current) => Math.min(totalPages, current + 1));
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [page, totalPages]);

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

  if (hotels.length === 0) {
    return (
      <div className="py-16 text-center font-figma-copy text-[1.6rem] text-[var(--figma-ink-soft)]">
        No hotels available at the moment.
      </div>
    );
  }

  return (
    <section className="figma-page py-6 sm:py-8">
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

        <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-end">
          <div>
            <label className="font-figma-nav text-[1rem] tracking-[0.08em] text-[var(--figma-red)]">
              FIND A HOTEL
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="figma-input mt-2"
              placeholder="Search by hotel name, city, or address"
            />
          </div>

          <p className="font-figma-copy text-[1.15rem] text-[var(--figma-ink-soft)] lg:text-right">
            {filteredHotels.length} hotel{filteredHotels.length === 1 ? "" : "s"} available
          </p>
        </div>

        {visibleHotels.length > 0 ? (
          <div className="mt-10 grid gap-8 lg:grid-cols-2">
            {visibleHotels.map((hotel: HotelItem) => (
              <Card
                key={hotel.id || hotel._id}
                href={buildDateRangeHref(`/hotel/${hotel.id || hotel._id}`, {
                  checkIn: fromDate,
                  checkOut: toDate,
                  guestsAdult,
                  guestsChild,
                })}
                name={hotel.name}
                address={hotel.address}
                province={hotel.province}
                price={hotel.price}
                imgSrc={hotel.imgSrc}
              />
            ))}
          </div>
        ) : (
          <div className="mt-10 border border-[rgba(171,25,46,0.1)] bg-[rgba(255,245,244,0.55)] px-6 py-10 text-center">
            <p className="font-figma-nav text-[1.35rem] tracking-[0.08em] text-[var(--figma-red)]">
              NO HOTELS MATCH THIS FILTER
            </p>
            <p className="mt-2 font-figma-copy text-[1.3rem] text-[var(--figma-ink-soft)]">
              Try a different hotel name, city, or address keyword.
            </p>
          </div>
        )}

        <PaginationControls
          currentPage={page}
          totalPages={totalPages}
          onPrevious={() => setPage((current) => Math.max(1, current - 1))}
          onNext={() => setPage((current) => Math.min(totalPages, current + 1))}
        />
      </div>
    </section>
  );
}
