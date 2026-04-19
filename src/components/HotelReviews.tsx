"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { CommentItem } from "@/interface";
import { createComment, deleteComment, getComments } from "@/libs/commentsApi";
import { useDismissibleNotice } from "@/libs/useDismissibleNotice";
import DismissibleNotice from "@/components/DismissibleNotice";

const PAGE_SIZE = 6;

type UserLike = { _id?: string; name?: string };
function userObj(c: CommentItem): UserLike | null {
  return (typeof c.userId === "object" ? c.userId : (c as unknown as { user?: unknown }).user) as UserLike | null;
}
const userIdOf = (c: CommentItem) => typeof c.userId === "string" ? c.userId : (userObj(c)?._id || "");
const nameOf = (c: CommentItem) => userObj(c)?.name || "Guest";
const textOf = (c: CommentItem) => c.comment || (c as unknown as { text?: string }).text || "";
const dateOf = (c: CommentItem) => c.commentDate || (c as unknown as { createdAt?: string }).createdAt || "";
function relTime(d: string): string {
  if (!d) return "";
  const diff = Date.now() - new Date(d).getTime();
  if (isNaN(diff) || diff < 0) return "";
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(months / 12);
  const p = (n: number, u: string) => `${n} ${u}${n > 1 ? "s" : ""}`;
  const two = (a: number, ua: string, b: number, ub: string) =>
    b > 0 ? `${p(a, ua)} and ${p(b, ub)} ago` : `${p(a, ua)} ago`;
  if (years > 0) return two(years, "year", months - years * 12, "month");
  if (months > 0) return two(months, "month", days - months * 30, "day");
  if (days > 0) return two(days, "day", hours - days * 24, "hour");
  if (hours > 0) return two(hours, "hour", minutes - hours * 60, "minute");
  if (minutes > 0) return two(minutes, "minute", seconds - minutes * 60, "second");
  return "just now";
}
function stars(r: number): string {
  const n = Math.max(0, Math.min(5, Math.round(Number(r) || 0)));
  return "★".repeat(n) + "☆".repeat(5 - n);
}

