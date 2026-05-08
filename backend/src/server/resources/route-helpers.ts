import { badRequest } from "@/server/http/errors";

export function idFrom(value: string, label: string) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw badRequest(`Invalid ${label} id`);
  }
  return id;
}

export function searchParamsObject(request: Request) {
  return Object.fromEntries(new URL(request.url).searchParams.entries());
}
