"use client";

import React from "react";
import { CategoryRevenueShare } from "@/lib/types";
import { formatRupiah } from "@/lib/utils";
import { PieChart, Pill, Sparkles, ShieldCheck, HeartPulse, Activity } from "lucide-react";

interface MonthlyCategoryShareProps {
  categories: CategoryRevenueShare[];
  privacyMode?: boolean;
}

export const MonthlyCategoryShare: React.FC<MonthlyCategoryShareProps> = ({
  categories,
  privacyMode = false,
}) => {
  const renderAmount = (amount: number, color = "text-[#1C1C1E] dark:text-white") => {
    if (privacyMode) return <span className="font-mono text-[#8E8E93]">••••••••</span>;
    return <span className={`tabular-nums font-bold ${color}`}>{formatRupiah(amount)}</span>;
  };

  const getCategoryIcon = (id: CategoryRevenueShare["categoryId"]) => {
    switch (id) {
      case "ETHICAL":
        return <Pill className="w-4 h-4 text-purple-600" />;
      case "OTC":
        return <ShieldCheck className="w-4 h-4 text-emerald-600" />;
      case "RACIKAN":
        return <Sparkles className="w-4 h-4 text-amber-600" />;
      case "ALKES":
        return <Activity className="w-4 h-4 text-blue-600" />;
      case "SUPLEMEN":
        return <HeartPulse className="w-4 h-4 text-rose-600" />;
    }
  };

  const getCategoryColor = (id: CategoryRevenueShare["categoryId"]) => {
    switch (id) {
      case "ETHICAL":
        return "bg-purple-500";
      case "OTC":
        return "bg-emerald-500";
      case "RACIKAN":
        return "bg-amber-500";
      case "ALKES":
        return "bg-blue-500";
      case "SUPLEMEN":
        return "bg-rose-500";
    }
  };

  return (
    <div className="bg-white dark:bg-[#1C1C1E] p-6 rounded-[22px] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-5">
      <div className="flex items-center gap-2">
        <span className="p-1.5 rounded-[8px] bg-purple-50 dark:bg-purple-950/50 text-purple-600">
          <PieChart className="w-4 h-4" />
        </span>
        <div>
          <h3 className="text-[17px] font-bold text-[#1C1C1E] dark:text-white">
            Kontribusi Kategori Obat & Produk Farmasi
          </h3>
          <p className="text-[12px] text-[#8E8E93]">
            Analisis proporsi omzet terhadap total penjualan dan efisiensi margin keuntungan per lini kategori
          </p>
        </div>
      </div>

      {/* Multi-segment stacked progress bar */}
      <div className="w-full h-3 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden flex">
        {categories.map((c) => (
          <div
            key={c.categoryId}
            className={`h-full ${getCategoryColor(c.categoryId)} transition-all duration-500`}
            style={{ width: `${Math.max(2, c.revenueSharePercent)}%` }}
            title={`${c.label}: ${c.revenueSharePercent}%`}
          />
        ))}
      </div>

      {/* Category List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
        {categories.map((c) => (
          <div
            key={c.categoryId}
            className="p-3.5 rounded-[16px] bg-neutral-50 dark:bg-[#2C2C2E]/40 border border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-[10px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-center shrink-0">
                {getCategoryIcon(c.categoryId)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-[13px] font-bold text-[#1C1C1E] dark:text-white truncate">
                    {c.label}
                  </h4>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-neutral-200 dark:bg-neutral-700 text-[#1C1C1E] dark:text-white font-mono">
                    {c.revenueSharePercent}%
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-[#8E8E93] mt-0.5">
                  <span>Margin: <strong className="text-emerald-600 dark:text-emerald-400">+{c.profitMarginPercent}%</strong></span>
                  <span>&bull;</span>
                  <span>Laba: {renderAmount(c.grossProfit)}</span>
                </div>
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="text-[14px]">
                {renderAmount(c.revenue, "text-[#008B94]")}
              </div>
              <span className="text-[10px] text-[#8E8E93]">
                {c.itemCountSold} unit terjual
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
