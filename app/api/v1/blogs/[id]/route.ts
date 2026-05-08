import { routeJson } from "@/server/http/route";
import { idFrom } from "@/server/resources/route-helpers";
import { blogRequestSchema } from "@/server/content/schemas";
import { deleteContent, getContent, updateContent } from "@/server/content/service";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Context) {
  return routeJson(async () => {
    const { id } = await context.params;
    return { message: "Blog", data: await getContent("blog", idFrom(id, "blog"), request) };
  });
}

export async function PUT(request: Request, context: Context) {
  return routeJson(async () => {
    const { id } = await context.params;
    return { message: "Blog updated", data: await updateContent("blog", idFrom(id, "blog"), request, blogRequestSchema.parse(await request.json())) };
  });
}

export async function DELETE(request: Request, context: Context) {
  return routeJson(async () => {
    const { id } = await context.params;
    await deleteContent("blog", idFrom(id, "blog"), request);
    return { message: "Blog deleted", data: null };
  });
}
