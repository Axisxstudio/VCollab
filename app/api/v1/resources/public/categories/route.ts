import { routeJson } from "@/server/http/route";
import { listCategories } from "@/server/resources/service";

export async function GET() {
  return routeJson(async () => ({ message: "Resource categories", data: await listCategories(true) }));
}
