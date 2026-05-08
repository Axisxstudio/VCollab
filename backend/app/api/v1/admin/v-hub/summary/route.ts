import { routeJson } from "@/server/http/route";
import { summary } from "@/server/vhub/service";

export async function GET(request: Request) {
  return routeJson(async () => ({ message: "Admin V Hub summary", data: await summary(request) }));
}
