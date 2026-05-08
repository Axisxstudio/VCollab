import { listReceivedProjectRequests } from "@/server/project-requests/service";
import { routeJson } from "@/server/http/route";

export async function GET(request: Request) {
  return routeJson(async () => {
    const data = await listReceivedProjectRequests(request);

    return {
      message: "Received requests",
      data,
    };
  });
}
