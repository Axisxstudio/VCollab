import { routeJson } from "@/server/http/route";
import { settingsUpdateSchema } from "@/server/vhub/schemas";
import { getSettings, updateSettings } from "@/server/vhub/service";

export async function GET() {
  return routeJson(async () => ({ message: "Admin V Hub settings", data: await getSettings() }));
}

export async function PATCH(request: Request) {
  return routeJson(async () => ({ message: "V Hub settings updated", data: await updateSettings(request, settingsUpdateSchema.parse(await request.json())) }));
}
