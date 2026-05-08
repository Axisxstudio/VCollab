import { bearerTokenFromRequest, meFromToken } from "@/server/auth/service";
import { routeJson } from "@/server/http/route";

export async function GET(request: Request) {
  return routeJson(async () => {
    const token = bearerTokenFromRequest(request);
    const data = await meFromToken(token);

    return {
      message: "Session user",
      data,
    };
  });
}
