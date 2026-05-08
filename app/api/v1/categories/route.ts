import { routeJson } from "@/server/http/route";
import { searchParamsObject } from "@/server/resources/route-helpers";
import { categoryListQuerySchema, categoryRequestSchema } from "@/server/categories/schemas";
import { createCategory, listCategories } from "@/server/categories/service";

export async function GET(request: Request) {
  return routeJson(async () => {
    const input = categoryListQuerySchema.parse(searchParamsObject(request));
    return { message: "Categories", data: await listCategories(input.type) };
  });
}

export async function POST(request: Request) {
  return routeJson(async () => ({
    message: "Category created",
    data: await createCategory(request, categoryRequestSchema.parse(await request.json())),
  }));
}
