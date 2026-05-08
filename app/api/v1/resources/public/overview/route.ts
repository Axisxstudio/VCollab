import { routeJson } from "@/server/http/route";
import { publicOverview } from "@/server/resources/service";

export async function GET() {
  return routeJson(async () => ({ message: "Resources overview", data: await publicOverview() }));
}
