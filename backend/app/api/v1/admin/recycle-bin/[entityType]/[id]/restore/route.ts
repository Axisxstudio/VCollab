import { routeJson } from "@/server/http/route";
import { idFrom, restoreRecycle } from "@/server/social-admin/service";
type Context = { params: Promise<{ entityType: string; id: string }> };
export async function PATCH(request: Request, context: Context) { return routeJson(async () => { const { entityType, id } = await context.params; return { message: "Record restored", data: await restoreRecycle(request, entityType, idFrom(id, "record")) }; }); }
