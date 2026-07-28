import { routeJson } from "@/server/http/route";
import { idFrom, updateAdminUser } from "@/server/social-admin/service";
type Context = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: Context) {
  return routeJson(async () => {
    const { id } = await context.params;
    const body = await request.json();
    return {
      message: "User updated",
      data: await updateAdminUser(request, idFrom(id, "user"), body)
    };
  });
}

export async function DELETE(request: Request, context: Context) { 
  return routeJson(async () => { 
    const { id } = await context.params; 
    return { 
      message: "User deleted", 
      data: await updateAdminUser(request, idFrom(id, "user"), { active: false, suspended: true }) 
    }; 
  }); 
}
