import { discoverUsersSchema } from "@/server/users/schemas";
import { discoverUsers } from "@/server/users/service";
import { routeJson } from "@/server/http/route";
import { meFromToken } from "@/server/auth/service";

export async function GET(request: Request) {
  return routeJson(async () => {
    const url = new URL(request.url);
    const payload = discoverUsersSchema.parse({
      query: url.searchParams.get("query") ?? undefined,
      role: url.searchParams.get("role") ?? undefined,
      page: url.searchParams.get("page") ?? undefined,
      size: url.searchParams.get("size") ?? undefined,
    });

    let currentUserId: number | undefined = undefined;
    try {
      const authHeader = request.headers.get("authorization") ?? "";
      const match = authHeader.match(/^Bearer\s+(.+)$/i);
      if (match?.[1]) {
        const user = await meFromToken(match[1].trim());
        currentUserId = user.id;
      }
    } catch {
      // Ignore auth errors for guest discovery
    }

    const data = await discoverUsers(payload, currentUserId);

    return {
      message: "Contributors",
      data,
    };
  });
}
