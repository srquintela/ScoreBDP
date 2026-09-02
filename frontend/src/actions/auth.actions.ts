"use server";

import { redirect } from "next/navigation";
import { loginUsuario, deleteSessionCookie } from "@/lib/auth/cookies";
import type { Rol } from "@/lib/types";

type Credencial = {
  email: string;
  password: string;
  nombre: string;
  rol: Rol;
};

// Credenciales mock. En producción esto valida contra el backend de BDP
// (usuarios, roles y sucursales). NO uses contraseñas en texto plano.
const USUARIOS: Credencial[] = [
  { email: "oficial@bdp.bo", password: "oficial2026", nombre: "Camila Ríos", rol: "oficial" },
  { email: "jefe@bdp.bo", password: "jefe2026", nombre: "Marcelo López", rol: "jefe_agencia" },
  { email: "analista@bdp.bo", password: "analista2026", nombre: "Andrea Zenteno", rol: "analista" },
];

export type LoginState = { error?: string } | undefined;

export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const user = USUARIOS.find((u) => u.email === email && u.password === password);

  if (!user) {
    return {
      error:
        "No encontramos esas credenciales. Revisá tu usuario o contactá a tu agencia.",
    };
  }

  await loginUsuario(user.email, user.rol, user.nombre);
  redirect("/dashboard");
}

export async function logout() {
  await deleteSessionCookie();
  redirect("/login");
}
