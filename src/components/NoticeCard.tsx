import fs from "fs";
import Link from "next/link";
import path from "path";

const MONTHS: Record<string, number> = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
};

function formatNoticeDate(rawDate: string) {
  const trimmedDate = rawDate.trim();
  const isoMatch = trimmedDate.match(/^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/);

  if (isoMatch) {
    return `${Number(isoMatch[3])}/${Number(isoMatch[2])}/${isoMatch[1]}`;
  }

  const dayMonthYearMatch = trimmedDate.match(
    /^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/,
  );

  if (dayMonthYearMatch) {
    const month = MONTHS[dayMonthYearMatch[2].toLowerCase()];

    if (month) {
      return `${Number(dayMonthYearMatch[1])}/${month}/${dayMonthYearMatch[3]}`;
    }
  }

  const monthDayYearMatch = trimmedDate.match(
    /^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$/,
  );

  if (monthDayYearMatch) {
    const month = MONTHS[monthDayYearMatch[1].toLowerCase()];

    if (month) {
      return `${Number(monthDayYearMatch[2])}/${month}/${monthDayYearMatch[3]}`;
    }
  }

  return trimmedDate;
}

function getLastUpdatedDate(slug: string) {
  try {
    const filePath = path.join(
      process.cwd(),
      "public",
      "content",
      `${slug}.md`,
    );
    const fileContent = fs.readFileSync(filePath, "utf8");

    const match = fileContent.match(
      /Last Updated:\s*\*?\*?\s*([^* \n\r][^*]*)\s*\*?\*?/i,
    );

    return match ? formatNoticeDate(match[1].trim()) : "Date TBD";
  } catch (error) {
    console.error(`Error reading ${slug}.md:`, error);
    return "Recently";
  }
}

const NoticeCard = ({
  title,
  lastUpdated,
  href,
}: {
  title: string;
  lastUpdated: string;
  href: string;
}) => (
  <div className="relative h-[211px] w-full max-w-[380px] bg-[#fff8f3]">
    <h2 className="absolute left-2.5 top-3 font-figma-copy text-[3rem] font-bold leading-none tracking-[0.05em] text-[var(--figma-red-strong)]">
      {title}
    </h2>

    <p className="absolute bottom-2.5 left-2.5 font-figma-copy text-base font-bold leading-normal tracking-[0.05em] text-black/25">
      {lastUpdated}
    </p>

    <div className="absolute bottom-2.5 right-[11px]">
      <Link
        href={href}
        className="figma-button h-[51px] w-[81px] px-0 py-0 font-figma-nav text-2xl"
      >
        READ
      </Link>
    </div>
  </div>
);

export default async function NoticeSection() {
  const privacyDate = getLastUpdatedDate("privacy-notice");
  const cookieDate = getLastUpdatedDate("cookies-notice");

  const notices = [
    {
      title: "Privacy policy",
      lastUpdated: privacyDate,
      href: "/about/privacy",
    },
    {
      title: "Cookie Notice",
      lastUpdated: cookieDate,
      href: "/about/cookies",
    },
  ];

  return (
    <section className="mt-[5.4rem]">
      <div className="grid grid-cols-1 justify-items-center gap-8 md:grid-cols-[380px_380px] md:justify-between md:gap-[92px]">
        {notices.map((notice) => (
          <NoticeCard
            key={notice.title}
            title={notice.title}
            lastUpdated={notice.lastUpdated}
            href={notice.href}
          />
        ))}
      </div>
    </section>
  );
}
