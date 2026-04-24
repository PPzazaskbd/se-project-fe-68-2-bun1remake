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

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ hotelId: string }> },
) {
  try {
    const { hotelId } = await context.params;
    const response = await fetch(
      buildBackendUrl(`/hotels/${encodeURIComponent(hotelId)}/comments`),
      { cache: "no-store" },
    );
    console.log("skibidi"+buildBackendUrl(`/hotels/${encodeURIComponent(hotelId)}/comments`));
    const payload = await response.json().catch(() => null);
    return jsonResponse(payload, response.status, "Failed to load comments.");
  } catch {
    return NextResponse.json({ message: "Comments service unavailable." }, { status: 502 });
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ hotelId: string }> },
) {
  const authorization = getAuthorizationHeader(request);

  try {
    const { hotelId } = await context.params;
    const body = await request.json();

    // Forward auth header only when present (guests won't have one)
    const forwardHeaders: Record<string, string> = { "Content-Type": "application/json" };
    if (authorization) forwardHeaders.Authorization = authorization;

    const response = await fetch(
      buildBackendUrl(`/hotels/${encodeURIComponent(hotelId)}/comments`),
      {
        method: "POST",
        headers: forwardHeaders,
        body: JSON.stringify(body),
      },
    );
    const payload = await response.json().catch(() => null);
    return jsonResponse(payload, response.status, "Failed to create comment.");
  } catch {
    return NextResponse.json({ message: "Comments service unavailable." }, { status: 502 });
  }
}