import { pageQuerySchema } from "@/server/messages/schemas";
import { listMessages } from "@/server/messages/service";
import { routeJson } from "@/server/http/route";
import { badRequest } from "@/server/http/errors";

type Context = {
  params: Promise<{
    conversationId: string;
  }>;
};

export async function GET(request: Request, context: Context) {
  return routeJson(async () => {
    const { conversationId: rawId } = await context.params;
    const conversationId = Number(rawId);

    if (!Number.isInteger(conversationId) || conversationId <= 0) {
      throw badRequest("Invalid conversation id");
    }

    const url = new URL(request.url);
    const payload = pageQuerySchema.parse({
      page: url.searchParams.get("page") ?? undefined,
      size: url.searchParams.get("size") ?? undefined,
    });
    const data = await listMessages(request, conversationId, payload);

    return {
      message: "Messages",
      data,
    };
  });
}
