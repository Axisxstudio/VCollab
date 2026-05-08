import type { AppUserRow, UserResponse } from "./types";

function firstProfile(row: AppUserRow) {
  if (Array.isArray(row.user_profiles)) {
    return row.user_profiles[0] ?? null;
  }

  return row.user_profiles;
}

export function mapUserResponse(row: AppUserRow): UserResponse {
  const profile = firstProfile(row);

  return {
    id: row.id,
    username: row.username,
    email: row.email,
    role: row.role,
    fullName: profile?.full_name ?? null,
    profileImage: profile?.profile_image ?? null,
    educationType: profile?.education_type ?? null,
  };
}
