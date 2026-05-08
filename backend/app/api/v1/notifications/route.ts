import { routeJson } from "@/server/http/route";
import { listNotifications } from "@/server/social-admin/service";
export async function GET(request: Request) { return routeJson(async () => ({ message: "Notifications", data: await listNotifications(request) })); }
