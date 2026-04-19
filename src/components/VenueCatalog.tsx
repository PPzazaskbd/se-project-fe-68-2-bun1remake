"use client";

import { useEffect, useState } from "react";
import { HotelJson } from "@/interface";
import Card from "./Card";
import HotelCardSkeleton from "./HotelCardSkeleton";

export default function VenueCatalog() {
  const [venues, setVenues] = useState<HotelJson | null>(null);

  useEffect(() => {
    fetch("/api/venues")
      .then((response) => response.json())
      .then((data) => setVenues(data))
      .catch((error) => console.error(error));
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
          key={item._id}
          id={item._id}
          href={`/venue/${item._id}`}
          name={item.name}
          district={item.district}
          province={item.province}
          price={item.price}
          imgSrc={item.imgSrc}
          specializations={item.specializations}
        />
      ))}
    </div>
  );
}
