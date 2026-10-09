import type { Metadata } from "next";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import "./globals.css";
export const metadata: Metadata = {
  title: "BDP Score | Crédito agrícola",
  description: "Expediente de evaluación de crédito productivo agrícola.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        <a href="#contenido" className="sr-only focus:not-sr-only">
          Ir al contenido
        </a>
        <WorkspaceShell>{children}</WorkspaceShell>
      </body>
    </html>
  );
}
