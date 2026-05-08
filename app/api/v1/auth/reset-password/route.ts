import { resetPasswordSchema } from "@/server/auth/schemas";
import { resetPassword } from "@/server/auth/service";
import { routeJson } from "@/server/http/route";

export async function POST(request: Request) {
  return routeJson(async () => {
    const payload = resetPasswordSchema.parse(await request.json());
    await resetPassword(payload.token, payload.password);

    return {
      message: "Password updated",
      data: null,
    };
  });
}
