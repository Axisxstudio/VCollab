import { routeJson } from "@/server/http/route";
import { createReplySchema, threadListSchema } from "@/server/vhub/schemas";
import { createReply, listReplies } from "@/server/vhub/service";
import { idFrom, paramsObject } from "@/server/vhub/route-helpers";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Context) {
  return routeJson(async () => {
    const { id } = await context.params;
    const page = threadListSchema.pick({ page: true, size: true }).parse(paramsObject(request));
    return { message: "V Hub replies", data: await listReplies(request, idFrom(id, "thread"), page) };
  });
}

export async function POST(request: Request, context: Context) {
  return routeJson(async () => {
    const { id } = await context.params;
    return { message: "V Hub reply added", data: await createReply(request, idFrom(id, "thread"), createReplySchema.parse(await request.json())) };
  });
}
