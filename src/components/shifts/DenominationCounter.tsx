"use client";

import React, { useState, useEffect } from "react";
import { RupiahDenominationCount } from "@/lib/types";
import { formatRupiah } from "@/lib/utils";
import { Banknote, Coins, RotateCcw, Calculator, Sparkles } from "lucide-react";

interface DenominationCounterProps {
  initialCounts?: Partial<RupiahDenominationCount>;
  onChange: (result: RupiahDenominationCount) => void;
  readOnly?: boolean;
}

const BANKNOTE_SPECS = [
  { value: 100000, label: "Rp 100.000", color: "text-rose-600 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50", hero: "Soekarno-Hatta" },
  { value: 50000, label: "Rp 50.000", color: "text-blue-600 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/50", hero: "Ir. H. Djuanda" },
  { value: 20000, label: "Rp 20.000", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50", hero: "GSSJ Ratulangi" },
  { value: 10000, label: "Rp 10.000", color: "text-purple-600 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-900/50", hero: "Frans Kaisiepo" },
  { value: 5000, label: "Rp 5.000", color: "text-amber-700 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/50", hero: "Dr. K.H. Idham Chalid" },
  { value: 2000, label: "Rp 2.000", color: "text-slate-600 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700", hero: "MH Thamrin" },
  { value: 1000, label: "Rp 1.000", color: "text-lime-700 bg-lime-50 dark:bg-lime-950/40 border-lime-200 dark:border-lime-900/50", hero: "Tjut Meutia" },
] as const;

const COIN_SPECS = [
  { value: 1000, label: "Rp 1.000", color: "text-amber-800 bg-amber-50 dark:bg-amber-950/40 border-amber-200", hero: "Koin Bimetal / Aluminium" },
  { value: 500, label: "Rp 500", color: "text-neutral-700 bg-neutral-100 dark:bg-neutral-800 border-neutral-200", hero: "Koin Aluminium Melati" },
  { value: 200, label: "Rp 200", color: "text-neutral-700 bg-neutral-100 dark:bg-neutral-800 border-neutral-200", hero: "Koin Jalak Bali" },
  { value: 100, label: "Rp 100", color: "text-neutral-700 bg-neutral-100 dark:bg-neutral-800 border-neutral-200", hero: "Koin Kakaktua Raja" },
] as const;

export const DenominationCounter: React.FC<DenominationCounterProps> = ({
  initialCounts,
  onChange,
  readOnly = false,
}) => {
  const [bills, setBills] = useState<Record<number, number>>({
    100000: initialCounts?.bills?.[100000] || 0,
    50000: initialCounts?.bills?.[50000] || 0,
    20000: initialCounts?.bills?.[20000] || 0,
    10000: initialCounts?.bills?.[10000] || 0,
    5000: initialCounts?.bills?.[5000] || 0,
    2000: initialCounts?.bills?.[2000] || 0,
    1000: initialCounts?.bills?.[1000] || 0,
  });

  const [coins, setCoins] = useState<Record<number, number>>({
    1000: initialCounts?.coins?.[1000] || 0,
    500: initialCounts?.coins?.[500] || 0,
    200: initialCounts?.coins?.[200] || 0,
    100: initialCounts?.coins?.[100] || 0,
  });

  // Calculate totals
  const totalBills = Object.entries(bills).reduce(
    (acc, [val, count]) => acc + Number(val) * count,
    0
  );

  const totalCoins = Object.entries(coins).reduce(
    (acc, [val, count]) => acc + Number(val) * count,
    0
  );

  const grandTotal = totalBills + totalCoins;

  useEffect(() => {
    onChange({
      bills: {
        100000: bills[100000] || 0,
        50000: bills[50000] || 0,
        20000: bills[20000] || 0,
        10000: bills[10000] || 0,
        5000: bills[5000] || 0,
        2000: bills[2000] || 0,
        1000: bills[1000] || 0,
      },
      coins: {
        1000: coins[1000] || 0,
        500: coins[500] || 0,
        200: coins[200] || 0,
        100: coins[100] || 0,
      },
      totalBills,
      totalCoins,
      grandTotal,
    });
  }, [bills, coins, totalBills, totalCoins, grandTotal, onChange]);

  const handleBillChange = (nominal: number, qty: number) => {
    if (readOnly) return;
    setBills((prev) => ({
      ...prev,
      [nominal]: Math.max(0, qty || 0),
    }));
  };

  const handleCoinChange = (nominal: number, qty: number) => {
    if (readOnly) return;
    setCoins((prev) => ({
      ...prev,
      [nominal]: Math.max(0, qty || 0),
    }));
  };

  const adjustBill = (nominal: number, delta: number) => {
    if (readOnly) return;
    setBills((prev) => ({
      ...prev,
      [nominal]: Math.max(0, (prev[nominal] || 0) + delta),
    }));
  };

  const adjustCoin = (nominal: number, delta: number) => {
    if (readOnly) return;
    setCoins((prev) => ({
      ...prev,
      [nominal]: Math.max(0, (prev[nominal] || 0) + delta),
    }));
  };

  const resetAll = () => {
    if (readOnly) return;
    setBills({ 100000: 0, 50000: 0, 20000: 0, 10000: 0, 5000: 0, 2000: 0, 1000: 0 });
    setCoins({ 1000: 0, 500: 0, 200: 0, 100: 0 });
  };

  return (
    <div className="space-y-6">
      {/* Top Total Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-[16px] bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-black/[0.04] dark:border-white/[0.04]">
          <div className="flex items-center gap-2 text-[11px] font-semibold text-[#8E8E93] uppercase tracking-wider mb-1">
            <Banknote className="w-3.5 h-3.5 text-blue-600" />
            <span>Uang Kertas</span>
          </div>
          <div className="text-[17px] font-bold text-[#1C1C1E] dark:text-white tabular-nums">
            {formatRupiah(totalBills)}
          </div>
        </div>

        <div className="p-3.5 rounded-[16px] bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-black/[0.04] dark:border-white/[0.04]">
          <div className="flex items-center gap-2 text-[11px] font-semibold text-[#8E8E93] uppercase tracking-wider mb-1">
            <Coins className="w-3.5 h-3.5 text-amber-600" />
            <span>Uang Logam (Koin)</span>
          </div>
          <div className="text-[17px] font-bold text-[#1C1C1E] dark:text-white tabular-nums">
            {formatRupiah(totalCoins)}
          </div>
        </div>

        <div className="p-3.5 rounded-[16px] bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300/60 dark:border-emerald-800/40">
          <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider mb-1">
            <div className="flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5" />
              <span>Total Fisik Laci</span>
            </div>
            {!readOnly && (
              <button
                type="button"
                onClick={resetAll}
                className="text-[10px] text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 normal-case font-medium"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            )}
          </div>
          <div className="text-[19px] font-black text-emerald-700 dark:text-emerald-300 tabular-nums">
            {formatRupiah(grandTotal)}
          </div>
        </div>
      </div>

      {/* Grid: Banknotes (Uang Kertas Rupiah) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-[6px] bg-blue-100 dark:bg-blue-950 text-blue-600">
              <Banknote className="w-4 h-4" />
            </span>
            <h4 className="text-[13px] font-bold text-[#1C1C1E] dark:text-white">
              Pecahan Uang Kertas (Banknotes)
            </h4>
          </div>
          <span className="text-[11px] text-[#8E8E93]">
            Isi jumlah lembar per denominasi
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {BANKNOTE_SPECS.map((spec) => {
            const qty = bills[spec.value] || 0;
            const subtotal = spec.value * qty;

            return (
              <div
                key={spec.value}
                className="p-3 rounded-[14px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex items-center justify-between gap-3 hover:border-black/[0.15] transition-all"
              >
                <div className="flex items-center gap-2.5 min-w-[130px]">
                  <span
                    className={`px-2 py-1 rounded-[8px] text-[11px] font-bold border ${spec.color} tabular-nums`}
                  >
                    {spec.label}
                  </span>
                  <div className="hidden sm:block">
                    <p className="text-[10px] text-[#8E8E93] truncate max-w-[80px]">
                      {spec.hero}
                    </p>
                  </div>
                </div>

                {/* Subtotal */}
                <div className="text-right flex-1 px-2">
                  <div className="text-[12px] font-bold text-[#1C1C1E] dark:text-white tabular-nums">
                    {formatRupiah(subtotal)}
                  </div>
                  <div className="text-[10px] text-[#8E8E93] tabular-nums">
                    {qty} lembar
                  </div>
                </div>

                {/* Steppers & Input */}
                {!readOnly ? (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => adjustBill(spec.value, -1)}
                      className="w-7 h-7 rounded-[8px] bg-[#F5F5F7] dark:bg-[#2C2C2E] hover:bg-neutral-200 dark:hover:bg-neutral-700 text-[#1C1C1E] dark:text-white font-bold text-[13px] flex items-center justify-center transition-colors"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={0}
                      value={qty === 0 ? "" : qty}
                      onChange={(e) =>
                        handleBillChange(spec.value, parseInt(e.target.value) || 0)
                      }
                      placeholder="0"
                      className="w-12 h-7 text-center rounded-[8px] border border-black/[0.1] dark:border-white/[0.1] bg-[#F5F5F7] dark:bg-[#2C2C2E] text-[12px] font-bold text-[#1C1C1E] dark:text-white focus:outline-none focus:border-[#007AFF] tabular-nums"
                    />
                    <button
                      type="button"
                      onClick={() => adjustBill(spec.value, 1)}
                      className="w-7 h-7 rounded-[8px] bg-[#F5F5F7] dark:bg-[#2C2C2E] hover:bg-neutral-200 dark:hover:bg-neutral-700 text-[#1C1C1E] dark:text-white font-bold text-[13px] flex items-center justify-center transition-colors"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={() => adjustBill(spec.value, 5)}
                      className="hidden sm:inline-flex px-1.5 h-7 rounded-[8px] bg-neutral-100 dark:bg-neutral-800 text-[10px] font-semibold text-[#636366] hover:bg-neutral-200 items-center justify-center"
                      title="Tambah 5 lembar"
                    >
                      +5
                    </button>
                  </div>
                ) : (
                  <div className="text-[12px] font-semibold text-[#1C1C1E] dark:text-white tabular-nums px-2">
                    {qty} lembar
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid: Coins (Uang Logam Rupiah) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-[6px] bg-amber-100 dark:bg-amber-950 text-amber-700">
              <Coins className="w-4 h-4" />
            </span>
            <h4 className="text-[13px] font-bold text-[#1C1C1E] dark:text-white">
              Pecahan Uang Logam (Koin Receh)
            </h4>
          </div>
          <span className="text-[11px] text-[#8E8E93]">
            Isi jumlah keping koin
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {COIN_SPECS.map((spec) => {
            const qty = coins[spec.value] || 0;
            const subtotal = spec.value * qty;

            return (
              <div
                key={spec.value}
                className="p-3 rounded-[14px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex items-center justify-between gap-3 hover:border-black/[0.15] transition-all"
              >
                <div className="flex items-center gap-2.5 min-w-[130px]">
                  <span
                    className={`px-2 py-1 rounded-[8px] text-[11px] font-bold border ${spec.color} tabular-nums`}
                  >
                    {spec.label}
                  </span>
                  <div className="hidden sm:block">
                    <p className="text-[10px] text-[#8E8E93] truncate max-w-[80px]">
                      {spec.hero}
                    </p>
                  </div>
                </div>

                {/* Subtotal */}
                <div className="text-right flex-1 px-2">
                  <div className="text-[12px] font-bold text-[#1C1C1E] dark:text-white tabular-nums">
                    {formatRupiah(subtotal)}
                  </div>
                  <div className="text-[10px] text-[#8E8E93] tabular-nums">
                    {qty} keping
                  </div>
                </div>

                {/* Steppers & Input */}
                {!readOnly ? (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => adjustCoin(spec.value, -1)}
                      className="w-7 h-7 rounded-[8px] bg-[#F5F5F7] dark:bg-[#2C2C2E] hover:bg-neutral-200 dark:hover:bg-neutral-700 text-[#1C1C1E] dark:text-white font-bold text-[13px] flex items-center justify-center transition-colors"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={0}
                      value={qty === 0 ? "" : qty}
                      onChange={(e) =>
                        handleCoinChange(spec.value, parseInt(e.target.value) || 0)
                      }
                      placeholder="0"
                      className="w-12 h-7 text-center rounded-[8px] border border-black/[0.1] dark:border-white/[0.1] bg-[#F5F5F7] dark:bg-[#2C2C2E] text-[12px] font-bold text-[#1C1C1E] dark:text-white focus:outline-none focus:border-[#007AFF] tabular-nums"
                    />
                    <button
                      type="button"
                      onClick={() => adjustCoin(spec.value, 1)}
                      className="w-7 h-7 rounded-[8px] bg-[#F5F5F7] dark:bg-[#2C2C2E] hover:bg-neutral-200 dark:hover:bg-neutral-700 text-[#1C1C1E] dark:text-white font-bold text-[13px] flex items-center justify-center transition-colors"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={() => adjustCoin(spec.value, 10)}
                      className="hidden sm:inline-flex px-1.5 h-7 rounded-[8px] bg-neutral-100 dark:bg-neutral-800 text-[10px] font-semibold text-[#636366] hover:bg-neutral-200 items-center justify-center"
                      title="Tambah 10 keping"
                    >
                      +10
                    </button>
                  </div>
                ) : (
                  <div className="text-[12px] font-semibold text-[#1C1C1E] dark:text-white tabular-nums px-2">
                    {qty} keping
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
