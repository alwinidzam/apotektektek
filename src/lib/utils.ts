import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function getDaysUntilExpiry(expiryDate: string | Date): number {
  const target = new Date(expiryDate).getTime();
  const now = new Date().getTime();
  const diffTime = target - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function getExpiryStatus(daysRemaining: number): {
  label: string;
  colorClass: string;
  badgeBg: string;
  isExpired: boolean;
} {
  if (daysRemaining <= 0) {
    return {
      label: "EXPIRED (Dilarang Dijual)",
      colorClass: "text-red-700 dark:text-red-400 font-bold",
      badgeBg: "bg-red-100 dark:bg-red-950/60 border-red-300 dark:border-red-800 text-red-800 dark:text-red-200 animate-pulse",
      isExpired: true,
    };
  }
  if (daysRemaining < 30) {
    return {
      label: `Kritis: < ${daysRemaining} hari`,
      colorClass: "text-red-600 dark:text-red-400 font-semibold",
      badgeBg: "bg-red-50 dark:bg-red-950/40 border-red-200 text-red-700 dark:text-red-300",
      isExpired: false,
    };
  }
  if (daysRemaining <= 90) {
    return {
      label: `Waspada: ${daysRemaining} hari`,
      colorClass: "text-amber-600 dark:text-amber-400 font-semibold",
      badgeBg: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 text-amber-700 dark:text-amber-300",
      isExpired: false,
    };
  }
  return {
    label: `Aman (${daysRemaining} hari)`,
    colorClass: "text-emerald-600 dark:text-emerald-400",
    badgeBg: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 text-emerald-700 dark:text-emerald-300",
    isExpired: false,
  };
}

export function roundCashPayment(amount: number, step: 100 | 500 = 100): number {
  return Math.round(amount / step) * step;
}

export function formatIndonesianDate(date: string | Date | undefined | null): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return String(date);
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function formatUnitLabel(unit: string | undefined | null): string {
  if (!unit) return "Unit";
  const map: Record<string, string> = {
    tablet: "Tablet",
    kapsul: "Kapsul",
    strip: "Strip",
    botol: "Botol",
    tube: "Tube",
    sachet: "Sachet",
    ampul: "Ampul",
    vial: "Vial",
    box: "Box",
    kaplet: "Kaplet",
    bungkus: "Bungkus",
    fls: "Botol",
  };
  return map[unit.toLowerCase()] || unit;
}
