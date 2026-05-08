import { routeJson } from "@/server/http/route";
import { deleteAdminRow, idFrom } from "@/server/social-admin/service";
type Context = { params: Promise<{ id: string }> };
export async function DELETE(request: Request, context: Context) { return routeJson(async () => { const { id } = await context.params; return { message: "Warning deleted", data: await deleteAdminRow(request, "warnings", idFrom(id, "warning")) }; }); }
