import { registerSchema } from "@/server/auth/schemas";
import { register } from "@/server/auth/service";
import { routeJson } from "@/server/http/route";

export async function POST(request: Request) {
  return routeJson(async () => {
    const payload = registerSchema.parse(await request.json());
    const data = await register(payload);

    return {
      message: "Registered successfully",
      data,
    };
  });
}
