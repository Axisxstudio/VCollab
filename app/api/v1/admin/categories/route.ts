import { routeJson } from "@/server/http/route";
import { listAdminCategories } from "@/server/categories/service";

export async function GET(request: Request) {
  return routeJson(async () => ({ message: "All categories", data: await listAdminCategories(request) }));
}
