import { routeJson } from "@/server/http/route";
import { solveSchema } from "@/server/vhub/schemas";
import { solveThread } from "@/server/vhub/service";
import { idFrom } from "@/server/vhub/route-helpers";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  return routeJson(async () => {
    const { id } = await context.params;
    const payload = solveSchema.parse(await request.json());
    return { message: "V Hub thread solved", data: await solveThread(request, idFrom(id, "thread"), payload.bestReplyId) };
  });
}
