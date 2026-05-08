import { routeJson } from "@/server/http/route";
import { recycleRecords } from "@/server/social-admin/service";
export async function GET(request: Request) { return routeJson(async () => ({ message: "Recycle records", data: await recycleRecords(request) })); }
