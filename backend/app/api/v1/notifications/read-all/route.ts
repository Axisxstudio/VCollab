import { routeJson } from "@/server/http/route";
import { markNotification } from "@/server/social-admin/service";
export async function PATCH(request: Request) { return routeJson(async () => ({ message: "Notifications read", data: await markNotification(request) })); }
