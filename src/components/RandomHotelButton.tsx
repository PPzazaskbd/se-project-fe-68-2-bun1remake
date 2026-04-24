"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, CircularProgress } from "@mui/material";
import { fetchHotelsAction } from "@/libs/actionGetHotels";
import {
  getDateRangeFromSearchParams,
  buildDateRangeHref,
} from "@/libs/dateRangeParams";

export default function RandomHotelButton() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  // State to track the cumulative rotation
  const [rotation, setRotation] = useState(0);

  const handleRandomize = async () => {
    if (loading) return; // Prevent double clicks
    setLoading(true);
    try {
      const hotelsJson = await fetchHotelsAction();
      const hotels = hotelsJson.data || [];
      if (hotels.length === 0) return;

      const randomHotel = hotels[Math.floor(Math.random() * hotels.length)];
      const id = randomHotel.id || randomHotel._id;

      const currentUrlParams = getDateRangeFromSearchParams(searchParams);
      const href = buildDateRangeHref(`/hotel/${id}`, currentUrlParams);

      router.push(href);
    } catch (error) {
      console.error("Randomizer failed:", error);
    } finally {
      // Note: We don't necessarily set loading to false here
      // if we want it to stay spinning until the next page loads
      setLoading(false);
    }
  };

  return (
    <Button
      variant="contained"
      className="!px-1 figma-button self-start group"
      onClick={handleRandomize}
      // When hovering, we trigger a "tick" of 90 degrees
      onMouseEnter={() => setRotation((prev) => prev + 90)}
      sx={{
        width: "40px",
        height: "40px",
        minWidth: "40px",
        borderRadius: "6px !important",
        padding: "0 !important",
        backgroundColor: "var(--figma-red)",
        "&:hover": {
          backgroundColor: "var(--figma-red)",
          filter: "brightness(0.9)",
        },
        "&.Mui-disabled": { backgroundColor: "var(--figma-red)", opacity: 0.7 },
      }}
      disableElevation
    >
      {loading ? (
        <CircularProgress size={20} sx={{ color: "var(--figma-white)" }} />
      ) : (
        <div
          className="flex items-center justify-center transition-transform duration-500 ease-in-out"
          style={{ transform: `rotate(${rotation}deg)` }}
          // To make it continue/pause, we can add a listener to keep it turning while hovered
          onTransitionEnd={() => {
            // If the mouse is still over the button, rotate another 90 degrees after a tiny "rest"
            const isHovered = document.querySelector(".group:hover");
            if (isHovered) {
              setTimeout(() => setRotation((prev) => prev + 90), 100);
            }
          }}
        >
          <img
            src="/dice.svg"
            alt="Randomize"
            style={{ width: 30, height: 30, filter: "invert(1)" }}
          />
        </div>
      )}
    </Button>
  );
}
