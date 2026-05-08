import { routeJson } from "@/server/http/route";
import { deleteInteraction, upsertInteraction } from "@/server/social-admin/service";
export async function POST(request: Request) { return routeJson(async () => ({ message: "Content saved", data: await upsertInteraction(request, "saves", await request.json()) })); }
export async function DELETE(request: Request) { return routeJson(async () => ({ message: "Content unsaved", data: await deleteInteraction(request, "saves") })); }
