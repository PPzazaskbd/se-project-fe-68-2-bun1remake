"use client";

import { memo } from "react";
import Image from "next/image";

interface SelectedFilters {
  rating: string;
  priceRange: string;
  accommodationType: string[];
  facility: string[];
  location: string[];
  accessibility: string[];
}

interface FilterPanelProps {
  isOpen: boolean;
  selectedFilters: SelectedFilters;
  onToggle: (category: keyof SelectedFilters, value: string) => void;
}

// Sub-component สำหรับ Rating Button (เป๊ะตาม Figma CSS)
const RatingButton = memo(({ value, isSelected, onClick }: { value: string; isSelected: boolean; onClick: () => void }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        relative flex items-center justify-center gap-3 transition-all duration-300
        w-[120px] h-[48px] rounded-[12px]
        ${isSelected ? "bg-[#AB192E]" : "bg-[#D9D9D9]"}
      `}
    >

      <span
        className={`
          absolute top-1/2 -translate-y-1/2 left-[42px]
          font-['Cormorant_Infant'] text-[36px] font-bold leading-[44px] tracking-[0.05em]
          ${isSelected ? "text-[#FBEFDF]" : "text-black"}
        `}>
        {value}
      </span>

      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        className={`
          absolute top-1/2 -translate-y-1/2 left-[57px]
          ${isSelected ? "fill-[#FBEFDF]" : "fill-[#1D1B20]"}
        `}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
      </svg>
    </button>
  );
});
RatingButton.displayName = "RatingButton";

const PriceButton = memo(({ 
  value, 
  isSelected, 
  onClick 
}: { 
  value: string; 
  isSelected: boolean; 
  onClick: () => void 
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex items-center justify-center transition-all duration-300
        w-[120px] h-[48px] rounded-[12px]
        ${isSelected ? "bg-[#AB192E]" : "bg-[#D9D9D9]"}
      `}
    >
      <span className={`
        font-['Cormorant_Infant'] text-[36px] font-bold leading-none tracking-[0.05em]
        mt-[2px] 
        ${isSelected ? "text-[#FBEFDF]" : "text-black"}
      `}>
        {value}
      </span>
    </button>
  );
});
PriceButton.displayName = "PriceButton";

const FilterPill = memo(({ label, isSelected, onClick }: { label: string; isSelected: boolean; onClick: () => void }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ fontFamily: "'Cormorant SC', serif", fontSize: "30px",fontWeight: "bold" }}
      className={`
        flex flex-row items-center justify-center flex-shrink-0
        min-w-[103px] h-[36px] px-[10px]
        rounded-[50px] transition-all duration-200 whitespace-nowrap
        font-['Cormorant_SC'] text-[30px] font-bold leading-none uppercase
        shadow-[0px_4px_4px_rgba(0,0,0,0.25)]
        ${isSelected ? "bg-[#AB192E] text-[#FBEFDF]" : "bg-[#FBEFDF] text-black"}
      `}
    >
      {label}
    </button>
  );
});
FilterPill.displayName = "FilterPill";

export default function FilterPanel({ isOpen, selectedFilters, onToggle }: FilterPanelProps) {
  return (
    <div
      className={`
        overflow-hidden transition-all duration-500 ease-in-out
        ${isOpen ? "max-h-[1000px] opacity-100 mb-8" : "max-h-0 opacity-0 pointer-events-none"}
      `}
    >
      <div className="bg-[#FDF1E8]/40 p-8 border-y border-[#AB192E]/10 space-y-10">

        {/* RATING SECTION */}
        <section className="space-y-6">
          <h3 className="font-['Cormorant_SC'] text-[32px] font-bold leading-[39px] tracking-[0.05em] text-[#AB192E] uppercase">
            Rating
          </h3>

          <div className="flex flex-wrap gap-[33px]">
            {["1", "2", "3", "4", "5"].map((star) => (
              <RatingButton
                key={star}
                value={star}
                isSelected={selectedFilters.rating === star}
                onClick={() => onToggle("rating", star)}
              />
            ))}
          </div>
        </section>

        {/* PRICE SECTION */}
        <section className="space-y-6">
          <h3 className="font-['Cormorant_SC'] text-[32px] font-bold leading-[39px] tracking-[0.05em] text-[#AB192E] uppercase">
            Price
          </h3>
          <div className="flex flex-wrap gap-[33px]">
            {["$", "$$", "$$$", "$$$+"].map((price) => (
              <PriceButton
                key={price}
                value={price}
                isSelected={selectedFilters.priceRange === price}
                onClick={() => onToggle("priceRange", price)}
              />
            ))}
          </div>
        </section>
        
        <section className="space-y-6">
          <h3 className="font-['Cormorant_SC'] text-[32px] font-bold leading-[39px] tracking-[0.05em] text-[#AB192E] uppercase">
            Accommodation Type
          </h3>

          <div className="flex flex-wrap gap-[10px] ">
            {["Hotel", "Resort", "Villa"].map((type) => (
              <FilterPill
                key={type}
                label={type}
                isSelected={selectedFilters.accommodationType.includes(type)}
                onClick={() => onToggle("accommodationType", type)}
              />
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <h3 className="font-['Cormorant_SC'] text-[32px] font-bold leading-[39px] tracking-[0.05em] text-[#AB192E] uppercase">
            Facility
          </h3>

          <div className="flex flex-wrap gap-[10px] ">
            {["Spa" , "Pool" , "Gym" , "Co-Working Space" , "Library"].map((type) => (
              <FilterPill
                key={type}
                label={type}
                isSelected={selectedFilters.facility.includes(type)}
                onClick={() => onToggle("facility", type)}
              />
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <h3 className="font-['Cormorant_SC'] text-[32px] font-bold leading-[39px] tracking-[0.05em] text-[#AB192E] uppercase">
            Location
          </h3>

          <div className="flex flex-wrap gap-[10px] ">
            {["Sunset" , "Mountain View" , "Riverside" , "Near Airport"].map((type) => (
              <FilterPill
                key={type}
                label={type}
                isSelected={selectedFilters.location.includes(type)}
                onClick={() => onToggle("location", type)}
              />
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <h3 className="font-['Cormorant_SC'] text-[32px] font-bold leading-[39px] tracking-[0.05em] text-[#AB192E] uppercase">
            Acessibility  
          </h3>

          <div className="flex flex-wrap gap-[10px] ">
            {["Blind" , "Deaf" , "Mobility"].map((type) => (
              <FilterPill
                key={type}
                label={type}
                isSelected={selectedFilters.accessibility.includes(type)}
                onClick={() => onToggle("accessibility", type)}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}