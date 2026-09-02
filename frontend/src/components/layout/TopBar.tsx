import { logout } from "@/actions/auth.actions";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

export function TopBar({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-soil-400/15 bg-wheat-50 px-6 py-4">
      <div>
        <h1 className="font-display text-xl font-semibold text-soil-900">{title}</h1>
        {subtitle && <p className="text-sm text-soil-400">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <form action={logout}>
          <Button type="submit" variant="ghost">
            Cerrar sesión
          </Button>
        </form>
      </div>
    </header>
  );
}
