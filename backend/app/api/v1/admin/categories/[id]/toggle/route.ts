import { routeJson } from "@/server/http/route";
import { idFrom, searchParamsObject } from "@/server/resources/route-helpers";
import { categoryToggleQuerySchema } from "@/server/categories/schemas";
import { toggleCategory } from "@/server/categories/service";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  return routeJson(async () => {
    const { id } = await context.params;
    const input = categoryToggleQuerySchema.parse(searchParamsObject(request));
    return {
      message: "Category toggled",
      data: await toggleCategory(request, idFrom(id, "category"), input.active),
    };
  });
}
