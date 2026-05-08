import { routeJson } from "@/server/http/route";
import { createComment, listComments } from "@/server/social-admin/service";
export async function GET(request: Request) { return routeJson(async () => ({ message: "Comments", data: await listComments(request) })); }
export async function POST(request: Request) { return routeJson(async () => ({ message: "Comment created", data: await createComment(request, await request.json()) })); }
