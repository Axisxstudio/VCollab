import { routeJson } from "@/server/http/route";
import { deleteNotifications, idFrom } from "@/server/social-admin/service";
type Context = { params: Promise<{ id: string }> };
export async function DELETE(request: Request, context: Context) { return routeJson(async () => { const { id } = await context.params; await deleteNotifications(request, idFrom(id, "notification")); return { message: "Notification deleted", data: null }; }); }
