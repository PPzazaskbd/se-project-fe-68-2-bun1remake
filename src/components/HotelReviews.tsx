"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CommentItem } from "@/interface";
import { createComment, deleteComment, getComments } from "@/libs/commentsApi";
import { useDismissibleNotice } from "@/libs/useDismissibleNotice";
import DismissibleNotice from "@/components/DismissibleNotice";

interface HotelReviewsProps {
  hotelId: string;
}

function resolveUserId(userId: CommentItem["userId"]) {
  if (typeof userId === "string") return userId;
  if (userId && typeof userId === "object") {
    return (userId as { _id?: string; id?: string })._id ||
      (userId as { _id?: string; id?: string }).id ||
      "";
  }
  return "";
}

function resolveUserName(userId: CommentItem["userId"]) {
  if (userId && typeof userId === "object") {
    return (userId as { name?: string }).name || "Guest";
  }
  return "Guest";
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  const months = Math.floor(days / 30);
  const years = Math.floor(months / 12);
  if (years > 0) return `${years} year${years > 1 ? "s" : ""} ago`;
  if (months > 0) {
    const remDays = days - months * 30;
    if (remDays > 0)
      return `${months} month${months > 1 ? "s" : ""} and ${remDays} day${remDays > 1 ? "s" : ""} ago`;
    return `${months} month${months > 1 ? "s" : ""} ago`;
  }
  if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
  return "just now";
}

