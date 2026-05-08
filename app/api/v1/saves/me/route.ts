import { routeJson } from "@/server/http/route";
import { listSaved } from "@/server/social-admin/service";
export async function GET(request: Request) { return routeJson(async () => ({ message: "Saved content", data: await listSaved(request) })); }
