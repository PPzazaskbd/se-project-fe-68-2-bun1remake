import { CommentItem } from "@/interface";

interface CommentPayload {
  comment: string;
  rating: number;
  guestName?: string;   // only used when posting without a session
}

interface CommentsResponse {
  success: boolean;
  count: number;
  averageRating: number | null;
  data: CommentItem[];
}

function getErrorMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== "object") return fallback;
  const p = payload as { message?: string; msg?: string; error?: string };
  return p.message || p.msg || p.error || fallback;
}

async function parseJson(response: Response) {
  try {
    return (await response.json()) as unknown;
  } catch {
    return null;
  }
}

export async function getComments(hotelId: string): Promise<CommentsResponse> {
  const response = await fetch(`/api/comments/${encodeURIComponent(hotelId)}`, {
    cache: "no-store",
  });
  const payload = await parseJson(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(payload, "Failed to load comments."));
  }

  return payload as CommentsResponse;
}

export async function createComment(hotelId: string, token: string | null, body: CommentPayload) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`/api/comments/${encodeURIComponent(hotelId)}`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      text: body.comment,
      rating: body.rating,
      ...(body.guestName ? { guestName: body.guestName } : {}),
    }),
  });
  const payload = await parseJson(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(payload, "Failed to submit review."));
  }

  return payload as { success: boolean; data: CommentItem };
}

export async function deleteComment(commentId: string, token: string) {
  const response = await fetch(`/api/comments/delete/${encodeURIComponent(commentId)}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const payload = await parseJson(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(payload, "Failed to delete review."));
  }
}
