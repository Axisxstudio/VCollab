import { searchSchema } from "@/server/search/schemas";
import { searchWorkspace } from "@/server/search/service";
import { routeJson } from "@/server/http/route";

export async function GET(request: Request) {
  return routeJson(async () => {
    const url = new URL(request.url);
    const payload = searchSchema.parse({
      query: url.searchParams.get("query") ?? undefined,
      size: url.searchParams.get("size") ?? undefined,
    });
    const data = await searchWorkspace(payload);

    return {
      message: "Search results",
      data,
    };
  });
}
