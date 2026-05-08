import { routeJson } from "@/server/http/route";
import { getSettings } from "@/server/vhub/service";

export async function GET() {
  return routeJson(async () => ({ message: "V Hub settings", data: await getSettings() }));
}
