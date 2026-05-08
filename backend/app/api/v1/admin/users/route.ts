import { routeJson } from "@/server/http/route";
import { listAdminUsers } from "@/server/social-admin/service";
export async function GET(request: Request) { return routeJson(async () => ({ message: "Users", data: await listAdminUsers(request) })); }
