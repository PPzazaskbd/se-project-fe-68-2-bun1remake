"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import Arrow from "@/components/Arrow";
import { HotelPayload } from "@/libs/hotelsAdminApi";
import { useDismissibleNotice } from "@/libs/useDismissibleNotice";
import DismissibleNotice from "@/components/DismissibleNotice";

const TAG_CATEGORIES: Record<string, string[]> = {
  Location: ["City-Center", "Mountain-View", "Sunset", "Riverside", "Near-Beach", "Secluded", "Airport-Proximity"],
  Experience: ["Romantic", "Family-Friendly", "Business", "Adventure", "Wellness", "Cultural", "Palm-Resort"],
  Amenities: ["Pool", "Spa", "Gym", "Free-Parking", "Pet-Friendly", "Breakfast-Included", "Wifi"],
  Room: ["1-Person-Room", "2-Person-Room", "Suite", "Villa"],
  Vibes: ["Luxury", "Budget", "Boutique", "Modern", "Eco-Friendly"],
};

const EMPTY: HotelPayload = {
  name: "", address: "", district: "", province: "",
  postalcode: "", region: "", tel: "", description: "",
  imgSrc: "", price: 0, tags: [],
};

type Step = 1 | 2 | 3;

const fieldClass =
  "w-full border-0 border-b border-[rgba(171,25,46,0.22)] bg-transparent pb-1.5 pt-0.5 font-figma-copy text-[1.1rem] text-[var(--figma-ink)] placeholder:text-[rgba(100,60,60,0.38)] focus:border-[var(--figma-red)] focus:outline-none";

function PhotoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="1" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="8" strokeWidth="2.5" />
      <line x1="12" y1="12" x2="12" y2="16" />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
      <circle cx="7" cy="7" r="1" fill="currentColor" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

interface HotelWizardProps {
  mode: "create" | "update";
  initialData?: Partial<HotelPayload>;
  onSubmit: (data: HotelPayload) => Promise<void>;
  isSaving: boolean;
}

