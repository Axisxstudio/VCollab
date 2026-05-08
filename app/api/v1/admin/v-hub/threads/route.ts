import { routeJson } from "@/server/http/route";
import { threadListSchema } from "@/server/vhub/schemas";
import { listThreads } from "@/server/vhub/service";
import { paramsObject } from "@/server/vhub/route-helpers";

export async function GET(request: Request) {
  return routeJson(async () => ({ message: "Admin V Hub threads", data: await listThreads(request, threadListSchema.parse(paramsObject(request)), true) }));
}
