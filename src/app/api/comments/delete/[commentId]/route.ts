import { NextRequest, NextResponse } from "next/server";
import { buildBackendUrl } from "@/libs/backendApiBase";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ commentId: string }> },
) {
  const authorization = request.headers.get("authorization");
  if (!authorization) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  try {
    const { commentId } = await context.params;
    const response = await fetch(
      buildBackendUrl(`/comments/${encodeURIComponent(commentId)}`),
      {
        method: "DELETE",
        headers: { Authorization: authorization },
      },
    );
    const payload = await response.json().catch(() => null);
    return NextResponse.json(payload ?? { success: true }, { status: response.status });
  } catch {
    return NextResponse.json({ message: "Comments service unavailable." }, { status: 502 });
  }
}