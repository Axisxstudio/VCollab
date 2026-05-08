import { routeJson } from "@/server/http/route";
import { adminSummary } from "@/server/social-admin/service";
export async function GET(request: Request) { return routeJson(async () => ({ message: "Dashboard summary", data: await adminSummary(request) })); }
