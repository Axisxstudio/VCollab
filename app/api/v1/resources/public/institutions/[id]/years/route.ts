import { routeJson } from "@/server/http/route";
import { listPublicFolders } from "@/server/resources/service";
import { idFrom } from "@/server/resources/route-helpers";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  return routeJson(async () => {
    const { id } = await context.params;
    return { message: "Academic years", data: await listPublicFolders("ACADEMIC_YEAR", idFrom(id, "institution")) };
  });
}
