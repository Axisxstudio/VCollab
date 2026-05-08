import { forgotPasswordSchema } from "@/server/auth/schemas";
import { requestPasswordReset } from "@/server/auth/service";
import { routeJson } from "@/server/http/route";

export async function POST(request: Request) {
  return routeJson(async () => {
    const payload = forgotPasswordSchema.parse(await request.json());
    await requestPasswordReset(payload.email);

    return {
      message: "If an account exists, a reset link has been sent.",
      data: null,
    };
  });
}
