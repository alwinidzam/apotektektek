import React from "react";

export type PillVariant =
  | "safe"
  | "warning"
  | "danger"
  | "clinical"
  | "neutral"
  | "bebas"
  | "bebas_terbatas"
  | "keras"
  | "narkotika"
  | "psikotropika"
  | "oot";

interface AppleStatusPillProps {
  variant: PillVariant;
  label: string;
  subtext?: string;
  size?: "sm" | "md";
}

export const AppleStatusPill: React.FC<AppleStatusPillProps> = ({
  variant,
  label,
  subtext,
  size = "md",
}) => {
  const styles: Record<
    PillVariant,
    { bg: string; text: string; ring: string; dot: string }
  > = {
    safe: {
      bg: "bg-[#EBF9F0] dark:bg-[#1A3826]",
      text: "text-[#1F7A3C] dark:text-[#34C759]",
      ring: "ring-1 ring-[#34C759]/30",
      dot: "bg-[#34C759]",
    },
    warning: {
      bg: "bg-[#FFF6E9] dark:bg-[#3D2C14]",
      text: "text-[#9A5B00] dark:text-[#FF9F0A]",
      ring: "ring-1 ring-[#FF9500]/30",
      dot: "bg-[#FF9500]",
    },
    danger: {
      bg: "bg-[#FDF0EF] dark:bg-[#3B1917]",
      text: "text-[#B82B24] dark:text-[#FF453A]",
      ring: "ring-1 ring-[#FF3B30]/30",
      dot: "bg-[#FF3B30]",
    },
    clinical: {
      bg: "bg-[#F4F3FB] dark:bg-[#25223E]",
      text: "text-[#4845B2] dark:text-[#5E5CE6]",
      ring: "ring-1 ring-[#5856D6]/30",
      dot: "bg-[#5856D6]",
    },
    neutral: {
      bg: "bg-[#F2F2F7] dark:bg-[#2C2C2E]",
      text: "text-[#48484A] dark:text-[#AEAEB2]",
      ring: "ring-1 ring-black/[0.06] dark:ring-white/[0.08]",
      dot: "bg-[#8E8E93]",
    },
    bebas: {
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
      text: "text-emerald-700 dark:text-emerald-300",
      ring: "ring-1 ring-emerald-500/30",
      dot: "bg-emerald-500",
    },
    bebas_terbatas: {
      bg: "bg-sky-50 dark:bg-sky-950/40",
      text: "text-sky-700 dark:text-sky-300",
      ring: "ring-1 ring-sky-500/30",
      dot: "bg-sky-500",
    },
    keras: {
      bg: "bg-rose-50 dark:bg-rose-950/40",
      text: "text-rose-700 dark:text-rose-300",
      ring: "ring-1 ring-rose-500/30",
      dot: "bg-rose-600",
    },
    narkotika: {
      bg: "bg-red-100 dark:bg-red-950/60",
      text: "text-red-900 dark:text-red-200 font-bold",
      ring: "ring-1 ring-red-600/40",
      dot: "bg-red-600",
    },
    psikotropika: {
      bg: "bg-purple-50 dark:bg-purple-950/40",
      text: "text-purple-700 dark:text-purple-300",
      ring: "ring-1 ring-purple-500/30",
      dot: "bg-purple-600",
    },
    oot: {
      bg: "bg-amber-50 dark:bg-amber-950/40",
      text: "text-amber-800 dark:text-amber-300",
      ring: "ring-1 ring-amber-500/30",
      dot: "bg-amber-600",
    },
  };

  const current = styles[variant] || styles.neutral;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${current.bg} ${current.text} ${current.ring} ${
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-0.5 text-[12px]"
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`} />
      <span>{label}</span>
      {subtext && <span className="opacity-70 font-normal">({subtext})</span>}
    </span>
  );
};
