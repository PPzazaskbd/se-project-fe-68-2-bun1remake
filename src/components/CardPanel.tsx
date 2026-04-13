"use client";

import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { HotelItem, HotelJson } from "@/interface";
import Card from "./Card";
import DateRangeToolbar from "./DateRangeToolbar";
import PaginationControls from "./PaginationControls";
import { getTodayIsoDate } from "@/libs/bookingStorage";
import { deleteHotel } from "@/libs/hotelsAdminApi";
import {
  buildDateRangeHref,
  createDateRangeSearchParams,
  getDateRangeFromSearchParams,
  normalizeDateRange,
} from "@/libs/dateRangeParams";

const ITEMS_PER_PAGE = 4;

const PRICE_TIERS = [
  { label: "$", min: 0, max: 100 },
  { label: "$$", min: 100, max: 300 },
  { label: "$$$", min: 300, max: 700 },
  { label: "$$$+", min: 700, max: Infinity },
];

const FACILITY_TAGS = ["Pool", "Spa", "Gym", "Free-Parking", "Pet-Friendly", "Breakfast-Included", "Wifi"];
const ROOM_TYPES = ["1-Person-Room", "2-Person-Room", "Suite", "Villa"];

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  );
}

function FilterIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

function AddIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

export default function CardPanel({ hotelsJson }: { hotelsJson: HotelJson }) {
  const { data: session } = useSession();
  const hotels = hotelsJson.data ?? [];
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const today = getTodayIsoDate();
  const urlDateRange = getDateRangeFromSearchParams(searchParams, today, session?.user);

  const token = session?.user?.token || "";
  const role = session?.user?.role || "";
  const isAdmin = role === "admin" || session?.user?.email === "admin@example.com";

  const [fromDate, setFromDate] = useState(urlDateRange.checkIn);
  const [toDate, setToDate] = useState(urlDateRange.checkOut);
  const [guestsAdult, setGuestsAdult] = useState(urlDateRange.guestsAdult);
  const [guestsChild, setGuestsChild] = useState(urlDateRange.guestsChild);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  // Filter state
  const [showFilter, setShowFilter] = useState(false);
  const [selectedPrices, setSelectedPrices] = useState<string[]>([]);
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);
  const [selectedRoomTypes, setSelectedRoomTypes] = useState<string[]>([]);

  // Delete modal state
  const [deletingHotel, setDeletingHotel] = useState<HotelItem | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [hotelList, setHotelList] = useState<HotelItem[]>(hotels);

  useEffect(() => { setHotelList(hotels); }, [hotels]);

  const togglePrice = (label: string) =>
    setSelectedPrices((p) => p.includes(label) ? p.filter((x) => x !== label) : [...p, label]);

  const toggleFacility = (tag: string) =>
    setSelectedFacilities((p) => p.includes(tag) ? p.filter((x) => x !== tag) : [...p, tag]);

  const toggleRoomType = (tag: string) =>
    setSelectedRoomTypes((p) => p.includes(tag) ? p.filter((x) => x !== tag) : [...p, tag]);

  const filteredHotels = useMemo(() => {
    let list = hotelList;

    const term = searchTerm.trim().toLowerCase();
    if (term) {
      list = list.filter((h) =>
        [h.name, h.address, h.province, h.region]
          .filter(Boolean)
          .some((v) => v.toLowerCase().includes(term)),
      );
    }

    if (selectedPrices.length > 0) {
      list = list.filter((h) =>
        selectedPrices.some((label) => {
          const tier = PRICE_TIERS.find((t) => t.label === label);
          return tier && h.price >= tier.min && h.price < tier.max;
        }),
      );
    }

    if (selectedFacilities.length > 0) {
      list = list.filter((h) =>
        selectedFacilities.every((f) => h.tags?.includes(f)),
      );
    }

    if (selectedRoomTypes.length > 0) {
      list = list.filter((h) =>
        selectedRoomTypes.some((r) => h.tags?.includes(r)),
      );
    }

    return list;
  }, [hotelList, searchTerm, selectedPrices, selectedFacilities, selectedRoomTypes]);

  const totalPages = Math.max(1, Math.ceil(filteredHotels.length / ITEMS_PER_PAGE));

  const visibleHotels = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredHotels.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredHotels, page]);

  useEffect(() => { setPage(1); }, [searchTerm, selectedPrices, selectedFacilities, selectedRoomTypes]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  useEffect(() => {
    setFromDate(urlDateRange.checkIn);
    setToDate(urlDateRange.checkOut);
    setGuestsAdult(urlDateRange.guestsAdult);
    setGuestsChild(urlDateRange.guestsChild);
  }, [urlDateRange.checkIn, urlDateRange.checkOut, urlDateRange.guestsAdult, urlDateRange.guestsChild]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || isEditableTarget(event.target)) return;
      if (event.key === "ArrowLeft" && page > 1) { event.preventDefault(); setPage((c) => Math.max(1, c - 1)); }
      if (event.key === "ArrowRight" && page < totalPages) { event.preventDefault(); setPage((c) => Math.min(totalPages, c + 1)); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [page, totalPages]);

  const syncToolbarState = (ci: string, co: string, ga: number, gc: number) => {
    const r = normalizeDateRange(ci, co, today, ga, gc);
    setFromDate(r.checkIn); setToDate(r.checkOut); setGuestsAdult(r.guestsAdult); setGuestsChild(r.guestsChild);
    const next = createDateRangeSearchParams(searchParams, r);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };

  const handleDeleteConfirm = async () => {
    if (!deletingHotel || !token) return;
    const hotelId = deletingHotel._id || deletingHotel.id || "";
    setIsDeleting(true);
    try {
      await deleteHotel(hotelId, token);
      setHotelList((prev) => prev.filter((h) => h._id !== hotelId && h.id !== hotelId));
      setDeletingHotel(null);
      setConfirmText("");
    } finally {
      setIsDeleting(false);
    }
  };

  const activeFilterCount = selectedPrices.length + selectedFacilities.length + selectedRoomTypes.length;

  return (
    <section className="figma-page py-6 sm:py-8">
      <div className="figma-shell">
        <DateRangeToolbar
          fromDate={fromDate} toDate={toDate} guestsAdult={guestsAdult} guestsChild={guestsChild}
          onFromDateChange={(v) => syncToolbarState(v, toDate, guestsAdult, guestsChild)}
          onToDateChange={(v) => syncToolbarState(fromDate, v, guestsAdult, guestsChild)}
          onGuestsAdultChange={(v) => syncToolbarState(fromDate, toDate, v, guestsChild)}
          onGuestsChildChange={(v) => syncToolbarState(fromDate, toDate, guestsAdult, v)}
        />

        {/* Search + action row */}
        <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div>
            <label className="font-figma-nav text-[1rem] tracking-[0.08em] text-[var(--figma-red)]">
              FIND A HOTEL
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="figma-input mt-2"
              placeholder="Search by hotel name, city, or address"
            />
          </div>

          <div className="flex items-end gap-2 pb-0.5">
            <button
              type="button"
              onClick={() => setShowFilter((v) => !v)}
              className={`flex items-center gap-1.5 border px-4 py-2 font-figma-nav text-[0.95rem] tracking-widest transition-colors ${
                showFilter || activeFilterCount > 0
                  ? "border-[var(--figma-red)] bg-[var(--figma-red)] text-white"
                  : "border-[rgba(171,25,46,0.3)] text-[var(--figma-red)] hover:bg-[rgba(171,25,46,0.05)]"
              }`}
            >
              <FilterIcon />
              Filter{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
            </button>
            {isAdmin && (
              <a
                href="/hotel/create"
                className="flex items-center gap-1.5 bg-[var(--figma-red)] px-4 py-2 font-figma-nav text-[0.95rem] tracking-widest text-white hover:opacity-90"
              >
                <AddIcon />
                Add
              </a>
            )}
          </div>
        </div>

        <p className="mt-2 font-figma-copy text-[1.1rem] text-[var(--figma-ink-soft)]">
          {filteredHotels.length} hotel{filteredHotels.length === 1 ? "" : "s"} available
        </p>

        {/* Filter panel */}
        {showFilter && (
          <div className="mt-4 border border-[rgba(171,25,46,0.1)] bg-[rgba(255,248,245,0.8)] p-5">

            <div className="mb-4">
              <p className="mb-2 font-figma-nav text-[0.9rem] tracking-widest text-[var(--figma-ink)]">Rating</p>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5].map((r) => (
                  <span key={r} className="border border-[rgba(171,25,46,0.15)] px-3 py-1 font-figma-copy text-[0.95rem] text-[var(--figma-ink-soft)]">
                    {r}★
                  </span>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <p className="mb-2 font-figma-nav text-[0.9rem] tracking-widest text-[var(--figma-ink)]">Price</p>
              <div className="flex flex-wrap gap-2">
                {PRICE_TIERS.map(({ label }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => togglePrice(label)}
                    className={`border px-3 py-1 font-figma-copy text-[0.95rem] transition-colors ${
                      selectedPrices.includes(label)
                        ? "border-[var(--figma-red)] bg-[var(--figma-red)] text-white"
                        : "border-[rgba(171,25,46,0.2)] text-[var(--figma-ink)] hover:border-[var(--figma-red)]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <p className="mb-2 font-figma-nav text-[0.9rem] tracking-widest text-[var(--figma-ink)]">Accommodation type</p>
              <div className="flex flex-wrap gap-2">
                {ROOM_TYPES.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => toggleRoomType(r)}
                    className={`border px-3 py-1 font-figma-copy text-[0.95rem] transition-colors ${
                      selectedRoomTypes.includes(r)
                        ? "border-[var(--figma-red)] bg-[var(--figma-red)] text-white"
                        : "border-[rgba(171,25,46,0.2)] text-[var(--figma-ink)] hover:border-[var(--figma-red)]"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 font-figma-nav text-[0.9rem] tracking-widest text-[var(--figma-ink)]">Facility</p>
              <div className="flex flex-wrap gap-2">
                {FACILITY_TAGS.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => toggleFacility(f)}
                    className={`border px-3 py-1 font-figma-copy text-[0.95rem] transition-colors ${
                      selectedFacilities.includes(f)
                        ? "border-[var(--figma-red)] bg-[var(--figma-red)] text-white"
                        : "border-[rgba(171,25,46,0.2)] text-[var(--figma-ink)] hover:border-[var(--figma-red)]"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={() => { setSelectedPrices([]); setSelectedFacilities([]); setSelectedRoomTypes([]); }}
                className="mt-4 font-figma-copy text-[0.9rem] text-[var(--figma-red)] underline underline-offset-2"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}

        {/* Hotel grid */}
        {visibleHotels.length > 0 ? (
          <div className="mt-10 grid gap-8 lg:grid-cols-2">
            {visibleHotels.map((hotel: HotelItem) => {
              const hotelId = hotel.id || hotel._id;
              return (
                <Card
                  key={hotelId}
                  href={buildDateRangeHref(`/hotel/${hotelId}`, { checkIn: fromDate, checkOut: toDate, guestsAdult, guestsChild })}
                  name={hotel.name}
                  address={hotel.address}
                  province={hotel.province}
                  price={hotel.price}
                  imgSrc={hotel.imgSrc}
                  tags={hotel.tags}
                  isAdmin={isAdmin}
                  editHref={isAdmin ? `/hotel/${hotelId}/update` : undefined}
                  onDelete={isAdmin ? () => { setDeletingHotel(hotel); setConfirmText(""); } : undefined}
                />
              );
            })}
          </div>
        ) : (
          <div className="mt-10 border border-[rgba(171,25,46,0.1)] bg-[rgba(255,245,244,0.55)] px-6 py-10 text-center">
            <p className="font-figma-nav text-[1.35rem] tracking-[0.08em] text-[var(--figma-red)]">
              NO HOTELS MATCH THIS FILTER
            </p>
            <p className="mt-2 font-figma-copy text-[1.3rem] text-[var(--figma-ink-soft)]">
              Try a different keyword or adjust the filters.
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

      {/* Delete confirmation modal */}
      {deletingHotel && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[rgba(240,230,224,0.97)] p-6">
          <div className="w-full max-w-lg">
            <h1 className="mb-8 text-center font-figma-copy text-[2.6rem] font-semibold text-[var(--figma-ink)] sm:text-[3rem]">
              ARE YOU SURE?
            </h1>

            <p className="font-figma-copy text-[1.15rem] leading-relaxed text-[var(--figma-ink)]">
              You are about DELETE{" "}
              <span className="text-[var(--figma-red)]">{deletingHotel.name}</span>{" "}
              hotel. This will PERMANENTLY DELETE this hotel and related information like Hotel picture, Address and Tags.
            </p>

            <p className="mt-6 font-figma-copy text-[1.1rem] text-[var(--figma-ink)]">
              To confirm, type &ldquo;{deletingHotel.name}&rdquo;
            </p>

            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              autoFocus
              className="mt-3 w-full border-0 border-b border-[rgba(171,25,46,0.3)] bg-transparent pb-2 font-figma-copy text-[1.1rem] text-[var(--figma-ink)] placeholder:text-[rgba(171,25,46,0.25)] focus:border-[var(--figma-red)] focus:outline-none"
              placeholder={deletingHotel.name}
            />

            <div className="mt-8 flex items-center gap-8">
              <button
                type="button"
                onClick={() => { setDeletingHotel(null); setConfirmText(""); }}
                className="figma-button figma-button-prominent px-8 py-3 font-figma-nav text-[1.3rem] tracking-widest"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={() => void handleDeleteConfirm()}
                disabled={confirmText !== deletingHotel.name || isDeleting}
                className="font-figma-nav text-[1.3rem] tracking-widest text-[var(--figma-red)] disabled:opacity-30"
              >
                {isDeleting ? "DELETING..." : "DELETE"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </section>
  );
}
