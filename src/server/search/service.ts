import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { mapPublicProfile } from "@/server/users/mapper";
import type { UserProfileRow } from "@/server/users/types";
import { badRequest } from "@/server/http/errors";

type SearchInput = {
  query?: string;
  size: number;
};

type SearchStats = {
  totalResults: number;
  userCount: number;
  projectCount: number;
  postCount: number;
  blogCount: number;
};

export type SearchResponse = {
  query: string;
  requestedSize: number;
  stats: SearchStats;
  users: unknown[];
  projects: unknown[];
  posts: unknown[];
  blogs: unknown[];
};

function normalizeSize(size: number) {
  if (!Number.isFinite(size) || size <= 0) {
    return 4;
  }
  return Math.min(Math.floor(size), 8);
}

function userSelect() {
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

async function searchTable(
  table: "projects" | "posts" | "blogs",
  searchColumns: string[],
  query: string,
  size: number,
) {
  const admin = createSupabaseAdminClient();
  const orFilter = searchColumns
    .map((column) => `${column}.ilike.%${query}%`)
    .join(",");

  const { data, error, count } = await admin
    .from(table)
    .select("*", { count: "exact" })
    .or(orFilter)
    .eq("is_active", true)
    .eq("visibility", "PUBLIC")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(size);

  if (error) {
    throw badRequest(error.message);
  }

  return {
    rows: data ?? [],
    count: count ?? 0,
  };
}

async function searchUsers(query: string, size: number) {
  const admin = createSupabaseAdminClient();
  const { data, error, count } = await admin
    .from("users")
    .select(userSelect(), { count: "exact" })
    .or(`username.ilike.%${query}%,email.ilike.%${query}%`)
    .eq("is_active", true)
    .eq("is_suspended", false)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(size);

  if (error) {
    throw badRequest(error.message);
  }

  return {
    rows: ((data ?? []) as unknown as UserProfileRow[]).map(mapPublicProfile),
    count: count ?? 0,
  };
}

export async function searchWorkspace(input: SearchInput): Promise<SearchResponse> {
  const requestedSize = normalizeSize(input.size);
  const query = input.query?.trim() ?? "";

  if (!query) {
    return {
      query: "",
      requestedSize,
      stats: {
        totalResults: 0,
        userCount: 0,
        projectCount: 0,
        postCount: 0,
        blogCount: 0,
      },
      users: [],
      projects: [],
      posts: [],
      blogs: [],
    };
  }

  const [users, projects, posts, blogs] = await Promise.all([
    searchUsers(query, requestedSize),
    searchTable("projects", ["title", "short_desc", "full_desc", "tags"], query, requestedSize),
    searchTable("posts", ["content", "tags"], query, requestedSize),
    searchTable("blogs", ["title", "content", "tags"], query, requestedSize),
  ]);

  return {
    query,
    requestedSize,
    stats: {
      totalResults: users.count + projects.count + posts.count + blogs.count,
      userCount: users.count,
      projectCount: projects.count,
      postCount: posts.count,
      blogCount: blogs.count,
    },
    users: users.rows,
    projects: projects.rows,
    posts: posts.rows,
    blogs: blogs.rows,
  };
}
