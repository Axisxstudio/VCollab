import { routeJson } from "@/server/http/route";
import { moderationSchema } from "@/server/vhub/schemas";
import { moderateReply } from "@/server/vhub/service";
import { idFrom } from "@/server/vhub/route-helpers";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  return routeJson(async () => {
    const { id } = await context.params;
    const payload = moderationSchema.parse(await request.json());
    return { message: "V Hub reply visibility updated", data: await moderateReply(request, idFrom(id, "reply"), payload.value) };
  });
}
