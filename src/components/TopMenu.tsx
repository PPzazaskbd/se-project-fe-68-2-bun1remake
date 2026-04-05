"use client";

import Image from "next/image";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef, useState } from "react";

type NavKey = "hotels" | "bookings" | "profile" | "auth";

function UserIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    >
      <path d="M15.5 7.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z" />
      <path d="M5.5 18.5c1.7-2.6 4-3.9 6.5-3.9s4.8 1.3 6.5 3.9" />
    </svg>
  );
}

function getLinkClass(isCurrent: boolean) {
  return `figma-link font-figma-nav text-[1.15rem] sm:text-[1.35rem] ${isCurrent ? "figma-link-current" : ""}`;
}

export default function TopMenu() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = (session?.user as { role?: string } | undefined)?.role === "admin";
  const bookingsHref = isAdmin ? "/admin" : "/mybooking";
  const bookingsLinkHref = session
    ? bookingsHref
    : `/login?callbackUrl=${encodeURIComponent(bookingsHref)}`;
  const profileHref = session
    ? "/profile"
    : `/login?callbackUrl=${encodeURIComponent("/profile")}`;
  const authHref = session ? "/" : "/login";
  const isHotelsActive = pathname.startsWith("/hotel");
  const isBookingsActive = pathname === "/mybooking" || pathname === "/admin";
  const isProfileActive = pathname === "/profile";
  const isAuthActive =
    !session &&
    (pathname === "/login" || pathname === "/register" || pathname === "/verify-otp");
  const activeKey: NavKey | null = isHotelsActive
    ? "hotels"
    : isBookingsActive
      ? "bookings"
      : isProfileActive
        ? "profile"
      : isAuthActive
        ? "auth"
        : null;

  const shellRef = useRef<HTMLDivElement>(null);
  const linkRefs = useRef<Partial<Record<NavKey, HTMLElement | null>>>({});
  const [indicatorStyle, setIndicatorStyle] = useState({
    left: 0,
    width: 0,
    opacity: 0,
  });

  useLayoutEffect(() => {
    const updateIndicator = () => {
      const shell = shellRef.current;
      const activeElement = activeKey ? linkRefs.current[activeKey] : null;

      if (!shell || !activeElement) {
        setIndicatorStyle((current) => ({ ...current, opacity: 0 }));
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

    const resizeObserver = new ResizeObserver(() => {
      updateIndicator();
    });

    if (shellRef.current) {
      resizeObserver.observe(shellRef.current);
    }

    Object.values(linkRefs.current).forEach((node) => {
      if (node) {
        resizeObserver.observe(node);
      }
    });

    const frameId = window.requestAnimationFrame(updateIndicator);
    window.addEventListener("resize", updateIndicator);
    window.addEventListener("load", updateIndicator);

    return () => {
      resizeObserver.disconnect();
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", updateIndicator);
      window.removeEventListener("load", updateIndicator);
    };
  }, [activeKey, pathname, session]);

  return (
    <header
      className="sticky top-0 z-30 border-b"
      style={{
        background: "var(--figma-soft)",
        borderColor: "rgba(171, 25, 46, 0.08)",
      }}
    >
      <div
        ref={shellRef}
        className="figma-shell relative flex min-h-[72px] items-center justify-between gap-4 py-3 sm:min-h-[80px] sm:py-4"
      >
        <div className="flex items-center gap-3 sm:gap-5">
          <Link href="/" className="shrink-0">
            <Image
              src="/img/Bun_JS_logo.png"
              alt="Bun1"
              width={34}
              height={34}
              className="h-8 w-8 sm:h-9 sm:w-9"
              priority
            />
          </Link>

          <div className="flex items-center gap-3 text-[var(--figma-red)] sm:gap-4">
            <Link
              href="/"
              className="font-figma-nav text-[1.15rem] tracking-[0.08em] sm:text-[1.4rem]"
            >
              BUN1
            </Link>
            <span
              aria-hidden="true"
              className="hidden h-8 w-px sm:block"
              style={{ background: "rgba(171, 25, 46, 0.28)" }}
            />
            <Link
              href="/hotel"
              ref={(node) => {
                linkRefs.current.hotels = node;
              }}
              className={getLinkClass(isHotelsActive)}
            >
              HOTELS
            </Link>
          </div>
        </div>

        <nav className="flex flex-wrap items-center justify-end gap-4 text-[var(--figma-red)] sm:gap-6">
          <Link
            href={bookingsLinkHref}
            ref={(node) => {
              linkRefs.current.bookings = node;
            }}
            className={getLinkClass(isBookingsActive)}
          >
            BOOKINGS
          </Link>

          {session ? (
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className={getLinkClass(false)}
            >
              LOG OUT
            </button>
          ) : (
            <Link
              href={authHref}
              ref={(node) => {
                linkRefs.current.auth = node;
              }}
              className={getLinkClass(isAuthActive)}
            >
              LOG IN
            </Link>
          )}

          <Link
            href={profileHref}
            ref={(node) => {
              linkRefs.current.profile = node;
            }}
            className="figma-card-action text-[var(--figma-red)]"
            aria-label={session ? "Open profile" : "Open login"}
          >
            <UserIcon />
          </Link>
        </nav>

        <span
          aria-hidden="true"
          className="figma-nav-indicator"
          style={{
            width: `${indicatorStyle.width}px`,
            transform: `translateX(${indicatorStyle.left}px)`,
            opacity: indicatorStyle.opacity,
          }}
        />
      </div>
    </header>
  );
}
