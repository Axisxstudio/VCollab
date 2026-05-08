import { routeJson } from "@/server/http/route";
import { searchParamsObject } from "@/server/resources/route-helpers";
import { blogRequestSchema, contentSearchSchema } from "@/server/content/schemas";
import { createBlog, listPublicContent } from "@/server/content/service";

export async function GET(request: Request) {
  return routeJson(async () => ({ message: "Blogs", data: await listPublicContent("blog", contentSearchSchema.parse(searchParamsObject(request))) }));
}

export async function POST(request: Request) {
  return routeJson(async () => ({ message: "Blog created", data: await createBlog(request, blogRequestSchema.parse(await request.json())) }));
}
