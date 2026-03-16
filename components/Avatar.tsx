"use client";

const AVATAR_COLORS: Record<string, string> = {
  amber: "bg-amber-500 text-white",
  blue: "bg-blue-500 text-white",
  rose: "bg-rose-500 text-white",
  emerald: "bg-emerald-500 text-white",
  violet: "bg-violet-500 text-white",
};

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";
}

export function Avatar({
  name,
  style,
  size = "md",
}: {
  name: string;
  style?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const initials = getInitials(name);
  const colorClass =
    (style && AVATAR_COLORS[style]) || "bg-slate-400 text-white";
  const sizeClass =
    size === "sm"
      ? "w-8 h-8 text-xs"
      : size === "lg"
        ? "w-12 h-12 text-base"
        : "w-10 h-10 text-sm";

  return (
    <div
      className={`rounded-full flex items-center justify-center font-medium flex-shrink-0 ${sizeClass} ${colorClass}`}
      aria-hidden
    >
      {initials}
    </div>
  );
}
