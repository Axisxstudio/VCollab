import { getConversation } from "@/server/messages/service";
import { routeJson } from "@/server/http/route";
import { badRequest } from "@/server/http/errors";

type Context = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: Request, context: Context) {
  return routeJson(async () => {
    const { id: rawId } = await context.params;
    const id = Number(rawId);

    if (!Number.isInteger(id) || id <= 0) {
      throw badRequest("Invalid conversation id");
    }

    const data = await getConversation(request, id);

    return {
      message: "Conversation",
      data,
    };
  });
}
