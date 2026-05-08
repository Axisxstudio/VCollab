import { meFromToken, bearerTokenFromRequest } from "./service";
import { forbidden } from "@/server/http/errors";
import type { Role, UserResponse } from "./types";

export async function requireUser(request: Request): Promise<UserResponse> {
  return meFromToken(bearerTokenFromRequest(request));
}

export async function requireRole(
  request: Request,
  allowedRoles: readonly Role[],
): Promise<UserResponse> {
  const user = await requireUser(request);

  if (!allowedRoles.includes(user.role)) {
    throw forbidden("Forbidden");
  }

  return user;
}

export async function requireSuperAdmin(request: Request): Promise<UserResponse> {
  return requireRole(request, ["SUPER_ADMIN"]);
}
