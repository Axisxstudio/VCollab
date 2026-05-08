import { createClient } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { badRequest, conflict, forbidden, notFound, unauthorized } from "@/server/http/errors";
import { mapUserResponse } from "./mapper";
import type { AppUserRow, AuthResponse, UserResponse } from "./types";

type LoginInput = {
  identifier: string;
  password: string;
};

type RegisterInput = {
  fullName: string;
  username: string;
  email: string;
  password: string;
  role: "STUDENT" | "INDUSTRIAL_EXPERT" | "SOFTWARE_ENGINEER";
};

function createSupabasePasswordClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Missing public Supabase environment variables");
  }

  return createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function appUserSelect() {
  return `
    id,
    auth_user_id,
    email,
    username,
    role,
    is_active,
    is_suspended,
    user_profiles!user_profiles_user_id_fkey (
      full_name,
      profile_image,
      education_type
    )
  `;
}

async function getUserByIdentifier(identifier: string): Promise<AppUserRow | null> {
  const admin = createSupabaseAdminClient();
  const normalized = identifier.trim();

  const { data, error } = await admin
    .from("users")
    .select(appUserSelect())
    .or(`email.ilike.${normalized},username.ilike.${normalized}`)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw badRequest(error.message);
  }

  return data as AppUserRow | null;
}

async function getUserByAuthId(authUserId: string): Promise<AppUserRow | null> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("users")
    .select(appUserSelect())
    .eq("auth_user_id", authUserId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw badRequest(error.message);
  }

  return data as AppUserRow | null;
}

function assertCanSignIn(user: AppUserRow) {
  if (!user.is_active || user.is_suspended) {
    throw forbidden("Account is not active");
  }
}

export async function register(input: RegisterInput): Promise<AuthResponse> {
  const admin = createSupabaseAdminClient();

  const existingEmail = await getUserByIdentifier(input.email);
  if (existingEmail?.email.toLowerCase() === input.email.toLowerCase()) {
    throw conflict("Email already registered");
  }

  const existingUsername = await getUserByIdentifier(input.username);
  if (existingUsername?.username.toLowerCase() === input.username.toLowerCase()) {
    throw conflict("Username already taken");
  }

  const { data: createdAuthUser, error: createAuthError } =
    await admin.auth.admin.createUser({
      email: input.email,
      password: input.password,
      // Enable immediate sign-in after register for API compatibility.
      email_confirm: true,
      user_metadata: {
        full_name: input.fullName,
        username: input.username,
        role: input.role,
      },
    });

  if (createAuthError || !createdAuthUser.user) {
    throw badRequest(createAuthError?.message ?? "Could not create user");
  }

  const { data: insertedUser, error: insertUserError } = await admin
    .from("users")
    .insert({
      auth_user_id: createdAuthUser.user.id,
      email: input.email,
      username: input.username,
      role: input.role,
      is_active: true,
      is_suspended: false,
      email_verified: false,
    })
    .select("id")
    .single();

  if (insertUserError || !insertedUser) {
    await admin.auth.admin.deleteUser(createdAuthUser.user.id);
    throw badRequest(insertUserError?.message ?? "Could not create app user");
  }

  const { error: insertProfileError } = await admin.from("user_profiles").insert({
    user_id: insertedUser.id,
    full_name: input.fullName,
  });

  if (insertProfileError) {
    await admin.from("users").delete().eq("id", insertedUser.id);
    await admin.auth.admin.deleteUser(createdAuthUser.user.id);
    throw badRequest(insertProfileError.message);
  }

  return login({ identifier: input.email, password: input.password });
}

export async function login(input: LoginInput): Promise<AuthResponse> {
  const appUser = await getUserByIdentifier(input.identifier);
  if (!appUser) {
    throw unauthorized("Invalid username/email or password");
  }

  assertCanSignIn(appUser);

  const client = createSupabasePasswordClient();
  const { data, error } = await client.auth.signInWithPassword({
    email: appUser.email,
    password: input.password,
  });

  if (error || !data.session?.access_token) {
    throw unauthorized("Invalid username/email or password");
  }

  const admin = createSupabaseAdminClient();
  await admin
    .from("users")
    .update({ last_login_at: new Date().toISOString() })
    .eq("id", appUser.id);

  return {
    token: data.session.access_token,
    user: mapUserResponse(appUser),
  };
}

export async function meFromToken(token: string): Promise<UserResponse> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.auth.getUser(token);

  if (error || !data.user) {
    throw unauthorized("Not authenticated");
  }

  const appUser = await getUserByAuthId(data.user.id);
  if (!appUser) {
    throw notFound("User not found");
  }

  assertCanSignIn(appUser);

  return mapUserResponse(appUser);
}

export async function checkUsernameAvailability(username: string): Promise<boolean> {
  const admin = createSupabaseAdminClient();
  const normalized = username.trim();

  if (!normalized) {
    return false;
  }

  const { data, error } = await admin
    .from("users")
    .select("id")
    .ilike("username", normalized)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw badRequest(error.message);
  }

  return !data;
}

export async function requestPasswordReset(email: string): Promise<void> {
  const client = createSupabasePasswordClient();
  const redirectTo = process.env.NEXT_PUBLIC_PASSWORD_RESET_REDIRECT_URL;

  await client.auth.resetPasswordForEmail(email, {
    redirectTo,
  });
}

export async function resetPassword(accessToken: string, password: string): Promise<void> {
  const client = createSupabasePasswordClient();

  const { error: sessionError } = await client.auth.setSession({
    access_token: accessToken,
    refresh_token: "",
  });

  if (sessionError) {
    throw unauthorized("Invalid or expired reset token");
  }

  const { error } = await client.auth.updateUser({ password });
  if (error) {
    throw unauthorized(error.message);
  }
}

export function bearerTokenFromRequest(request: Request): string {
  const header = request.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);

  if (!match?.[1]) {
    throw unauthorized("Not authenticated");
  }

  return match[1].trim();
}
