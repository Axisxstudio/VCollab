import { routeJson } from "@/server/http/route";
import { getTargeting, upsertTargeting } from "@/server/social-admin/service";
export async function GET(request: Request) { return routeJson(async () => ({ message: "Content targeting", data: await getTargeting(request) })); }
export async function PUT(request: Request) { return routeJson(async () => ({ message: "Content targeting updated", data: await upsertTargeting(request, await request.json()) })); }
