import { routeJson } from "@/server/http/route";
import { unreadCount } from "@/server/social-admin/service";
export async function GET(request: Request) { return routeJson(async () => ({ message: "Unread notifications", data: await unreadCount(request) })); }
