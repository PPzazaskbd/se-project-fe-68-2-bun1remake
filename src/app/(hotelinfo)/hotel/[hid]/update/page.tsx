"use client";

import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { UpdateHotelPayload } from "@/libs/updateHotel";
import type { HotelSpecializations } from "@/interface";
import { updateHotelRecache } from "@/libs/recache";
import getHotel from "@/libs/getHotel";
import Arrow from "@/components/Arrow";
import { UploadButton } from "@/utils/uploadthing";
import tagOptions from "@/data/tagOptions.json";

type Tab = "image" | "info" | "tag";
type TagCategory = keyof HotelSpecializations;

const TAG_OPTIONS: Record<TagCategory, string[]> = tagOptions;
const TAG_CATEGORY_LABELS: Record<TagCategory, string> = {
  location: "Location",
  facility: "Facility",
  accessibility: "Accessibility",
};

function createEmptySpecializations(): HotelSpecializations {
  return {
    location: [],
    facility: [],
    accessibility: [],
  };
}

function normalizeSpecializations(
  value: UpdateHotelPayload["specializations"],
): HotelSpecializations {
  return {
    location: Array.isArray(value?.location) ? value.location : [],
    facility: Array.isArray(value?.facility) ? value.facility : [],
    accessibility: Array.isArray(value?.accessibility)
      ? value.accessibility
      : [],
  };
}

function formatTagLabel(value: string) {
  return value
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

const TAB_SUBTITLE: Record<Tab, string> = {
  image: "Hotel Photo",
  info: "Information",
  tag: "Tags",
};

const INFO_FIELDS: { name: keyof UpdateHotelPayload; label: string; wide?: boolean }[] = [
  { name: "name",       label: "Hotel Name",  wide: true },
  { name: "address",    label: "Address",     wide: true },
  { name: "district",   label: "District" },
  { name: "province",   label: "Province" },
  { name: "postalcode", label: "Postal Code" },
  { name: "region",     label: "Region" },
  { name: "tel",        label: "Telephone" },
  { name: "price",      label: "Price/night" },
];

function IconImage({ active }: { active: boolean }) {
  const c = active ? "#fbefdf" : "rgba(251,239,223,0.85)";
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
      stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

function IconInfo({ active }: { active: boolean }) {
  const c = active ? "#fbefdf" : "rgba(251,239,223,0.85)";
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
      stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" strokeWidth="3" />
    </svg>
  );
}

function IconTag({ active }: { active: boolean }) {
  const c = active ? "#fbefdf" : "rgba(251,239,223,0.85)";
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
      stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" strokeWidth="3" />
    </svg>
  );
}

