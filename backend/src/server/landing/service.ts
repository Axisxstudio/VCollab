import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { mapPublicProfile } from "@/server/users/mapper";
import type { UserProfileRow } from "@/server/users/types";
import { badRequest } from "@/server/http/errors";
import { listPublicCmsBlocks } from "@/server/cms/service";
import { mapLandingBlog, mapLandingPost, mapLandingProject, type ContentRow } from "./mapper";

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

function projectSelect() {
  return `
    *,
    category:categories(id,name),
    owner:users!projects_owner_id_fkey(id,username,user_profiles!user_profiles_user_id_fkey(full_name,profile_image,education_type)),
    project_media(id,url,media_type,file_name,file_size,sort_order)
  `;
}

function postSelect() {
  return `
    *,
    category:categories(id,name),
    author:users!posts_author_id_fkey(id,username,user_profiles!user_profiles_user_id_fkey(full_name,profile_image,education_type)),
    post_media(id,url,media_type,sort_order)
  `;
}

function blogSelect() {
  return `
    *,
    category:categories(id,name),
    author:users!blogs_author_id_fkey(id,username,user_profiles!user_profiles_user_id_fkey(full_name,profile_image,education_type)),
    blog_media(id,url,media_type,sort_order)
  `;
}

async function listPublicContent(table: "projects" | "posts" | "blogs", select: string) {
  const { data, error } = await createSupabaseAdminClient()
    .from(table)
    .select(select)
    .eq("visibility", "PUBLIC")
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(8);

  if (error) throw badRequest(error.message);
  return data ?? [];
}

async function countPublicContent(table: "projects" | "posts" | "blogs") {
  const { count, error } = await createSupabaseAdminClient()
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("visibility", "PUBLIC")
    .eq("is_active", true)
    .is("deleted_at", null);

  if (error) throw badRequest(error.message);
  return count ?? 0;
}

async function listContributors() {
  const { data, error, count } = await createSupabaseAdminClient()
    .from("users")
    .select(userSelect(), { count: "exact" })
    .eq("is_active", true)
    .eq("is_suspended", false)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(8);

  if (error) throw badRequest(error.message);
  return {
    rows: ((data ?? []) as unknown as UserProfileRow[]).map(mapPublicProfile),
    count: count ?? 0,
  };
}

export async function landingOverview() {
  const [
    projects,
    posts,
    blogs,
    contributors,
    projectCount,
    postCount,
    blogCount,
    heroHighlights,
    infoBlocks,
    companyBlocks,
    footerBlocks,
  ] = await Promise.all([
    listPublicContent("projects", projectSelect()),
    listPublicContent("posts", postSelect()),
    listPublicContent("blogs", blogSelect()),
    listContributors(),
    countPublicContent("projects"),
    countPublicContent("posts"),
    countPublicContent("blogs"),
    listPublicCmsBlocks("HERO_HIGHLIGHT"),
    listPublicCmsBlocks("LANDING_INFO"),
    listPublicCmsBlocks("VTECH_AI_SOLUTIONS"),
    listPublicCmsBlocks("FOOTER_NOTE"),
  ]);

  const featuredProjects = (projects as unknown as ContentRow[]).map(mapLandingProject);

  return {
    stats: {
      projectCount,
      contributorCount: contributors.count,
      postCount,
      blogCount,
    },
    featuredProject: featuredProjects[0] ?? null,
    featuredProjects,
    latestPosts: (posts as unknown as ContentRow[]).map(mapLandingPost),
    latestBlogs: (blogs as unknown as ContentRow[]).map(mapLandingBlog),
    featuredContributors: contributors.rows,
    heroHighlights,
    infoBlocks,
    companyBlocks,
    footerBlocks,
  };
}
