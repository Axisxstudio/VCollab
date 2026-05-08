import { NextResponse } from "next/server";

export const runtime = "nodejs";

export function GET() {
  return NextResponse.json({
    success: true,
    message: "VCollab Next API is healthy",
    data: {
      service: "vcollab-next",
      status: "ok",
    },
    timestamp: new Date().toISOString(),
  });
}
