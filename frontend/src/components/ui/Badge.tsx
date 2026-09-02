type Tone = "positive" | "warn" | "error" | "neutral";

const tones: Record<Tone, string> = {
  positive: "bg-blue-100 text-blue-600",
  warn: "bg-blue-100 text-blue-700",
  error: "bg-brick-100 text-brick-700",
  neutral: "bg-wheat-100 text-soil-600",
};

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: Tone;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
