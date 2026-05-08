import { routeJson } from "@/server/http/route";
import { feed } from "@/server/social-admin/service";
export async function GET(request: Request) { return routeJson(async () => ({ message: "Feed", data: await feed(request) })); }
