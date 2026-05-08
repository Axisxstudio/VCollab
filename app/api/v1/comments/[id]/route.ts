import { routeJson } from "@/server/http/route";
import { deleteComment, idFrom, updateComment } from "@/server/social-admin/service";
type Context = { params: Promise<{ id: string }> };
export async function PUT(request: Request, context: Context) { return routeJson(async () => { const { id } = await context.params; return { message: "Comment updated", data: await updateComment(request, idFrom(id, "comment"), await request.json()) }; }); }
export async function DELETE(request: Request, context: Context) { return routeJson(async () => { const { id } = await context.params; await deleteComment(request, idFrom(id, "comment")); return { message: "Comment deleted", data: null }; }); }
