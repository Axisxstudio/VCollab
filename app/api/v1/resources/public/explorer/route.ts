import { routeJson } from "@/server/http/route";
import { exploreResources } from "@/server/resources/service";
import { folderIdQuerySchema } from "@/server/resources/schemas";

export async function GET(request: Request) {
  return routeJson(async () => {
    const params = new URL(request.url).searchParams;
    const { folderId } = folderIdQuerySchema.parse({ folderId: params.get("folderId") ?? undefined });
    return { message: "Resource explorer", data: await exploreResources(folderId) };
  });
}
