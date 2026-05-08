import { routeJson } from "@/server/http/route";
import { searchParamsObject } from "@/server/resources/route-helpers";
import { contentSearchSchema, postRequestSchema } from "@/server/content/schemas";
import { createPost, listPublicContent } from "@/server/content/service";

export async function GET(request: Request) {
  return routeJson(async () => ({ message: "Posts", data: await listPublicContent("post", contentSearchSchema.parse(searchParamsObject(request))) }));
}

export async function POST(request: Request) {
  return routeJson(async () => ({ message: "Post created", data: await createPost(request, postRequestSchema.parse(await request.json())) }));
}
