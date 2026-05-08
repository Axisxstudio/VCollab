import { routeJson } from "@/server/http/route";
import { adminRestoreResource } from "@/server/resources/service";
import { idFrom } from "@/server/resources/route-helpers";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  return routeJson(async () => {
    const { id } = await context.params;
    return { message: "Resource restored", data: await adminRestoreResource(request, idFrom(id, "resource")) };
  });
}
