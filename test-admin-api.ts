// @ts-nocheck
import { SignJWT } from "jose";

async function main() {
  const secret = new TextEncoder().encode("super-secret-jwt-key-for-local-dev-only-do-not-use-in-prod");
  const token = await new SignJWT({ id: 1, role: "SUPER_ADMIN" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("2h")
    .sign(secret);

  const res = await fetch("http://localhost:3000/api/v1/admin/projects?page=0&size=20&sort=NEWEST&deleted=false", {
    headers: { Authorization: `Bearer ${token}` }
  });

  console.log("Status:", res.status);
  console.log("Body:", await res.text());
}
main();
