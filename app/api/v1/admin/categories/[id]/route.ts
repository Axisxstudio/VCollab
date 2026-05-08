import { routeJson } from "@/server/http/route";
import { idFrom } from "@/server/resources/route-helpers";
import { categoryRequestSchema } from "@/server/categories/schemas";
import { updateCategory } from "@/server/categories/service";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  return routeJson(async () => {
    const { id } = await context.params;
    return {
      message: "Category updated",
      data: await updateCategory(request, idFrom(id, "category"), categoryRequestSchema.parse(await request.json())),
    };
  });
}
