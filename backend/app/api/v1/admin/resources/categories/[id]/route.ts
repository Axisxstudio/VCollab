import { routeJson } from "@/server/http/route";
import { categorySchema } from "@/server/resources/schemas";
import { adminUpdateCategory } from "@/server/resources/service";
import { idFrom } from "@/server/resources/route-helpers";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  return routeJson(async () => {
    const { id } = await context.params;
    return { message: "Resource category updated", data: await adminUpdateCategory(request, idFrom(id, "category"), categorySchema.partial().parse(await request.json())) };
  });
}
