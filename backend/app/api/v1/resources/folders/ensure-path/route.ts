import { routeJson } from "@/server/http/route";
import { ensurePathSchema } from "@/server/resources/schemas";
import { ensurePath } from "@/server/resources/service";

export async function POST(request: Request) {
  return routeJson(async () => ({ message: "Resource path ready", data: await ensurePath(request, ensurePathSchema.parse(await request.json())) }));
}