export default function UpdateHotelPage() {
  const router = useRouter();
  const params = useParams();
  const hid = params.hid as string;
  const { data: session, status } = useSession();

  const [tab, setTab] = useState<Tab>("image");
  const [form, setForm] = useState<UpdateHotelPayload | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [tagSearch, setTagSearch] = useState("");
  const [openCategory, setOpenCategory] = useState<TagCategory>("location");

  const selectedSpecializations =
    form?.specializations ?? createEmptySpecializations();
  const selectedTagCount =
    selectedSpecializations.location.length +
    selectedSpecializations.facility.length +
    selectedSpecializations.accessibility.length;
  const normalizedTagSearch = tagSearch.trim().toLowerCase();

  useEffect(() => {
    if (status !== "loading") {
      if (!session || session.user?.role !== "admin") {
        router.push("/hotel");
      }
    }
  }, [session, status, router]);

  useEffect(() => {
    if (!hid) return;
    getHotel(hid)
      .then((res) => {
        const { _id, id, __v, ...rest } = res.data;
        setForm({
          ...rest,
          specializations: normalizeSpecializations(rest.specializations),
        });
      })
      .catch((err) => {
        setLoadError(err instanceof Error ? err.message : "Failed to load hotel.");
      });
  }, [hid]);

  if (status === "loading" || form === null) {
    return <div className="min-h-screen bg-[#FDF6EF]" />;
  }

  if (status === "unauthenticated" || session?.user?.role !== "admin") {
    return <div className="min-h-screen bg-[#FDF6EF]" />;
  }

  if (loadError) {
    return (
      <div className="figma-page font-figma-copy page-fade">
        <div className="figma-shell py-4 sm:py-6">
          <p className="text-red-600">{loadError}</p>
        </div>
      </div>
    );
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        [name]: name === "price" ? Number(value) : value,
      };
    });
  };

  const toggleTag = (category: TagCategory, value: string) => {
    setForm((prev) => {
      if (!prev) return prev;

      const fallbackSpecializations = createEmptySpecializations();
      const currentSpecializations =
        prev.specializations ?? fallbackSpecializations;
      const valuesInCategory = currentSpecializations[category];
      const isSelected = valuesInCategory.includes(value);

      let updatedValues: string[];
      if (isSelected) {
        updatedValues = valuesInCategory.filter((item) => item !== value);
      } else {
        updatedValues = [...valuesInCategory, value];
      }

      const updatedSpecializations: HotelSpecializations = {
        ...currentSpecializations,
        [category]: updatedValues,
      };

      return {
        ...prev,
        specializations: updatedSpecializations,
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!form) {
      setError("Form is not ready yet.");
      return;
    }

    if (!session?.user?.token) {
      router.push(`/login?callbackUrl=%2Fhotel%2F${hid}%2Fupdate`);
      return;
    }

    setSubmitting(true);
    try {
      await updateHotelRecache(hid, form, session.user.token);
      router.push("/hotel");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update hotel.");
    } finally {
      setSubmitting(false);
    }
  };

  const tabs: { key: Tab; Icon: typeof IconImage }[] = [
    { key: "image", Icon: IconImage },
    { key: "info", Icon: IconInfo },
    { key: "tag", Icon: IconTag },
  ];

  return (
    <div className="figma-page font-figma-copy page-fade">
      <div className="figma-shell py-4 sm:py-6">

        <h1 className="font-figma-nav font-bold text-center text-[2rem] sm:text-[2.75rem] lg:text-[4rem]
                        text-black leading-tight tracking-[0.05em]">
          Update Hotel
        </h1>
        <p className="font-figma-copy font-bold text-center text-[1.4rem] sm:text-[2rem] lg:text-[3rem]
                      text-[#3a3939] mt-1 mb-4 sm:mb-5 leading-tight">
          {TAB_SUBTITLE[tab]}
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="flex w-full sm:ml-[10.9%] sm:w-[73.2%]">

            {/* Sidebar */}
            <div className="flex flex-col flex-none">
              {tabs.map(({ key, Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  title={TAB_SUBTITLE[key]}
                  className="w-16 h-16 flex items-center justify-center cursor-pointer transition-colors"
                  style={{
                    background: tab === key ? "#ab192e" : "rgba(183,20,34,0.5)",
                  }}
                >
                  <Icon active={tab === key} />
                </button>
              ))}
            </div>

            {/* Panel */}
            <div className="flex-1 bg-[rgba(254,186,207,0.12)] px-[3.5%] pt-[4%] pb-[5%]">

              {/* Image tab */}
              {tab === "image" && (
                <div className="flex flex-col items-center">
                  <div
                    className="w-full bg-[#d9d9d9] flex items-center justify-center overflow-hidden"
                    style={{ aspectRatio: "2.24" }}
                  >
                    {form.imgSrc ? (
                      <img
                        src={form.imgSrc}
                        alt="Hotel preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <p className="font-figma-nav font-bold text-black tracking-[0.05em] text-center px-2
                                    text-[0.85rem] sm:text-[1.2rem] lg:text-[2rem]">
                        Sample Photo will be display here
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-center gap-2 mt-[8%]">
                    <span className="bg-[rgba(183,20,34,0.5)] hover:bg-[var(--figma-red)]
                                     px-8 py-2 font-figma-nav font-bold
                                     tracking-[0.12em] text-[var(--figma-white)]
                                     transition-colors cursor-pointer inline-block"
                          style={{ fontSize: "clamp(1rem, 2vw, 2.5rem)" }}>
                      <UploadButton
                        endpoint="imageUploader"
                        onClientUploadComplete={(res) => {
                          const url = res?.[0]?.ufsUrl || "";
                          setForm((prev) => {
                            if (!prev) return prev;
                            return { ...prev, imgSrc: url };
                          });
                          alert("Upload Completed");
                        }}
                        onUploadError={(err: Error) => {
                          alert(`ERROR! ${err.message}`);
                        }}
                      />
                    </span>

                    <p className="font-figma-nav text-black tracking-[0.05em]
                                  text-[1.0rem] sm:text-[1.4rem] lg:text-[1.9rem]">
                      Preferably 616 x 275
                    </p>
                  </div>
                </div>
              )}

              {/* Info tab */}
              {tab === "info" && (
                <div className="grid gap-5 sm:grid-cols-2">
                  {INFO_FIELDS.map(({ name, label, wide }) => (
                    <div key={name} className={wide ? "sm:col-span-2" : ""}>
                      <input
                        id={name}
                        name={name}
                        type={name === "price" ? "number" : "text"}
                        min={name === "price" ? 0 : undefined}
                        value={
                          name === "price"
                            ? (form.price === 0 ? "" : form.price ?? "")
                            : ((form[name] as string) ?? "")
                        }
                        onChange={handleChange}
                        placeholder={label}
                        className="figma-input"
                      />
                    </div>
                  ))}
                  <div className="sm:col-span-2">
                    <textarea
                      id="description"
                      name="description"
                      rows={4}
                      value={form.description ?? ""}
                      onChange={handleChange}
                      placeholder="Description"
                      className="figma-input resize-none"
                    />
                  </div>
                </div>
              )}

              {/* Tag tab */}
              {tab === "tag" && (
                <div className="mx-auto flex max-w-[52rem] flex-col gap-5">
                  <div className="border border-[#f3aaaa] bg-[rgba(254,186,207,0.15)] px-4 py-4 shadow-[inset_-4px_-4px_4px_rgba(255,255,255,0.5),inset_4px_4px_4px_rgba(133,133,133,0.25)] sm:px-6">
                    <div className="px-1">
                      <input
                        type="text"
                        value={tagSearch}
                        onChange={(event) => setTagSearch(event.target.value)}
                        placeholder="Search for Tags"
                        className="w-full border-b-2 border-[#f3aaaa] bg-transparent px-1 pb-2 font-figma-nav text-[1.45rem] tracking-[0.04em] text-black placeholder:text-[#f3aaaa] focus:outline-none"
                      />
                    </div>

                    <div className="mt-4 max-h-[18rem] overflow-y-auto pr-1">
                      {(Object.keys(TAG_OPTIONS) as TagCategory[]).map((category) => {
                        const visibleOptions = TAG_OPTIONS[category].filter((value) =>
                          value.toLowerCase().includes(normalizedTagSearch),
                        );
                        const isOpen = openCategory === category;
                        const categoryCount = selectedSpecializations[category].length;

                        return (
                          <section
                            key={category}
                            className="mb-3 border-2 border-[#f3aaaa] bg-transparent last:mb-0"
                          >
                            <button
                              type="button"
                              onClick={() => setOpenCategory(category)}
                              className="flex w-full items-center justify-between px-4 py-3 text-left"
                            >
                              <div className="flex items-center">
                                <span className="font-figma-nav text-[1.35rem] tracking-[0.04em] text-[#ab192e]">
                                  {TAG_CATEGORY_LABELS[category]}
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="font-figma-copy text-[0.95rem] text-[#ab192e]">
                                  {categoryCount} selected
                                </span>
                                <span className="font-figma-nav text-[1.3rem] text-[#ab192e]">
                                  {isOpen ? "▾" : "▸"}
                                </span>
                              </div>
                            </button>

                            {isOpen && (
                              <div className="border-t border-[#f3aaaa] px-4 py-3">
                                {visibleOptions.length > 0 ? (
                                  <div className="flex flex-wrap gap-2">
                                    {visibleOptions.map((value) => {
                                      const selected = selectedSpecializations[category].includes(value);

                                      return (
                                        <button
                                          key={`${category}-${value}`}
                                          type="button"
                                          onClick={() => toggleTag(category, value)}
                                          className={`rounded-full px-3 py-[0.35rem] font-figma-nav text-[1.05rem] tracking-[0.03em] shadow-[0_4px_4px_rgba(0,0,0,0.2)] transition-colors ${
                                            selected
                                              ? "bg-[#ab192e] text-[#fbefdf]"
                                              : "bg-[#fbefdf] text-black hover:bg-[rgba(255,124,124,0.35)]"
                                          }`}
                                        >
                                          {formatTagLabel(value)}
                                        </button>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <p className="font-figma-copy text-[1rem] text-[var(--figma-ink-soft)]">
                                    No matching tags in this category.
                                  </p>
                                )}
                              </div>
                            )}
                          </section>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 flex items-center gap-2 font-figma-nav text-[1.18rem] tracking-[0.08em] text-[#ab192e]">
                      <img src="/tick.svg" alt="Selected tags" className="h-5 w-5" />
                      {selectedTagCount} TAG{selectedTagCount === 1 ? "" : "S"} SELECTED
                    </p>

                    <div className="border-[3px] border-[#ab192e] bg-transparent px-4 py-3 sm:px-5">
                      {selectedTagCount > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {(Object.keys(TAG_OPTIONS) as TagCategory[]).flatMap((category) =>
                            selectedSpecializations[category].map((value) => (
                              <button
                                key={`${category}:${value}`}
                                type="button"
                                onClick={() => toggleTag(category, value)}
                                className="rounded-full bg-[rgba(255,124,124,0.4)] px-3 py-[0.3rem] font-figma-nav text-[1rem] tracking-[0.02em] text-black shadow-[0_4px_4px_rgba(0,0,0,0.2)] transition-colors hover:bg-[rgba(255,124,124,0.55)]"
                              >
                                {formatTagLabel(value)}
                                <span className="ml-2 text-[#ab192e]">x</span>
                              </button>
                            )),
                          )}
                        </div>
                      ) : (
                        <p className="font-figma-copy text-[1rem] text-[var(--figma-ink-soft)]">
                          No tags selected yet.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="figma-feedback figma-feedback-error mt-5 text-[0.9rem] font-bold">
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* Bottom navigation */}
          <div className="grid grid-cols-3 items-center mt-6 sm:mt-8">

            <button
              type="button"
              onClick={() => router.push("/hotel")}
              className="flex items-center gap-2 font-figma-nav font-bold
                         tracking-[0.05em] text-black hover:text-[var(--figma-red)]
                         transition-colors cursor-pointer justify-self-start"
              style={{ fontSize: "clamp(1rem, 2vw, 2.5rem)" }}
            >
              <Arrow direction="left" />
              To Hotels
            </button>

            <div className="flex justify-center">
              <button
                type="submit"
                disabled={submitting}
                className="bg-[rgba(183,20,34,0.5)] hover:bg-[var(--figma-red)]
                           px-8 py-2 font-figma-nav font-bold
                           tracking-[0.12em] text-[var(--figma-white)]
                           transition-colors cursor-pointer
                           disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontSize: "clamp(1rem, 2vw, 2.5rem)" }}
              >
                {submitting ? "SAVING…" : "SAVE"}
              </button>
            </div>

            <div />
          </div>
        </form>
      </div>
    </div>
  );
}
