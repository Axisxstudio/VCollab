import { routeJson } from "@/server/http/route";
import { deleteNotifications } from "@/server/social-admin/service";
export async function DELETE(request: Request) { return routeJson(async () => { await deleteNotifications(request); return { message: "Notifications cleared", data: null }; }); }
