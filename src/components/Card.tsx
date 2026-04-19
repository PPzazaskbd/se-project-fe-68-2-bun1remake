import Link from "next/link";
import type { HotelSpecializations } from "@/interface";

function formatTagLabel(value: string) {
  return value
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

interface CardProps {
  id: string;
  href: string;
  name: string;
  district: string;
  province: string;
  price: number;
  imgSrc?: string;
  isAdmin?: boolean;
  specializations?: HotelSpecializations;
}

export default function Card({
  href,
  name,
  district,
  province,
  price,
  imgSrc,
  isAdmin,
  id,
  specializations,
}: CardProps) {
  const allTags = Array.from(
    new Set(
      [
        ...(specializations?.location ?? []),
        ...(specializations?.facility ?? []),
        ...(specializations?.accessibility ?? []),
      ]
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  );

  const previewTags = allTags.slice(0, 2);
  const hiddenTagCount = allTags.length - previewTags.length;

  return (
    <article className="figma-card-surface border border-[rgba(171,25,46,0.08)] bg-[#fff8f3]">
      <div className="relative block">
        <Link href={href} className="block">
          <div className="aspect-[616/275] overflow-hidden bg-[#efe3d8]">
            {imgSrc ? (
              <img
                src={imgSrc}
                alt={name}
                loading="lazy"
                className="figma-card-image block h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center font-figma-copy text-[1.8rem] text-[var(--figma-ink-soft)]">
                Some photo
              </div>
            )}
          </div>
        </Link>

        {isAdmin && (
          <div className="absolute right-3 top-3 flex gap-2">
            {/* ปุ่ม edit */}
            <Link href={`/hotel/${id}/update`}>
              <button className="flex h-10 w-10 items-center justify-center bg-red-700 text-white shadow hover:bg-red-800 transition-colors cursor-pointer">
                <img src="/edit.svg" alt="Edit icon" className="h-[18px] w-[18px]" />
              </button>
            </Link>

            {/* ปุ่ม delete */}
            <Link href={`/hotel/deleteHotel?id=${id}&name=${encodeURIComponent(name)}`}>
              <button className="flex h-10 w-10 items-center justify-center bg-red-700 text-white shadow hover:bg-red-800 transition-colors cursor-pointer">
                <img src="/delete.svg" alt="Delete icon" className="h-[18px] w-[18px]" />
              </button>
            </Link>
            
          </div>
        )}
      </div>
      
      {/* <button onClick={(e) => {
        e.preventDefault();
        if (!id) return;
        onDelete?.(id)
      }}>
        Delete
      </button> */}

      <div className="px-5 py-4 sm:px-6">
        <h2 className="truncate font-figma-copy text-[1.9rem] text-[var(--figma-ink)] sm:text-[2rem]">
          {name}
        </h2>

        <p className="mt-1 font-figma-copy text-[1rem] text-[var(--figma-ink-soft)] sm:text-[1.15rem]">
          {[province, district].filter(Boolean).join(" - ")}
        </p>

        <div className="mt-3 flex items-end justify-between gap-4">
          <div className="min-h-[2rem] flex items-center gap-2">
            {previewTags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-[#AB192E] px-3 py-[0.35rem] font-figma-nav text-[0.8rem] tracking-[0.03em] text-[#FBEFDF] shadow-[0_4px_4px_rgba(0,0,0,0.15)] sm:text-[0.9rem]"
              >
                {formatTagLabel(tag)}
              </span>
            ))}

            {hiddenTagCount > 0 ? (
              <span className="rounded-full bg-[#AB192E] px-3 py-[0.35rem] font-figma-nav text-[0.8rem] tracking-[0.03em] text-[#FBEFDF] sm:text-[0.9rem]">
                +{hiddenTagCount}
              </span>
            ) : null}
          </div>

          <div className="ml-auto flex shrink-0 items-end gap-3">
            <p className="font-figma-copy text-[1rem] whitespace-nowrap text-[var(--figma-red)] sm:text-[1.1rem]">
              ${price.toLocaleString()} per night
            </p>

            <Link
              href={href}
              className="figma-button figma-card-detail-button px-4 py-1 font-figma-copy text-[1.15rem] normal-case sm:px-5 sm:text-[1.25rem]"
            >
              detail
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
