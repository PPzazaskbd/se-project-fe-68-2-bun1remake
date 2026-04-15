"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { createHotel } from "@/libs/createHotel";
import type { CreateHotelPayload } from "@/libs/createHotel";
import Arrow from "@/components/Arrow";
import {UploadButton} from "@/utils/uploadthing";
import { createHotelRecache } from "@/libs/recache";

type Tab = "image" | "info" | "tag";

const EMPTY_FORM: CreateHotelPayload = {
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
};

const TAB_SUBTITLE: Record<Tab, string> = {
  image: "Hotel Photo",
  info: "Information",
  tag: "Tags",
};

const INFO_FIELDS: { name: keyof CreateHotelPayload; label: string; wide?: boolean }[] = [
  { name: "name",       label: "Hotel Name",           wide: true },
  { name: "address",    label: "Address",              wide: true },
  { name: "district",   label: "District" },
  { name: "province",   label: "Province" },
  { name: "postalcode", label: "Postal Code" },
  { name: "region",     label: "Region" },
  { name: "tel",        label: "Telephone" },
  { name: "price",      label: "Price/night" },
];

/* ── Tab icons ─────────────────────────────────────────────────── */

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

/* ── Page ───────────────────────────────────────────────────────── */

export default function CreateHotelPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [tab, setTab] = useState<Tab>("image");
  const [form, setForm] = useState<CreateHotelPayload>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "loading") {
      if (!session || session.user?.role !== "admin") {
        router.push("/hotel");
      }
    }
  }, [session, status, router]);

  useEffect(() => {
    if (uploadedUrl) {
      setForm((prev) => ({
        ...prev,
        imgSrc: uploadedUrl,
      }));
    }
  }, [uploadedUrl]);

  if (status === "loading") {
    return <div className="min-h-screen bg-[#FDF6EF]" />;
  }

  if (status === "unauthenticated" || session?.user?.role !== "admin") {
    return <div className="min-h-screen bg-[#FDF6EF]" />;
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "price" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const requiredText: (keyof CreateHotelPayload)[] = [
      "name", "address", "district", "province",
      "postalcode", "region", "tel", "description",
    ];
    const missingText = requiredText.find((k) => !String(form[k]).trim());
    if (missingText) {
      setError(`Please fill in all required fields (${missingText}).`);
      setTab("info");
      return;
    }
    if (form.price <= 0) {
      setError("Price must be greater than 0.");
      setTab("tag");
      return;
    }

    if (!session?.user?.token) {
      router.push("/login?callbackUrl=%2Fhotel%2Fcreate");
      return;
    }

    setSubmitting(true);
    try {
      await createHotelRecache(form, session.user.token);
      router.push("/hotel");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create hotel.");
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

        {/* ── Title — centered on shell, same as Figma ── */}
        {/* Figma: "Add New Hotel" 64px Cormorant SC; "Hotel Photo" 48px Cormorant Infant */}
        <h1 className="font-figma-nav font-bold text-center text-[2rem] sm:text-[2.75rem] lg:text-[4rem]
                        text-black leading-tight tracking-[0.05em]">
          Add New Hotel
        </h1>
        <p className="font-figma-copy font-bold text-center text-[1.4rem] sm:text-[2rem] lg:text-[3rem]
                      text-[#3a3939] mt-1 mb-4 sm:mb-5 leading-tight">
          {TAB_SUBTITLE[tab]}
        </p>

        <form onSubmit={handleSubmit} noValidate>
          {/*
            Content block: tabs (w=64px) + panel (flex-1)
            Figma: 1019px wide, left offset 152px inside 1392px shell
              → margin-left = 152/1392 = 10.916…% ≈ 10.9%
              → width       = 1019/1392 = 73.204…% ≈ 73.2%
            On mobile: full width, no offset
          */}
          <div className="flex w-full sm:ml-[10.9%] sm:w-[73.2%]">

            {/* Sidebar — 3 × 64px squares, stacked */}
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

            {/*
              Panel
              Figma: 950px × 655px, bg rgba(254,186,207,0.12)
              Inner photo padding: left 33px / 950 = 3.47% ≈ px-[3.5%]
              Photo top:  27px / 655 = 4.1% ≈ pt-[4%]
            */}
            <div className="flex-1 bg-[rgba(254,186,207,0.12)] px-[3.5%] pt-[4%] pb-[5%]">

              {/* ── Image tab ── */}
              {tab === "image" && (
                <div className="flex flex-col items-center">
                  {/*
                    Photo preview
                    Figma: 896×400px → aspect-ratio 2.24
                    Full panel width minus padding
                  */}
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

                  {/*
                    Upload button + label
                    Figma: Upload btn at y=482 from panel top (gap from photo bottom ≈ 8% of panel h)
                    Centered horizontally in panel
                  */}
                  <div className="flex flex-col items-center gap-2 mt-[8%]">
                    <span className="bg-[rgba(183,20,34,0.5)] hover:bg-[var(--figma-red)]
                                     px-8 py-2 font-figma-nav font-bold
                                     tracking-[0.12em] text-[var(--figma-white)]
                                     transition-colors cursor-pointer inline-block"
                          style={{ fontSize: "clamp(1rem, 2vw, 2.5rem)" }}>
                      <UploadButton
                        endpoint="imageUploader"
                        onClientUploadComplete={(res) => {
                          console.log("Files: ", res);
                          setUploadedUrl(res?.[0]?.ufsUrl || "");
                          alert("Upload Completed");
                        }}
                        onUploadError={(error: Error) => {
                          alert(`ERROR! ${error.message}`);
                        }}
                      />
                    </span>

                    {/* "Image (4MB)" — Figma: 24px mixed SC+Infant */}
                    <p className="font-figma-nav text-black tracking-[0.05em]
                                  text-[1.0rem] sm:text-[1.4rem] lg:text-[1.9rem]">
                      Preferably 616 x 275
                    </p>
                  </div>
                </div>
              )}

              {/* ── Info tab ── */}
              {tab === "info" && (
                <div className="grid gap-5 sm:grid-cols-2">
                  {INFO_FIELDS.map(({ name, label, wide }) => (
                    <div key={name} className={wide ? "sm:col-span-2" : ""}>
                      <input
                        id={name}
                        name={name}
                        type={name === "price" ? "number" : "text"}
                        min={name === "price" ? 0 : undefined}
                        value={name === "price"
                          ? (form.price === 0 ? "" : form.price)
                          : (form[name] as string)}
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
                      value={form.description}
                      onChange={handleChange}
                      placeholder="Description"
                      className="figma-input resize-none"
                    />
                  </div>
                </div>
              )}

              {/* ── Tag / Pricing tab ── */}
              {/* ── Tag tab — TODO ── */}
              {tab === "tag" && (
                <div className="flex items-center justify-center min-h-[200px]">
                  <p className="font-figma-copy text-[var(--figma-ink-soft)] text-[1.25rem] tracking-wide">
                    Coming soon…
                  </p>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="figma-feedback figma-feedback-error mt-5 text-[0.9rem] font-bold">
                  {error}
                </div>
              )}
            </div>
          </div>

          {/*
            Bottom navigation — full shell width
            Figma:
              "To Hotels" arrow at x=264 = shell-left-edge; text at x=344
              CREATE centered on shell (x=806, w=308 → center=960=shell-center)
            Implementation: relative container, "To Hotels" flush left, CREATE absolutely centered
          */}
          <div className="grid grid-cols-3 items-center mt-6 sm:mt-8">

            {/* ← To Hotels */}
            <button
              type="button"
              onClick={() => router.push("/hotel")}
              className="flex items-center gap-2 font-figma-nav font-bold
                         tracking-[0.05em] text-black hover:text-[var(--figma-red)]
                         transition-colors cursor-pointer justify-self-start"
              style={{ fontSize: "clamp(1rem, 2vw, 2.5rem)" }}
            >
              <Arrow direction="left"></Arrow>
              To Hotels
            </button>

            {/* CREATE — กลาง */}
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
                {submitting ? "CREATING…" : "CREATE"}
              </button>
            </div>

            {/* spacer ขวา */}
            <div />
          </div>
        </form>
      </div>
    </div>
  );
}
