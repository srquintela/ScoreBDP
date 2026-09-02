import "server-only";
import { cookies } from "next/headers";
import { verifySession, createSession } from "@/lib/auth/session";
import type { Rol, Sesion } from "@/lib/types";

export const COOKIE_NAME = "bdp_session";

export async function setSessionCookie(token: string) {
  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 horas
  });
}

export async function getSession(): Promise<Sesion | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    return await verifySession(token);
  } catch {
    return null;
  }
}

export async function deleteSessionCookie() {
  (await cookies()).delete(COOKIE_NAME);
}

/**
 * Ingresa un usuario (crea la sesión). Devuelve el token para poder prefiarla,
 * o null si falla la autenticación.
 */
export async function loginUsuario(
  userId: string,
  role: Rol,
  name?: string
): Promise<void> {
  const token = await createSession({ userId, role, name });
  await setSessionCookie(token);
}
