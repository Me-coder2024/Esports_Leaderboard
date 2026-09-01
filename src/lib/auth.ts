import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const SESSION_COOKIE = "scorer_session";
const SESSION_VALUE = "authenticated";

export function validatePasscode(input: string): boolean {
  const passcode = process.env.ADMIN_PASSCODE || "tournament2024";
  return input === passcode;
}

export async function setSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, SESSION_VALUE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE);
  return session?.value === SESSION_VALUE;
}

export function isAuthenticatedFromRequest(request: NextRequest): boolean {
  const session = request.cookies.get(SESSION_COOKIE);
  return session?.value === SESSION_VALUE;
}
