import { updateCoverImage } from "@/server/users/service";
import { routeJson } from "@/server/http/route";

export async function POST(request: Request) {
  return routeJson(async () => {
    const data = await updateCoverImage(request);

    return {
      message: "Cover image updated",
      data,
    };
  });
}
