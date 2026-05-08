import { routeJson } from "@/server/http/route";
import { listFollowUsers } from "@/server/social-admin/service";
export async function GET(request: Request) { return routeJson(async () => ({ message: "Following", data: await listFollowUsers(request, "following") })); }
