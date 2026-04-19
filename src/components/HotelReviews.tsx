"use client";

import { useRef, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { CommentItem } from "@/interface";
import { createComment, deleteComment, getComments } from "@/libs/commentsApi";
import { useDismissibleNotice } from "@/libs/useDismissibleNotice";
import DismissibleNotice from "@/components/DismissibleNotice";

interface HotelReviewsProps {
  hotelId: string;
}

/* ─── schema helpers ───────────────────────────────────────────── */

function resolveUserId(c: CommentItem): string {
  if (typeof c.userId === "string") return c.userId;
  if (c.userId && typeof c.userId === "object") {
    const o = c.userId as { _id?: string; id?: string };
    return o._id || o.id || "";
  }
  const raw = c as unknown as Record<string, unknown>;
  const u = raw.user;
  if (u && typeof u === "object") {
    const uo = u as { _id?: string; id?: string };
    return uo._id || uo.id || "";
  }
  return "";
}

function resolveUserName(c: CommentItem): string {
  if (c.userId && typeof c.userId === "object") {
    return (c.userId as { name?: string }).name || "Guest";
  }
  const raw = c as unknown as Record<string, unknown>;
  const u = raw.user;
  if (u && typeof u === "object") {
    return (u as { name?: string }).name || "Guest";
  }
  return "Guest";
}

function getDateField(c: CommentItem): string {
  const raw = c as unknown as Record<string, unknown>;
  return (
    (typeof c.commentDate === "string" ? c.commentDate : undefined) ||
    (typeof raw.createdAt === "string" ? raw.createdAt : undefined) ||
    ""
  );
}

// Backend schema uses 'text' field; frontend sends 'comment'. Read both.
function getCommentText(c: CommentItem): string {
  const raw = c as unknown as Record<string, unknown>;
  return (
    (typeof c.comment === "string" ? c.comment : undefined) ||
    (typeof raw.text === "string" ? raw.text : undefined) ||
    ""
  );
}

// Render simple markdown to HTML for display (escape HTML first to prevent XSS)
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderMarkdown(raw: string): string {
  const safe = escapeHtml(raw);
  return safe
    .replace(/\*\*([\s\S]*?)\*\*/g, "<strong>$1</strong>")
    .replace(/__([\s\S]*?)__/g, "<u>$1</u>")
    .replace(/~~([\s\S]*?)~~/g, "<del>$1</del>")
    .replace(/_([\s\S]*?)_/g, "<em>$1</em>")
    .replace(/\n/g, "<br />");
}

// New reviews come in as HTML (from contenteditable); old ones may be markdown.
function renderCommentHtml(raw: string): string {
  if (/<[a-zA-Z]/.test(raw)) return raw; // already HTML — render as-is
  return renderMarkdown(raw);             // legacy markdown — convert first
}

function relativeTime(dateStr: string): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  if (isNaN(diff)) return "";
  const days = Math.floor(diff / 86400000);
  const months = Math.floor(days / 30);
  const years = Math.floor(months / 12);
  if (years > 0) {
    const remMonths = months - years * 12;
    if (remMonths > 0)
      return `${years} year${years > 1 ? "s" : ""} and ${remMonths} month${remMonths > 1 ? "s" : ""} ago`;
    return `${years} year${years > 1 ? "s" : ""} ago`;
  }
  if (months > 0) {
    const remDays = days - months * 30;
    if (remDays > 0)
      return `${months} month${months > 1 ? "s" : ""} and ${remDays} day${remDays > 1 ? "s" : ""} ago`;
    return `${months} month${months > 1 ? "s" : ""} ago`;
  }
  if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
  return "just now";
}

function recalcAverage(list: CommentItem[]): number | null {
  if (!Array.isArray(list) || list.length === 0) return null;
  const sum = list.reduce((s, c) => s + (Number(c.rating) || 0), 0);
  return parseFloat((sum / list.length).toFixed(2));
}

/* ─── TrashIcon ────────────────────────────────────────────────── */

