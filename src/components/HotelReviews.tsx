"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import { CommentItem } from "@/interface";
import { createComment, deleteComment, getComments } from "@/libs/commentsApi";
import { useDismissibleNotice } from "@/libs/useDismissibleNotice";
import DismissibleNotice from "@/components/DismissibleNotice";

const PAGE_SIZE = 6;

type UserLike = { _id?: string; name?: string };
function userObj(c: CommentItem): UserLike | null {
  return (c.user && typeof c.user === "object" ? c.user : null) as UserLike | null;
}
const userIdOf = (c: CommentItem) => typeof c.user === "string" ? c.user : (userObj(c)?._id || "");
const nameOf = (c: CommentItem) => userObj(c)?.name || c.guestName || "Guest";
const textOf = (c: CommentItem) => c.text || c.comment || "";
const dateOf = (c: CommentItem) => c.createdAt || c.commentDate || "";
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

type InlineFormat = "bold" | "italic" | "underline" | "strikethrough";
type FormatState = Record<InlineFormat, boolean>;

const FORMAT_BUTTONS: Array<{
  kind: InlineFormat;
  glyph: string;
  className?: string;
  ariaLabel: string;
}> = [
  { kind: "bold", glyph: "B", ariaLabel: "Apply bold" },
  { kind: "italic", glyph: "I", className: "italic", ariaLabel: "Apply italic" },
  { kind: "underline", glyph: "U", className: "underline", ariaLabel: "Apply underline" },
  {
    kind: "strikethrough",
    glyph: "S",
    className: "line-through [text-decoration-skip-ink:none]",
    ariaLabel: "Apply strikethrough",
  },
];

function emptyFormatState(): FormatState {
  return {
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
  };
}

function commandFor(kind: InlineFormat): "bold" | "italic" | "underline" | "strikeThrough" {
  switch (kind) {
    case "bold":
      return "bold";
    case "italic":
      return "italic";
    case "underline":
      return "underline";
    case "strikethrough":
      return "strikeThrough";
  }
}

function wrapTagged(content: string, tag: "strong" | "em" | "u" | "s"): string {
  if (!content) return "";

  const leading = content.match(/^\s*/)?.[0] || "";
  const trailing = content.match(/\s*$/)?.[0] || "";
  const core = content.slice(leading.length, content.length - trailing.length);

  if (!core) return content;
  return `${leading}<${tag}>${core}</${tag}>${trailing}`;
}

const reviewSanitizeSchema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames || []), "u", "s"],
};

function serializeEditorNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return (node.textContent || "").replace(/\u200B/g, "");
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return "";

  const el = node as HTMLElement;
  const inner = Array.from(el.childNodes).map(serializeEditorNode).join("");

  if (el.tagName === "SPAN") {
    let styled = inner;
    const fontWeight = Number.parseInt(el.style.fontWeight || "", 10);
    const isBold = Number.isFinite(fontWeight)
      ? fontWeight >= 600
      : /(bold|bolder)/i.test(el.style.fontWeight || "");

    if (isBold) styled = wrapTagged(styled, "strong");
    if (el.style.fontStyle === "italic") styled = wrapTagged(styled, "em");

    const decoration = `${el.style.textDecoration} ${el.style.textDecorationLine}`.toLowerCase();
    if (decoration.includes("line-through")) styled = wrapTagged(styled, "s");
    if (decoration.includes("underline")) styled = wrapTagged(styled, "u");

    return styled;
  }

  switch (el.tagName) {
    case "BR":
      return "\n";
    case "STRONG":
    case "B":
      return inner ? wrapTagged(inner, "strong") : "";
    case "EM":
    case "I":
      return inner ? wrapTagged(inner, "em") : "";
    case "U":
      return inner ? wrapTagged(inner, "u") : "";
    case "S":
    case "STRIKE":
    case "DEL":
      return inner ? wrapTagged(inner, "s") : "";
    case "DIV":
    case "P":
      return `${inner}\n`;
    default:
      return inner;
  }
}

function serializeEditorContent(root: HTMLElement): string {
  return Array.from(root.childNodes)
    .map(serializeEditorNode)
    .join("")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}

