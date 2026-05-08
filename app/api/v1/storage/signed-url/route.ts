import { routeJson } from "@/server/http/route";
import { signedUrlSchema } from "@/server/storage/schemas";
import { createSignedUrlForRequest } from "@/server/storage/signed-url";

export async function POST(request: Request) {
  return routeJson(async () => {
    const payload = signedUrlSchema.parse(await request.json());
    const data = await createSignedUrlForRequest(request, payload);

    return {
      message: "Signed URL",
      data,
    };
  });
}
