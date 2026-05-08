import { projectRequestCreateSchema } from "@/server/project-requests/schemas";
import { createProjectRequest } from "@/server/project-requests/service";
import { routeJson } from "@/server/http/route";

export async function POST(request: Request) {
  return routeJson(async () => {
    const payload = projectRequestCreateSchema.parse(await request.json());
    const data = await createProjectRequest(request, payload);

    return {
      message: "Project request created",
      data,
    };
  });
}
