import { routeJson } from "@/server/http/route";
import { replaceFile } from "@/server/resources/service";
import { idFrom } from "@/server/resources/route-helpers";

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: Context) {
  return routeJson(async () => {
    const { id } = await context.params;
    return { message: "Resource replaced", data: await replaceFile(request, idFrom(id, "file")) };
  });
}
