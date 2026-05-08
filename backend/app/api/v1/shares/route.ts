import { routeJson } from "@/server/http/route";
import { upsertInteraction } from "@/server/social-admin/service";
export async function POST(request: Request) { return routeJson(async () => ({ message: "Content shared", data: await upsertInteraction(request, "shares", await request.json()) })); }
