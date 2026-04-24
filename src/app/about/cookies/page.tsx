import fs from "fs";
import path from "path";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import PolicySidebar from "@/components/PolicySidebar";
import BackToTop from "@/components/BackToTop";

export default async function PrivacyPolicy() {
  // 1. Get the path to the markdown file
  const filePath = path.join(
    process.cwd(),
    "public",
    "content",
    "cookies-notice.md",
  );

  // 2. Read the file content
  const fileContent = fs.readFileSync(filePath, "utf8");
  const headings = fileContent
    .split("\n")
    .filter((line) => line.startsWith("## "))
    .map((line) => line.replace("## ", "").trim());

  return (
    <main className="w-full h-screen overflow-hidden">
      {/* 3. Render the Markdown */}
      <PolicySidebar headings={headings}>
        <div className="max-w-none pb-20">
          <div id="top-start" className="pt-15 lg:pt-0" />
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              // Headings
              h1: ({ ...props }) => (
                <h1
                  className="font-figma-display text-5xl !tracking-wide font-bold text-[var(--figma-red)] mb-10 border-b border-[var(--figma-red-soft)] pb-6"
                  {...props}
                />
              ),
              h2: ({ node, ...props }) => {
                // Convert text to a slug: "Hello World" -> "hello-world"
                const id = props.children
                  ?.toString()
                  .toLowerCase()
                  .replace(/\s+/g, "-")
                  .replace(/[^\w-]/g, "");
                return (
                  <h2
                    id={id}
                    className="font-figma-display text-3xl font-semibold text-[var(--figma-red-strong)] mt-12 mb-4 uppercase tracking-wide scroll-mt-24"
                    {...props}
                  />
                );
              },
              h3: ({ ...props }) => (
                <h3
                  className="font-figma-display text-2xl font-medium text-[var(--figma-ink)] mt-8 mb-3 italic"
                  {...props}
                />
              ),

              p: ({ children, node, ref, ...props }) => {
                if (children === "===") {
                  return (
                    <hr
                      // We do NOT spread props here to avoid the type mismatch
                      className="mb-6 mt-12 border-t border-[var(--figma-border)] font-bold"
                    />
                  );
                }

                return (
                  <p
                    className="font-figma-copy text-[1.4rem] leading-relaxed text-[var(--figma-ink-soft)] mb-6"
                    {...props} // Spreading into a <p> is safe here
                  >
                    {children}
                  </p>
                );
              },

              strong: ({ ...props }) => (
                <strong
                  className="font-bold text-[var(--figma-red-strong)]"
                  {...props}
                />
              ),

              // Lists with ink color
              ul: ({ ...props }) => (
                <ul
                  className="list-disc list-outside ml-8 mb-8 space-y-3 text-[1.3rem] text-[var(--figma-ink-soft)]"
                  {...props}
                />
              ),
              li: ({ ...props }) => <li className="pl-2" {...props} />,

              // Links use "figma-link" logic
              a: ({ ...props }) => (
                <a
                  className="figma-link font-figma-nav !text-[var(--figma-red)] !tracking-wide font-bold border-b border-[var(--figma-red-soft)] hover:border-[var(--figma-red-strong)] transition-all"
                  {...props}
                />
              ),

              // Use "figma-feedback" style for blockquotes
              blockquote: ({ ...props }) => (
                <blockquote
                  className="figma-feedback italic bg-[var(--figma-soft)] border-l-4 border-[var(--figma-red)] my-8 !pb-0 text-[1.2rem]"
                  {...props}
                />
              ),

              hr: () => (
                <hr className="my-12 border-t border-[var(--figma-red-soft)] opacity-30" />
              ),
            }}
          >
            {fileContent}
          </ReactMarkdown>
          <BackToTop />
        </div>
      </PolicySidebar>
    </main>
  );
}
