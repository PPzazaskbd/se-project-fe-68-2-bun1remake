import Image from "next/image";
import Link from "next/link";

export default function Banner() {
  return (
    <section className="figma-page">
      <div className="figma-shell grid min-h-[calc(100vh-80px)] items-center gap-10 py-12 md:grid-cols-[1.2fr_0.88fr] md:gap-16 md:py-20">
        <div className="max-w-[44rem]">
          <h1
            className="font-figma-display text-[3.1rem] leading-[0.96] text-[var(--figma-ink)] sm:text-[4rem] md:text-[5.5rem]"
          >
            <span className="block">Rest well,</span>
            <span className="block">
              from the moment you <em className="italic">book.</em>
            </span>
          </h1>

          <p className="mt-5 max-w-[28rem] font-figma-display text-[2rem] text-[var(--figma-ink)] sm:text-[2.35rem]">
            For quiet weekends and brief escapes.
          </p>

          <Link
            href="/hotel"
            className="figma-button figma-button-prominent mt-10 px-8 py-3 font-figma-display text-[1.45rem] sm:text-[1.9rem]"
          >
            Book Your Stay
          </Link>
        </div>

        <div className="relative mx-auto w-full max-w-[25rem] overflow-hidden border border-[rgba(171,25,46,0.08)] bg-[#f2e2d5] md:max-w-[23.7rem]">
          <div className="relative aspect-[379/569]">
            <Image
              src="/img/banner.jpg"
              alt="Guest room"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 379px"
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
