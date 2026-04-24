"use client";

import DismissibleNotice from "@/components/DismissibleNotice";
import { buildAuthHref, getSafeCallbackUrl } from "@/libs/authRedirect";
import { savePendingOtpRegistration } from "@/libs/pendingOtpRegistration";
import { useDismissibleNotice } from "@/libs/useDismissibleNotice";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function getRecord(value: unknown) {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;
}

function getStringValue(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return undefined;
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedCallbackUrl = searchParams.get("callbackUrl");
  const callbackUrl = getSafeCallbackUrl(requestedCallbackUrl);
  const loginHref = buildAuthHref("/login", requestedCallbackUrl);
  const { notice, showNotice, dismissNotice } = useDismissibleNotice();

  const [name, setName] = useState("");
  const [telephone, setTelephone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit =
    !isSubmitting && acceptPrivacy && name && telephone && email && password;

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    dismissNotice(true);

    if (!acceptPrivacy) {
      showNotice({
        type: "error",
        message: "Please accept the Privacy Policy.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          telephone,
          email,
          password,
          acceptPrivacy,
        }),
      });

      const data = (await response.json()) as unknown;
      const payload = getRecord(data);
      const payloadData = getRecord(payload?.data);

      if (!response.ok || payload?.success === false) {
        showNotice({
          type: "error",
          message:
            getStringValue(payload?.message, payload?.msg, payload?.error) ||
            "Registration failed.",
        });
        setIsSubmitting(false);
        return;
      }

      savePendingOtpRegistration({
        name,
        email: getStringValue(payloadData?.email, payload?.email) || email,
        callbackUrl,
        otpExpiresAt: getStringValue(payloadData?.otpExpiresAt, payload?.otpExpiresAt),
        resendAvailableAt: getStringValue(
          payloadData?.resendAvailableAt,
          payload?.resendAvailableAt,
        ),
      });

      router.push("/verify-otp");
    } catch {
      showNotice({ type: "error", message: "Registration service unavailable." });
      setIsSubmitting(false);
    }
  };

  return (
    <main className="figma-page flex items-center justify-center px-4 py-10 sm:px-6 sm:py-16">
      <section className="figma-panel w-full max-w-[51.6rem] px-8 py-12 sm:px-11 sm:py-14">
        <h1 className="font-figma-nav text-center text-[2rem] tracking-[0.08em] text-[var(--figma-red)]">
          REGISTER
        </h1>

        <form onSubmit={handleRegister} className="mx-auto mt-10 flex max-w-[25rem] flex-col gap-6">
          <label className="font-figma-copy text-[2rem] text-[var(--figma-red-soft)]">
            <span className="sr-only">Name</span>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="figma-input"
              placeholder="Name"
              required
            />
          </label>

          <label className="font-figma-copy text-[2rem] text-[var(--figma-red-soft)]">
            <span className="sr-only">Phone Number</span>
            <input
              type="tel"
              value={telephone}
              onChange={(event) => setTelephone(event.target.value.replace(/\D/g, ""))}
              className="figma-input"
              placeholder="Phone Number"
              required
            />
          </label>

          <label className="font-figma-copy text-[2rem] text-[var(--figma-red-soft)]">
            <span className="sr-only">Email Address</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="figma-input"
              placeholder="Email Address"
              required
            />
          </label>

          <label className="font-figma-copy text-[2rem] text-[var(--figma-red-soft)]">
            <span className="sr-only">Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="figma-input"
              placeholder="Password"
              required
              minLength={6}
            />
          </label>

          <div className="flex items-start gap-3 rounded-xl border border-[var(--figma-red-soft)]/30 p-4 font-figma-copy text-[1rem] text-[var(--figma-ink)]">
            <input
              id="accept-privacy"
              type="checkbox"
              checked={acceptPrivacy}
              onChange={(event) => setAcceptPrivacy(event.target.checked)}
              className="mt-1 h-4 w-4 shrink-0 accent-[var(--figma-red)]"
              required
            />
              <label htmlFor="accept-privacy" className="leading-6">
                I have read, accept:{" "}
                <Link
                  href="/about/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--figma-red)] underline"
                >
                  Privacy Policy
                </Link>
              </label>
          </div>

          <DismissibleNotice notice={notice} onClose={dismissNotice} />

          <button
            type="submit"
            disabled={!canSubmit}
            aria-busy={isSubmitting}
            className="figma-button figma-button-prominent mt-4 h-[2rem] w-full font-figma-nav text-[1.9rem] leading-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "REGISTERING" : "REGISTER"}
          </button>
        </form>

        <p className="mt-10 text-center font-figma-copy text-[1.5rem] text-[var(--figma-ink)]">
          Have an account?{" "}
          <Link href={loginHref} className="text-[var(--figma-red)]">
            Log in
          </Link>
        </p>
      </section>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}