import { routeJson } from "@/server/http/route";
import { deleteInteraction, upsertInteraction } from "@/server/social-admin/service";
export async function POST(request: Request) { return routeJson(async () => ({ message: "Content liked", data: await upsertInteraction(request, "likes", await request.json()) })); }
export async function DELETE(request: Request) { return routeJson(async () => ({ message: "Content unliked", data: await deleteInteraction(request, "likes") })); }
