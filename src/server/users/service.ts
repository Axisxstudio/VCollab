import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { bearerTokenFromRequest, meFromToken } from "@/server/auth/service";
import { badRequest, notFound } from "@/server/http/errors";
import { pageBounds, toPageResponse } from "@/server/pagination/page";
import { mapMyProfile, mapPublicProfile } from "./mapper";
import type { PublicProfileResponse, UserProfileResponse, UserProfileRow } from "./types";

type DiscoverInput = {
  query?: string;
  role?: string;
  page: number;
  size: number;
};

type ProfileUpdateInput = {
  fullName?: string | null;
  bio?: string | null;
  role?: string;
  department?: string | null;
  yearOfStudy?: string | null;
  institution?: string | null;
  skills?: string[] | null;
  githubUrl?: string | null;
  linkedinUrl?: string | null;
  websiteUrl?: string | null;
  dob?: string | null;
  educationType?: string | null;
  institutionName?: string | null;
  grade?: string | null;
  academicYear?: string | null;
  semester?: string | null;
  faculty?: string | null;
};

function profileSelect() {
  return `
    id,
    username,
    email,
    role,
    created_at,
    is_active,
    is_suspended,
    user_profiles!user_profiles_user_id_fkey (
      full_name,
      bio,
      profile_image,
      cover_image,
      department,
      year_of_study,
      institution,
      skills,
      github_url,
      linkedin_url,
      website_url,
      follower_count,
      following_count,
      project_count,
      post_count,
      blog_count,
      dob,
      education_type,
      institution_name,
      grade,
      academic_year,
      semester,
      faculty
    )
  `;
}

async function getProfileRowByUserId(userId: number): Promise<UserProfileRow> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("users")
    .select(profileSelect())
    .eq("id", userId)
    .is("deleted_at", null)
    .single();

  if (error || !data) {
    throw notFound("User not found");
  }

  return data as unknown as UserProfileRow;
}

export async function discoverUsers(input: DiscoverInput, excludeUserId?: number) {
  const admin = createSupabaseAdminClient();
  const bounds = pageBounds(input.page, input.size);
  const normalizedQuery = input.query?.trim();

  let query = admin
    .from("users")
    .select(profileSelect(), { count: "exact" })
    .eq("is_active", true)
    .eq("is_suspended", false)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (excludeUserId !== undefined) {
    query = query.neq("id", excludeUserId);
  }

  query = query.range(bounds.from, bounds.to);

  if (input.role) {
    query = query.eq("role", input.role);
  }

  if (normalizedQuery) {
    query = query.or(
      `username.ilike.%${normalizedQuery}%,email.ilike.%${normalizedQuery}%,user_profiles.full_name.ilike.%${normalizedQuery}%`,
    );
  }

  const { data, error, count } = await query;

  if (error) {
    throw badRequest(error.message);
  }

  return toPageResponse(
    ((data ?? []) as unknown as UserProfileRow[]).map(mapPublicProfile),
    count ?? 0,
    bounds.page,
    bounds.size,
  );
}

export async function getPublicProfile(username: string): Promise<PublicProfileResponse> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("users")
    .select(profileSelect())
    .ilike("username", username)
    .eq("is_active", true)
    .eq("is_suspended", false)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw badRequest(error.message);
  }

  if (!data) {
    throw notFound("User not found");
  }

  return mapPublicProfile(data as unknown as UserProfileRow);
}

export async function getMyProfile(request: Request): Promise<UserProfileResponse> {
  const user = await meFromToken(bearerTokenFromRequest(request));
  const row = await getProfileRowByUserId(user.id);
  return mapMyProfile(row);
}

export async function updateMyProfile(
  request: Request,
  input: ProfileUpdateInput,
): Promise<UserProfileResponse> {
  const user = await meFromToken(bearerTokenFromRequest(request));
  const admin = createSupabaseAdminClient();

  if (input.role) {
    const { error } = await admin
      .from("users")
      .update({ role: input.role })
      .eq("id", user.id);

    if (error) {
      throw badRequest(error.message);
    }
  }

  const profilePatch = {
    full_name: input.fullName,
    bio: input.bio,
    department: input.department,
    year_of_study: input.yearOfStudy,
    institution: input.institution,
    skills: input.skills ? JSON.stringify(input.skills) : input.skills,
    github_url: input.githubUrl,
    linkedin_url: input.linkedinUrl,
    website_url: input.websiteUrl,
    dob: input.dob,
    education_type: input.educationType,
    institution_name: input.institutionName,
    grade: input.grade,
    academic_year: input.academicYear,
    semester: input.semester,
    faculty: input.faculty,
  };

  const patch = Object.fromEntries(
    Object.entries(profilePatch).filter(([, value]) => value !== undefined),
  );

  if (Object.keys(patch).length > 0) {
    const { error } = await admin
      .from("user_profiles")
      .update(patch)
      .eq("user_id", user.id);

    if (error) {
      throw badRequest(error.message);
    }
  }

  const row = await getProfileRowByUserId(user.id);
  return mapMyProfile(row);
}

async function uploadProfileMedia(
  request: Request,
  column: "profile_image" | "cover_image",
  folder: "profile" | "cover",
): Promise<UserProfileResponse> {
  const user = await meFromToken(bearerTokenFromRequest(request));
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    throw badRequest("file is required");
  }

  const admin = createSupabaseAdminClient();
  const extension = file.name.split(".").pop() ?? "bin";
  const path = `${folder}/${user.id}/${crypto.randomUUID()}.${extension}`;
  const bytes = await file.arrayBuffer();

  const { error: uploadError } = await admin.storage
    .from("profile-media")
    .upload(path, bytes, {
      contentType: file.type || "application/octet-stream",
      upsert: true,
    });

  if (uploadError) {
    throw badRequest(uploadError.message);
  }

  const { data } = admin.storage.from("profile-media").getPublicUrl(path);
  const publicUrl = data.publicUrl;

  const { error: updateError } = await admin
    .from("user_profiles")
    .update({ [column]: publicUrl })
    .eq("user_id", user.id);

  if (updateError) {
    throw badRequest(updateError.message);
  }

  const row = await getProfileRowByUserId(user.id);
  return mapMyProfile(row);
}

export function updateProfileImage(request: Request) {
  return uploadProfileMedia(request, "profile_image", "profile");
}

export function updateCoverImage(request: Request) {
  return uploadProfileMedia(request, "cover_image", "cover");
}
