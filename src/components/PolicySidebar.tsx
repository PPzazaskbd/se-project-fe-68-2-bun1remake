"use client";
import { useState } from "react";

export default function ExpandableShell({
  children,
  headings,
}: {
  children: React.ReactNode;
  headings: string[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const slugify = (text: string) =>
    text
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-row relative">
      {/* 1. FIXED SIDEBAR (Sticks to the left of the screen) */}
      <aside
        className={`absolute top-0 left-0 h-screen z-50 bg-[var(--figma-bg)] border-r border-[var(--figma-border)] transition-transform duration-500 ease-in-out overflow-y-auto shadow-2xl w-80
          ${isOpen ? "translate-x-0" : "-translate-x-full"} w-80`}
      >
        {" "}
        <div className="sticky top-0 z-10 bg-[var(--figma-bg)] px-8 py-14 flex items-center gap-6"></div>
        {/* --- SCROLLABLE LINKS PART --- */}
        <div className="px-8 pt-4 pb-12">
          <ul className="space-y-6">
            {headings.map((h) => (
              <li key={h}>
                <a
                  href={`#${slugify(h)}`}
                  onClick={() => {
                    if (window.innerWidth < 768) setIsOpen(false);
                  }}
                  className="font-figma-copy text-xl text-[var(--figma-ink-soft)] hover:text-[var(--figma-red)] transition-all block hover:translate-x-2"
                >
                  {h}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* 2. THE FLOATING TOGGLE BUTTON */}
      <div className="fixed top-10 left-10 z-[60] flex items-center gap-6 pointer-events-none">
        {/* Button - pointer-events-auto allows clicking despite the parent container */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg bg-[var(--figma-white)] border border-[var(--figma-border)] pointer-events-auto flex-shrink-0"
        >
          <div className="relative w-6 h-5">
            <span
              className={`absolute block h-0.5 w-6 bg-[var(--figma-red)] transition-all duration-300 ${isOpen ? "rotate-45 top-2" : "top-0"}`}
            />
            <span
              className={`absolute block h-0.5 w-6 bg-[var(--figma-red)] transition-all duration-300 top-2 ${isOpen ? "opacity-0" : "opacity-100"}`}
            />
            <span
              className={`absolute block h-0.5 w-6 bg-[var(--figma-red)] transition-all duration-300 ${isOpen ? "-rotate-45 top-2" : "top-4"}`}
            />
          </div>
        </button>

        {/* Navigation Label */}
        <span
          className={`font-figma-nav font-bold text-[var(--figma-red)] tracking-[0.2em] text-s uppercase whitespace-nowrap transition-all duration-500
            ${isOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"}`}
        >
          Navigation
        </span>
      </div>

      {/* 3. THE MAIN PAGE CONTENT 
          The padding-left (pl) animates to "push" the content when the sidebar opens
      */}
      <div
        className={`h-full flex-1 overflow-x-hidden overflow-y-auto transition-all duration-500 ease-in-out
          ${isOpen ? "pl-80" : "pl-0"}`}
      >
        <div className="max-w-4xl mx-auto px-6 py-11">{children}</div>
      </div>
    </div>
  );
}
