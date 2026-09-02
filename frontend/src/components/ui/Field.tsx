export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-soil-900">{label}</label>
      {children}
      {hint && !error && <p className="text-xs text-soil-400">{hint}</p>}
      {error && <p className="text-xs text-brick-700">{error}</p>}
    </div>
  );
}

export const inputStyles =
  "rounded-md border border-soil-600/25 bg-input px-3 py-2 text-sm text-soil-900 placeholder:text-soil-400 focus:border-blue-600 focus:outline-none";
