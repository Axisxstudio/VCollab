import { routeJson } from "@/server/http/route";
import { idFrom, markNotification } from "@/server/social-admin/service";
type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, context: Context) { return routeJson(async () => { const { id } = await context.params; return { message: "Notification read", data: await markNotification(request, idFrom(id, "notification")) }; }); }
