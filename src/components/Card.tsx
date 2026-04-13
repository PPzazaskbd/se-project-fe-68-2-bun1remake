"use client";

import Link from "next/link";

interface CardProps {
  href: string;
  name: string;
  address: string;
  province: string;
  price: number;
  imgSrc?: string;
  tags?: string[];
  isAdmin?: boolean;
  editHref?: string;
  onDelete?: () => void;
}

function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 4h12M5 4V2h4v2M2 4l1 10h8l1-10H2z" />
    </svg>
  );
}

export default function Card({
  href,
  name,
  address,
  province,
  price,
  imgSrc,
  tags,
  isAdmin,
  editHref,
  onDelete,
}: CardProps) {
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
          <div className="absolute right-2 top-2 flex gap-1.5">
            {editHref && (
              <Link
                href={editHref}
                className="flex h-7 w-7 items-center justify-center bg-[var(--figma-red)] text-white"
                onClick={(e) => e.stopPropagation()}
              >
                <EditIcon />
              </Link>
            )}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); onDelete?.(); }}
              className="flex h-7 w-7 items-center justify-center bg-[var(--figma-red)] text-white"
            >
              <TrashIcon />
            </button>
          </div>
        )}
      </div>

      <div className="flex items-end justify-between gap-4 px-5 py-4 sm:px-6">
        <div className="min-w-0">
          <h2 className="truncate font-figma-copy text-[1.9rem] text-[var(--figma-ink)] sm:text-[2rem]">
            {name}
          </h2>
          <p className="font-figma-copy text-[1rem] text-[var(--figma-ink-soft)] sm:text-[1.15rem]">
            {province} - {address}
          </p>
          <p className="mt-1 font-figma-copy text-[1rem] text-[var(--figma-red)] sm:text-[1.1rem]">
            ${price.toLocaleString()} per night
          </p>
          {tags && tags.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="border border-[rgba(171,25,46,0.18)] px-2 py-0.5 font-figma-copy text-[0.9rem] text-[var(--figma-ink-soft)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <Link
          href={href}
          className="figma-button figma-card-detail-button px-4 py-1 font-figma-copy text-[1.15rem] normal-case sm:px-5 sm:text-[1.25rem]"
        >
          detail
        </Link>
      </div>
    </article>
  );
}
