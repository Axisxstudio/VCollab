import { routeJson } from "@/server/http/route";
import { createWarning, listWarnings } from "@/server/social-admin/service";
export async function GET(request: Request) { return routeJson(async () => ({ message: "Warnings", data: await listWarnings(request, true) })); }
export async function POST(request: Request) { return routeJson(async () => ({ message: "Warning created", data: await createWarning(request, await request.json()) })); }
