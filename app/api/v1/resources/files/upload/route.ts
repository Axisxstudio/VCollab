import { routeJson } from "@/server/http/route";
import { uploadFiles } from "@/server/resources/service";

export async function POST(request: Request) {
  return routeJson(async () => ({ message: "Resources uploaded", data: await uploadFiles(request) }));
}
