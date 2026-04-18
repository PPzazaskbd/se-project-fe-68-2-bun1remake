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

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ hotelId: string }> },
) {
  const authorization = getAuthorizationHeader(request);

  if (!authorization) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  try {
    const { hotelId } = await context.params;
    const body = await request.json();
    const response = await fetch(buildBackendUrl(`/hotels/${encodeURIComponent(hotelId)}`), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: authorization,
      },
      body: JSON.stringify(body),
    });
    const payload = await response.json().catch(() => null);
    return jsonResponse(payload, response.status, "Failed to update hotel.");
  } catch {
    return NextResponse.json({ message: "Hotel service unavailable." }, { status: 502 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ hotelId: string }> },
) {
  const authorization = getAuthorizationHeader(request);

  if (!authorization) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  try {
    const { hotelId } = await context.params;
    const response = await fetch(buildBackendUrl(`/hotels/${encodeURIComponent(hotelId)}`), {
      method: "DELETE",
      headers: {
        Authorization: authorization,
      },
    });
    const payload = await response.json().catch(() => null);
    return jsonResponse(payload, response.status, "Failed to delete hotel.");
  } catch {
    return NextResponse.json({ message: "Hotel service unavailable." }, { status: 502 });
  }
}
