"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Rol } from "@/lib/types";

type NavEntry = {
  href: string;
  label: string;
  roles: Rol[];
};

const NAV: { seccion: string; items: NavEntry[] }[] = [
  {
    seccion: "Operación",
    items: [
      { href: "/dashboard", label: "Resumen de cartera", roles: ["oficial", "analista", "jefe_agencia"] },
      { href: "/solicitudes", label: "Solicitudes", roles: ["oficial", "analista", "jefe_agencia"] },
    ],
  },
  {
    seccion: "Riesgo",
    items: [
      { href: "/solicitudes/nueva", label: "Alta de solicitud", roles: ["oficial"] },
      { href: "/auditoria", label: "Auditoría", roles: ["analista", "jefe_agencia"] },
    ],
  },
];

type FlatNav = NavEntry & { seccion: string };

export function Sidebar({ rol, userName }: { rol: Rol; userName?: string }) {
  const pathname = usePathname();

  const items: FlatNav[] = NAV.flatMap((grp) =>
    grp.items
      .filter((i) => i.roles.includes(rol))
      .map((i) => ({ ...i, seccion: grp.seccion })),
  );

  /*
   * Match activo por segmento, no por prefijo ingenuo:
   * - coincidencia exacta (pathname === href), o
   * - coincidencia de prefijo en límite de segmento (href + "/").
   * Si dos ítems matchean a la vez (p. ej. /solicitudes y /solicitudes/nueva),
   * gana el de ruta más larga, de modo que nunca haya dos resaltados.
   */
  const activeHref = items
    .map((i) => ({
      href: i.href,
      match: pathname === i.href || pathname.startsWith(i.href + "/"),
    }))
    .filter((m) => m.match)
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-soil-900/10 bg-wheat-100 lg:flex">
      <div className="flex items-center gap-3 border-b border-soil-900/10 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-blue-900 font-mono text-sm font-semibold text-on-accent">
          B
        </div>
        <div>
          <p className="font-display text-base font-semibold leading-tight text-soil-900">
            BDP Score
          </p>
          <p className="text-xs text-soil-400">Calificación crediticia</p>
        </div>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
        {NAV.map((grp) => {
          const groupItems = items.filter((i) => i.seccion === grp.seccion);
          if (groupItems.length === 0) return null;
          return (
            <div key={grp.seccion}>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-soil-400">
                {grp.seccion}
              </p>
              <ul className="space-y-1">
                {groupItems.map((item) => {
                  const active = item.href === activeHref;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                          active
                            ? "bg-blue-600 font-semibold text-on-accent"
                            : "text-soil-600 hover:bg-wheat-50 hover:text-soil-900"
                        }`}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-soil-900/10 px-5 py-4">
        <p className="text-sm font-medium text-soil-900">{userName ?? rol}</p>
        <p className="text-xs capitalize text-soil-400">
          {rol.replace("_", " ")}
        </p>
      </div>
    </aside>
  );
}
