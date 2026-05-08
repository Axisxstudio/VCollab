import { routeJson } from "@/server/http/route";
import { bearerTokenFromRequest, meFromToken } from "@/server/auth/service";
import { exploreResources } from "@/server/resources/service";
import { folderIdQuerySchema } from "@/server/resources/schemas";

export async function GET(request: Request) {
  return routeJson(async () => {
    const user = await meFromToken(bearerTokenFromRequest(request));
    const params = new URL(request.url).searchParams;
    const { folderId } = folderIdQuerySchema.parse({ folderId: params.get("folderId") ?? undefined });
    return { message: "My resource explorer", data: await exploreResources(folderId, user.id) };
  });
}
