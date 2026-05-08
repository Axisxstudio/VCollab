/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireSuperAdmin } from "@/server/auth/guards";
import { bearerTokenFromRequest, meFromToken } from "@/server/auth/service";
import { badRequest, forbidden, notFound } from "@/server/http/errors";
import { pageBounds, toPageResponse } from "@/server/pagination/page";
import { mapCategory, mapFile, mapFolder, slugify } from "./mapper";

function fileSelect() {
  return `
    *,
    owner:users!resource_files_owner_id_fkey (
      id,
      username,
      user_profiles!user_profiles_user_id_fkey (
        full_name,
        profile_image,
        institution
      )
    )
  `;
}

function folderSelect() {
  return `
    *,
    owner:users!resource_folders_owner_id_fkey (
      id,
      username,
      user_profiles!user_profiles_user_id_fkey (
        full_name,
        profile_image,
        institution
      )
    )
  `;
}

async function currentUserId(request: Request) {
  return (await meFromToken(bearerTokenFromRequest(request))).id;
}

async function folderById(id: number) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("resource_folders")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw badRequest(error.message);
  if (!data) throw notFound("Folder not found");
  return data as any;
}

async function fileById(id: number, includeDeleted = false) {
  const admin = createSupabaseAdminClient();
  let query = admin.from("resource_files").select(fileSelect()).eq("id", id);
  if (!includeDeleted) query = query.is("deleted_at", null);
  const { data, error } = await query.maybeSingle();
  if (error) throw badRequest(error.message);
  if (!data) throw notFound("Resource not found");
  return data as any;
}

export async function listCategories(activeOnly = true) {
  const admin = createSupabaseAdminClient();
  let query = admin.from("resource_categories").select("*").order("sort_order");
  if (activeOnly) query = query.eq("active", true).is("deleted_at", null);
  const { data, error } = await query;
  if (error) throw badRequest(error.message);
  return (data ?? []).map(mapCategory);
}

export async function publicOverview() {
  const admin = createSupabaseAdminClient();
  const [{ count: totalResources }, { count: totalInstitutions }, { count: totalContributors }] =
    await Promise.all([
      admin.from("resource_files").select("id", { count: "exact", head: true }).eq("active", true).eq("visibility", "PUBLIC").is("deleted_at", null),
      admin.from("resource_folders").select("id", { count: "exact", head: true }).eq("folder_type", "INSTITUTION").eq("active", true).is("deleted_at", null),
      admin.from("resource_files").select("owner_id", { count: "exact", head: true }).eq("active", true).is("deleted_at", null),
    ]);
  const { data: institutions } = await admin
    .from("resource_folders")
    .select(folderSelect())
    .eq("folder_type", "INSTITUTION")
    .eq("active", true)
    .eq("visibility", "PUBLIC")
    .is("deleted_at", null)
    .order("sort_order")
    .limit(8);
  const { data: recent } = await admin
    .from("resource_files")
    .select(fileSelect())
    .eq("active", true)
    .eq("visibility", "PUBLIC")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(8);

  return {
    stats: {
      totalResources: totalResources ?? 0,
      totalInstitutions: totalInstitutions ?? 0,
      totalContributors: totalContributors ?? 0,
      totalDownloads: (recent ?? []).reduce((sum: number, row: any) => sum + Number(row.download_count ?? 0), 0),
    },
    institutions: (institutions ?? []).map(mapFolder),
    popularInstitutions: [],
    trendingCategories: [],
    topContributors: [],
    recentResources: (recent ?? []).map(mapFile),
  };
}

export async function listPublicFolders(type: string, parentId?: number) {
  const admin = createSupabaseAdminClient();
  let query = admin
    .from("resource_folders")
    .select(folderSelect())
    .eq("folder_type", type)
    .eq("active", true)
    .eq("visibility", "PUBLIC")
    .is("deleted_at", null)
    .order("sort_order");
  query = parentId ? query.eq("parent_id", parentId) : query.is("parent_id", null);
  const { data, error } = await query;
  if (error) throw badRequest(error.message);
  return (data ?? []).map(mapFolder);
}

