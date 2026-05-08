import { conversationCreateSchema, pageQuerySchema } from "@/server/messages/schemas";
import { listConversations, startConversation } from "@/server/messages/service";
import { routeJson } from "@/server/http/route";

export async function POST(request: Request) {
  return routeJson(async () => {
    const payload = conversationCreateSchema.parse(await request.json());
    const data = await startConversation(request, payload.userId);

    return {
      message: "Conversation ready",
      data,
    };
  });
}

export async function GET(request: Request) {
  return routeJson(async () => {
    const url = new URL(request.url);
    const payload = pageQuerySchema.parse({
      page: url.searchParams.get("page") ?? undefined,
      size: url.searchParams.get("size") ?? undefined,
    });
    const data = await listConversations(request, payload);

    return {
      message: "Conversations",
      data,
    };
  });
}
