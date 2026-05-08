import { routeJson } from "@/server/http/route";
import { searchParamsObject } from "@/server/resources/route-helpers";
import { adminContentSearchSchema } from "@/server/content/schemas";
import { listAdminContent } from "@/server/content/service";

export async function GET(request: Request) {
  return routeJson(async () => ({ message: "Blogs", data: await listAdminContent("blog", request, adminContentSearchSchema.parse(searchParamsObject(request))) }));
}
