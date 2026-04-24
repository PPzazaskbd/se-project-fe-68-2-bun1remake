"use client";

export default function Arrow({
  direction,
  disabled,
}: {
  direction: "left" | "right" | "top" | "bottom";
  disabled?: boolean;
}) {
  const rotations = {
    left: "rotate(0deg)",
    right: "rotate(180deg)",
    top: "rotate(90deg)",
    bottom: "rotate(270deg)",
  };

  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        transform: rotations[direction],
        transition: "transform 0.3s ease-out",
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
      className="inline-block"
    >
      <path
        d="M15 18L9 12L15 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
