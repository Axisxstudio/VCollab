import { routeJson } from "@/server/http/route";
import { idFrom } from "@/server/resources/route-helpers";
import { adminDeleteContent } from "@/server/content/service";

type Context = { params: Promise<{ id: string }> };

export async function DELETE(request: Request, context: Context) {
  return routeJson(async () => {
    const { id } = await context.params;
    return { message: "Project moved to recycle bin", data: await adminDeleteContent("project", request, idFrom(id, "project")) };
  });
}
