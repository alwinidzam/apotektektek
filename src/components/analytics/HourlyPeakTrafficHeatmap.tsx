"use client";

import React from "react";
import { HourlyTrafficPoint } from "@/lib/types";
import { formatRupiah } from "@/lib/utils";
import { Clock, Zap } from "lucide-react";

interface HourlyPeakTrafficHeatmapProps {
  hourly: HourlyTrafficPoint[];
  privacyMode?: boolean;
}

export const HourlyPeakTrafficHeatmap: React.FC<HourlyPeakTrafficHeatmapProps> = ({
  hourly,
  privacyMode = false,
}) => {
  const maxOmzet = Math.max(...hourly.map((h) => h.totalOmzet), 1);

  const renderAmount = (amount: number) => {
    if (privacyMode) return "••••••••";
    return formatRupiah(amount);
  };

  return (
    <div className="bg-white dark:bg-[#1C1C1E] p-6 rounded-[22px] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-[8px] bg-amber-50 dark:bg-amber-950/50 text-amber-600">
            <Clock className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-[17px] font-bold text-[#1C1C1E] dark:text-white">
              Sebaran Jam Sibuk & Lalu Lintas Pasien (08:00 - 22:00)
            </h3>
            <p className="text-[12px] text-[#8E8E93]">
              Distribusi transaksi per jam untuk optimalisasi jadwal apoteker peracik dan kasir operasional
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px]">
          <span className="inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            <Zap className="w-3 h-3" />
            <span>Rush Hour (09:00 - 11:00 & 17:00 - 20:00)</span>
          </span>
        </div>
      </div>

      {/* Hourly Bar Histogram */}
      <div className="grid grid-cols-7 sm:grid-cols-14 gap-2 pt-3">
        {hourly.map((h) => {
          const heightPercent = Math.max(10, Math.round((h.totalOmzet / maxOmzet) * 100));

          return (
            <div
              key={h.hourNumber}
              className="flex flex-col items-center gap-1.5 group"
              title={`${h.hourString}: ${renderAmount(h.totalOmzet)} (${h.transactionCount} transaksi)`}
            >
              {/* Bar */}
              <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-28 rounded-[8px] flex items-end p-0.5 overflow-hidden">
                <div
                  className={`w-full rounded-[6px] transition-all duration-300 group-hover:opacity-90 ${
                    h.isPeakHour
                      ? "bg-gradient-to-t from-amber-500 to-amber-400 shadow-sm shadow-amber-500/20"
                      : "bg-teal-600/70 dark:bg-teal-500/50"
                  }`}
                  style={{ height: `${heightPercent}%` }}
                />
              </div>

              {/* Hour Label */}
              <span
                className={`text-[10px] font-mono ${
                  h.isPeakHour
                    ? "font-bold text-amber-600 dark:text-amber-400"
                    : "text-[#8E8E93]"
                }`}
              >
                {h.hourString.split(":")[0]}
              </span>

              {/* Transactions count badge */}
              <span className="text-[9px] text-[#8E8E93] tabular-nums font-mono">
                {h.transactionCount}tx
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
