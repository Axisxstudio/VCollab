import { routeJson } from "@/server/http/route";
import { searchParamsObject } from "@/server/resources/route-helpers";
import { contentSearchSchema } from "@/server/content/schemas";
import { listUserContent } from "@/server/content/service";

type Context = { params: Promise<{ username: string }> };

export async function GET(request: Request, context: Context) {
  return routeJson(async () => {
    const { username } = await context.params;
    return { message: "Posts", data: await listUserContent("post", username, request, contentSearchSchema.parse(searchParamsObject(request))) };
  });
}
