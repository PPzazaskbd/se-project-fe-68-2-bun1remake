"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const COOKIE_CONSENT_KEY = "bun1_cookie_consent";

export default function CookieConsentModal() {
  const pathname = usePathname();
  const [shouldShow, setShouldShow] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const acceptButtonRef = useRef<HTMLButtonElement>(null);
  const isCookieNoticePage = pathname === "/about/cookies";

  useEffect(() => {
    setShouldShow(localStorage.getItem(COOKIE_CONSENT_KEY) !== "accepted");
  }, []);

  useEffect(() => {
    if (!shouldShow) {
      return;
    }

    const previousHtmlOverflow = document.documentElement.style.overflow;
    const scrollRoot = document.getElementById("app-scroll-root");
    const previousScrollRootOverflow = scrollRoot?.style.overflow;
    const previousActiveElement = document.activeElement;

    document.documentElement.style.overflow = "hidden";
    if (scrollRoot) {
      scrollRoot.style.overflow = "hidden";
    }

    acceptButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      // Consent requires explicit acknowledgement; Escape stays trapped.
      if (event.key === "Escape") {
        event.preventDefault();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const modal = modalRef.current;
      if (!modal) {
        return;
      }

      const focusableElements = Array.from(
        modal.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );

      if (focusableElements.length === 0) {
        event.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;

      if (!activeElement || !modal.contains(activeElement)) {
        event.preventDefault();
        if (event.shiftKey) {
          lastElement.focus();
        } else {
          firstElement.focus();
        }
        return;
      }

      if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.documentElement.style.overflow = previousHtmlOverflow;
      if (scrollRoot) {
        scrollRoot.style.overflow = previousScrollRootOverflow ?? "";
      }

      if (previousActiveElement instanceof HTMLElement) {
        previousActiveElement.focus();
      }
    };
  }, [shouldShow]);

  if (!shouldShow) {
    return null;
  }

  const acceptCookies = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    setShouldShow(false);
  };

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-end justify-center overflow-hidden px-4 backdrop-blur-[1px] ${
        isCookieNoticePage ? "bg-black/20" : "bg-black/55"
      }`}
      aria-labelledby="cookie-consent-title"
      aria-modal="true"
      role="dialog"
    >
      <div
        ref={modalRef}
        className="relative h-[251px] w-[min(380px,calc(100vw_-_2rem))] translate-y-10 rounded-[20px] bg-[rgba(183,20,34,0.5)] p-[10px] shadow-[0_24px_80px_rgba(23,17,12,0.28)]"
      >
        <div className="relative h-[222px] rounded-lg bg-[var(--figma-bg)]">
          <Image
            aria-hidden="true"
            src="/cookie.svg"
            alt=""
            width={32}
            height={32}
            className="absolute left-[5px] top-[5px] h-8 w-8"
          />

          <h2
            id="cookie-consent-title"
            className="absolute left-[45px] top-[1px] font-figma-copy text-[25px] font-bold leading-normal tracking-[0.05em] text-black"
          >
            We use cookies
          </h2>

          <p className="absolute left-[45px] top-[54px] w-[calc(100%-58px)] font-figma-copy text-base font-bold leading-normal tracking-[0.05em] text-black sm:w-[302px]">
            We use cookies to keep you logged in and make the site work
            properly. These are essential and cannot be disabled.
          </p>

          <div className="absolute bottom-[30px] left-[45px]">
            <Link
              href="/about/cookies"
              target="_blank"
              rel="noopener noreferrer"
              className="font-figma-copy text-base font-bold tracking-[0.05em] text-[var(--figma-red)] underline underline-offset-2 hover:text-[var(--figma-red-strong)]"
            >
              Learn more
            </Link>
          </div>

          <div className="absolute bottom-[34px] right-[13px]">
            <button
              ref={acceptButtonRef}
              type="button"
              onClick={acceptCookies}
              className="figma-button h-[51px] w-[98px] px-0 py-0 font-figma-nav text-2xl"
            >
              GOT IT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
