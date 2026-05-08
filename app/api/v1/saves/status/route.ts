import { routeJson } from "@/server/http/route";
import { interactionStatus } from "@/server/social-admin/service";
export async function GET(request: Request) { return routeJson(async () => ({ message: "Save status", data: await interactionStatus(request, "saves") })); }
