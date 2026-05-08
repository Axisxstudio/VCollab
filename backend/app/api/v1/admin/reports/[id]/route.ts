import { routeJson } from "@/server/http/route";
import { deleteAdminRow, idFrom } from "@/server/social-admin/service";
type Context = { params: Promise<{ id: string }> };
export async function DELETE(request: Request, context: Context) { return routeJson(async () => { const { id } = await context.params; return { message: "Report deleted", data: await deleteAdminRow(request, "reports", idFrom(id, "report")) }; }); }
