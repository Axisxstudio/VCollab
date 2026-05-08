import { updateProfileImage } from "@/server/users/service";
import { routeJson } from "@/server/http/route";

export async function POST(request: Request) {
  return routeJson(async () => {
    const data = await updateProfileImage(request);

    return {
      message: "Profile image updated",
      data,
    };
  });
}
