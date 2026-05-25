import { createClient } from "@supabase/supabase-js";
import fs from "fs";

try {
  const envFile = fs.readFileSync(".env.local", "utf8");
  envFile.split("\\n").forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1]] = match[2];
    }
  });
} catch (e) {
  // Ignore
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  throw new Error("Missing Supabase admin environment variables");
}

const admin = createClient(url, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function main() {
  const { data, error } = await admin.from("users").update({ role: "SUPER_ADMIN" }).neq("role", "SUPER_ADMIN");
  if (error) {
    console.error("Error updating users:", error);
  } else {
    console.log("Successfully upgraded all users to SUPER_ADMIN!");
  }
}

main();
