import { routeJson } from "@/server/http/route";
import { updateFolderSchema } from "@/server/resources/schemas";
import { deleteFolder, updateFolder } from "@/server/resources/service";
import { idFrom } from "@/server/resources/route-helpers";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  return routeJson(async () => {
    const { id } = await context.params;
    return { message: "Folder updated", data: await updateFolder(request, idFrom(id, "folder"), updateFolderSchema.parse(await request.json())) };
  });
}

export async function DELETE(request: Request, context: Context) {
  return routeJson(async () => {
    const { id } = await context.params;
    await deleteFolder(request, idFrom(id, "folder"));
    return { message: "Folder deleted", data: null };
  });
}
