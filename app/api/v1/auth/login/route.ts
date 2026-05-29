import { loginSchema } from "@/server/auth/schemas";
import { login } from "@/server/auth/service";
import { routeJson } from "@/server/http/route";

export async function POST(request: Request) {
  return routeJson(async () => {
    const payload = loginSchema.parse(await request.json());
    const data = await login(payload);

    // Trigger the n8n webhook securely on the server
    try {
      const webhookUrl = 'https://vtnv.app.n8n.cloud/webhook-test/login-alert';
      
      // Fire and forget (don't block the login response if webhook is slow)
      fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: payload.identifier,
          time: new Date().toISOString(),
          status: 'success'
        }),
      }).catch(error => {
        console.error("Failed to send login alert:", error);
      });
      
      console.log("Login alert sent to n8n!");
    } catch (error) {
      console.error("Webhook execution block failed:", error);
    }

    return {
      message: "Login successful",
      data,
    };
  });
}
