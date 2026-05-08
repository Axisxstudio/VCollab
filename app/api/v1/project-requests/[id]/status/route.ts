import { projectRequestStatusSchema } from "@/server/project-requests/schemas";
import { updateProjectRequestStatus } from "@/server/project-requests/service";
import { routeJson } from "@/server/http/route";
import { badRequest } from "@/server/http/errors";

type Context = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: Context) {
  return routeJson(async () => {
    const { id: rawId } = await context.params;
    const id = Number(rawId);

    if (!Number.isInteger(id) || id <= 0) {
      throw badRequest("Invalid project request id");
    }

    const payload = projectRequestStatusSchema.parse(await request.json());
    const data = await updateProjectRequestStatus(request, id, payload);

    return {
      message: "Project request updated",
      data,
    };
  });
}
