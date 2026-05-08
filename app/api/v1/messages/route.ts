import { messageCreateSchema } from "@/server/messages/schemas";
import { sendMessage } from "@/server/messages/service";
import { routeJson } from "@/server/http/route";

export async function POST(request: Request) {
  return routeJson(async () => {
    const payload = messageCreateSchema.parse(await request.json());
    const data = await sendMessage(request, payload);

    return {
      message: "Message sent",
      data,
    };
  });
}
