import { routeJson } from "@/server/http/route";
import { searchParamsObject } from "@/server/resources/route-helpers";
import { cmsBlockListQuerySchema, cmsBlockRequestSchema } from "@/server/cms/schemas";
import { createAdminCmsBlock, listAdminCmsBlocks } from "@/server/cms/service";

export async function GET(request: Request) {
  return routeJson(async () => ({
    message: "CMS blocks",
    data: await listAdminCmsBlocks(request, cmsBlockListQuerySchema.parse(searchParamsObject(request))),
  }));
}

export async function POST(request: Request) {
  return routeJson(async () => ({
    message: "CMS block created",
    data: await createAdminCmsBlock(request, cmsBlockRequestSchema.parse(await request.json())),
  }));
}
