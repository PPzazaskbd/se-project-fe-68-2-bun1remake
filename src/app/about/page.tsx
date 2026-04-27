import fs from "fs";
import path from "path";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import LegalNotices from "@/components/NoticeCard";

export default async function PrivacyPolicy() {
  const filePath = path.join(process.cwd(), "public", "content", "about.md");
  const fileContent = fs.readFileSync(filePath, "utf8");

  return (
    <main className="figma-page h-[calc(100vh-80px)] overflow-y-auto overflow-x-hidden no-scrollbar">
      <div className="mx-auto w-[min(850px,calc(100%_-_2rem))] pb-48 pt-[3.1rem]">
        <div className="max-w-none">
          <div id="top-start" />
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => (
                <h1
                  className="mb-[4.4rem] text-center font-figma-copy text-[3rem] font-bold leading-none tracking-[0.05em] text-[var(--figma-red)]"
                >
                  {children}
                </h1>
              ),
              h2: ({ node, ...props }) => {
                const id = props.children
                  ?.toString()
                  .toLowerCase()
                  .replace(/\s+/g, "-")
                  .replace(/[^\w-]/g, "");
                return (
                  <h2
                    id={id}
                    className="sr-only"
                    {...props}
                  />
                );
              },
              h3: ({ node, ...props }) => (
                <h3
                  className="sr-only"
                  {...props}
                />
              ),

              p: ({ children, node, ref, ...props }) => {
                if (children === "===") {
                  return null;
                }

                return (
                  <p
                    className="mb-4 font-figma-copy text-base leading-normal tracking-[0.05em] text-black"
                    {...props}
                  >
                    {children}
                  </p>
                );
              },

              strong: ({ node, ...props }) => (
                <strong
                  className="font-bold text-[var(--figma-ink)]"
                  {...props}
                />
              ),

              ul: ({ node, ...props }) => (
                <ul
                  className="mb-4 list-disc space-y-1 pl-6 font-figma-copy text-base leading-normal tracking-[0.05em] text-black"
                  {...props}
                />
              ),
              li: ({ node, ...props }) => <li className="pl-2" {...props} />,

              a: ({ node, ...props }) => (
                <a
                  className="figma-link font-figma-nav !text-[var(--figma-red)] !tracking-wide font-bold border-b border-[var(--figma-red-soft)] hover:border-[var(--figma-red-strong)] transition-all"
                  {...props}
                />
              ),

              blockquote: () => null,

              hr: () => null,
            }}
          >
            {fileContent}
          </ReactMarkdown>
          <LegalNotices />
        </div>
      </div>
    </main>
  );
}
