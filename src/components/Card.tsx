import Link from "next/link";

interface CardProps {
  id: string;
  href: string;
  name: string;
  address: string;
  province: string;
  price: number;
  imgSrc?: string;
  isAdmin?: boolean;
}

export default function Card({
  href,
  name,
  address,
  province,
  price,
  imgSrc,
  isAdmin,
  id,
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
          <div className="absolute right-3 top-3 flex gap-2">
            {/* ปุ่ม edit */}
            <button className="flex h-10 w-10 items-center justify-center bg-red-700 text-white shadow hover:bg-red-800 transition-colors cursor-pointer">
              <img src="/edit.svg" alt="Edit icon" className="h-[18px] w-[18px]" />
            </button>

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
