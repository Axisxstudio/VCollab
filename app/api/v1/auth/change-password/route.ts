import { routeJson } from "@/server/http/route";
import { changePassword } from "@/server/auth/service";

export async function POST(request: Request) {
  return routeJson(async () => {
    const input = await request.json();
    await changePassword(request, input.oldPassword, input.newPassword);
    return { message: "Password updated successfully", data: null };
  });
}
