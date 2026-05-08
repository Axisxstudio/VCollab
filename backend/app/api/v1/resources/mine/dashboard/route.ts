import { routeJson } from "@/server/http/route";
import { myDashboard } from "@/server/resources/service";

export async function GET(request: Request) {
  return routeJson(async () => ({ message: "My resource library", data: await myDashboard(request) }));
}
