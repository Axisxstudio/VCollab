import { loginSchema } from "@/server/auth/schemas";
import { login } from "@/server/auth/service";
import { routeJson } from "@/server/http/route";

export async function POST(request: Request) {
  return routeJson(async () => {
    const payload = loginSchema.parse(await request.json());
    const data = await login(payload);

    return {
      message: "Login successful",
      data,
    };
  });
}
