import { routeJson } from "@/server/http/route";
import { idFrom } from "@/server/resources/route-helpers";
import { adminRestoreContent } from "@/server/content/service";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  return routeJson(async () => {
    const { id } = await context.params;
    return { message: "Blog restored", data: await adminRestoreContent("blog", request, idFrom(id, "blog")) };
  });
}
