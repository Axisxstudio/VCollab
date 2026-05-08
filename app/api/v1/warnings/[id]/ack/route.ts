import { routeJson } from "@/server/http/route";
import { ackWarning, idFrom } from "@/server/social-admin/service";
type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, context: Context) { return routeJson(async () => { const { id } = await context.params; return { message: "Warning acknowledged", data: await ackWarning(request, idFrom(id, "warning")) }; }); }
