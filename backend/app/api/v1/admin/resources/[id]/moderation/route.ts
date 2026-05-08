import { routeJson } from "@/server/http/route";
import { adminModerationSchema } from "@/server/resources/schemas";
import { adminModerateResource } from "@/server/resources/service";
import { idFrom } from "@/server/resources/route-helpers";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  return routeJson(async () => {
    const { id } = await context.params;
    return { message: "Resource updated", data: await adminModerateResource(request, idFrom(id, "resource"), adminModerationSchema.parse(await request.json())) };
  });
}
