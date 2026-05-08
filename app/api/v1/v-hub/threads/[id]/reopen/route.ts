import { routeJson } from "@/server/http/route";
import { reopenThread } from "@/server/vhub/service";
import { idFrom } from "@/server/vhub/route-helpers";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  return routeJson(async () => {
    const { id } = await context.params;
    return { message: "V Hub thread reopened", data: await reopenThread(request, idFrom(id, "thread")) };
  });
}
