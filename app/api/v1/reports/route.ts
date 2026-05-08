import { routeJson } from "@/server/http/route";
import { createReport, listReports } from "@/server/social-admin/service";
export async function GET(request: Request) { return routeJson(async () => ({ message: "Reports", data: await listReports(request) })); }
export async function POST(request: Request) { return routeJson(async () => ({ message: "Report created", data: await createReport(request, await request.json()) })); }
