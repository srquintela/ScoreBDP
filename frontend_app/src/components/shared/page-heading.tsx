export function PageHeading({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="mb-7 flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="mb-2 text-xs font-bold tracking-[.15em] text-primary">
          CRÉDITO PRODUCTIVO AGRÍCOLA
        </p>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
      {action}
    </header>
  );
}
export function ErrorNotice({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="alert"
      className="my-4 rounded-lg border border-danger/30 bg-danger/5 p-4 text-sm text-danger"
    >
      {children}
    </p>
  );
}
export const money = (value: number | null) =>
  value === null
    ? "No disponible"
    : new Intl.NumberFormat("es-BO", {
        style: "currency",
        currency: "BOB",
        maximumFractionDigits: 0,
      }).format(value);
export const decimal = (value: number | null) =>
  value === null
    ? "No disponible"
    : new Intl.NumberFormat("es-BO", { maximumFractionDigits: 2 }).format(
        value,
      );
