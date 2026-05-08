import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const rootDir = resolve(process.cwd(), "..");

function loadEnvFile(path) {
  if (!existsSync(path)) {
    return;
  }

  const lines = readFileSync(path, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^["']|["']$/g, "");
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(resolve(rootDir, ".env"));
loadEnvFile(resolve(process.cwd(), ".env"));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const username = process.env.SUPER_ADMIN_USERNAME || "vtnv";
const email = process.env.SUPER_ADMIN_EMAIL || "vijayakumarvithusan@gmail.com";
const password = process.env.SUPER_ADMIN_PASSWORD || "vtnv";

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function findAuthUserByEmail(targetEmail) {
  let page = 1;
  const perPage = 1000;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) {
      throw error;
    }

    const found = data.users.find((user) => user.email?.toLowerCase() === targetEmail.toLowerCase());
    if (found) {
      return found;
    }

    if (data.users.length < perPage) {
      return null;
    }

    page += 1;
  }
}

async function ensureAuthUser() {
  const existing = await findAuthUserByEmail(email);
  if (existing) {
    const { data, error } = await admin.auth.admin.updateUserById(existing.id, {
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: username,
        username,
        role: "SUPER_ADMIN",
      },
    });

    if (error || !data.user) {
      throw error || new Error("Could not update super admin auth user");
    }

    return data.user;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: username,
      username,
      role: "SUPER_ADMIN",
    },
  });

  if (error || !data.user) {
    throw error || new Error("Could not create super admin auth user");
  }

  return data.user;
}

async function ensureAppUser(authUser) {
  const { data: matchingRows, error: matchError } = await admin
    .from("users")
    .select("id,auth_user_id,email,username,role")
    .or(`auth_user_id.eq.${authUser.id},email.ilike.${email},username.ilike.${username}`);

  if (matchError) {
    throw matchError;
  }

  const targetRow = matchingRows?.find((row) => row.auth_user_id === authUser.id)
    || matchingRows?.find((row) => row.email?.toLowerCase() === email.toLowerCase())
    || matchingRows?.find((row) => row.username?.toLowerCase() === username.toLowerCase());

  await admin
    .from("users")
    .update({
      role: "STUDENT",
      is_active: true,
      is_suspended: false,
    })
    .eq("role", "SUPER_ADMIN")
    .is("deleted_at", null);

  let appUserId = targetRow?.id;
  if (appUserId) {
    const { error } = await admin
      .from("users")
      .update({
        auth_user_id: authUser.id,
        email,
        username,
        role: "SUPER_ADMIN",
        is_active: true,
        is_suspended: false,
        email_verified: true,
        deleted_at: null,
        deleted_by: null,
      })
      .eq("id", appUserId);

    if (error) {
      throw error;
    }
  } else {
    const { data, error } = await admin
      .from("users")
      .insert({
        auth_user_id: authUser.id,
        email,
        username,
        role: "SUPER_ADMIN",
        is_active: true,
        is_suspended: false,
        email_verified: true,
      })
      .select("id")
      .single();

    if (error || !data) {
      throw error || new Error("Could not create super admin app user");
    }

    appUserId = data.id;
  }

  const { data: profile } = await admin
    .from("user_profiles")
    .select("id")
    .eq("user_id", appUserId)
    .maybeSingle();

  if (profile) {
    const { error } = await admin
      .from("user_profiles")
      .update({ full_name: username })
      .eq("user_id", appUserId);
    if (error) {
      throw error;
    }
  } else {
    const { error } = await admin
      .from("user_profiles")
      .insert({ user_id: appUserId, full_name: username });
    if (error) {
      throw error;
    }
  }

  return appUserId;
}

const authUser = await ensureAuthUser();
const appUserId = await ensureAppUser(authUser);

console.log(`Super admin ready: ${username} <${email}> (app user ${appUserId})`);
