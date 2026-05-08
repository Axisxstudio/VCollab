import { getPublicProfile } from "@/server/users/service";
import { routeJson } from "@/server/http/route";

type Context = {
  params: Promise<{
    username: string;
  }>;
};

export async function GET(_request: Request, context: Context) {
  return routeJson(async () => {
    const { username } = await context.params;
    const data = await getPublicProfile(username);

    return {
      message: "Public profile",
      data,
    };
  });
}
