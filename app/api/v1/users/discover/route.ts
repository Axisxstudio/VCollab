import { discoverUsersSchema } from "@/server/users/schemas";
import { discoverUsers } from "@/server/users/service";
import { routeJson } from "@/server/http/route";

export async function GET(request: Request) {
  return routeJson(async () => {
    const url = new URL(request.url);
    const payload = discoverUsersSchema.parse({
      query: url.searchParams.get("query") ?? undefined,
      role: url.searchParams.get("role") ?? undefined,
      page: url.searchParams.get("page") ?? undefined,
      size: url.searchParams.get("size") ?? undefined,
    });
    const data = await discoverUsers(payload);

    return {
      message: "Contributors",
      data,
    };
  });
}
