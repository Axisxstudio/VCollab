export type ProjectRequestResponse = {
  id: number;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  message: string | null;
  project: {
    id: number;
    title: string;
    thumbnail: string | null;
    slug: string;
  };
  requester: {
    id: number;
    username: string;
    fullName: string | null;
    profileImage: string | null;
  };
  owner: {
    id: number;
    username: string;
    fullName: string | null;
    profileImage: string | null;
  };
  createdAt: string;
  updatedAt: string | null;
  respondedAt: string | null;
};

export type ProjectRequestRow = {
  id: number;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  message: string | null;
  created_at: string;
  updated_at: string | null;
  responded_at: string | null;
  projects: {
    id: number;
    title: string;
    thumbnail: string | null;
    slug: string;
  } | null;
  requester: UserSummaryRow | null;
  owner: UserSummaryRow | null;
};

export type UserSummaryRow = {
  id: number;
  username: string;
  user_profiles:
    | {
        full_name: string | null;
        profile_image: string | null;
      }
    | Array<{
        full_name: string | null;
        profile_image: string | null;
      }>
    | null;
};
