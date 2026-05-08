import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/server/auth/guards";
import { badRequest, forbidden } from "@/server/http/errors";

const publicBuckets = new Set(["profile-media", "content-media"]);

export async function createSignedUrlForRequest(
  request: Request,
  input: {
    bucket: string;
    path: string;
    expiresIn: number;
  },
) {
  const user = await requireUser(request);

  if (!publicBuckets.has(input.bucket) && !input.path.startsWith(`${user.id}/`) && user.role !== "SUPER_ADMIN") {
    throw forbidden("Not allowed to access this file");
  }

  const { data, error } = await createSupabaseAdminClient()
    .storage
    .from(input.bucket)
    .createSignedUrl(input.path, input.expiresIn);

  if (error || !data) {
    throw badRequest(error?.message ?? "Could not create signed URL");
  }

  return {
    bucket: input.bucket,
    path: input.path,
    signedUrl: data.signedUrl,
    expiresIn: input.expiresIn,
  };
}
