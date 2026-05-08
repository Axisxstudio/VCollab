import { routeJson } from "@/server/http/route";
import { auditLogs } from "@/server/social-admin/service";
export async function GET(request: Request) { return routeJson(async () => ({ message: "Audit logs", data: await auditLogs(request) })); }
