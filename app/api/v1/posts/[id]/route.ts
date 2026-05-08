import { routeJson } from "@/server/http/route";
import { idFrom } from "@/server/resources/route-helpers";
import { postRequestSchema } from "@/server/content/schemas";
import { deleteContent, getContent, updateContent } from "@/server/content/service";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Context) {
  return routeJson(async () => {
    const { id } = await context.params;
    return { message: "Post", data: await getContent("post", idFrom(id, "post"), request) };
  });
}

export async function PUT(request: Request, context: Context) {
  return routeJson(async () => {
    const { id } = await context.params;
    return { message: "Post updated", data: await updateContent("post", idFrom(id, "post"), request, postRequestSchema.parse(await request.json())) };
  });
}

export async function DELETE(request: Request, context: Context) {
  return routeJson(async () => {
    const { id } = await context.params;
    await deleteContent("post", idFrom(id, "post"), request);
    return { message: "Post deleted", data: null };
  });
}
