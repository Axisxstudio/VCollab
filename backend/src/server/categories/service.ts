import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireSuperAdmin, requireUser } from "@/server/auth/guards";
import { badRequest, conflict } from "@/server/http/errors";
import { mapCategory, slugifyCategory, type CategoryRow } from "./mapper";

type CategoryInput = {
  name: string;
  type: "ALL" | "PROJECT" | "POST" | "BLOG";
};

function categorySelect() {
  return "id,name,slug,type,is_system_default,is_active";
}

async function ensureUniqueCategory(input: CategoryInput, currentId?: number) {
  const admin = createSupabaseAdminClient();
  let query = admin
    .from("categories")
    .select("id")
    .ilike("name", input.name)
    .eq("type", input.type)
    .is("deleted_at", null)
    .limit(1);

  if (currentId) {
    query = query.neq("id", currentId);
  }

  const { data, error } = await query;
  if (error) throw badRequest(error.message);
  if ((data ?? []).length > 0) throw conflict("Category already exists");
}

export async function listCategories(type?: string) {
  const admin = createSupabaseAdminClient();
  let query = admin
    .from("categories")
    .select(categorySelect())
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("name");

  if (type) {
    query = query.in("type", [type, "ALL"]);
  }

  const { data, error } = await query;
  if (error) throw badRequest(error.message);
  return ((data ?? []) as unknown as CategoryRow[]).map(mapCategory);
}

export async function listAdminCategories(request: Request) {
  await requireSuperAdmin(request);
  const { data, error } = await createSupabaseAdminClient()
    .from("categories")
    .select(categorySelect())
    .is("deleted_at", null)
    .order("name");

  if (error) throw badRequest(error.message);
  return ((data ?? []) as unknown as CategoryRow[]).map(mapCategory);
}

export async function createCategory(request: Request, input: CategoryInput) {
  const user = await requireUser(request);
  await ensureUniqueCategory(input);

  const { data, error } = await createSupabaseAdminClient()
    .from("categories")
    .insert({
      name: input.name,
      slug: slugifyCategory(input.name),
      type: input.type,
      is_system_default: false,
      is_active: true,
      created_by: user.id,
    })
    .select(categorySelect())
    .single();

  if (error || !data) throw badRequest(error?.message ?? "Could not create category");
  return mapCategory(data as unknown as CategoryRow);
}

export async function updateCategory(request: Request, id: number, input: CategoryInput) {
  await requireSuperAdmin(request);
  await ensureUniqueCategory(input, id);

  const { data, error } = await createSupabaseAdminClient()
    .from("categories")
    .update({
      name: input.name,
      slug: slugifyCategory(input.name),
      type: input.type,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .is("deleted_at", null)
    .select(categorySelect())
    .single();

  if (error || !data) throw badRequest(error?.message ?? "Could not update category");
  return mapCategory(data as unknown as CategoryRow);
}

export async function toggleCategory(request: Request, id: number, active: boolean) {
  await requireSuperAdmin(request);

  const { data, error } = await createSupabaseAdminClient()
    .from("categories")
    .update({ is_active: active, updated_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null)
    .select(categorySelect())
    .single();

  if (error || !data) throw badRequest(error?.message ?? "Could not update category");
  return mapCategory(data as unknown as CategoryRow);
}
