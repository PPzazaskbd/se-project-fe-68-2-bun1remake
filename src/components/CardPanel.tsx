"use client";

import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { HotelItem, HotelJson } from "@/interface";
import Card from "./Card";
import DateRangeToolbar from "./DateRangeToolbar";
import PaginationControls from "./PaginationControls";
import { getTodayIsoDate } from "@/libs/bookingStorage";
import FilterPanel from "./FilterPanel";
import {
  buildDateRangeHref,
  createDateRangeSearchParams,
  getDateRangeFromSearchParams,
  normalizeDateRange,
} from "@/libs/dateRangeParams";
import Link from "next/link";

const ITEMS_PER_PAGE = 4;

type FilterState = {
  rating: string;
  priceRange: string;
  accommodationType: string[];
  facility: string[];
  location: string[];
  accessibility: string[];
};

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
  const isAdmin = session?.user?.role === "admin"; 
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
  //filter
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<FilterState>({
    rating: "" as string,
    priceRange: "" as string,
    accommodationType: [] as string[],
    facility: [] as string[],
    location: [] as string[],
    accessibility: [] as string[],
  });
  const [page, setPage] = useState(1);

  const filteredHotels = useMemo(() => {
    const normalizedTerm = searchTerm.trim().toLowerCase();
    if (!normalizedTerm) return hotels;

    return hotels.filter((hotel) => {
      const specializationValues = [
        ...(hotel.specializations?.location ?? []),
        ...(hotel.specializations?.facility ?? []),
        ...(hotel.specializations?.accessibility ?? []),
      ];

      return [
        hotel.name,
        hotel.address,
        hotel.district,
        hotel.province,
        hotel.region,
        ...specializationValues,
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedTerm));
    });
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

  const toggleFilter = (category: keyof typeof selectedFilters, value: string) => {
    const isSingleSelect = category === "rating" || category === "priceRange";
    let nextValue: string | string[];

    if (isSingleSelect) {
      nextValue = (selectedFilters[category] as string) === value ? "" : value;
    } else {
      const current = selectedFilters[category] as string[];
      nextValue = current.includes(value)
        ? current.filter((item: string) => item !== value)
        : [...current, value];
    }

    setSelectedFilters((prev: FilterState) => ({
      ...prev,
      [category]: nextValue,
    }));

    const params = new URLSearchParams(searchParams.toString());
    const queryKey = category === "rating" ? "review" : (category as string);

    const PRICE_MAP: Record<string, string> = {
      "$": "1", "$$": "2", "$$$": "3", "$$$+": "4"
    };

    if (Array.isArray(nextValue)) {
      if (nextValue.length > 0) {
        params.set(queryKey, nextValue.join(","));
      } else {
        params.delete(queryKey);
      }
    } else {
      const queryValue = category === "priceRange" && nextValue
        ? PRICE_MAP[nextValue] ?? nextValue
        : nextValue;
        
      if (nextValue) {
        params.set(queryKey, nextValue);
      } else {
        params.delete(queryKey);
      }
    }

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };  
    

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

        <div className="mt-6">
          <div className="flex items-center justify-between gap-4">
            
            <div className="flex items-center gap-4">
              <label className="font-figma-nav text-[1rem] tracking-[0.08em] text-[var(--figma-red)]">
                FIND A HOTEL
              </label>
              <p className="font-figma-copy text-[1.15rem] text-[var(--figma-ink-soft)]">
                {filteredHotels.length} hotel{filteredHotels.length === 1 ? "" : "s"} available
              </p>
            </div>

            <div className="flex items-center gap-3">

              <button 
              //ปุ่ม filter
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                style={{ fontFamily: "'Cormorant Infant', serif" }}
                className={`
                  flex items-center justify-center gap-2
                  w-[120px] h-[60px] 
                  transition-all duration-300
                  drop-shadow-[0_4px_4px_rgba(0,0,0,0.25)]
                  border-[1px] border-[#AB192E]
                  ${isFilterOpen 
                    ? "bg-[#AB192E] text-[#FDF1E8]" 
                    : "bg-[#FDF1E8] text-[#AB192E]" 
                  }
                `}
              >
                <svg 
                  width="32" 
                  height="32" 
                  viewBox="20 16 28 28" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path 
                    d="M46 18H22L31.6 30.6133V39.3333L36.4 42V30.6133L46 18Z" 
                    stroke="currentColor" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="text-[24px] leading-[29px] font-[400]">Filter</span>
              </button>
              
              {isAdmin && (
                <Link href="/hotel/create">
                  <button className="flex items-center gap-2 bg-red-700 px-6 py-2 text-white shadow hover:bg-red-800 transition-colors cursor-pointer">
                    <img src="/addhotel.svg" alt="Add icon" className="w-5 h-5" />
                    <span className="font-figma-copy text-[1.15rem] tracking-wide">Add</span>
                  </button>
                </Link>
              )}
            </div>
          </div>
          
          <FilterPanel 
            isOpen={isFilterOpen} 
            selectedFilters={selectedFilters} 
            onToggle={toggleFilter} 
          />

          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="figma-input mt-4 w-full"
            placeholder="Search by hotel name, location, address"
          />
        </div>

        {visibleHotels.length > 0 ? (
          <div className="mt-10 grid gap-8 lg:grid-cols-2">
            {visibleHotels.map((hotel: HotelItem) => (
              <Card
                key={hotel.id || hotel._id}
                id={hotel.id || hotel._id}
                isAdmin={isAdmin}
                href={buildDateRangeHref(`/hotel/${hotel.id || hotel._id}`, {
                  checkIn: fromDate,
                  checkOut: toDate,
                  guestsAdult,
                  guestsChild,
                })}
                name={hotel.name}
                district={hotel.district}
                province={hotel.province}
                price={hotel.price}
                imgSrc={hotel.imgSrc}
                specializations={hotel.specializations}
              />
            ))}
          </div>
        ) : (
          <div className="mt-10 border border-[rgba(171,25,46,0.1)] bg-[rgba(255,245,244,0.55)] px-6 py-10 text-center">
            <p className="font-figma-nav text-[1.35rem] tracking-[0.08em] text-[var(--figma-red)]">
              NO HOTELS MATCH THIS FILTER
            </p>
            <p className="mt-2 font-figma-copy text-[1.3rem] text-[var(--figma-ink-soft)]">
              Try a different hotel name, location, address.
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