import { routeJson } from "@/server/http/route";
import { requireSuperAdmin } from "@/server/auth/guards";
import { categorySchema } from "@/server/resources/schemas";
import { adminCreateCategory, listCategories } from "@/server/resources/service";

export async function GET(request: Request) {
  return routeJson(async () => {
    await requireSuperAdmin(request);
    return { message: "Resource categories", data: await listCategories(false) };
  });
}

export async function POST(request: Request) {
  return routeJson(async () => ({ message: "Resource category created", data: await adminCreateCategory(request, categorySchema.parse(await request.json())) }));
}
