import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import crypto from "crypto";

const COOKIE_NAME = "lnd_session";
const ONE_WEEK = 60 * 60 * 24 * 7;

function token() {
  return crypto.randomBytes(32).toString("hex");
}

export async function createSession(userId: string, device?: string, location?: string) {
  const t = token();
  const expiresAt = new Date(Date.now() + ONE_WEEK * 1000);
  await prisma.authSession.updateMany({
    where: { userId, current: true },
    data: { current: false },
  });
  const session = await prisma.authSession.create({
    data: {
      userId,
      token: t,
      device: device ?? "Unknown device",
      location: location ?? null,
      current: true,
      expiresAt,
    },
  });
  cookies().set(COOKIE_NAME, t, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: ONE_WEEK,
    path: "/",
  });
  return session;
}

export async function destroySession() {
  const t = cookies().get(COOKIE_NAME)?.value;
  if (t) {
    await prisma.authSession.deleteMany({ where: { token: t } });
  }
  cookies().delete(COOKIE_NAME);
}

export async function destroyAllSessionsForCurrentUser() {
  const u = await getCurrentUser();
  if (!u) return;
  await prisma.authSession.deleteMany({ where: { userId: u.id } });
  cookies().delete(COOKIE_NAME);
}

export async function getCurrentUser() {
  const t = cookies().get(COOKIE_NAME)?.value;
  if (!t) return null;
  const session = await prisma.authSession.findUnique({
    where: { token: t },
    include: { user: { include: { provider: true } } },
  });
  if (!session || session.expiresAt < new Date()) return null;
  await prisma.authSession.update({
    where: { id: session.id },
    data: { lastActive: new Date() },
  });
  return session.user;
}

export async function requireUser() {
  const u = await getCurrentUser();
  if (!u) redirect("/login");
  return u;
}

export async function requireProvider() {
  const u = await getCurrentUser();
  if (!u) redirect("/provider/login");
  if (!u.provider) redirect("/provider/signup");
  return { user: u, provider: u.provider };
}

export function deviceFromRequest() {
  const h = headers();
  const ua = h.get("user-agent") ?? "";
  const isMac = /Macintosh/.test(ua);
  const isIphone = /iPhone/.test(ua);
  const isAndroid = /Android/.test(ua);
  const isChrome = /Chrome/.test(ua);
  const isSafari = /Safari/.test(ua) && !isChrome;
  const isFirefox = /Firefox/.test(ua);
  const browser = isChrome ? "Chrome" : isFirefox ? "Firefox" : isSafari ? "Safari" : "Browser";
  const os = isMac ? "MacOS" : isIphone ? "iPhone" : isAndroid ? "Android" : "Desktop";
  return `${browser} on ${os}`;
}
