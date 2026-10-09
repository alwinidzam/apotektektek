"use client";

import React from "react";
import { WeeklyRevenueMetric } from "@/lib/types";
import { formatRupiah } from "@/lib/utils";
import { Layers, ArrowUpRight, ArrowDownRight, CalendarDays, ShoppingCart } from "lucide-react";

interface WeeklyGrowthChartProps {
  weeks: WeeklyRevenueMetric[];
  privacyMode?: boolean;
}

export const WeeklyGrowthChart: React.FC<WeeklyGrowthChartProps> = ({
  weeks,
  privacyMode = false,
}) => {
  const maxWeekly = Math.max(...weeks.map((w) => w.netRevenue), 1);

  const renderAmount = (amount: number, color = "text-[#1C1C1E] dark:text-white") => {
    if (privacyMode) return <span className="font-mono text-[#8E8E93]">••••••••</span>;
    return <span className={`tabular-nums font-bold ${color}`}>{formatRupiah(amount)}</span>;
  };

  return (
    <div className="bg-white dark:bg-[#1C1C1E] p-6 rounded-[22px] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-[8px] bg-blue-50 dark:bg-blue-950/50 text-[#007AFF]">
            <Layers className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-[17px] font-bold text-[#1C1C1E] dark:text-white">
              Performa & Pertumbuhan Mingguan (WoW)
            </h3>
            <p className="text-[12px] text-[#8E8E93]">
              Progresivitas omzet 4 pekan kalender, margin laba kotor, dan hari tersibuk apotek
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {weeks.map((week) => {
          const barHeightRatio = Math.max(15, Math.round((week.netRevenue / maxWeekly) * 100));

          return (
            <div
              key={week.weekNumber}
              className="p-4 rounded-[18px] bg-neutral-50 dark:bg-[#2C2C2E]/50 border border-black/[0.04] dark:border-white/[0.06] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-bold text-[#1C1C1E] dark:text-white">
                    {week.weekLabel}
                  </span>
                  {week.growthWoWPercent !== 0 && (
                    <span
                      className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        week.growthWoWPercent > 0
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                      }`}
                    >
                      {week.growthWoWPercent > 0 ? (
                        <ArrowUpRight className="w-3 h-3" />
                      ) : (
                        <ArrowDownRight className="w-3 h-3" />
                      )}
                      {week.growthWoWPercent > 0 ? `+${week.growthWoWPercent}%` : `${week.growthWoWPercent}%`}
                    </span>
                  )}
                </div>

                <div className="text-[18px] mt-3">
                  {renderAmount(week.netRevenue, "text-[#008B94]")}
                </div>

                {/* Progress Bar */}
                <div className="mt-2.5 w-full bg-neutral-200 dark:bg-neutral-700 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#008B94] rounded-full transition-all duration-500"
                    style={{ width: `${barHeightRatio}%` }}
                  />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-black/[0.04] dark:border-white/[0.06] space-y-1.5 text-[11px] text-[#8E8E93]">
                <div className="flex items-center justify-between">
                  <span>Laba Kotor:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {renderAmount(week.grossProfit)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <ShoppingCart className="w-3 h-3" />
                    <span>Total Struk:</span>
                  </span>
                  <span className="font-semibold text-[#1C1C1E] dark:text-white">
                    {week.transactionCount} struk
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] pt-1 border-t border-black/[0.03] dark:border-white/[0.04]">
                  <span className="flex items-center gap-1">
                    <CalendarDays className="w-3 h-3 text-amber-500" />
                    <span>Paling Ramai:</span>
                  </span>
                  <span className="font-medium text-[#1C1C1E] dark:text-white truncate max-w-[90px]">
                    {week.busiestDay}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