async function breadcrumb(folder: any) {
  const ids = String(folder.tree_path ?? "")
    .split("/")
    .filter(Boolean)
    .map(Number);
  if (ids.length === 0) return [];
  const admin = createSupabaseAdminClient();
  const { data } = await admin.from("resource_folders").select("id,name,folder_type").in("id", ids);
  const byId = new Map((data ?? []).map((row: any) => [row.id, row]));
  return ids
    .map((id) => byId.get(id))
    .filter(Boolean)
    .map((row: any) => ({ id: row.id, label: row.name, folderType: row.folder_type }));
}

export async function exploreResources(folderId?: number, userId?: number) {
  const admin = createSupabaseAdminClient();
  const current = folderId ? await folderById(folderId) : null;
  let folders = admin.from("resource_folders").select(folderSelect()).eq("active", true).is("deleted_at", null).order("sort_order");
  let files = admin.from("resource_files").select(fileSelect()).eq("active", true).is("deleted_at", null).order("created_at", { ascending: false });
  folders = folderId ? folders.eq("parent_id", folderId) : folders.is("parent_id", null);
  files = folderId ? files.eq("folder_id", folderId) : files.limit(20);
  if (!userId) {
    folders = folders.eq("visibility", "PUBLIC");
    files = files.eq("visibility", "PUBLIC");
  } else {
    files = files.eq("owner_id", userId);
  }
  const [{ data: folderRows, error: folderError }, { data: fileRows, error: fileError }] = await Promise.all([folders, files]);
  if (folderError) throw badRequest(folderError.message);
  if (fileError) throw badRequest(fileError.message);
  return {
    root: !folderId,
    canUpload: Boolean(userId),
    currentFolder: current ? mapFolder(current) : null,
    breadcrumb: current ? await breadcrumb(current) : [],
    folders: (folderRows ?? []).map(mapFolder),
    files: (fileRows ?? []).map(mapFile),
  };
}

export async function searchPublicResources(input: any) {
  const admin = createSupabaseAdminClient();
  const bounds = pageBounds(input.page, input.size);
  let query = admin
    .from("resource_files")
    .select(fileSelect(), { count: "exact" })
    .eq("active", true)
    .eq("visibility", "PUBLIC")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .range(bounds.from, bounds.to);
  if (input.search) query = query.or(`display_name.ilike.%${input.search}%,description.ilike.%${input.search}%,tags_text.ilike.%${input.search}%`);
  if (input.institution) query = query.ilike("institution_name", input.institution);
  if (input.academicYear) query = query.ilike("academic_year_label", input.academicYear);
  if (input.semester) query = query.ilike("semester_label", input.semester);
  if (input.category) query = query.ilike("category_name", input.category);
  if (input.module) query = query.ilike("module_name", input.module);
  if (input.resourceType) query = query.eq("resource_type", input.resourceType);
  if (input.fileName) query = query.ilike("original_file_name", `%${input.fileName}%`);
  if (input.tag) query = query.ilike("tags_text", `%${input.tag}%`);
  const { data, error, count } = await query;
  if (error) throw badRequest(error.message);
  return toPageResponse((data ?? []).map(mapFile), count ?? 0, bounds.page, bounds.size);
}

export async function previewPublicFile(id: number, incrementDownload = false) {
  const admin = createSupabaseAdminClient();
  const row = await fileById(id);
  if (!row.active || row.visibility !== "PUBLIC") throw notFound("Resource not found");
  const patch = incrementDownload
    ? { download_count: Number(row.download_count ?? 0) + 1 }
    : { view_count: Number(row.view_count ?? 0) + 1 };
  await admin.from("resource_files").update(patch).eq("id", id);
  return mapFile({ ...row, ...patch });
}

