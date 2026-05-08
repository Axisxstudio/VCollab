import { routeJson } from "@/server/http/route";
import { resourceSearchSchema } from "@/server/resources/schemas";
import { searchPublicResources } from "@/server/resources/service";
import { searchParamsObject } from "@/server/resources/route-helpers";

export async function GET(request: Request) {
  return routeJson(async () => ({ message: "Public resources", data: await searchPublicResources(resourceSearchSchema.parse(searchParamsObject(request))) }));
}
