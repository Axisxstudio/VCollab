import { routeJson } from "@/server/http/route";
import { idFrom, adminChangeUserPassword } from "@/server/social-admin/service";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  return routeJson(async () => {
    const { id } = await context.params;
    const input = await request.json();
    await adminChangeUserPassword(request, idFrom(id, "user"), input.newPassword);
    return { message: "Password updated successfully", data: null };
  });
}
