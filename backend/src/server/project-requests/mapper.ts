import type { ProjectRequestResponse, ProjectRequestRow, UserSummaryRow } from "./types";

function profile(user: UserSummaryRow | null) {
  const raw = Array.isArray(user?.user_profiles)
    ? user.user_profiles[0]
    : user?.user_profiles;

  return {
    fullName: raw?.full_name ?? null,
    profileImage: raw?.profile_image ?? null,
  };
}

function userSummary(user: UserSummaryRow | null) {
  if (!user) {
    return {
      id: 0,
      username: "",
      fullName: null,
      profileImage: null,
    };
  }

  return {
    id: user.id,
    username: user.username,
    ...profile(user),
  };
}

export function mapProjectRequest(row: ProjectRequestRow): ProjectRequestResponse {
  return {
    id: row.id,
    status: row.status,
    message: row.message,
    project: {
      id: row.projects?.id ?? 0,
      title: row.projects?.title ?? "",
      thumbnail: row.projects?.thumbnail ?? null,
      slug: row.projects?.slug ?? "",
    },
    requester: userSummary(row.requester),
    owner: userSummary(row.owner),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    respondedAt: row.responded_at,
  };
}
