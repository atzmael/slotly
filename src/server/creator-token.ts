import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";

const cookieMaxAgeSeconds = 60 * 60 * 24 * 180;

export function createCreatorToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashCreatorToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function getCreatorCookieName(eventId: string): string {
  return `slotly_creator_${eventId}`;
}

export async function storeCreatorToken(
  eventId: string,
  token: string,
): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(getCreatorCookieName(eventId), token, {
    httpOnly: true,
    maxAge: cookieMaxAgeSeconds,
    path: `/e/${eventId}`,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function getCreatorTokenHashFromCookie(
  eventId: string,
): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(getCreatorCookieName(eventId))?.value;

  return token ? hashCreatorToken(token) : null;
}
