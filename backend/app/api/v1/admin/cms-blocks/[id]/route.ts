import { routeJson } from "@/server/http/route";
import { idFrom } from "@/server/resources/route-helpers";
import { cmsBlockRequestSchema } from "@/server/cms/schemas";
import { updateAdminCmsBlock } from "@/server/cms/service";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  return routeJson(async () => {
    const { id } = await context.params;
    return {
      message: "CMS block updated",
      data: await updateAdminCmsBlock(request, idFrom(id, "CMS block"), cmsBlockRequestSchema.parse(await request.json())),
    };
  });
}
