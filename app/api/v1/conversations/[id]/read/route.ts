import { markConversationRead } from "@/server/messages/service";
import { routeJson } from "@/server/http/route";
import { badRequest } from "@/server/http/errors";

type Context = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: Context) {
  return routeJson(async () => {
    const { id: rawId } = await context.params;
    const id = Number(rawId);

    if (!Number.isInteger(id) || id <= 0) {
      throw badRequest("Invalid conversation id");
    }

    await markConversationRead(request, id);

    return {
      message: "Conversation updated",
      data: null,
    };
  });
}
