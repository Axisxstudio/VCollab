import { routeJson } from "@/server/http/route";
import { idFrom } from "@/server/resources/route-helpers";
import { projectRequestSchema } from "@/server/content/schemas";
import { deleteContent, getContent, updateContent } from "@/server/content/service";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Context) {
  return routeJson(async () => {
    const { id } = await context.params;
    return { message: "Project", data: await getContent("project", idFrom(id, "project"), request) };
  });
}

export async function PUT(request: Request, context: Context) {
  return routeJson(async () => {
    const { id } = await context.params;
    return { message: "Project updated", data: await updateContent("project", idFrom(id, "project"), request, projectRequestSchema.parse(await request.json())) };
  });
}

export async function DELETE(request: Request, context: Context) {
  return routeJson(async () => {
    const { id } = await context.params;
    await deleteContent("project", idFrom(id, "project"), request);
    return { message: "Project deleted", data: null };
  });
}
