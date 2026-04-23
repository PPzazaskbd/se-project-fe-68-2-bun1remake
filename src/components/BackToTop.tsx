"use client";
import Arrow from "./Arrow";

export default function BackToTop() {
  const scrollToHeader = () => {
    const topElement = document.getElementById("top-start");

    if (topElement) {
      topElement.scrollIntoView({ behavior: "smooth" });
    } else {
      const scrollContainer = document.querySelector("main.overflow-y-auto");
      scrollContainer?.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <button
      onClick={scrollToHeader}
      className="figma-link font-figma-nav text-sm flex items-center gap-3 mt-12 mb-8 group cursor-pointer border-none bg-transparent p-0 transition-colors"
    >
      {/* Wrapper for the Arrow to handle the vertical lift */}
      <span className="inline-flex transition-transform duration-300 ease-out group-hover:-translate-y-1">
        <Arrow direction="top" />
      </span>

      {/* Text with subtle letter-spacing (tracking-widest) for that luxury look */}
      <span className="tracking-widest uppercase">Back to Top</span>
    </button>
  );
}
