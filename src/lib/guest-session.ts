import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "spotgo_guest";

export async function readGuestToken() {
  return (await cookies()).get(COOKIE_NAME)?.value ?? null;
}

export async function ensureGuestToken() {
  const cookieStore = await cookies();
  const existing = cookieStore.get(COOKIE_NAME)?.value;
  if (existing) return existing;

  const token = randomBytes(32).toString("base64url");
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    priority: "high",
  });
  return token;
}