export default function HotelWizard({ mode, initialData, onSubmit, isSaving }: HotelWizardProps) {
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<HotelPayload>({ ...EMPTY, ...initialData, tags: initialData?.tags ?? [] });
  const [previewSrc, setPreviewSrc] = useState<string>(initialData?.imgSrc ?? "");
  const [openCats, setOpenCats] = useState<Record<string, boolean>>({ Location: true });
  const [tagSearch, setTagSearch] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const { notice, showNotice, dismissNotice } = useDismissibleNotice();

  const setField = <K extends keyof HotelPayload>(key: K, val: HotelPayload[K]) =>
    setForm((p) => ({ ...p, [key]: val }));

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setPreviewSrc(result);
      setField("imgSrc", result);
    };
    reader.readAsDataURL(file);
  };

  const toggleTag = (tag: string) => {
    setForm((p) => ({
      ...p,
      tags: p.tags?.includes(tag) ? p.tags.filter((t) => t !== tag) : [...(p.tags ?? []), tag],
    }));
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      showNotice({ type: "error", message: "Hotel name is required." });
      setStep(2);
      return;
    }
    try {
      await onSubmit({ ...form, imgSrc: previewSrc || form.imgSrc || "" });
    } catch (err) {
      showNotice({ type: "error", message: err instanceof Error ? err.message : "Failed to save hotel." });
    }
  };

  const STEP_ICONS = [<PhotoIcon key={1} />, <InfoIcon key={2} />, <TagIcon key={3} />];
  const stepLabel = ["Hotel Photo", "Information", "Tags"][step - 1];
  const title = mode === "create" ? "Add New Hotel" : "Update Hotel";
  const actionLabel = mode === "create" ? "CREATE" : "SAVE";

  return (
    <main className="figma-page py-8 sm:py-12">
      <div className="figma-shell">

        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="font-figma-copy text-[2.6rem] font-semibold capitalize tracking-wide text-[var(--figma-ink)] sm:text-[3.2rem]">
            {title}
          </h1>
          <p className="mt-0.5 font-figma-copy text-[1.25rem] text-[var(--figma-ink-soft)]">
            {stepLabel}
          </p>
        </div>

        <div className="flex gap-4 sm:gap-6">
          {/* Sidebar — step icons */}
          <div className="flex shrink-0 flex-col gap-2 pt-1">
            {([1, 2, 3] as Step[]).map((s, i) => (
              <button
                key={s}
                type="button"
                onClick={() => setStep(s)}
                className={`flex h-9 w-9 items-center justify-center transition-colors ${
                  step === s
                    ? "bg-[var(--figma-red)] text-white"
                    : "border border-[rgba(171,25,46,0.3)] bg-white text-[var(--figma-red)] hover:bg-[rgba(171,25,46,0.05)]"
                }`}
              >
                {STEP_ICONS[i]}
              </button>
            ))}
          </div>

          {/* Content panel */}
          <div className="min-h-[20rem] flex-1 border border-[rgba(171,25,46,0.1)] bg-[rgba(255,248,245,0.6)] p-5 sm:p-7">

            {/* Step 1 — Photo */}
            {step === 1 && (
              <div className="flex flex-col items-center gap-5">
                <div
                  className="flex w-full items-center justify-center overflow-hidden bg-[#c8d5db]"
                  style={{ maxWidth: "22rem", aspectRatio: "4/3" }}
                >
                  {previewSrc ? (
                    <img src={previewSrc} alt="preview" className="h-full w-full object-cover" />
                  ) : (
                    <p className="px-6 text-center font-figma-copy text-[1rem] italic text-[rgba(80,100,110,0.7)]">
                      {mode === "update" ? "Sample Photo displayed." : "Sample Photo will be display here"}
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-center gap-1">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="figma-button flex items-center gap-2 px-5 py-2 font-figma-nav text-[1rem]"
                  >
                    <UploadIcon />
                    Upload
                  </button>
                  <span className="font-figma-copy text-[0.85rem] text-[var(--figma-ink-soft)]">Image (5MB)</span>
                </div>

                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

                <input
                  type="text"
                  value={form.imgSrc ?? ""}
                  onChange={(e) => { setField("imgSrc", e.target.value); setPreviewSrc(e.target.value); }}
                  className={fieldClass + " w-full max-w-sm"}
                  placeholder="Or paste image URL..."
                />
              </div>
            )}

            {/* Step 2 — Information */}
            {step === 2 && (
              <div className="grid gap-x-6 gap-y-5 md:grid-cols-2">
                <div className="md:col-span-2">
                  <input type="text" value={form.name} onChange={(e) => setField("name", e.target.value)} className={fieldClass} placeholder="Hotel Name" />
                </div>
                <div className="md:col-span-2">
                  <input type="text" value={form.address} onChange={(e) => setField("address", e.target.value)} className={fieldClass} placeholder="Address" />
                </div>
                <input type="text" value={form.district} onChange={(e) => setField("district", e.target.value)} className={fieldClass} placeholder="District" />
                <input type="text" value={form.province} onChange={(e) => setField("province", e.target.value)} className={fieldClass} placeholder="Province" />
                <input type="text" value={form.postalcode} onChange={(e) => setField("postalcode", e.target.value)} className={fieldClass} maxLength={5} placeholder="Postal Code" />
                <input type="text" value={form.region} onChange={(e) => setField("region", e.target.value)} className={fieldClass} placeholder="Region" />
                <input type="text" value={form.tel} onChange={(e) => setField("tel", e.target.value)} className={fieldClass} placeholder="Telephone" />
                <div className="flex items-end gap-1.5">
                  <input
                    type="number"
                    min={0}
                    value={form.price}
                    onChange={(e) => setField("price", Math.max(0, Number(e.target.value)))}
                    className={fieldClass + " flex-1"}
                    placeholder="Price/night"
                  />
                  <span className="shrink-0 pb-1.5 font-figma-copy text-[1.1rem] text-[var(--figma-ink-soft)]">$</span>
                </div>
                <div className="md:col-span-2">
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) => setField("description", e.target.value)}
                    className={fieldClass + " resize-none"}
                    placeholder="Description"
                  />
                </div>
              </div>
            )}

            {/* Step 3 — Tags */}
            {step === 3 && (
              <div className="space-y-3">
                <input
                  type="text"
                  value={tagSearch}
                  onChange={(e) => setTagSearch(e.target.value)}
                  className={fieldClass}
                  placeholder="Search for Tag"
                />

                <div className="space-y-1.5">
                  {Object.entries(TAG_CATEGORIES).map(([cat, tags]) => {
                    const filtered = tagSearch
                      ? tags.filter((t) => t.toLowerCase().includes(tagSearch.toLowerCase()))
                      : tags;
                    if (tagSearch && !filtered.length) return null;
                    const isOpen = openCats[cat] ?? false;
                    return (
                      <div key={cat} className="border border-[rgba(171,25,46,0.15)] bg-white">
                        <button
                          type="button"
                          onClick={() => setOpenCats((p) => ({ ...p, [cat]: !p[cat] }))}
                          className="flex w-full items-center justify-between px-3 py-2 font-figma-nav text-[0.9rem] tracking-widest text-[var(--figma-ink)]"
                        >
                          <span className="flex items-center gap-2">
                            <TagIcon />
                            {cat}
                          </span>
                          <ChevronIcon open={isOpen || !!tagSearch} />
                        </button>
                        {(isOpen || tagSearch) && (
                          <div className="flex flex-wrap gap-1.5 border-t border-[rgba(171,25,46,0.08)] px-3 py-2.5">
                            {filtered.map((tag) => {
                              const selected = form.tags?.includes(tag);
                              return (
                                <button
                                  key={tag}
                                  type="button"
                                  onClick={() => toggleTag(tag)}
                                  className={`px-2.5 py-0.5 font-figma-copy text-[0.85rem] transition-colors ${
                                    selected
                                      ? "bg-[var(--figma-red)] text-white"
                                      : "border border-[rgba(171,25,46,0.2)] text-[var(--figma-ink)] hover:border-[var(--figma-red)]"
                                  }`}
                                >
                                  {tag}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {(form.tags ?? []).length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <p className="font-figma-nav text-[0.8rem] tracking-widest text-[var(--figma-red)]">
                      {form.tags?.length} TAGS SELECTED
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {form.tags?.map((tag) => (
                        <span key={tag} className="flex items-center gap-1 border border-[rgba(171,25,46,0.25)] px-2.5 py-0.5 font-figma-copy text-[0.85rem] text-[var(--figma-ink)]">
                          {tag}
                          <button type="button" onClick={() => toggleTag(tag)} className="text-[var(--figma-red)]" aria-label={`Remove ${tag}`}>×</button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <DismissibleNotice notice={notice} onClose={dismissNotice} className="mt-4" />

        {/* Bottom bar */}
        <div className="mt-5 flex items-center justify-between">
          <Link
            href="/admin/hotels"
            className="figma-text-action flex items-center gap-2 font-figma-copy text-[1.15rem] text-[var(--figma-red)]"
          >
            <Arrow direction="left" />
            To Hotels
          </Link>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={isSaving}
            className="figma-button figma-button-prominent px-10 py-3 font-figma-nav text-[1.4rem] tracking-widest"
          >
            {isSaving ? "SAVING..." : actionLabel}
          </button>
        </div>
      </div>
    </main>
  );
}
