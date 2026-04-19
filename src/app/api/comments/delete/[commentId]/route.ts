import { NextRequest, NextResponse } from "next/server";
import { buildBackendUrl } from "@/libs/backendApiBase";

function getAuthorizationHeader(request: NextRequest) {
  return request.headers.get("authorization");
}

function jsonResponse(payload: unknown, status: number, fallbackMessage: string) {
  if (payload === null || payload === undefined) {
    return NextResponse.json({ message: fallbackMessage }, { status });
  }
  return NextResponse.json(payload, { status });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ commentId: string }> },
) {
  const authorization = getAuthorizationHeader(request);

  if (!authorization) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  try {
    const { commentId } = await context.params;
    const response = await fetch(buildBackendUrl(`/comments/${encodeURIComponent(commentId)}`), {
      method: "DELETE",
      headers: {
        Authorization: authorization,
      },
    });
    const payload = await response.json().catch(() => null);
    return jsonResponse(payload, response.status, "Failed to delete comment.");
  } catch {
    return NextResponse.json({ message: "Comments service unavailable." }, { status: 502 });
  }
}