export async function myDashboard(request: Request) {
  const userId = await currentUserId(request);
  const admin = createSupabaseAdminClient();
  const { data } = await admin.from("resource_files").select("*").eq("owner_id", userId).is("deleted_at", null);
  const rows = data ?? [];
  return {
    totalResources: rows.length,
    publicResources: rows.filter((row: any) => row.visibility === "PUBLIC").length,
    storageUsed: rows.reduce((sum: number, row: any) => sum + Number(row.file_size ?? 0), 0),
    libraries: [],
  };
}

export async function createFolder(request: Request, input: any) {
  const userId = await currentUserId(request);
  const parent = await folderById(input.parentId);
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("resource_folders")
    .insert({
      parent_id: input.parentId,
      owner_id: userId,
      category_id: input.categoryId ?? null,
      name: input.name,
      slug: slugify(input.name),
      folder_type: input.folderType,
      visibility: input.visibility ?? parent.visibility ?? "PUBLIC",
      sort_order: input.sortOrder ?? 0,
      tree_path: "",
      depth: Number(parent.depth ?? 0) + 1,
      institution_name: parent.institution_name,
      academic_year_label: parent.academic_year_label,
      semester_label: parent.semester_label,
      module_name: input.folderType === "MODULE" ? input.name : parent.module_name,
    })
    .select(folderSelect())
    .single();
  if (error || !data) throw badRequest(error?.message ?? "Could not create folder");
  const created = data as unknown as any;
  await admin.from("resource_folders").update({ tree_path: `${parent.tree_path}${created.id}/` }).eq("id", created.id);
  return mapFolder({ ...created, tree_path: `${parent.tree_path}${created.id}/` });
}

export async function ensurePath(request: Request, input: any) {
  const base = await folderById(input.semesterFolderId);
  let current = base;
  if (input.categoryName) current = await createFolder(request, { parentId: current.id, name: input.categoryName, folderType: "CATEGORY", categoryId: input.categoryId, visibility: input.visibility });
  if (input.moduleName) current = await createFolder(request, { parentId: current.id, name: input.moduleName, folderType: "MODULE", visibility: input.visibility });
  if (input.subCategoryName) current = await createFolder(request, { parentId: current.id, name: input.subCategoryName, folderType: "SUBCATEGORY", visibility: input.visibility });
  return current;
}

export async function updateFolder(request: Request, id: number, input: any) {
  const userId = await currentUserId(request);
  const existing = await folderById(id);
  if (existing.owner_id && existing.owner_id !== userId) throw forbidden("Not allowed to update this folder");
  const patch: any = {};
  if (input.name !== undefined) { patch.name = input.name; patch.slug = slugify(input.name); }
  if (input.visibility !== undefined) patch.visibility = input.visibility;
  if (input.active !== undefined) patch.active = input.active;
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.from("resource_folders").update(patch).eq("id", id).select(folderSelect()).single();
  if (error || !data) throw badRequest(error?.message ?? "Could not update folder");
  return mapFolder(data);
}

export async function deleteFolder(request: Request, id: number) {
  const userId = await currentUserId(request);
  const existing = await folderById(id);
  if (existing.owner_id && existing.owner_id !== userId) throw forbidden("Not allowed to delete this folder");
  const { error } = await createSupabaseAdminClient().from("resource_folders").update({ deleted_at: new Date().toISOString(), deleted_by: userId }).eq("id", id);
  if (error) throw badRequest(error.message);
}

function fileTypeFromName(name: string) {
  const ext = (name.split(".").pop() ?? "OTHER").toUpperCase();
  return ["PDF","DOC","DOCX","PPT","PPTX","JPG","JPEG","PNG","WEBP","ZIP","TXT"].includes(ext) ? ext : "OTHER";
}