function ReviewCard({ c, canDel, onDelete }: {
  c: CommentItem; canDel: boolean; onDelete: (id: string) => void;
}) {
  return (
    <article className="flex flex-col border border-[rgba(171,25,46,0.08)] bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-figma-copy text-[1.05rem] text-[var(--figma-red)]">{stars(c.rating)}</span>
          <span className="font-figma-copy text-[1rem] text-[var(--figma-ink)]">{nameOf(c)}</span>
        </div>
        {canDel && (
          <button type="button" onClick={() => onDelete(c._id)} className="shrink-0 text-[var(--figma-red)] opacity-60 hover:opacity-100" aria-label="Delete review">
            <svg width="14" height="16" viewBox="0 0 14 16" fill="none"><path d="M1 4h12M5 4V2h4v2M2 4l1 10h8l1-10H2z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        )}
      </div>
      <p className="mt-2 line-clamp-3 font-figma-copy text-[1rem] leading-snug text-[var(--figma-ink)] whitespace-pre-wrap">{textOf(c)}</p>
      <p className="mt-auto pt-3 text-right font-figma-copy text-[0.85rem] text-[var(--figma-ink-soft)]">{relTime(dateOf(c))}</p>
    </article>
  );
}

export default function HotelReviews({ hotelId }: { hotelId: string }) {
  const { data: session } = useSession();
  const token = session?.user?.token || "";
  const uid = session?.user?._id || "";
  const role = session?.user?.role || "";

  const [comments, setComments] = useState<CommentItem[]>([]);
  const [avg, setAvg] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | "yours">("all");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { notice, showNotice, dismissNotice } = useDismissibleNotice();

  const recalcAvg = (list: CommentItem[]) =>
    list.length === 0 ? null : parseFloat((list.reduce((s, c) => s + (Number(c.rating) || 0), 0) / list.length).toFixed(2));

  useEffect(() => {
    if (!hotelId) return;
    let ignore = false;
    setLoading(true);
    getComments(hotelId)
      .then((d) => {
        if (ignore) return;
        const list = Array.isArray(d?.data) ? d.data : [];
        setComments(list);
        setAvg(typeof d?.averageRating === "number" ? d.averageRating : recalcAvg(list));
      })
      .catch(() => { if (!ignore) setComments([]); })
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, [hotelId]);

  const canDel = (c: CommentItem) => role === "admin" || (role === "user" && !!uid && userIdOf(c) === uid);

  const submit = async () => {
    if (!token) return;
    if (!text.trim()) return showNotice({ type: "error", message: "Please write a comment." });
    setSubmitting(true);
    try {
      const r = await createComment(hotelId, token, { comment: text.trim(), rating });
      if (r?.data) {
        const updated = [r.data, ...comments];
        setComments(updated);
        setAvg(recalcAvg(updated));
      }
      setText(""); setRating(5); setShowForm(false);
      showNotice({ type: "success", message: "Review submitted." });
    } catch (e) {
      showNotice({ type: "error", message: e instanceof Error ? e.message : "Failed to submit." });
    } finally { setSubmitting(false); }
  };

  const del = async (id: string) => {
    if (!token) return;
    try {
      await deleteComment(id, token);
      const rest = comments.filter((c) => c._id !== id);
      setComments(rest);
      setAvg(recalcAvg(rest));
    } catch (e) {
      showNotice({ type: "error", message: e instanceof Error ? e.message : "Failed to delete." });
    }
  };

  const filtered = tab === "yours" ? comments.filter((c) => userIdOf(c) === uid) : comments;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const start = (page - 1) * PAGE_SIZE;
  const visible = filtered.slice(start, start + PAGE_SIZE);

  return (
    <>
      <section className="mt-8 border border-[rgba(171,25,46,0.08)] bg-[rgba(255,245,244,0.45)] p-5 sm:p-10">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-figma-copy text-[2rem] text-[var(--figma-ink)] sm:text-[2.5rem]">
            Reviews ({comments.length}){avg !== null && <span className="ml-2 text-[var(--figma-red)]">{avg.toFixed(1)}★</span>}
          </h2>
          {token && (
            <button type="button" onClick={() => setShowForm((v) => !v)} className="flex h-9 w-9 shrink-0 items-center justify-center bg-[var(--figma-red)] text-white font-figma-copy text-[1.4rem] leading-none" aria-label={showForm ? "Close" : "Write a review"}>
              {showForm ? "×" : "+"}
            </button>
          )}
        </div>

        {showForm && token && (
          <div className="mt-5 space-y-4 border-t border-[rgba(171,25,46,0.12)] pt-5">
            <div className="flex items-center gap-3">
              <span className="font-figma-copy text-[1.1rem] text-[var(--figma-red)]">Rating</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((v) => (
                  <button key={v} type="button" onClick={() => setRating(v)} className={`text-[1.6rem] leading-none ${v <= rating ? "text-[var(--figma-red)]" : "text-[rgba(171,25,46,0.2)]"}`} aria-label={`Rate ${v}`}>★</button>
                ))}
              </div>
            </div>
            <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Add Your Comment Here" rows={4}
              className="w-full resize-none border border-[rgba(171,25,46,0.15)] bg-[rgba(255,245,244,0.6)] p-4 font-figma-copy text-[1.05rem] text-[var(--figma-ink)] placeholder:italic placeholder:text-[var(--figma-ink-soft)] focus:outline-none" />
            <DismissibleNotice notice={notice} onClose={dismissNotice} />
            <button type="button" onClick={() => void submit()} disabled={submitting} className="figma-button w-full py-3 font-figma-copy text-[1.3rem] normal-case tracking-normal">
              {submitting ? "Submitting..." : "Submit Review"}
            </button>
          </div>
        )}

        {!loading && comments.length > 0 && (
          <div className="mt-5 flex gap-2">
            <button type="button" onClick={() => { setTab("all"); setPage(1); }} className={`px-4 py-1.5 font-figma-copy text-[1.05rem] ${tab === "all" ? "bg-[var(--figma-red)] text-white" : "border border-[rgba(171,25,46,0.2)] text-[var(--figma-ink)]"}`}>All reviews</button>
            {token && (
              <button type="button" onClick={() => { setTab("yours"); setPage(1); }} className={`px-4 py-1.5 font-figma-copy text-[1.05rem] ${tab === "yours" ? "bg-[var(--figma-red)] text-white" : "border border-[rgba(171,25,46,0.2)] text-[var(--figma-ink)]"}`}>Your reviews</button>
            )}
          </div>
        )}

        {loading ? (
          <p className="mt-5 font-figma-copy text-[1.3rem] text-[var(--figma-ink-soft)]">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="mt-5 font-figma-copy text-[1.3rem] text-[var(--figma-ink-soft)]">{tab === "yours" ? "You haven't reviewed this hotel yet." : "No ratings yet"}</p>
        ) : (
          <>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {visible.map((c) => <ReviewCard key={c._id} c={c} canDel={canDel(c)} onDelete={(id) => void del(id)} />)}
            </div>
            {totalPages > 1 && (
              <div className="mt-6 flex items-center gap-3">
                <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="text-[var(--figma-red)] disabled:opacity-30" aria-label="Previous">‹</button>
                <span className="font-figma-copy text-[1rem] text-[var(--figma-ink)]">{start + 1}–{Math.min(start + PAGE_SIZE, filtered.length)} of {filtered.length}</span>
                <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="text-[var(--figma-red)] disabled:opacity-30" aria-label="Next">›</button>
              </div>
            )}
          </>
        )}

        {!token && (
          <p className="mt-6 border-t border-[rgba(171,25,46,0.12)] pt-6 font-figma-copy text-[1.2rem] text-[var(--figma-ink-soft)]">
            <a href="/login" className="figma-link">Sign in</a> to leave a review.
          </p>
        )}
      </section>
    </>
  );
}
