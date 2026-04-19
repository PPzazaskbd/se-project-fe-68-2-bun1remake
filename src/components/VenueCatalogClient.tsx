"use client";

import { useEffect, useState } from "react";
import { HotelJson } from "@/interface";
import Card from "./Card";
import HotelCardSkeleton from "./HotelCardSkeleton";

export default function VenueCatalogClient() {
  const [venues, setVenues] = useState<HotelJson | null>(null);

  useEffect(() => {
    fetch("/api/venues")
      .then((response) => response.json())
      .then((data) => setVenues(data))
      .catch((error) => console.error("Error fetching venues:", error));
  }, []);

  if (!venues) {
    return (
      <div className="grid gap-8 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <HotelCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {venues.data.map((item) => (
        <Card
          key={item.id || item._id}
          id={item.id || item._id}
          href={`/venue/${item.id || item._id}`}
          name={item.name}
          address={item.address}
          province={item.province}
          price={item.price}
          imgSrc={item.imgSrc}
        />
      ))}
    </div>
  );
}
