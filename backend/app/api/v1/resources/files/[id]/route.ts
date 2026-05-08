import { routeJson } from "@/server/http/route";
import { updateFileSchema } from "@/server/resources/schemas";
import { deleteFile, updateFile } from "@/server/resources/service";
import { idFrom } from "@/server/resources/route-helpers";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  return routeJson(async () => {
    const { id } = await context.params;
    return { message: "Resource updated", data: await updateFile(request, idFrom(id, "file"), updateFileSchema.parse(await request.json())) };
  });
}

export async function DELETE(request: Request, context: Context) {
  return routeJson(async () => {
    const { id } = await context.params;
    await deleteFile(request, idFrom(id, "file"));
    return { message: "Resource deleted", data: null };
  });
}
