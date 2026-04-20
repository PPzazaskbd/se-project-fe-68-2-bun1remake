import { CommentItem } from "@/interface";

interface CommentPayload {
  comment: string;
  rating: number;
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

export async function createComment(hotelId: string, token: string, body: CommentPayload) {
  const response = await fetch(`/api/comments/${encodeURIComponent(hotelId)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ text: body.comment, rating: body.rating }),
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
