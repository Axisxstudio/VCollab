import { routeJson } from "@/server/http/route";
import { tagSuggestions } from "@/server/social-admin/service";
export async function GET(request: Request) { return routeJson(async () => ({ message: "Tag suggestions", data: await tagSuggestions(request) })); }
