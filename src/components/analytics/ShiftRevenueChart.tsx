"use client";

import React, { useState } from "react";
import { ShiftRevenueMetric } from "@/lib/types";
import { formatRupiah } from "@/lib/utils";
import { Clock, User, ShoppingBag, Coins, TrendingUp, CheckCircle2, AlertTriangle } from "lucide-react";

interface ShiftRevenueChartProps {
  shifts: ShiftRevenueMetric[];
  privacyMode?: boolean;
}

export const ShiftRevenueChart: React.FC<ShiftRevenueChartProps> = ({
  shifts,
  privacyMode = false,
}) => {
  const [selectedShiftId, setSelectedShiftId] = useState<string>(shifts[0]?.shiftId || "");

  const activeShift = shifts.find((s) => s.shiftId === selectedShiftId) || shifts[0];
  const maxNetSales = Math.max(...shifts.map((s) => s.netSales), 1);

  const renderAmount = (amount: number, color = "text-[#1C1C1E] dark:text-white") => {
    if (privacyMode) return <span className="font-mono text-[#8E8E93]">••••••••</span>;
    return <span className={`tabular-nums font-bold ${color}`}>{formatRupiah(amount)}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Top Shift Comparison Bar Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {shifts.slice(0, 3).map((shift) => {
          const isSelected = shift.shiftId === activeShift?.shiftId;
          const barHeightPercent = Math.max(15, Math.round((shift.netSales / maxNetSales) * 100));

          return (
            <div
              key={shift.shiftId}
              onClick={() => setSelectedShiftId(shift.shiftId)}
              className={`p-5 rounded-[20px] border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? "bg-white dark:bg-[#1C1C1E] border-[#008B94] shadow-[0_8px_24px_rgba(0,139,148,0.12)] ring-2 ring-[#008B94]/20"
                  : "bg-white/70 dark:bg-[#1C1C1E]/60 border-black/[0.06] dark:border-white/[0.08] hover:border-black/[0.12] hover:bg-white"
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold ${
                        shift.shiftNumber === 1
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                          : shift.shiftNumber === 2
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                          : "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                      }`}
                    >
                      {shift.shiftNumber}
                    </span>
                    <div>
                      <h4 className="font-bold text-[14px] text-[#1C1C1E] dark:text-white leading-tight">
                        {shift.shiftLabel.split(" ")[0]} {shift.shiftLabel.split(" ")[1]}
                      </h4>
                      <p className="text-[11px] text-[#8E8E93]">
                        {shift.shiftNumber === 1 ? "07:00 - 14:00" : shift.shiftNumber === 2 ? "14:00 - 21:30" : "Malam / Siaga"}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 ${
                      shift.status === "OPEN"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 animate-pulse"
                        : "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                    }`}
                  >
                    {shift.status === "OPEN" ? "Shift Berjalan" : "Shift Selesai"}
                  </span>
                </div>

                <div className="mt-4">
                  <div className="text-[11px] text-[#8E8E93] font-medium uppercase tracking-wider">
                    Total Omzet Shift
                  </div>
                  <div className="text-[22px] mt-0.5">
                    {renderAmount(shift.netSales, "text-[#008B94]")}
                  </div>
                </div>

                {/* Comparative Visual Bar */}
                <div className="mt-3 w-full bg-neutral-100 dark:bg-neutral-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      shift.shiftNumber === 1
                        ? "bg-blue-500"
                        : shift.shiftNumber === 2
                        ? "bg-[#008B94]"
                        : "bg-purple-500"
                    }`}
                    style={{ width: `${barHeightPercent}%` }}
                  />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between text-[11px] text-[#8E8E93]">
                <span className="flex items-center gap-1 truncate max-w-[140px]">
                  <User className="w-3.5 h-3.5 shrink-0" />
                  {shift.cashierName}
                </span>
                <span className="font-semibold text-[#1C1C1E] dark:text-white whitespace-nowrap">
                  {shift.totalTransactions} Struk
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Shift Deep Analysis Card */}
      {activeShift && (
        <div className="bg-white dark:bg-[#1C1C1E] p-6 rounded-[18px] border border-black/[0.06] dark:border-white/[0.08] shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-black/[0.06] dark:border-white/[0.08]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[12px] bg-teal-50 dark:bg-teal-950/50 flex items-center justify-center text-[#008B94] shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-[17px] font-bold text-[#1C1C1E] dark:text-white">
                  Rincian Performa: {activeShift.shiftLabel}
                </h3>
                <p className="text-[12px] text-[#8E8E93]">
                  Kasir Bertugas: <strong className="text-[#1C1C1E] dark:text-white">{activeShift.cashierName}</strong> &bull; Terminal: {activeShift.terminalId}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] text-[#8E8E93] font-mono bg-neutral-100 dark:bg-neutral-800 px-3 py-1.5 rounded-[8px] whitespace-nowrap">
                {new Date(activeShift.startTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} – {activeShift.endTime ? new Date(activeShift.endTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "Sekarang"}
              </span>
            </div>
          </div>

          {/* Metric Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
            <div className="p-4 rounded-[14px] bg-neutral-50 dark:bg-[#2C2C2E]/50 border border-black/[0.04] dark:border-white/[0.06]">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#8E8E93] uppercase whitespace-nowrap">
                <ShoppingBag className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span>Rata-Rata Nilai Struk</span>
              </div>
              <div className="text-[18px] mt-1.5 font-bold text-[#1C1C1E] dark:text-white whitespace-nowrap">
                {renderAmount(activeShift.averageOrderValue)}
              </div>
              <p className="text-[10px] text-[#8E8E93] mt-0.5">Nilai rata-rata per transaksi</p>
            </div>

            <div className="p-4 rounded-[14px] bg-neutral-50 dark:bg-[#2C2C2E]/50 border border-black/[0.04] dark:border-white/[0.06]">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#8E8E93] uppercase whitespace-nowrap">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Jumlah Item per Struk</span>
              </div>
              <div className="text-[18px] mt-1.5 font-bold text-[#1C1C1E] dark:text-white font-mono whitespace-nowrap">
                {activeShift.itemsPerTransaction} <span className="text-[12px] font-normal text-[#8E8E93]">item</span>
              </div>
              <p className="text-[10px] text-[#8E8E93] mt-0.5">Rata-rata obat per struk</p>
            </div>

            <div className="p-4 rounded-[16px] bg-neutral-50 dark:bg-[#2C2C2E]/50 border border-black/[0.04] dark:border-white/[0.06]">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#8E8E93] uppercase">
                <Coins className="w-3.5 h-3.5 text-purple-500" />
                <span>Penerimaan Tunai</span>
              </div>
              <div className="text-[18px] mt-1.5 font-bold text-[#1C1C1E] dark:text-white">
                {renderAmount(activeShift.cashCollected)}
              </div>
              <p className="text-[10px] text-[#8E8E93] mt-0.5">Uang kas fisik masuk laci</p>
            </div>

            <div className="p-4 rounded-[16px] bg-neutral-50 dark:bg-[#2C2C2E]/50 border border-black/[0.04] dark:border-white/[0.06]">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#8E8E93] uppercase">
                {activeShift.cashVariance === 0 ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                )}
                <span>Selisih Rekonsiliasi</span>
              </div>
              <div
                className={`text-[18px] mt-1.5 font-bold ${
                  activeShift.cashVariance === 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : activeShift.cashVariance > 0
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {activeShift.cashVariance === 0
                  ? "Rp 0 (Klop)"
                  : renderAmount(activeShift.cashVariance)}
              </div>
              <p className="text-[10px] text-[#8E8E93] mt-0.5">
                {activeShift.cashVariance === 0
                  ? "Kas fisik cocok sempurna"
                  : activeShift.cashVariance > 0
                  ? "Selisih lebih fisik"
                  : "Selisih kurang kasir"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
