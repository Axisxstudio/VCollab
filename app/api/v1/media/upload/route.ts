import { routeJson } from "@/server/http/route";
import { uploadMedia } from "@/server/social-admin/service";
export async function POST(request: Request) { return routeJson(async () => ({ message: "Media uploaded", data: await uploadMedia(request) })); }
