import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-wheat-50 px-4 py-10">
      <div className="w-full max-w-md rounded-md border border-soil-900/15 bg-wheat-100 p-8 shadow-sm">
        <div className="mb-6">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-sm bg-blue-900 font-mono text-lg font-semibold text-on-accent">
            B
          </div>
          <h1 className="font-display text-2xl font-semibold text-soil-900">
            BDP Score
          </h1>
          <p className="mt-1 text-sm text-soil-600">
            Calificación crediticia agrícola. Acceso para oficiales, jefes de
            agencia y analistas de riesgo.
          </p>
        </div>

        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
