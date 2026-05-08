import { routeJson } from "@/server/http/route";
import { idFrom } from "@/server/resources/route-helpers";
import { adminModerationSchema } from "@/server/content/schemas";
import { moderateAdminContent } from "@/server/content/service";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  return routeJson(async () => {
    const { id } = await context.params;
    return { message: "Blog updated", data: await moderateAdminContent("blog", request, idFrom(id, "blog"), adminModerationSchema.parse(await request.json())) };
  });
}
