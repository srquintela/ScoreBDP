import "server-only";
import { SignJWT, jwtVerify } from "jose";
import type { Rol, Sesion } from "@/lib/types";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
const alg = "HS256";

export async function createSession(payload: {
  userId: string;
  role: Rol;
  name?: string;
}) {
  return new SignJWT({ role: payload.role, name: payload.name })
    .setProtectedHeader({ alg })
    .setSubject(payload.userId)
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secret);
}

export async function verifySession(token: string): Promise<Sesion | null> {
  try {
    const { payload } = await jwtVerify(token, secret, { algorithms: [alg] });
    return {
      userId: payload.sub as string,
      role: payload.role as Rol,
      name: payload.name as string | undefined,
    };
  } catch {
    return null;
  }
}
