import Link from "next/link";
import fs from "fs";
import path from "path";

interface NoticeCardProps {
  title: string;
  slug: string; // 'privacy' or 'cookies'
  href: string;
}

// Function to extract "Last Updated" date from MD content
async function getLastUpdatedDate(slug: string) {
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

    return match ? match[1].trim() : "Date TBD";
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
  <div className="figma-card-surface flex flex-col justify-between h-48 p-4 border border-[var(--figma-border)] bg-[var(--figma-soft)] rounded-sm">
    <div className="text-left">
      <h2 className="font-figma-display text-4xl lg:text-5xl text-[var(--figma-red-strong)] leading-none tracking-tight">
        {title}
      </h2>
    </div>

    <div className="flex items-end justify-between mt-auto">
      <div className="font-figma-copy text-lg text-[var(--figma-ink-soft)] italic">
        Last updated: <span className="not-italic">{lastUpdated}</span>
      </div>

      <Link href={href} className="figma-button px-4 py-3 text-md">
        Read
      </Link>
    </div>
  </div>
);

export default async function NoticeSection() {
  // Fetching data directly in the Server Component
  const privacyDate = await getLastUpdatedDate("privacy-notice");
  const cookieDate = await getLastUpdatedDate("cookies-notice");

  const notices = [
    {
      title: "Privacy Policy",
      lastUpdated: privacyDate,
      href: "/about/privacy",
    },
    {
      title: "Cookies Notice",
      lastUpdated: cookieDate,
      href: "/about/cookies",
    },
  ];

  return (
    <div className="figma-shell py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {notices.map((notice) => (
          <NoticeCard
            key={notice.title}
            title={notice.title}
            lastUpdated={notice.lastUpdated}
            href={notice.href}
          />
        ))}
      </div>
    </div>
  );
}
