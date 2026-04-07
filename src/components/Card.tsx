import Link from "next/link";

interface CardProps {
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
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>  
            </button>

            {/* ปุ่ม delete */}
            <Link href={"/hotel/deleteHotel"}>
              <button className="flex h-10 w-10 items-center justify-center bg-red-700 text-white shadow hover:bg-red-800 transition-colors cursor-pointer">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
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
