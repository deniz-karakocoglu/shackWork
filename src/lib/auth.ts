// kimlik doğrulama: bcrypt + JWT + httpOnly çerez (+ mobil Bearer)

import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies, headers } from "next/headers";

const COOKIE_NAME = "shackwork_session";

function getSecret() {
  return new TextEncoder().encode(
    process.env.JWT_SECRET ?? "shackwork-dev-secret-change-me",
  );
}

async function userIdFromToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

// bcrypt, 10 round salt
export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

// JWT — 30 gün geçerli
export async function createSessionToken(userId: string) {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecret());
}

// web: httpOnly çerez | mobil: Authorization: Bearer
export async function readSessionUserId() {
  const jar = await cookies();
  const cookieToken = jar.get(COOKIE_NAME)?.value;
  if (cookieToken) {
    const id = await userIdFromToken(cookieToken);
    if (id) return id;
  }

  const hdrs = await headers();
  const auth = hdrs.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    return userIdFromToken(auth.slice(7).trim());
  }

  return null;
}

// httpOnly → XSS koruması, secure → üretimde HTTPS
export async function setSessionCookie(token: string) {
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.set(COOKIE_NAME, "", { path: "/", maxAge: 0 });
}
