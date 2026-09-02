import type { Metadata } from "next";
import { Newsreader, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const display = Newsreader({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const sans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "BDP Score",
  description:
    "Motor de calificación crediticia agrícola basado en reglas, 100% explicable.",
};

// Script inline anti-flash: aplica el tema antes de la primera pintura para
// evitar "flash of wrong theme". Respeta la preferencia guardada y, si no hay,
// la del sistema (prefers-color-scheme).
const themeScript = `
(function () {
  try {
    var stored = localStorage.getItem("bdp-theme");
    var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    var theme = stored ? stored : (prefersDark ? "dark" : "light");
    var root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    root.style.colorScheme = theme;
  } catch (e) {}
  // tras hidratar, habilitamos la transición suave
  requestAnimationFrame(function () {
    document.documentElement.classList.add("theme-transition");
  });
})();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${display.variable} ${sans.variable} ${mono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full bg-wheat-50 text-soil-900">
        {children}
      </body>
    </html>
  );
}
