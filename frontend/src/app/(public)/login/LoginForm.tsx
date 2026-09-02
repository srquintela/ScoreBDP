"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/actions/auth.actions";
import { Field, inputStyles } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(
    login,
    undefined
  );

  return (
    <form action={action} className="space-y-5">
      <Field label="Usuario (correo)">
        <input
          name="email"
          type="email"
          autoComplete="username"
          required
          placeholder="oficial@bdp.bo"
          className={inputStyles}
        />
      </Field>

      <Field label="Contraseña">
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={inputStyles}
        />
      </Field>

      {state?.error && (
        <p
          role="alert"
          className="rounded-md border border-brick-700/25 bg-brick-100 px-3 py-2 text-sm text-brick-700"
        >
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Ingresando…" : "Ingresar"}
      </Button>

      <div className="rounded-md border border-soil-900/10 bg-wheat-50 p-3 text-xs text-soil-600">
        <p className="mb-1 font-semibold text-soil-900">Cuentas de demostración</p>
        <p>Oficial: oficial@bdp.bo / oficial2026</p>
        <p>Analista: analista@bdp.bo / analista2026</p>
        <p>Jefe de agencia: jefe@bdp.bo / jefe2026</p>
      </div>
    </form>
  );
}
