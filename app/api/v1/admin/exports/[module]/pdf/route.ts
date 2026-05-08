import { pdfExport } from "@/server/social-admin/service";
type Context = { params: Promise<{ module: string }> };
export async function GET(_request: Request, context: Context) { const { module } = await context.params; return pdfExport(module); }
