import { routeJson } from "@/server/http/route";
import { deleteThread, getThread } from "@/server/vhub/service";
import { idFrom } from "@/server/vhub/route-helpers";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Context) {
  return routeJson(async () => {
    const { id } = await context.params;
    return { message: "V Hub thread", data: await getThread(request, idFrom(id, "thread")) };
  });
}

export async function DELETE(request: Request, context: Context) {
  return routeJson(async () => {
    const { id } = await context.params;
    await deleteThread(request, idFrom(id, "thread"));
    return { message: "V Hub thread deleted", data: null };
  });
}
