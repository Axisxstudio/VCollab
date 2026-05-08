import { routeJson } from "@/server/http/route";
import { searchParamsObject } from "@/server/resources/route-helpers";
import { contentSearchSchema, projectRequestSchema } from "@/server/content/schemas";
import { createProject, listPublicContent } from "@/server/content/service";

export async function GET(request: Request) {
  return routeJson(async () => ({ message: "Projects", data: await listPublicContent("project", contentSearchSchema.parse(searchParamsObject(request))) }));
}

export async function POST(request: Request) {
  return routeJson(async () => ({ message: "Project created", data: await createProject(request, projectRequestSchema.parse(await request.json())) }));
}
