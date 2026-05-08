import { routeJson } from "@/server/http/route";
import { landingOverview } from "@/server/landing/service";

export async function GET() {
  return routeJson(async () => ({ message: "Landing overview", data: await landingOverview() }));
}