function ensureSelectionInEditor(root: HTMLElement) {
  const selection = window.getSelection();
  if (!selection) return;

  const inEditor =
    selection.rangeCount > 0 &&
    root.contains(selection.getRangeAt(0).commonAncestorContainer);

  if (inEditor) return;

  const range = document.createRange();
  range.selectNodeContents(root);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
}

function applyInlineStyle(root: HTMLElement, kind: InlineFormat) {
  root.focus();
  ensureSelectionInEditor(root);
  document.execCommand(commandFor(kind));
}

function renderReviewText(input: string) {
  if (!input) return null;

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw, [rehypeSanitize, reviewSanitizeSchema]]}
      components={{
        p: ({ children }) => <>{children}</>,
        strong: ({ children }) => <strong>{children}</strong>,
        em: ({ children }) => <em>{children}</em>,
        s: ({ children }) => <span className="line-through">{children}</span>,
        del: ({ children }) => <span className="line-through">{children}</span>,
        u: ({ children }) => <span className="underline">{children}</span>,
      }}
    >
      {input}
    </ReactMarkdown>
  );
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
      <div className="mt-2 line-clamp-3 wrap-break-word font-figma-copy text-[1rem] leading-snug text-[var(--figma-ink)]">
        {renderReviewText(textOf(c))}
      </div>
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
  const [guestName] = useState(() =>
    "Guest-" + Math.random().toString(36).slice(2, 8).toUpperCase()
  );
  const [submitting, setSubmitting] = useState(false);
  const [activeFormats, setActiveFormats] = useState<FormatState>(emptyFormatState());
  const editorRef = useRef<HTMLDivElement | null>(null);
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

  // Guests (no token / no uid) can never delete.
  // Logged-in users can delete only their own comments; admins can delete any.
  const canDel = (c: CommentItem) =>
    !!token && (
      role === "admin" ||
      (role === "user" && !!uid && !!userIdOf(c) && userIdOf(c) === uid)
    );

  const syncTextFromEditor = () => {
    const editor = editorRef.current;
    const next = editor ? serializeEditorContent(editor) : "";
    setText(next);
    return next;
  };

  const refreshActiveFormats = () => {
    const editor = editorRef.current;
    if (!editor) {
      setActiveFormats(emptyFormatState());
      return;
    }

    const selection = window.getSelection();
    const inEditor =
      !!selection &&
      selection.rangeCount > 0 &&
      editor.contains(selection.getRangeAt(0).commonAncestorContainer);

    if (!inEditor) {
      setActiveFormats(emptyFormatState());
      return;
    }

    const query = (command: "bold" | "italic" | "underline" | "strikeThrough") => {
      try {
        return document.queryCommandState(command);
      } catch {
        return false;
      }
    };

    setActiveFormats({
      bold: query("bold"),
      italic: query("italic"),
      underline: query("underline"),
      strikethrough: query("strikeThrough"),
    });
  };

  const applyInlineFormat = (kind: InlineFormat) => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    applyInlineStyle(editor, kind);
    syncTextFromEditor();
    refreshActiveFormats();
  };

  const toggleForm = () => {
    if (showForm && editorRef.current) {
      editorRef.current.innerHTML = "";
      setText("");
      setActiveFormats(emptyFormatState());
    }
    setShowForm((v) => !v);
  };

  const submit = async () => {
    const latestText = syncTextFromEditor();
    if (!latestText.trim()) return showNotice({ type: "error", message: "Please write a comment." });
    setSubmitting(true);
    try {
      const payload: { comment: string; rating: number; guestName?: string } = {
        comment: latestText.trim(),
        rating,
      };
      // Guests get an auto-generated name like "Guest-AB12CD"
      if (!token) payload.guestName = guestName;

      const r = await createComment(hotelId, token || null, payload);
      if (r?.data) {
        // Only inject user info when the backend actually saved it as a user
        // comment (r.data.user is set). If it came back as guest (no user),
        // keep it as guest so canDel stays false and the trash icon won't show
        // with a token that protect would later reject.
        const savedAsUser = !!r.data.user;
        const displayName = savedAsUser
          ? (session?.user?.name || "You")
          : (guestName.trim() || "Guest");
        const enriched = {
          ...r.data,
          user: savedAsUser ? { _id: uid, name: displayName } : null,
          guestName: savedAsUser ? undefined : displayName,
        };
        const updated = [enriched, ...comments];
        setComments(updated);
        setAvg(recalcAvg(updated));
      }
      if (editorRef.current) editorRef.current.innerHTML = "";
      setActiveFormats(emptyFormatState());
      setText(""); setRating(5); setShowForm(false);
      showNotice({ type: "success", message: "Review submitted." });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to submit.";
      // If the backend rejected a guest post (e.g. not yet updated on the server),
      // give a friendlier message instead of raw "Not authorized".
      const friendly = !token && /not authorized|unauthorized/i.test(msg)
        ? "Guest comments aren't available right now. Please log in to leave a review."
        : msg;
      showNotice({ type: "error", message: friendly });
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
          <button
            type="button"
            onClick={toggleForm}
            className="flex h-12 w-12 shrink-0 items-center justify-center border border-[var(--figma-bg)] bg-[var(--figma-red-strong)] text-white font-figma-copy text-[2rem] leading-none sm:h-14 sm:w-14"
            aria-label={showForm ? "Close" : "Write a review"}
          >
            {showForm ? "×" : "+"}
          </button>
        </div>

        {showForm && (
          <div className="mt-5 space-y-4 border-t border-[rgba(171,25,46,0.12)] pt-5">
            <div className="flex items-center gap-3">
              <span className="font-figma-copy text-[1.1rem] text-[var(--figma-red)]">Rating</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((v) => (
                  <button key={v} type="button" onClick={() => setRating(v)} className={`text-[1.6rem] leading-none ${v <= rating ? "text-[var(--figma-red)]" : "text-[rgba(171,25,46,0.2)]"}`} aria-label={`Rate ${v}`}>★</button>
                ))}
              </div>
            </div>
            <div className="border border-[rgba(171,25,46,0.18)] bg-[rgba(255,245,244,0.6)]">
              <div className="relative">
                {text.trim().length === 0 && (
                  <span className="pointer-events-none absolute left-4 top-4 font-figma-copy text-[1.05rem] text-[rgba(250,170,170,0.95)]">
                    Add Your Comment Here
                  </span>
                )}
                <div
                  ref={editorRef}
                  contentEditable
                  role="textbox"
                  aria-label="Add your comment"
                  onInput={() => {
                    syncTextFromEditor();
                    refreshActiveFormats();
                  }}
                  onBlur={() => {
                    syncTextFromEditor();
                    setActiveFormats(emptyFormatState());
                  }}
                  onFocus={refreshActiveFormats}
                  onKeyUp={refreshActiveFormats}
                  onMouseUp={refreshActiveFormats}
                  suppressContentEditableWarning
                  className="min-h-[140px] w-full whitespace-pre-wrap break-words bg-transparent p-4 font-figma-copy text-[1.05rem] text-[var(--figma-ink)] focus:outline-none"
                />
              </div>
              <div className="border-t border-[rgba(171,25,46,0.2)] px-4 py-2">
                <div className="flex flex-wrap items-center gap-5">
                  {FORMAT_BUTTONS.map((btn) => (
                    <button
                      key={btn.kind}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => applyInlineFormat(btn.kind)}
                      className={`flex h-9 min-w-9 items-center justify-center border px-2 font-figma-nav text-[1.7rem] transition-colors ${activeFormats[btn.kind] ? "border-[#B71422] bg-[#B71422] text-[#FBEFDF]" : "border-transparent text-[rgba(250,170,170,0.95)] hover:text-[var(--figma-red)]"} ${btn.className || ""}`}
                      aria-label={btn.ariaLabel}
                    >
                      {btn.glyph}
                    </button>
                  ))}
                </div>
              </div>
            </div>
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

        {/* {!token && (
          <p className="mt-6 border-t border-[rgba(171,25,46,0.12)] pt-6 font-figma-copy text-[1.2rem] text-[var(--figma-ink-soft)]">
            <a href="/login" className="figma-link">Sign in</a> to leave a review.
          </p>
        )} */}
      </section>
    </>
  );
}
