import { messageUpdateSchema } from "@/server/messages/schemas";
import { deleteMessage, updateMessage } from "@/server/messages/service";
import { routeJson } from "@/server/http/route";
import { badRequest } from "@/server/http/errors";

type Context = {
  params: Promise<{
    id: string;
  }>;
};

function parseMessageId(rawId: string) {
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) {
    throw badRequest("Invalid message id");
  }

  return id;
}

export async function PATCH(request: Request, context: Context) {
  return routeJson(async () => {
    const { id: rawId } = await context.params;
    const payload = messageUpdateSchema.parse(await request.json());
    const data = await updateMessage(request, parseMessageId(rawId), payload);

    return {
      message: "Message updated",
      data,
    };
  });
}

export async function PUT(request: Request, context: Context) {
  return PATCH(request, context);
}

export async function DELETE(request: Request, context: Context) {
  return routeJson(async () => {
    const { id: rawId } = await context.params;
    await deleteMessage(request, parseMessageId(rawId));

    return {
      message: "Message deleted",
      data: null,
    };
  });
}
