import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { bearerTokenFromRequest, meFromToken } from "@/server/auth/service";
import { badRequest, conflict, forbidden, notFound } from "@/server/http/errors";
import { mapProjectRequest } from "./mapper";
import type { ProjectRequestResponse, ProjectRequestRow } from "./types";

type CreateInput = {
  projectId: number;
  message?: string | null;
};

type StatusInput = {
  status: "PENDING" | "ACCEPTED" | "REJECTED";
};

type ProjectRow = {
  id: number;
  owner_id: number;
  title: string;
  deleted_at: string | null;
};

function requestSelect() {
  return `
    id,
    status,
    message,
    created_at,
    updated_at,
    responded_at,
    projects (
      id,
      title,
      thumbnail,
      slug
    ),
    requester:users!project_requests_requester_id_fkey (
      id,
      username,
      user_profiles!user_profiles_user_id_fkey (
        full_name,
        profile_image
      )
    ),
    owner:users!project_requests_owner_id_fkey (
      id,
      username,
      user_profiles!user_profiles_user_id_fkey (
        full_name,
        profile_image
      )
    )
  `;
}

async function currentUserId(request: Request) {
  const user = await meFromToken(bearerTokenFromRequest(request));
  return user.id;
}

async function getProject(projectId: number): Promise<ProjectRow> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("projects")
    .select("id, owner_id, title, deleted_at")
    .eq("id", projectId)
    .maybeSingle();

  if (error) {
    throw badRequest(error.message);
  }

  if (!data || data.deleted_at) {
    throw notFound("Project not found");
  }

  return data as ProjectRow;
}

async function getRequestById(id: number): Promise<ProjectRequestRow> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("project_requests")
    .select(requestSelect())
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error || !data) {
    throw notFound("Project request not found");
  }

  return data as unknown as ProjectRequestRow;
}

export async function createProjectRequest(
  request: Request,
  input: CreateInput,
): Promise<ProjectRequestResponse> {
  const requesterId = await currentUserId(request);
  const project = await getProject(input.projectId);

  if (project.owner_id === requesterId) {
    throw forbidden("You cannot request your own project");
  }

  const admin = createSupabaseAdminClient();
  const { data: existing, error: existingError } = await admin
    .from("project_requests")
    .select("id")
    .eq("project_id", project.id)
    .eq("requester_id", requesterId)
    .maybeSingle();

  if (existingError) {
    throw badRequest(existingError.message);
  }

  if (existing) {
    throw conflict("Project request already exists");
  }

  const { data, error } = await admin
    .from("project_requests")
    .insert({
      project_id: project.id,
      requester_id: requesterId,
      owner_id: project.owner_id,
      message: input.message ?? null,
      status: "PENDING",
    })
    .select(requestSelect())
    .single();

  if (error || !data) {
    throw badRequest(error?.message ?? "Could not create project request");
  }

  return mapProjectRequest(data as unknown as ProjectRequestRow);
}

export async function listSentProjectRequests(
  request: Request,
): Promise<ProjectRequestResponse[]> {
  const requesterId = await currentUserId(request);
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("project_requests")
    .select(requestSelect())
    .eq("requester_id", requesterId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    throw badRequest(error.message);
  }

  return ((data ?? []) as unknown as ProjectRequestRow[]).map(mapProjectRequest);
}

export async function listReceivedProjectRequests(
  request: Request,
): Promise<ProjectRequestResponse[]> {
  const ownerId = await currentUserId(request);
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("project_requests")
    .select(requestSelect())
    .eq("owner_id", ownerId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    throw badRequest(error.message);
  }

  return ((data ?? []) as unknown as ProjectRequestRow[]).map(mapProjectRequest);
}

export async function updateProjectRequestStatus(
  request: Request,
  id: number,
  input: StatusInput,
): Promise<ProjectRequestResponse> {
  const ownerId = await currentUserId(request);
  const existing = await getRequestById(id);

  if (existing.owner?.id !== ownerId) {
    throw forbidden("Not allowed to update this request");
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("project_requests")
    .update({
      status: input.status,
      responded_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select(requestSelect())
    .single();

  if (error || !data) {
    throw badRequest(error?.message ?? "Could not update project request");
  }

  return mapProjectRequest(data as unknown as ProjectRequestRow);
}
