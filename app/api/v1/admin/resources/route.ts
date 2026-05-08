import { routeJson } from "@/server/http/route";
import { listAdminResources } from "@/server/resources/service";
import { resourceSearchSchema } from "@/server/resources/schemas";
import { searchParamsObject } from "@/server/resources/route-helpers";

export async function GET(request: Request) {
  return routeJson(async () => ({ message: "Resources", data: await listAdminResources(request, resourceSearchSchema.extend({ deleted: resourceSearchSchema.shape.search.optional().transform(() => undefined) }).passthrough().parse(searchParamsObject(request))) }));
}
