import HotelCardSkeleton from "@/components/HotelCardSkeleton";

export default function HotelsLoading() {
  return (
    <section className="figma-page py-6 sm:py-8">
      <div className="figma-shell">
        <div className="figma-toolbar">
          <div className="h-6 w-10 animate-pulse bg-[rgba(171,25,46,0.12)]" />
          <div className="h-8 w-40 animate-pulse bg-[rgba(23,17,12,0.08)]" />
          <div className="h-6 w-6 animate-pulse bg-[rgba(171,25,46,0.12)]" />
          <div className="h-8 w-40 animate-pulse bg-[rgba(23,17,12,0.08)]" />
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="space-y-3">
            <div className="h-4 w-28 animate-pulse bg-[rgba(171,25,46,0.12)]" />
            <div className="h-10 w-full animate-pulse bg-[rgba(23,17,12,0.08)]" />
          </div>
          <div className="h-6 w-full animate-pulse self-end justify-self-end bg-[rgba(23,17,12,0.08)] lg:w-44" />
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <HotelCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
