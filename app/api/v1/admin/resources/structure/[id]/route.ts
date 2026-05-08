import { routeJson } from "@/server/http/route";
import { updateFolderSchema } from "@/server/resources/schemas";
import { updateFolder } from "@/server/resources/service";
import { idFrom } from "@/server/resources/route-helpers";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  return routeJson(async () => {
    const { id } = await context.params;
    return { message: "Structure updated", data: await updateFolder(request, idFrom(id, "structure"), updateFolderSchema.parse(await request.json())) };
  });
}
