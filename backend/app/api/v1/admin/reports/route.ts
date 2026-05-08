import { routeJson } from "@/server/http/route";
import { listReports } from "@/server/social-admin/service";
export async function GET(request: Request) { return routeJson(async () => ({ message: "Reports", data: await listReports(request, true) })); }