export async function uploadFiles(request: Request) {
  const userId = await currentUserId(request);
  const formData = await request.formData();
  const requestPart = formData.get("request");
  const payload = typeof requestPart === "string" ? JSON.parse(requestPart) : requestPart instanceof File ? JSON.parse(await requestPart.text()) : {};
  const files = formData.getAll("files").filter((file): file is File => file instanceof File);
  if (!payload.folderId || files.length === 0) throw badRequest("folderId and files are required");
  const folder = await folderById(payload.folderId);
  const admin = createSupabaseAdminClient();
  const results: unknown[] = [];
  for (const file of files) {
    const ext = file.name.split(".").pop() ?? "bin";
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await admin.storage.from("academic-resources").upload(path, await file.arrayBuffer(), { contentType: file.type || "application/octet-stream" });
    if (uploadError) throw badRequest(uploadError.message);
    const { data: insertedFile, error: insertError } = await admin.from("resource_files").insert({
      folder_id: payload.folderId,
      owner_id: userId,
      display_name: payload.items?.[results.length]?.displayName ?? file.name,
      original_file_name: file.name,
      stored_file_name: path.split("/").pop(),
      storage_path: path,
      public_url: path,
      mime_type: file.type || "application/octet-stream",
      extension: ext,
      resource_type: fileTypeFromName(file.name),
      file_size: file.size,
      visibility: payload.visibility ?? folder.visibility ?? "PUBLIC",
      allow_download: payload.allowDownload ?? true,
      institution_name: folder.institution_name,
      academic_year_label: folder.academic_year_label,
      semester_label: folder.semester_label,
      category_name: folder.folder_type === "CATEGORY" ? folder.name : null,
      module_name: folder.module_name,
      description: payload.items?.[results.length]?.description ?? payload.description ?? null,
      subject_code: payload.subjectCode ?? null,
      academic_batch: payload.academicBatch ?? null,
      lecturer_name: payload.lecturerName ?? null,
      tags_text: JSON.stringify(payload.items?.[results.length]?.tags ?? payload.tags ?? []),
    }).select(fileSelect()).single();
    if (insertError || !insertedFile) throw badRequest(insertError?.message ?? "Could not create resource");
    results.push(mapFile(insertedFile));
  }
  return results;
}

export async function updateFile(request: Request, id: number, input: any) {
  const userId = await currentUserId(request);
  const existing = await fileById(id);
  if (existing.owner_id !== userId) throw forbidden("Not allowed to update this resource");
  const patch: any = {};
  if (input.folderId !== undefined) patch.folder_id = input.folderId;
  if (input.displayName !== undefined) patch.display_name = input.displayName;
  if (input.description !== undefined) patch.description = input.description;
  if (input.tags !== undefined) patch.tags_text = JSON.stringify(input.tags ?? []);
  if (input.visibility !== undefined) patch.visibility = input.visibility;
  if (input.allowDownload !== undefined) patch.allow_download = input.allowDownload;
  if (input.active !== undefined) patch.active = input.active;
  if (input.subjectCode !== undefined) patch.subject_code = input.subjectCode;
  if (input.academicBatch !== undefined) patch.academic_batch = input.academicBatch;
  if (input.lecturerName !== undefined) patch.lecturer_name = input.lecturerName;
  const { data, error } = await createSupabaseAdminClient().from("resource_files").update(patch).eq("id", id).select(fileSelect()).single();
  if (error || !data) throw badRequest(error?.message ?? "Could not update resource");
  return mapFile(data);
}

export async function replaceFile(request: Request, id: number) {
  const userId = await currentUserId(request);
  const existing = await fileById(id);
  if (existing.owner_id !== userId) throw forbidden("Not allowed to replace this resource");
  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) throw badRequest("file is required");
  const admin = createSupabaseAdminClient();
  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error: uploadError } = await admin.storage.from("academic-resources").upload(path, await file.arrayBuffer(), { contentType: file.type || "application/octet-stream" });
  if (uploadError) throw badRequest(uploadError.message);
  const { data, error } = await admin.from("resource_files").update({
    original_file_name: file.name,
    stored_file_name: path.split("/").pop(),
    storage_path: path,
    public_url: path,
    mime_type: file.type || "application/octet-stream",
    extension: ext,
    resource_type: fileTypeFromName(file.name),
    file_size: file.size,
  }).eq("id", id).select(fileSelect()).single();
  if (error || !data) throw badRequest(error?.message ?? "Could not replace resource");
  return mapFile(data);
}

