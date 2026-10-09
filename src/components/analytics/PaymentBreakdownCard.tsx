"use client";

import React from "react";
import { PaymentMethodBreakdown } from "@/lib/types";
import { formatRupiah } from "@/lib/utils";
import { CreditCard, QrCode, Banknote, Shield, CheckCircle2 } from "lucide-react";

interface PaymentBreakdownCardProps {
  payments: PaymentMethodBreakdown[];
  privacyMode?: boolean;
}

export const PaymentBreakdownCard: React.FC<PaymentBreakdownCardProps> = ({
  payments,
  privacyMode = false,
}) => {
  const totalAmountAll = payments.reduce((sum, p) => sum + p.totalAmount, 0);
  const totalMDRAll = payments.reduce((sum, p) => sum + p.mdrFeeEstimated, 0);
  const netSettlementAll = totalAmountAll - totalMDRAll;

  const renderAmount = (amount: number, color = "text-[#1C1C1E] dark:text-white") => {
    if (privacyMode) return <span className="font-mono text-[#8E8E93]">••••••••</span>;
    return <span className={`tabular-nums font-bold ${color}`}>{formatRupiah(amount)}</span>;
  };

  const getMethodIcon = (method: PaymentMethodBreakdown["method"]) => {
    switch (method) {
      case "CASH":
        return <Banknote className="w-4 h-4 text-emerald-600" />;
      case "QRIS_DYNAMIC":
        return <QrCode className="w-4 h-4 text-teal-600" />;
      case "EDC_DEBIT":
      case "EDC_CREDIT":
        return <CreditCard className="w-4 h-4 text-blue-600" />;
      default:
        return <Shield className="w-4 h-4 text-purple-600" />;
    }
  };

  return (
    <div className="bg-white dark:bg-[#1C1C1E] p-6 rounded-[22px] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-[8px] bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600">
            <CreditCard className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-[17px] font-bold text-[#1C1C1E] dark:text-white">
              Rekapitulasi Kanal Pembayaran (Tender Settlement)
            </h3>
            <p className="text-[12px] text-[#8E8E93]">
              Komposisi kas masuk, estimasi biaya transaksi merchant (MDR), dan rekonsiliasi bank
            </p>
          </div>
        </div>

        <div className="text-left sm:text-right">
          <span className="text-[11px] text-[#8E8E93] uppercase font-semibold">Total Bersih Masuk Rekening / Kasir</span>
          <div className="text-[18px]">
            {renderAmount(netSettlementAll, "text-emerald-600 dark:text-emerald-400")}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {payments.map((p) => (
          <div
            key={p.method}
            className="p-3.5 rounded-[16px] bg-neutral-50 dark:bg-[#2C2C2E]/40 border border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-[10px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-center shrink-0">
                {getMethodIcon(p.method)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-[13px] font-bold text-[#1C1C1E] dark:text-white truncate">
                    {p.label}
                  </h4>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-neutral-200 dark:bg-neutral-700 text-[#1C1C1E] dark:text-white font-mono">
                    {p.sharePercent}%
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-[#8E8E93] mt-0.5">
                  <span>{p.transactionCount} transaksi</span>
                  {p.mdrFeeEstimated > 0 && (
                    <>
                      <span>&bull;</span>
                      <span className="text-amber-600 dark:text-amber-400">
                        Potongan MDR: -{renderAmount(p.mdrFeeEstimated)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="text-[14px]">
                {renderAmount(p.totalAmount, "text-[#1C1C1E] dark:text-white")}
              </div>
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                Net: {renderAmount(p.netSettlementAmount)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
