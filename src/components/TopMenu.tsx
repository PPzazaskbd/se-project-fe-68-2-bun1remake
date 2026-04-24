"use client";

import Image from "next/image";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import RandomHotelButton from "./RandomHotelButton";

type NavKey = "hotels" | "bookings" | "profile" | "auth" | "about";

function UserIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path
        d="M15.5 7.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.5 18.5c1.7-2.6 4-3.9 6.5-3.9s4.8 1.3 6.5 3.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function TopMenu() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isAdmin = (session?.user as any)?.role === "admin";
  const bookingsHref = isAdmin ? "/admin" : "/mybooking";

  // Navigation Keys for the indicator
  const isHotelsActive = pathname.startsWith("/hotel");
  const isBookingsActive = pathname === "/mybooking" || pathname === "/admin";
  const isAboutActive = pathname === "/about";

  const activeKey: NavKey | null = isHotelsActive
    ? "hotels"
    : isBookingsActive
      ? "bookings"
      : isAboutActive
        ? "about"
        : null;

  const shellRef = useRef<HTMLDivElement>(null);
  const linkRefs = useRef<Partial<Record<NavKey, HTMLElement | null>>>({});
  const [indicatorStyle, setIndicatorStyle] = useState({
    left: 0,
    width: 0,
    opacity: 0,
  });

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    // Cleanup if component unmounts
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMenuOpen]);

  useLayoutEffect(() => {
    const updateIndicator = () => {
      const shell = shellRef.current;
      const activeElement = activeKey ? linkRefs.current[activeKey] : null;
      if (!shell || !activeElement || window.innerWidth < 1024) {
        // Disable indicator on mobile
        setIndicatorStyle((prev) => ({ ...prev, opacity: 0 }));
        return;
      }
      const shellRect = shell.getBoundingClientRect();
      const activeRect = activeElement.getBoundingClientRect();
      setIndicatorStyle({
        left: activeRect.left - shellRect.left,
        width: activeRect.width,
        opacity: 1,
      });
    };

    updateIndicator();
    window.addEventListener("resize", updateIndicator);
    return () => window.removeEventListener("resize", updateIndicator);
  }, [activeKey, pathname, isMenuOpen]);

  return (
    <header
      className="sticky top-0 z-50 border-b backdrop-saturate-[1.2] transition-all"
      style={{
        backgroundColor: `color-mix(in srgb, transparent 20%, var(--figma-topbar))`,
        borderColor: "var(--figma-border)",
        boxShadow: "0 4px 30px rgba(0, 0, 0, 0.03)",
      }}
    >
      <div className="backdrop-blur-sm">
        <div
          ref={shellRef}
          className="figma-shell relative flex h-20 items-center justify-between"
        >
          {/* Left: Logo & Title */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/img/Bun_JS_logo.png"
                alt="Logo"
                width={32}
                height={32}
                className="h-8 w-8"
                priority
              />
              <span className="font-figma-nav text-xl tracking-widest text-[var(--figma-red)]">
                BUN1
              </span>
            </Link>

            <span className="hidden h-6 w-px bg-[var(--figma-red-soft)] lg:block" />

            {/* Desktop Links */}
            <nav className="hidden items-center gap-8 lg:flex">
              <Link
                href="/hotel"
                ref={(el) => {
                  linkRefs.current.hotels = el;
                }}
                className={`figma-link font-figma-nav tracking-widest ${isHotelsActive ? "figma-link-current" : ""}`}
              >
                HOTELS
              </Link>
              <Link
                href="/about"
                ref={(el) => {
                  linkRefs.current.about = el;
                }}
                className={`figma-link font-figma-nav tracking-widest ${isAboutActive ? "figma-link-current" : ""}`}
              >
                ABOUT
              </Link>
            </nav>
          </div>

          {/* Right: Desktop Actions & Mobile Toggle */}
          <div className="flex items-center gap-6">
            <div className="hidden lg:flex items-center gap-6">
              <RandomHotelButton />
              <Link
                href={bookingsHref}
                ref={(el) => {
                  linkRefs.current.bookings = el;
                }}
                className={`figma-link font-figma-nav ${isBookingsActive ? "figma-link-current" : ""}`}
              >
                BOOKINGS
              </Link>

              <span className="hidden h-6 w-px bg-[var(--figma-red-soft)] lg:block" />
              {session ? (
                <button
                  onClick={() => signOut()}
                  className="figma-link font-figma-nav"
                >
                  LOGOUT
                </button>
              ) : (
                <Link href="/login" className="figma-link font-figma-nav">
                  LOGIN
                </Link>
              )}
              <Link
                href="/profile"
                className="text-[var(--figma-red)] hover:opacity-70 transition-opacity"
              >
                <UserIcon />
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="flex flex-col gap-1.5 lg:hidden p-2 z-50"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle Menu"
            >
              <div
                className={`h-0.5 w-6 bg-[var(--figma-red)] transition-all ${isMenuOpen ? "rotate-45 translate-y-2" : ""}`}
              />
              <div
                className={`h-0.5 w-6 bg-[var(--figma-red)] transition-all ${isMenuOpen ? "opacity-0" : ""}`}
              />
              <div
                className={`h-0.5 w-6 bg-[var(--figma-red)] transition-all ${isMenuOpen ? "-rotate-45 -translate-y-2" : ""}`}
              />
            </button>
          </div>

          {/* Desktop Indicator */}
          <span
            className="figma-nav-indicator hidden lg:block"
            style={{
              width: `${indicatorStyle.width}px`,
              transform: `translateX(${indicatorStyle.left}px)`,
              opacity: indicatorStyle.opacity,
            }}
          />
        </div>

        {/* Mobile Navigation Overlay */}
        <div
          className={`fixed inset-0 top-20 z-40 transition-all duration-500 lg:hidden 
    ${
      isMenuOpen
        ? "translate-x-0 opacity-100 pointer-events-auto"
        : "translate-x-full opacity-0 pointer-events-none"
    }`}
        >
          {/* The Background Layer - Force Full Height */}
          <div className="absolute inset-0 bg-[var(--figma-bg)] h-[calc(100vh-80px)] shadow-2xl">
            <div
              className="absolute inset-0 opacity-[0.03] pointer-events-none"
              style={{
                backgroundImage: `url("https://www.transparenttextures.com/patterns/felt.png")`,
              }}
            />
          </div>

          {/* The Content Container - Internal Scroll Only */}
          <nav className="relative flex flex-col h-[calc(100vh-80px)] p-8 gap-10 overflow-y-auto no-scrollbar">
            <div className="flex flex-col gap-8 mt-4">
              <p className="font-figma-nav font-bold text-[var(--figma-red)] tracking-[0.2em] text-s uppercase whitespace-nowrap transition-all duration-500">
                Guest Menu
              </p>

              <Link
                href="/hotel"
                onClick={() => setIsMenuOpen(false)}
                className="font-figma-display text-6xl text-[var(--figma-red)] active:italic leading-none tracking-tighter"
              >
                Hotels
              </Link>

              <Link
                href="/about"
                onClick={() => setIsMenuOpen(false)}
                className="font-figma-display text-6xl text-[var(--figma-red)] active:italic leading-none tracking-tighter"
              >
                About
              </Link>

              <Link
                href={bookingsHref}
                onClick={() => setIsMenuOpen(false)}
                className="font-figma-display text-6xl text-[var(--figma-red)] active:italic leading-none tracking-tighter"
              >
                Bookings
              </Link>
            </div>

            <div className="mt-auto flex flex-col gap-8 pb-12">
              <hr className="border-[var(--figma-border)] opacity-20" />

              <div className="flex flex-col gap-6">
                <Link
                  href="/profile"
                  onClick={() => setIsMenuOpen(false)}
                  className="font-figma-nav text-2xl flex items-center gap-4 text-[var(--figma-ink)]"
                >
                  <UserIcon /> PROFILE
                </Link>

                {session ? (
                  <button
                    onClick={() => signOut()}
                    className="text-left font-figma-nav text-2xl tracking-widest text-[var(--figma-red)]"
                  >
                    LOG OUT —
                  </button>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="font-figma-nav text-2xl tracking-widest text-[var(--figma-red)]"
                  >
                    LOG IN —
                  </Link>
                )}
              </div>

              <RandomHotelButton />
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
