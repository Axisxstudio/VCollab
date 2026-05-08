import { routeJson } from "@/server/http/route";
import { listWarnings } from "@/server/social-admin/service";
export async function GET(request: Request) { return routeJson(async () => ({ message: "Warnings", data: await listWarnings(request) })); }
