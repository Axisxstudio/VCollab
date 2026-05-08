import { routeJson } from "@/server/http/route";
import { adminDeleteResource } from "@/server/resources/service";
import { idFrom } from "@/server/resources/route-helpers";

type Context = { params: Promise<{ id: string }> };

export async function DELETE(request: Request, context: Context) {
  return routeJson(async () => {
    const { id } = await context.params;
    return { message: "Resource moved to recycle bin", data: await adminDeleteResource(request, idFrom(id, "resource")) };
  });
}
