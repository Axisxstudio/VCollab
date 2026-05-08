import { routeJson } from "@/server/http/route";
import { listPublicFolders } from "@/server/resources/service";

export async function GET() {
  return routeJson(async () => ({ message: "Institutions", data: await listPublicFolders("INSTITUTION") }));
}
