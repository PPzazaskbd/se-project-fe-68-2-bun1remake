import Link from "next/link";

interface CardProps {
  href: string;
  name: string;
  address: string;
  province: string;
  price: number;
  imgSrc?: string;
  tags?: string[];
}

export default function Card({
  href,
  name,
  address,
  province,
  price,
  imgSrc,
  tags,
}: CardProps) {
  return (
    <article className="figma-card-surface border border-[rgba(171,25,46,0.08)] bg-[#fff8f3]">
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
