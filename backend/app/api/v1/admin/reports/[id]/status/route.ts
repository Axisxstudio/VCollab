import { routeJson } from "@/server/http/route";
import { idFrom, updateReportStatus } from "@/server/social-admin/service";
type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, context: Context) { return routeJson(async () => { const { id } = await context.params; return { message: "Report updated", data: await updateReportStatus(request, idFrom(id, "report"), await request.json()) }; }); }
