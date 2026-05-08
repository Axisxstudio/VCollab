import { routeJson } from "@/server/http/route";
import { followStatus } from "@/server/social-admin/service";
export async function GET(request: Request) { return routeJson(async () => ({ message: "Follow status", data: await followStatus(request) })); }
