import { routeJson } from "@/server/http/route";
import { moderationSchema } from "@/server/vhub/schemas";
import { moderateThread } from "@/server/vhub/service";
import { idFrom } from "@/server/vhub/route-helpers";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  return routeJson(async () => {
    const { id } = await context.params;
    const payload = moderationSchema.parse(await request.json());
    return { message: "V Hub thread visibility updated", data: await moderateThread(request, idFrom(id, "thread"), "is_hidden", payload.value) };
  });
}
