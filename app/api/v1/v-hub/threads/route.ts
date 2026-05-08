import { routeJson } from "@/server/http/route";
import { createThreadSchema, threadListSchema } from "@/server/vhub/schemas";
import { createThread, listThreads } from "@/server/vhub/service";
import { paramsObject } from "@/server/vhub/route-helpers";

export async function GET(request: Request) {
  return routeJson(async () => ({ message: "V Hub threads", data: await listThreads(request, threadListSchema.parse(paramsObject(request))) }));
}

export async function POST(request: Request) {
  return routeJson(async () => ({ message: "V Hub thread created", data: await createThread(request, createThreadSchema.parse(await request.json())) }));
}
