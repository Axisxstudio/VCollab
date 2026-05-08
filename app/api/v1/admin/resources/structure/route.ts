import { routeJson } from "@/server/http/route";
import { requireSuperAdmin } from "@/server/auth/guards";
import { createFolder, listPublicFolders } from "@/server/resources/service";
import { createFolderSchema } from "@/server/resources/schemas";

export async function GET(request: Request) {
  return routeJson(async () => {
    await requireSuperAdmin(request);
    const url = new URL(request.url);
    const type = url.searchParams.get("type") ?? "INSTITUTION";
    const parentId = url.searchParams.get("parentId");
    return { message: "Resource structure", data: await listPublicFolders(type, parentId ? Number(parentId) : undefined) };
  });
}

export async function POST(request: Request) {
  return routeJson(async () => ({ message: "Structure created", data: await createFolder(request, createFolderSchema.parse(await request.json())) }));
}
