import { routeJson } from "@/server/http/route";
import { createFolderSchema } from "@/server/resources/schemas";
import { createFolder } from "@/server/resources/service";

export async function POST(request: Request) {
  return routeJson(async () => ({ message: "Folder created", data: await createFolder(request, createFolderSchema.parse(await request.json())) }));
}
