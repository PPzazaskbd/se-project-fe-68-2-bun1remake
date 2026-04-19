"use client";

import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { HotelItem, HotelJson } from "@/interface";
import Card from "./Card";
import DateRangeToolbar from "./DateRangeToolbar";
import PaginationControls from "./PaginationControls";
import FilterPanel from "./FilterPanel";
import { getTodayIsoDate } from "@/libs/bookingStorage";
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
  const [page, setPage] = useState(1);

  // Filter State
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<FilterState>({
    rating: "",
    priceRange: "",
    accommodationType: [],
    facility: [],
    location: [],
    accessibility: [],
  });

  // --- Logic for Toggling Filters ---
  const toggleFilter = (category: keyof FilterState, value: string) => {
    setSelectedFilters((prev) => {
      const current = prev[category];
      if (Array.isArray(current)) {
        return {
          ...prev,
          [category]: current.includes(value)
            ? current.filter((item) => item !== value)
            : [...current, value],
        };
      }
      return {
        ...prev,
        [category]: current === value ? "" : value,
      };
    });
  };

  // --- Logic for Filtering Hotels (Using Specializations) ---
  const filteredHotels = useMemo(() => {
    return hotels.filter((hotel) => {
      // 1. Text Search
      const normalizedTerm = searchTerm.trim().toLowerCase();
      const matchesSearch = !normalizedTerm || 
        [hotel.name, hotel.address, hotel.province, hotel.region]
          .filter(Boolean)
          .some((v) => v.toLowerCase().includes(normalizedTerm));

      if (!matchesSearch) return false;

      // 2. Rating & Price (Single Select)
      if (selectedFilters.rating) {
        const hRating = (hotel as any).rating || (hotel as any).review;
        if (String(hRating) !== selectedFilters.rating) return false;
      }
      
      if (selectedFilters.priceRange) {
        const p = hotel.price;
        if (selectedFilters.priceRange === "$" && p > 1000) return false;
        if (selectedFilters.priceRange === "$$" && (p <= 1000 || p > 3000)) return false;
        if (selectedFilters.priceRange === "$$$" && (p <= 3000 || p > 6000)) return false;
        if (selectedFilters.priceRange === "$$$+" && p <= 6000) return false;
      }

      // 3. Tag Filters (Multi-select)
      const specs = hotel.specializations;

      if (selectedFilters.facility.length > 0) {
        const hFac = (specs?.facility || []).map(f => f.toLowerCase());
        if (!selectedFilters.facility.every(f => hFac.includes(f.toLowerCase()))) return false;
      }

      if (selectedFilters.location.length > 0) {
        const hLoc = (specs?.location || []).map(l => l.toLowerCase());
        if (!selectedFilters.location.some(l => hLoc.includes(l.toLowerCase()))) return false;
      }

      if (selectedFilters.accessibility.length > 0) {
        const hAcc = (specs?.accessibility || []).map(a => a.toLowerCase());
        if (!selectedFilters.accessibility.every(a => hAcc.includes(a.toLowerCase()))) return false;
      }

      return true;
    });
  }, [hotels, searchTerm, selectedFilters]);

  const totalPages = Math.max(1, Math.ceil(filteredHotels.length / ITEMS_PER_PAGE));

  const visibleHotels = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredHotels.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredHotels, page]);

  useEffect(() => { setPage(1); }, [searchTerm, selectedFilters]);

  // Sync state with URL params
  useEffect(() => {
    setFromDate(urlDateRange.checkIn);
    setToDate(urlDateRange.checkOut);
    setGuestsAdult(urlDateRange.guestsAdult);
    setGuestsChild(urlDateRange.guestsChild);
  }, [urlDateRange]);

  const syncToolbarState = (inDate: string, outDate: string, adults: number, kids: number) => {
    const normalized = normalizeDateRange(inDate, outDate, today, adults, kids);
    setFromDate(normalized.checkIn);
    setToDate(normalized.checkOut);
    setGuestsAdult(normalized.guestsAdult);
    setGuestsChild(normalized.guestsChild);
    const nextParams = createDateRangeSearchParams(searchParams, normalized);
    router.replace(`${pathname}?${nextParams.toString()}`, { scroll: false });
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
          fromDate={fromDate} toDate={toDate}
          guestsAdult={guestsAdult} guestsChild={guestsChild}
          onFromDateChange={(v) => syncToolbarState(v, toDate, guestsAdult, guestsChild)}
          onToDateChange={(v) => syncToolbarState(fromDate, v, guestsAdult, guestsChild)}
          onGuestsAdultChange={(v) => syncToolbarState(fromDate, toDate, v, guestsChild)}
          onGuestsChildChange={(v) => syncToolbarState(fromDate, toDate, guestsAdult, v)}
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
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                style={{ fontFamily: "'Cormorant Infant', serif" }}
                className={`
                  flex items-center justify-center gap-2
                  w-[120px] h-[60px] 
                  transition-all duration-300
                  drop-shadow-[0_4px_4px_rgba(0,0,0,0.25)]
                  border-[1px] border-[#AB192E]
                  ${isFilterOpen ? "bg-[#AB192E] text-[#FDF1E8]" : "bg-[#FDF1E8] text-[#AB192E]"}
                `}
              >
                <svg width="32" height="32" viewBox="20 16 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M46 18H22L31.6 30.6133V39.3333L36.4 42V30.6133L46 18Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-[24px] leading-[29px] font-[400]">Filter</span>
              </button>
              
              {isAdmin && (
                <Link href="/hotel/create">
                  <button className="flex items-center gap-2 bg-red-700 px-6 py-2 text-white shadow hover:bg-red-800 transition-colors cursor-pointer">
                    <img src="/addhotel.svg" alt="Add" className="w-5 h-5" />
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
            onChange={(e) => setSearchTerm(e.target.value)}
            className="figma-input mt-4 w-full"
            placeholder="Search by hotel name, city, or address"
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
                  checkIn: fromDate, checkOut: toDate,
                  guestsAdult, guestsChild,
                })}
                name={hotel.name}
                district={hotel.address}
                province={hotel.province}
                price={hotel.price}
                imgSrc={hotel.imgSrc}
                specializations={hotel.specializations}
              />
            ))}
          </div>
        ) : (
          <div className="mt-10 border border-[rgba(171,25,46,0.1)] bg-[rgba(255,245,244,0.55)] px-6 py-10 text-center">
            <p className="font-figma-nav text-[1.35rem] tracking-[0.08em] text-[var(--figma-red)] uppercase">
              No hotels match this filter
            </p>
          </div>
        )}

        <PaginationControls
          currentPage={page}
          totalPages={totalPages}
          onPrevious={() => setPage((c) => Math.max(1, c - 1))}
          onNext={() => setPage((c) => Math.min(totalPages, c + 1))}
        />
      </div>
    </section>
  );
}