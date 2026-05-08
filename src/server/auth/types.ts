export const roles = [
  "SUPER_ADMIN",
  "STUDENT",
  "INDUSTRIAL_EXPERT",
  "SOFTWARE_ENGINEER",
] as const;

export type Role = (typeof roles)[number];

export type UserResponse = {
  id: number;
  username: string;
  email: string;
  role: Role;
  fullName: string | null;
  profileImage: string | null;
  educationType: string | null;
};

export type AuthResponse = {
  token: string;
  user: UserResponse;
};

export type AppUserRow = {
  id: number;
  auth_user_id: string | null;
  email: string;
  username: string;
  role: Role;
  is_active: boolean;
  is_suspended: boolean;
  user_profiles:
    | {
        full_name: string;
        profile_image: string | null;
        education_type: string | null;
      }
    | Array<{
        full_name: string;
        profile_image: string | null;
        education_type: string | null;
      }>
    | null;
};
