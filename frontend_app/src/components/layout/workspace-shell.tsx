"use client";
import Image from "next/image";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FilePlus2,
  Files,
  Settings2,
  Sprout,
  Database,
} from "lucide-react";
import { dataMode } from "@/lib/scorebdp";
const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/solicitud", label: "Alta de solicitud", icon: FilePlus2 },
  { href: "/solicitudes", label: "Lista de solicitudes", icon: Files },
  { href: "/configuracion", label: "Configuración de pesos", icon: Settings2 },
];
export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [dark, setDark] = useState(false);
  return (
    <div
      data-theme={dark ? "dark" : "light"}
      className="min-h-screen bg-background text-foreground lg:grid lg:grid-cols-[250px_1fr]"
    >
      <aside className="flex flex-col bg-[#003366] text-white lg:sticky lg:top-0 lg:h-screen">
        <Link
          href="/dashboard"
          className="flex h-24 items-center justify-center bg-white p-5"
        >
          <Image
            src="/bdplogo.png"
            width={170}
            height={65}
            alt="BDP Banco de Desarrollo Productivo"
            className="h-auto max-h-16 w-auto max-w-full"
            priority
          />
        </Link>
        <div className="hidden px-6 pb-4 pt-8 lg:block">
          <p className="text-[11px] font-bold tracking-[.2em] text-cyan-200">
            BDP SCORE
          </p>
          <p className="mt-2 text-sm text-blue-100">Información para decidir</p>
        </div>
        <nav
          aria-label="Navegación principal"
          className="flex gap-1 overflow-x-auto p-3 lg:flex-col"
        >
          {links.map((item) => {
            const active =
              path === item.href ||
              (item.href === "/solicitudes" &&
                path.startsWith("/solicitudes/"));
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex shrink-0 items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium ${active ? "bg-[#005FBC] text-white" : "text-blue-100 hover:bg-white/10"}`}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto hidden p-6 lg:block">
          <div className="rounded-xl border border-white/15 bg-white/5 p-4">
            <Sprout className="mb-3 text-cyan-200" size={22} />
            <p className="text-sm font-semibold">Una mirada integral</p>
            <p className="mt-2 text-xs leading-5 text-blue-100">
              Crédito, producción y territorio al servicio del análisis.
            </p>
          </div>
        </div>
      </aside>
      <div className="min-w-0">
        <div className="flex min-h-16 flex-wrap items-center justify-between gap-2 border-b border-border bg-card px-5 py-3 lg:px-9">
          <span className="text-sm font-semibold">
            Plataforma de evaluación agrícola
          </span>
          <button
            type="button"
            aria-pressed={dark}
            onClick={() => setDark((value) => !value)}
            className="rounded-lg border border-border px-3 py-1 text-xs"
          >
            {dark ? "Modo claro" : "Modo oscuro"}
          </button>
          <span className="flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
            <Database size={14} />
            {dataMode === "demo"
              ? "DEMO · sin Oracle"
              : "Conexión API · ScoreBDP"}
          </span>
        </div>
        <div className="border-b border-border bg-secondary px-5 py-3 text-xs leading-5 text-secondary-foreground lg:px-9">
          {dataMode === "demo"
            ? "Datos de demostración identificados. Las capturas se conservan solo en esta sesión del navegador. No se realizan operaciones en Oracle."
            : "Modo API: las acciones de guardar y generar score escriben en el backend configurado. Una falla no activa datos de demostración."}
        </div>
        <main id="contenido" className="mx-auto max-w-7xl p-5 lg:p-9">
          {children}
        </main>
        <footer className="px-5 py-6 text-center text-xs text-muted-foreground">
          BDP Score apoya al oficial de crédito. No aprueba ni rechaza
          solicitudes.
        </footer>
      </div>
    </div>
  );
}