function TrashIcon() {
  return (
    <svg width="14" height="16" viewBox="0 0 14 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1 4h12M5 4V2h4v2M2 4l1 10h8l1-10H2z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

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
    let ignore = false;
    setIsLoading(true);
    getComments(hotelId)
      .then((data) => {
        if (!ignore) {
          setComments(data.data);
          setAverageRating(data.averageRating);
        }
      })
      .catch(() => { if (!ignore) setComments([]); })
      .finally(() => { if (!ignore) setIsLoading(false); });
    return () => { ignore = true; };
  }, [hotelId]);

  const recalcAverage = (list: CommentItem[]) => {
    if (!list.length) return null;
    return parseFloat((list.reduce((s, c) => s + c.rating, 0) / list.length).toFixed(2));
  };

  const canDelete = (c: CommentItem) =>
    userRole === "admin" || (userRole === "user" && !!userId && resolveUserId(c.userId) === userId);

  const handleSubmit = async () => {
    if (!token) return;
    if (!newComment.trim()) {
      showNotice({ type: "error", message: "Please write a comment." });
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await createComment(hotelId, token, { comment: newComment.trim(), rating: newRating });
      if (result.data) {
        const updated = [result.data, ...comments];
        setComments(updated);
        setAverageRating(recalcAverage(updated));
      }
      setNewComment("");
      setNewRating(5);
      setShowForm(false);
      showNotice({ type: "success", message: "Review submitted." });
    } catch (err) {
      showNotice({ type: "error", message: err instanceof Error ? err.message : "Failed to submit." });
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
      showNotice({ type: "error", message: err instanceof Error ? err.message : "Failed to delete." });
    }
  };

  const filtered = tab === "yours" ? comments.filter((c) => resolveUserId(c.userId) === userId) : comments;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const start = (page - 1) * PAGE_SIZE;
  const visible = filtered.slice(start, start + PAGE_SIZE);

  return (
    <section className="mt-8 border border-[rgba(171,25,46,0.08)] bg-[rgba(255,245,244,0.45)] p-5 sm:p-10">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-figma-copy text-[2rem] text-[var(--figma-ink)] sm:text-[2.5rem]">
          Reviews ({comments.length}){" "}
          {averageRating !== null && (
            <span>{averageRating.toFixed(1)}★</span>
          )}
        </h2>
        {token && (
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="flex h-9 w-9 shrink-0 items-center justify-center bg-[var(--figma-red)] font-figma-nav text-[1.6rem] leading-none text-white"
          >
            {showForm ? "−" : "+"}
          </button>
        )}
      </div>

      {/* Write form */}
      {showForm && token && (
        <div className="mt-5 space-y-3 border-t border-[rgba(171,25,46,0.12)] pt-5">
          <div className="flex items-center gap-3">
            <label className="font-figma-copy text-[1.1rem] text-[var(--figma-red)]">Rating</label>
            {/* Star rating: click a star to set rating 1–5; filled red up to selected value */}
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setNewRating(v)}
                  className={`text-[1.6rem] leading-none transition-colors ${
                    v <= newRating ? "text-[var(--figma-red)]" : "text-[rgba(171,25,46,0.2)]"
                  }`}
                  aria-label={`Rate ${v} star${v > 1 ? "s" : ""}`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your experience..."
            rows={3}
            className="figma-input resize-none"
          />
          <DismissibleNotice notice={notice} onClose={dismissNotice} />
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={isSubmitting}
            className="figma-button px-6 py-2 font-figma-nav text-[1.2rem]"
          >
            {isSubmitting ? "SUBMITTING" : "SUBMIT"}
          </button>
        </div>
      )}

      {/* Tabs */}
      {!isLoading && comments.length > 0 && (
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={() => { setTab("all"); setPage(1); }}
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
              onClick={() => { setTab("yours"); setPage(1); }}
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
        <p className="mt-5 font-figma-copy text-[1.3rem] text-[var(--figma-ink-soft)]">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="mt-5 font-figma-copy text-[1.3rem] text-[var(--figma-ink-soft)]">
          {tab === "yours" ? "You haven't reviewed this hotel yet." : "No ratings yet"}
        </p>
      ) : (
        <>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {visible.map((c) => (
              <article
                key={c._id}
                className="flex flex-col border border-[rgba(171,25,46,0.08)] bg-white p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-figma-copy text-[1.05rem] text-[var(--figma-ink)]">
                      {c.rating.toFixed(1)}★
                    </span>
                    <span className="font-figma-copy text-[1rem] text-[var(--figma-ink)]">
                      {resolveUserName(c.userId)}
                    </span>
                  </div>
                  {canDelete(c) && (
                    <button
                      type="button"
                      onClick={() => void handleDelete(c._id)}
                      className="shrink-0 text-[var(--figma-red)] opacity-60 hover:opacity-100"
                      aria-label="Delete review"
                    >
                      <TrashIcon />
                    </button>
                  )}
                </div>
                <p className="mt-2 line-clamp-3 font-figma-copy text-[1rem] leading-snug text-[var(--figma-ink)]">
                  {c.comment}
                </p>
                <div className="mt-auto flex items-center justify-between gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setModal(c)}
                    className="font-figma-copy text-[0.9rem] text-[var(--figma-red)] underline underline-offset-2"
                  >
                    Read full review
                  </button>
                  <span className="font-figma-copy text-[0.85rem] text-[var(--figma-ink-soft)]">
                    {relativeTime(c.commentDate)}
                  </span>
                </div>
              </article>
            ))}
          </div>

          {/* Pagination */}
          <div className="mt-6 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="text-[var(--figma-red)] disabled:opacity-30"
            >
              <svg width="20" height="24" viewBox="0 0 48 56" fill="none"><path d="M0 27.7129L48 7.62939e-05V55.4257L0 27.7129Z" fill="currentColor" fillOpacity="0.6"/></svg>
            </button>
            <span className="font-figma-copy text-[1rem] text-[var(--figma-ink)]">
              showing {start + 1} - {Math.min(start + PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="text-[var(--figma-red)] disabled:opacity-30"
            >
              <svg width="20" height="24" viewBox="0 0 48 56" fill="none"><path d="M0 27.7129L48 7.62939e-05V55.4257L0 27.7129Z" fill="currentColor" fillOpacity="0.6" transform="rotate(180 24 28)"/></svg>
            </button>
          </div>
        </>
      )}

      {!token && (
        <p className="mt-6 border-t border-[rgba(171,25,46,0.12)] pt-6 font-figma-copy text-[1.2rem] text-[var(--figma-ink-soft)]">
          <a href="/login" className="figma-link">Sign in</a> to leave a review.
        </p>
      )}

      {modal && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setModal(null); }}
        >
          <div className="relative w-full max-w-md bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="font-figma-copy text-[1.1rem] text-[var(--figma-ink)]">
                  {modal.rating.toFixed(1)}★
                </span>
                <span className="font-figma-copy text-[1.1rem] text-[var(--figma-ink)]">
                  {resolveUserName(modal.userId)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                {canDelete(modal) && (
                  <button
                    type="button"
                    onClick={() => void handleDelete(modal._id)}
                    className="text-[var(--figma-red)] opacity-70 hover:opacity-100"
                    aria-label="Delete"
                  >
                    <TrashIcon />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="font-figma-copy text-[1.4rem] leading-none text-[var(--figma-red)]"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
            </div>
            <p className="mt-4 font-figma-copy text-[1.05rem] leading-relaxed text-[var(--figma-ink)]">
              {modal.comment}
            </p>
            <p className="mt-4 font-figma-copy text-[0.9rem] text-[var(--figma-ink-soft)]">
              {relativeTime(modal.commentDate)}
            </p>
          </div>
        </div>,
        document.body
      )}
    </section>
  );
}