function TrashIcon() {
  return (
    <svg width="14" height="16" viewBox="0 0 14 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M1 4h12M5 4V2h4v2M2 4l1 10h8l1-10H2z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ─── ReviewCard ───────────────────────────────────────────────── */

interface ReviewCardProps {
  c: CommentItem;
  canDel: boolean;
  onDelete: (id: string) => void;
  onExpand: (c: CommentItem) => void;
}

function ReviewCard({ c, canDel, onDelete, onExpand }: ReviewCardProps) {
  const textRef = useRef<HTMLParagraphElement>(null);
  const [clamped, setClamped] = useState(false);

  useEffect(() => {
    const el = textRef.current;
    if (el) {
      setClamped(el.scrollHeight > el.clientHeight + 2);
    }
  }, [c]);

  return (
    <article className="flex flex-col border border-[rgba(171,25,46,0.08)] bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-figma-copy text-[1.05rem] text-[var(--figma-red)]">
            {"★".repeat(Math.max(0, Math.min(5, Math.round(Number(c.rating) || 0))))}
            {"☆".repeat(Math.max(0, 5 - Math.min(5, Math.round(Number(c.rating) || 0))))}
          </span>
          <span className="font-figma-copy text-[1rem] text-[var(--figma-ink)]">
            {resolveUserName(c)}
          </span>
        </div>
        {canDel && (
          <button
            type="button"
            onClick={() => onDelete(c._id)}
            className="shrink-0 text-[var(--figma-red)] opacity-60 hover:opacity-100"
            aria-label="Delete review"
          >
            <TrashIcon />
          </button>
        )}
      </div>

      <p
        ref={textRef}
        className="mt-2 line-clamp-3 font-figma-copy text-[1rem] leading-snug text-[var(--figma-ink)]"
        dangerouslySetInnerHTML={{ __html: renderCommentHtml(getCommentText(c)) }}
      />

      <div className="mt-auto flex items-center justify-between gap-2 pt-3">
        {clamped ? (
          <button
            type="button"
            onClick={() => onExpand(c)}
            className="font-figma-copy text-[0.9rem] text-[var(--figma-red)] underline underline-offset-2"
          >
            Read full review
          </button>
        ) : (
          <span />
        )}
        <span className="font-figma-copy text-[0.85rem] text-[var(--figma-ink-soft)]">
          {relativeTime(getDateField(c))}
        </span>
      </div>
    </article>
  );
}

/* ─── ReviewInput (contenteditable — live formatting) ─────────── */

interface ReviewInputProps {
  value: string;
  onChange: (v: string) => void;
  onClear: () => void; // called after submit so the div resets
}

function ReviewInput({ value, onChange, onClear }: ReviewInputProps) {
  const divRef = useRef<HTMLDivElement>(null);
  // Track whether the div is empty so we can show/hide placeholder
  const [empty, setEmpty] = useState(true);

  // When parent resets value to "" (after submit), clear the div
  useEffect(() => {
    if (value === "" && divRef.current && divRef.current.innerHTML !== "") {
      divRef.current.innerHTML = "";
      setEmpty(true);
    }
  }, [value]);

  function handleInput() {
    const div = divRef.current;
    if (!div) return;
    const html = div.innerHTML;
    // Treat a div containing only a <br> as empty (browser default)
    const isEmpty = html === "" || html === "<br>";
    setEmpty(isEmpty);
    onChange(isEmpty ? "" : html);
  }

  function applyFormat(command: string) {
    // execCommand works on the current selection inside the contenteditable
    document.execCommand(command, false);
    divRef.current?.focus();
    handleInput();
  }

  const fmtButtons: { label: string; cmd: string; btnClass: string }[] = [
    { label: "B", cmd: "bold",          btnClass: "font-bold" },
    { label: "I", cmd: "italic",        btnClass: "italic" },
    { label: "U", cmd: "underline",     btnClass: "underline" },
    { label: "S", cmd: "strikeThrough", btnClass: "line-through" },
  ];

  return (
    <div className="border border-[rgba(171,25,46,0.15)] bg-[rgba(255,245,244,0.6)]">
      <div className="relative min-h-[6.5rem] px-4 pt-4 pb-2">
        {/* Placeholder overlay */}
        {empty && (
          <span className="pointer-events-none absolute left-4 top-4 font-figma-copy text-[1.05rem] italic tracking-wide text-[var(--figma-ink-soft)] select-none">
            Add Your Comment Here
          </span>
        )}
        <div
          ref={divRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          className="relative min-h-[5rem] font-figma-copy text-[1.05rem] leading-relaxed text-[var(--figma-ink)] focus:outline-none"
        />
      </div>
      <div className="mx-4 border-t border-[rgba(171,25,46,0.12)]" />
      <div className="flex gap-2 px-4 py-2">
        {fmtButtons.map((btn) => (
          <button
            key={btn.label}
            type="button"
            onMouseDown={(e) => e.preventDefault()} // keep focus in contenteditable
            onClick={() => applyFormat(btn.cmd)}
            className={`flex h-7 w-7 items-center justify-center border border-[rgba(171,25,46,0.2)] font-figma-copy text-[0.9rem] text-[var(--figma-ink)] transition-colors hover:bg-[rgba(171,25,46,0.07)] ${btn.btnClass}`}
            aria-label={btn.label}
          >
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── Modal (inline, no createPortal) ─────────────────────────── */

interface FullReviewModalProps {
  c: CommentItem;
  canDel: boolean;
  onDelete: (id: string) => void;
  onClose: () => void;
}

function FullReviewModal({ c, canDel, onDelete, onClose }: FullReviewModalProps) {
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-md bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-figma-copy text-[1.1rem] text-[var(--figma-red)]">
              {"★".repeat(Math.max(0, Math.min(5, Math.round(Number(c.rating) || 0))))}
              {"☆".repeat(Math.max(0, 5 - Math.min(5, Math.round(Number(c.rating) || 0))))}
            </span>
            <span className="font-figma-copy text-[1.1rem] text-[var(--figma-ink)]">
              {resolveUserName(c)}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {canDel && (
              <button
                type="button"
                onClick={() => onDelete(c._id)}
                className="text-[var(--figma-red)] opacity-70 hover:opacity-100"
                aria-label="Delete"
              >
                <TrashIcon />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="font-figma-copy text-[1.6rem] leading-none text-[var(--figma-red)]"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>
        <p
          className="mt-4 font-figma-copy text-[1.05rem] leading-relaxed text-[var(--figma-ink)]"
          dangerouslySetInnerHTML={{ __html: renderCommentHtml(getCommentText(c)) }}
        />
        <p className="mt-4 font-figma-copy text-[0.9rem] text-[var(--figma-ink-soft)]">
          {relativeTime(getDateField(c))}
        </p>
      </div>
    </div>
  );
}

/* ─── Main component ───────────────────────────────────────────── */

const PAGE_SIZE = 6;

export default function HotelReviews({ hotelId }: HotelReviewsProps) {
  const { data: session } = useSession();
  const token = session?.user?.token || "";
  const userId = session?.user?._id || "";
  const userRole = session?.user?.role || "";

  const [comments, setComments] = useState<CommentItem[]>([]);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState<"all" | "yours">("all");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modal, setModal] = useState<CommentItem | null>(null);
  const { notice, showNotice, dismissNotice } = useDismissibleNotice();

  useEffect(() => {
    if (!hotelId) return;
    let ignore = false;
    setIsLoading(true);
    getComments(hotelId)
      .then((data) => {
        if (ignore) return;
        const list = Array.isArray(data?.data) ? data.data : [];
        setComments(list);
        setAverageRating(
          typeof data?.averageRating === "number" ? data.averageRating : recalcAverage(list),
        );
      })
      .catch(() => {
        if (!ignore) setComments([]);
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [hotelId]);

  const canDelete = (c: CommentItem) =>
    userRole === "admin" ||
    (userRole === "user" && !!userId && resolveUserId(c) === userId);

  const handleSubmit = async () => {
    if (!token) return;
    // Strip HTML tags to get plain text for the empty check
    const plainText = newComment.replace(/<[^>]+>/g, "").trim();
    if (!plainText) {
      showNotice({ type: "error", message: "Please write a comment." });
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await createComment(hotelId, token, {
        comment: newComment.trim(),
        rating: newRating,
      });
      if (result?.data) {
        const updated = [result.data, ...comments];
        setComments(updated);
        setAverageRating(recalcAverage(updated));
      }
      setNewComment("");
      setNewRating(5);
      setShowForm(false);
      showNotice({ type: "success", message: "Review submitted." });
    } catch (err) {
      showNotice({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to submit.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!token) return;
    try {
      await deleteComment(commentId, token);
      const remaining = comments.filter((c) => c._id !== commentId);
      setComments(remaining);
      setAverageRating(recalcAverage(remaining));
      if (modal?._id === commentId) setModal(null);
    } catch (err) {
      showNotice({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to delete.",
      });
    }
  };

  const filtered =
    tab === "yours"
      ? comments.filter((c) => resolveUserId(c) === userId)
      : comments;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const start = (page - 1) * PAGE_SIZE;
  const visible = filtered.slice(start, start + PAGE_SIZE);

  return (
    <>
      {/* Inline modal — no createPortal */}
      {modal && (
        <FullReviewModal
          c={modal}
          canDel={canDelete(modal)}
          onDelete={(id) => void handleDelete(id)}
          onClose={() => setModal(null)}
        />
      )}

      <section className="mt-8 border border-[rgba(171,25,46,0.08)] bg-[rgba(255,245,244,0.45)] p-5 sm:p-10">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-figma-copy text-[2rem] text-[var(--figma-ink)] sm:text-[2.5rem]">
            Reviews ({comments.length})
            {averageRating !== null && (
              <span className="ml-2 text-[var(--figma-red)]">
                {averageRating.toFixed(1)}★
              </span>
            )}
          </h2>
          {token && (
            <button
              type="button"
              onClick={() => setShowForm((v) => !v)}
              className="flex h-9 w-9 shrink-0 items-center justify-center bg-[var(--figma-red)] text-white"
              aria-label={showForm ? "Close review form" : "Write a review"}
            >
              {showForm ? (
                /* X icon — close form */
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="7" stroke="white" strokeWidth="1.4" />
                  <path d="M5 5l6 6M11 5l-6 6" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              ) : (
                /* + icon — open form */
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 3v10M3 8h10" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              )}
            </button>
          )}
        </div>

        {/* Write form */}
        {showForm && token && (
          <div className="mt-5 space-y-4 border-t border-[rgba(171,25,46,0.12)] pt-5">
            {/* Star rating */}
            <div className="flex items-center gap-3">
              <span className="font-figma-copy text-[1.1rem] text-[var(--figma-red)]">Rating</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setNewRating(v)}
                    className={`text-[1.6rem] leading-none transition-colors ${
                      v <= newRating
                        ? "text-[var(--figma-red)]"
                        : "text-[rgba(171,25,46,0.2)]"
                    }`}
                    aria-label={`Rate ${v} star${v > 1 ? "s" : ""}`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            {/* Rich text input */}
            <ReviewInput
              value={newComment}
              onChange={setNewComment}
              onClear={() => setNewComment("")}
            />

            <DismissibleNotice notice={notice} onClose={dismissNotice} />

            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={isSubmitting}
              className="figma-button w-full py-3 font-figma-copy text-[1.3rem] normal-case tracking-normal"
            >
              {isSubmitting ? "Submitting Review..." : "Submit Review"}
            </button>
          </div>
        )}

        {/* Tabs — always rendered when data exists so reviews never "disappear" */}
        {!isLoading && comments.length > 0 && (
          <div className="mt-5 flex gap-2">
            <button
              type="button"
              onClick={() => {
                setTab("all");
                setPage(1);
              }}
              className={`px-4 py-1.5 font-figma-copy text-[1.05rem] transition-colors ${
                tab === "all"
                  ? "bg-[var(--figma-red)] text-white"
                  : "border border-[rgba(171,25,46,0.2)] text-[var(--figma-ink)] hover:bg-[rgba(171,25,46,0.05)]"
              }`}
            >
              All reviews
            </button>
            {token && (
              <button
                type="button"
                onClick={() => {
                  setTab("yours");
                  setPage(1);
                }}
                className={`px-4 py-1.5 font-figma-copy text-[1.05rem] transition-colors ${
                  tab === "yours"
                    ? "bg-[var(--figma-red)] text-white"
                    : "border border-[rgba(171,25,46,0.2)] text-[var(--figma-ink)] hover:bg-[rgba(171,25,46,0.05)]"
                }`}
              >
                Your reviews
              </button>
            )}
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <p className="mt-5 font-figma-copy text-[1.3rem] text-[var(--figma-ink-soft)]">
            Loading…
          </p>
        ) : filtered.length === 0 ? (
          <p className="mt-5 font-figma-copy text-[1.3rem] text-[var(--figma-ink-soft)]">
            {tab === "yours"
              ? "You haven't reviewed this hotel yet."
              : "No ratings yet"}
          </p>
        ) : (
          <>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {visible.map((c) => (
                <ReviewCard
                  key={c._id}
                  c={c}
                  canDel={canDelete(c)}
                  onDelete={(id) => void handleDelete(id)}
                  onExpand={setModal}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="text-[var(--figma-red)] disabled:opacity-30"
                  aria-label="Previous page"
                >
                  <svg width="20" height="24" viewBox="0 0 48 56" fill="none">
                    <path d="M0 27.7129L48 7.62939e-05V55.4257L0 27.7129Z" fill="currentColor" fillOpacity="0.6" />
                  </svg>
                </button>
                <span className="font-figma-copy text-[1rem] text-[var(--figma-ink)]">
                  {start + 1}–{Math.min(start + PAGE_SIZE, filtered.length)} of {filtered.length}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="text-[var(--figma-red)] disabled:opacity-30"
                  aria-label="Next page"
                >
                  <svg width="20" height="24" viewBox="0 0 48 56" fill="none">
                    <path
                      d="M0 27.7129L48 7.62939e-05V55.4257L0 27.7129Z"
                      fill="currentColor"
                      fillOpacity="0.6"
                      transform="rotate(180 24 28)"
                    />
                  </svg>
                </button>
              </div>
            )}
          </>
        )}

        {!token && (
          <p className="mt-6 border-t border-[rgba(171,25,46,0.12)] pt-6 font-figma-copy text-[1.2rem] text-[var(--figma-ink-soft)]">
            <a href="/login" className="figma-link">
              Sign in
            </a>{" "}
            to leave a review.
          </p>
        )}
      </section>
    </>
  );
}