export async function deleteFile(request: Request, id: number) {
  const userId = await currentUserId(request);
  const existing = await fileById(id);
  if (existing.owner_id !== userId) throw forbidden("Not allowed to delete this resource");
  const { error } = await createSupabaseAdminClient().from("resource_files").update({ deleted_at: new Date().toISOString(), deleted_by: userId }).eq("id", id);
  if (error) throw badRequest(error.message);
}

export async function listAdminResources(request: Request, input: any) {
  await requireSuperAdmin(request);
  const bounds = pageBounds(input.page ?? 0, input.size ?? 20);
  let query = createSupabaseAdminClient().from("resource_files").select(fileSelect(), { count: "exact" }).range(bounds.from, bounds.to).order("created_at", { ascending: false });
  query = input.deleted ? query.not("deleted_at", "is", null) : query.is("deleted_at", null);
  if (input.search) query = query.ilike("display_name", `%${input.search}%`);
  if (input.visibility) query = query.eq("visibility", input.visibility);
  if (input.active !== undefined) query = query.eq("active", input.active);
  if (input.institution) query = query.ilike("institution_name", input.institution);
  if (input.resourceType) query = query.eq("resource_type", input.resourceType);
  const { data, error, count } = await query;
  if (error) throw badRequest(error.message);
  return toPageResponse((data ?? []).map(mapFile), count ?? 0, bounds.page, bounds.size);
}

export async function adminModerateResource(request: Request, id: number, input: any) {
  await requireSuperAdmin(request);
  const patch: any = {};
  if (input.visibility !== undefined) patch.visibility = input.visibility;
  if (input.active !== undefined) patch.active = input.active;
  if (input.allowDownload !== undefined) patch.allow_download = input.allowDownload;
  const { data, error } = await createSupabaseAdminClient().from("resource_files").update(patch).eq("id", id).select(fileSelect()).single();
  if (error || !data) throw badRequest(error?.message ?? "Could not update resource");
  return mapFile(data);
}

export async function adminDeleteResource(request: Request, id: number) {
  const user = await requireSuperAdmin(request);
  const { data, error } = await createSupabaseAdminClient().from("resource_files").update({ deleted_at: new Date().toISOString(), deleted_by: user.id }).eq("id", id).select(fileSelect()).single();
  if (error || !data) throw badRequest(error?.message ?? "Could not delete resource");
  return mapFile(data);
}

export async function adminRestoreResource(request: Request, id: number) {
  await requireSuperAdmin(request);
  const { data, error } = await createSupabaseAdminClient().from("resource_files").update({ deleted_at: null, deleted_by: null }).eq("id", id).select(fileSelect()).single();
  if (error || !data) throw badRequest(error?.message ?? "Could not restore resource");
  return mapFile(data);
}

export async function adminCreateCategory(request: Request, input: any) {
  await requireSuperAdmin(request);
  const { data, error } = await createSupabaseAdminClient().from("resource_categories").insert({ name: input.name, slug: input.slug ?? slugify(input.name), description: input.description ?? null, icon: input.icon ?? null, sort_order: input.sortOrder ?? 0, active: input.active ?? true }).select("*").single();
  if (error || !data) throw badRequest(error?.message ?? "Could not create category");
  return mapCategory(data);
}

export async function adminUpdateCategory(request: Request, id: number, input: any) {
  await requireSuperAdmin(request);
  const patch: any = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.slug !== undefined) patch.slug = input.slug;
  if (input.description !== undefined) patch.description = input.description;
  if (input.icon !== undefined) patch.icon = input.icon;
  if (input.sortOrder !== undefined) patch.sort_order = input.sortOrder;
  if (input.active !== undefined) patch.active = input.active;
  const { data, error } = await createSupabaseAdminClient().from("resource_categories").update(patch).eq("id", id).select("*").single();
  if (error || !data) throw badRequest(error?.message ?? "Could not update category");
  return mapCategory(data);
}
