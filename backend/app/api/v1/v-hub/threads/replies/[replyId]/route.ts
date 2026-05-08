import { routeJson } from "@/server/http/route";
import { deleteReply } from "@/server/vhub/service";
import { idFrom } from "@/server/vhub/route-helpers";

type Context = { params: Promise<{ replyId: string }> };

export async function DELETE(request: Request, context: Context) {
  return routeJson(async () => {
    const { replyId } = await context.params;
    await deleteReply(request, idFrom(replyId, "reply"));
    return { message: "V Hub reply deleted", data: null };
  });
}
