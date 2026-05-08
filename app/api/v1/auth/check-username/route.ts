import { checkUsernameSchema } from "@/server/auth/schemas";
import { checkUsernameAvailability } from "@/server/auth/service";
import { routeJson } from "@/server/http/route";

export async function GET(request: Request) {
  return routeJson(async () => {
    const url = new URL(request.url);
    const payload = checkUsernameSchema.parse({
      username: url.searchParams.get("username") ?? "",
    });
    const data = await checkUsernameAvailability(payload.username);

    return {
      message: data ? "Username is available" : "Username is already taken",
      data,
    };
  });
}
