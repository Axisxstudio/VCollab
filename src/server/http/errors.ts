import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { error } from "@/server/api-response";

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export function badRequest(message: string) {
  return new HttpError(400, message);
}

export function unauthorized(message = "Not authenticated") {
  return new HttpError(401, message);
}

export function forbidden(message = "Forbidden") {
  return new HttpError(403, message);
}

export function notFound(message = "Not found") {
  return new HttpError(404, message);
}

export function conflict(message: string) {
  return new HttpError(409, message);
}

export function toErrorResponse(cause: unknown) {
  if (cause instanceof ZodError) {
    const message = cause.issues
      .map((issue) => `${issue.path.join(".") || "request"} ${issue.message}`)
      .join(", ");
    return NextResponse.json(error(message), { status: 400 });
  }

  if (cause instanceof HttpError) {
    return NextResponse.json(error(cause.message), { status: cause.status });
  }

  return NextResponse.json(error("Unexpected error"), { status: 500 });
}
