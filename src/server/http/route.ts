import { NextResponse } from "next/server";
import { ok } from "@/server/api-response";
import { toErrorResponse } from "./errors";

export async function routeJson<T>(
  handler: () => Promise<{ message: string; data: T }>,
) {
  try {
    const response = await handler();
    return NextResponse.json(ok(response.message, response.data));
  } catch (cause) {
    return toErrorResponse(cause);
  }
}
