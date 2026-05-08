import { routeJson } from "@/server/http/route";
import { follow, paramsObject, unfollow } from "@/server/social-admin/service";
export async function POST(request: Request) { const body = await request.json(); return routeJson(async () => ({ message: "User followed", data: await follow(request, Number(body.userId)) })); }
export async function DELETE(request: Request) { return routeJson(async () => ({ message: "User unfollowed", data: await unfollow(request, Number(paramsObject(request).userId)) })); }
