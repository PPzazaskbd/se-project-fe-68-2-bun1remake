"use client";

import DismissibleNotice from "@/components/DismissibleNotice";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { HotelItem } from "@/interface";
import { useDismissibleNotice } from "@/libs/useDismissibleNotice";
import { createHotel, deleteHotel, HotelPayload, updateHotel } from "@/libs/hotelsAdminApi";
import { buildBackendUrl } from "@/libs/backendApiBase";
import Arrow from "@/components/Arrow";

const EMPTY_FORM: HotelPayload = {
  name: "",
  address: "",
  district: "",
  province: "",
  postalcode: "",
  region: "",
  tel: "",
  description: "",
  imgSrc: "",
  price: 0,
  tags: [],
};

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="font-figma-copy text-[1.1rem] text-[var(--figma-red)]">{label}</label>
      {children}
    </div>
  );
}

export default function AdminHotelsPage() {
  const { data: session, status } = useSession();
  const token = session?.user?.token || "";
  const role = session?.user?.role || "";

  const [hotels, setHotels] = useState<HotelItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingHotel, setEditingHotel] = useState<HotelItem | null>(null);
  const [form, setForm] = useState<HotelPayload>(EMPTY_FORM);
  const [tagInput, setTagInput] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { notice, showNotice, dismissNotice } = useDismissibleNotice();
  const formRef = useRef<HTMLDivElement>(null);

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

  const scrollToForm = () => {
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  const handleStartCreate = () => {
    setEditingHotel(null);
    setForm(EMPTY_FORM);
    setTagInput("");
    setShowForm(true);
    dismissNotice(true);
    scrollToForm();
  };

  const handleStartEdit = (hotel: HotelItem) => {
    setShowForm(true);
    setEditingHotel(hotel);
    setForm({
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
    });
    setTagInput("");
    dismissNotice(true);
    scrollToForm();
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingHotel(null);
    setForm(EMPTY_FORM);
    setTagInput("");
    dismissNotice(true);
  };

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (!tag) return;
    if (!form.tags?.includes(tag)) {
      setForm((prev) => ({ ...prev, tags: [...(prev.tags ?? []), tag] }));
    }
    setTagInput("");
  };

  const handleRemoveTag = (tag: string) => {
    setForm((prev) => ({ ...prev, tags: (prev.tags ?? []).filter((t) => t !== tag) }));
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.address.trim() || !form.province.trim()) {
      showNotice({ type: "error", message: "Name, address, and province are required." });
      return;
    }

    setIsSaving(true);

    try {
      if (editingHotel) {
        const hotelId = editingHotel._id || editingHotel.id || "";
        const result = await updateHotel(hotelId, token, form);
        setHotels((prev) =>
          prev.map((h) => (h._id === hotelId || h.id === hotelId ? result.data : h)),
        );
        showNotice({ type: "success", message: "Hotel updated." });
      } else {
        const result = await createHotel(token, form);
        setHotels((prev) => [result.data, ...prev]);
        showNotice({ type: "success", message: "Hotel created." });
      }

      setShowForm(false);
      setEditingHotel(null);
      setForm(EMPTY_FORM);
    } catch (err) {
      showNotice({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to save hotel.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (hotelId: string) => {
    if (!token) return;

    try {
      await deleteHotel(hotelId, token);
      setHotels((prev) => prev.filter((h) => h._id !== hotelId && h.id !== hotelId));
      setConfirmDeleteId(null);
      if (editingHotel && (editingHotel._id === hotelId || editingHotel.id === hotelId)) {
        handleCancelForm();
      }
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

  const isFormOpen = showForm;

  return (
    <main className="figma-page py-10 sm:py-12">
      <div className="figma-shell">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-figma-copy text-[2.6rem] text-[var(--figma-ink)] sm:text-[3rem]">
            Hotel Management
          </h1>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleStartCreate}
              className="figma-button px-5 py-3 font-figma-nav text-[1.3rem]"
            >
              + ADD HOTEL
            </button>
            <Link
              href="/admin"
              className="figma-text-action flex items-center gap-2 font-figma-copy text-[1.2rem] text-[var(--figma-red)]"
            >
              <Arrow direction="left" />
              Bookings
            </Link>
          </div>
        </div>

        {/* Form */}
        <div ref={formRef}>
          {isFormOpen ? (
            <section className="mb-10 border border-[rgba(171,25,46,0.08)] bg-[rgba(255,245,244,0.45)] p-5 sm:p-8">
              <h2 className="mb-6 font-figma-copy text-[1.8rem] text-[var(--figma-ink)]">
                {editingHotel ? "Edit Hotel" : "New Hotel"}
              </h2>

              <div className="grid gap-5 md:grid-cols-2">
                <FormField label="Name *">
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    className="figma-input"
                    placeholder="Hotel name"
                  />
                </FormField>

                <FormField label="Price *">
                  <input
                    type="number"
                    min={0}
                    value={form.price}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, price: Math.max(0, Number(e.target.value)) }))
                    }
                    className="figma-input"
                    placeholder="Price per night"
                  />
                </FormField>

                <FormField label="Address *">
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                    className="figma-input"
                    placeholder="Street address"
                  />
                </FormField>

                <FormField label="District">
                  <input
                    type="text"
                    value={form.district}
                    onChange={(e) => setForm((p) => ({ ...p, district: e.target.value }))}
                    className="figma-input"
                    placeholder="District"
                  />
                </FormField>

                <FormField label="Province *">
                  <input
                    type="text"
                    value={form.province}
                    onChange={(e) => setForm((p) => ({ ...p, province: e.target.value }))}
                    className="figma-input"
                    placeholder="Province"
                  />
                </FormField>

                <FormField label="Postal Code">
                  <input
                    type="text"
                    maxLength={5}
                    value={form.postalcode}
                    onChange={(e) => setForm((p) => ({ ...p, postalcode: e.target.value }))}
                    className="figma-input"
                    placeholder="00000"
                  />
                </FormField>

                <FormField label="Region">
                  <input
                    type="text"
                    value={form.region}
                    onChange={(e) => setForm((p) => ({ ...p, region: e.target.value }))}
                    className="figma-input"
                    placeholder="Region"
                  />
                </FormField>

                <FormField label="Tel">
                  <input
                    type="text"
                    value={form.tel}
                    onChange={(e) => setForm((p) => ({ ...p, tel: e.target.value }))}
                    className="figma-input"
                    placeholder="Telephone"
                  />
                </FormField>

                <div className="md:col-span-2">
                  <FormField label="Image URL">
                    <input
                      type="text"
                      value={form.imgSrc ?? ""}
                      onChange={(e) => setForm((p) => ({ ...p, imgSrc: e.target.value }))}
                      className="figma-input"
                      placeholder="https://..."
                    />
                  </FormField>
                </div>

                <div className="md:col-span-2">
                  <FormField label="Description">
                    <textarea
                      rows={3}
                      value={form.description}
                      onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                      className="figma-input resize-none"
                      placeholder="Hotel description"
                    />
                  </FormField>
                </div>

                <div className="md:col-span-2">
                  <FormField label="Facility Tags">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddTag();
                          }
                        }}
                        className="figma-input"
                        placeholder="e.g. pool, wifi, parking"
                      />
                      <button
                        type="button"
                        onClick={handleAddTag}
                        className="figma-button-secondary shrink-0 px-4 py-2 font-figma-nav text-[1rem]"
                      >
                        ADD
                      </button>
                    </div>
                    {(form.tags ?? []).length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {(form.tags ?? []).map((tag) => (
                          <span
                            key={tag}
                            className="flex items-center gap-1.5 border border-[rgba(171,25,46,0.2)] px-3 py-1 font-figma-copy text-[1.05rem] text-[var(--figma-ink)]"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => handleRemoveTag(tag)}
                              className="text-[var(--figma-red)] opacity-70 hover:opacity-100"
                              aria-label={`Remove tag ${tag}`}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </FormField>
                </div>
              </div>

              <DismissibleNotice notice={notice} onClose={dismissNotice} className="mt-5" />

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={isSaving}
                  className="figma-button figma-button-prominent px-6 py-3 font-figma-nav text-[1.4rem]"
                >
                  {isSaving ? "SAVING" : editingHotel ? "SAVE CHANGES" : "CREATE"}
                </button>
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="figma-button-secondary px-6 py-3 font-figma-nav text-[1.4rem]"
                >
                  CANCEL
                </button>
              </div>
            </section>
          ) : null}
        </div>

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
                      <button
                        type="button"
                        onClick={() => handleStartEdit(hotel)}
                        className="figma-button px-4 py-2 font-figma-nav text-[1.1rem]"
                      >
                        EDIT
                      </button>

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
