import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySession } from "@/lib/auth/session";
import { COOKIE_NAME } from "@/lib/auth/cookies";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;

  const isPublicRoute = pathname === "/login" || pathname === "/";
  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/solicitudes") ||
    pathname.startsWith("/auditoria");

  // Ruta protegida sin sesión -> login con destino de retorno
  if (isProtectedRoute && !session) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Usuario ya autenticado visitando /login -> dashboard
  if (isPublicRoute && session) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/dashboard/:path*",
    "/solicitudes/:path*",
    "/auditoria/:path*",
  ],
};
