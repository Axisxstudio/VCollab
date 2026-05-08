import { getMyProfile, updateMyProfile } from "@/server/users/service";
import { profileUpdateSchema } from "@/server/users/schemas";
import { routeJson } from "@/server/http/route";

export async function GET(request: Request) {
  return routeJson(async () => {
    const data = await getMyProfile(request);

    return {
      message: "My profile",
      data,
    };
  });
}

export async function PATCH(request: Request) {
  return routeJson(async () => {
    const payload = profileUpdateSchema.parse(await request.json());
    const data = await updateMyProfile(request, payload);

    return {
      message: "Profile updated",
      data,
    };
  });
}
