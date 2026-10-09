"use client";

import React, { useMemo } from "react";
import { useApotekStore } from "@/lib/store";
import { formatRupiah } from "@/lib/utils";
import Link from "next/link";
import {
  TrendingUp,
  DollarSign,
  Package,
  AlertOctagon,
  Eye,
  EyeOff,
  ArrowUpRight,
  ShieldCheck,
  Calendar,
  Layers,
  ArrowRight,
  PieChart,
  Users,
} from "lucide-react";
import { AppleStatusPill } from "@/components/ui/AppleStatusPill";
import { Navbar } from "@/components/Navbar";
import { AccessDenied } from "@/components/AccessDenied";
import { useRouter } from "next/navigation";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";

export default function OwnerDashboardPage() {
  const { products, transactions, currentUser, privacyMode, togglePrivacyMode } = useApotekStore();

  const router = useRouter();
  const swipeHandlers = useSwipeGesture({
    onEdgeSwipeRight: () => {
      if (typeof window !== "undefined" && window.history.length > 1) {
        router.back();
      } else {
        router.push("/");
      }
    },
  });

  // Financial calculations
  const totalRevenue = useMemo(() => {
    return transactions.reduce((acc, tx) => acc + tx.grandTotal, 0);
  }, [transactions]);

  const totalCOGS = useMemo(() => {
    return transactions.reduce((acc, tx) => {
      const txCost = tx.items.reduce((itemAcc, item) => {
        const prod = products.find((p) => p.id === item.product.id);
        const unitCost = prod ? prod.hpp * item.unitMultiplier : item.unitPrice * 0.7;
        return itemAcc + unitCost * item.quantity;
      }, 0);
      return acc + txCost;
    }, 0);
  }, [transactions, products]);

  const grossProfit = totalRevenue - totalCOGS;
  const grossMarginPercent = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : "0.0";

  // Inventory asset valuation
  const inventoryAssetHPP = useMemo(() => {
    return products.reduce((acc, p) => {
      const totalUnits = p.batches.reduce((bAcc, b) => bAcc + b.currentStock, 0);
      return acc + totalUnits * p.hpp;
    }, 0);
  }, [products]);

  const inventoryAssetHJA = useMemo(() => {
    return products.reduce((acc, p) => {
      const totalUnits = p.batches.reduce((bAcc, b) => bAcc + b.currentStock, 0);
      return acc + totalUnits * p.sellingPrice;
    }, 0);
  }, [products]);

  // Near Expired Asset Risk (<90 days)
  const nearExpiredRiskHPP = useMemo(() => {
    const now = new Date();
    let riskTotal = 0;
    products.forEach((p) => {
      p.batches.forEach((b) => {
        const exp = new Date(b.expiryDate);
        const diffDays = (exp.getTime() - now.getTime()) / (1000 * 3600 * 24);
        if (diffDays > 0 && diffDays <= 90) {
          riskTotal += b.currentStock * p.hpp;
        }
      });
    });
    return riskTotal;
  }, [products]);

  const renderAmount = (amount: number, colorClass = "text-[#1C1C1E] dark:text-white") => {
    if (privacyMode) {
      return <span className="font-mono text-[#8E8E93] select-none tracking-wider">••••••••</span>;
    }
    return <span className={`tabular-nums font-bold ${colorClass}`}>{formatRupiah(amount)}</span>;
  };

  if (currentUser.role !== "OWNER" && currentUser.role !== "SUPER_ADMIN") {
    return (
      <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#000000]">
        <Navbar />
        <AccessDenied
          requiredRole="Owner (PSA) / Super Admin"
          reason="Executive Suite memuat ikhtisar Laba Kotor, Valuasi Aset HPP, dan data finansial apotek yang eksklusif bagi Pemilik Sarana Apotek."
        />
      </div>
    );
  }

  return (
    <div
      {...swipeHandlers}
      className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#F5F5F7] dark:bg-[#000000] text-[#1C1C1E] dark:text-[#F5F5F7] pb-16 touch-pan-y"
    >
      <Navbar />
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 sm:pt-8 pb-4 sm:pb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-[8px] bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 shrink-0">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
              </span>
              <h1 className="text-[18px] sm:text-[26px] font-bold tracking-tight text-[#1C1C1E] dark:text-white truncate">
                <span className="sm:hidden">Owner Suite</span>
                <span className="hidden sm:inline">Executive Owner Suite</span>
              </h1>
              <span className="hidden sm:inline-flex text-[11px] uppercase font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 shrink-0">
                Laba & Valuasi
              </span>
            </div>
            <p className="hidden sm:block text-[13px] text-[#8E8E93] mt-1">
              Ikhtisar margin keuntungan bersih (tanpa PPN/diskon), valuasi persediaan HPP, dan manajemen risiko kedaluwarsa
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
            {/* Privacy Mode Toggle */}
            <button
              type="button"
              onClick={togglePrivacyMode}
              title={privacyMode ? "Tampilkan Nominal" : "Sembunyikan Nominal (Mode Privasi)"}
              className={`min-h-[40px] px-3.5 py-2 text-[12px] font-semibold rounded-[12px] border transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                privacyMode
                  ? "bg-amber-500 text-white border-amber-600 shadow-sm"
                  : "bg-white dark:bg-[#1C1C1E] border-black/[0.08] dark:border-white/[0.12] text-[#1C1C1E] dark:text-white hover:bg-neutral-50 shadow-sm"
              }`}
            >
              {privacyMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span>{privacyMode ? "Privasi Aktif" : "Privasi"}</span>
            </button>

            {/* Primary Action: Analytics & PnL */}
            <Link
              href="/analytics"
              title="Dashboard Analitik & Laporan Laba Rugi Formal"
              className="min-h-[40px] px-3.5 py-2 text-[12px] font-semibold rounded-[12px] bg-[#008B94] hover:bg-[#00767E] text-white transition-all shadow-sm flex items-center gap-1.5 shrink-0 whitespace-nowrap"
            >
              <TrendingUp className="w-4 h-4" />
              <span>Analitik & P&L</span>
            </Link>

            {/* Secondary Action: Staf */}
            <Link
              href="/users"
              title="Kelola Karyawan & Hak Akses Staf"
              className="min-h-[40px] px-3 sm:px-3.5 py-2 text-[12px] font-semibold rounded-[12px] bg-white dark:bg-[#1C1C1E] border border-black/[0.08] dark:border-white/[0.12] text-[#1C1C1E] dark:text-white hover:bg-neutral-50 transition-all shadow-sm flex items-center gap-1.5 shrink-0 whitespace-nowrap"
            >
              <Users className="w-4 h-4 text-[#008B94]" />
              <span className="hidden sm:inline">Kelola Staf</span>
              <span className="sm:hidden">Staf</span>
            </Link>

            {/* Secondary Action: HPP & Margin */}
            <Link
              href="/products"
              title="Kelola Master HPP & Persentase Margin"
              className="min-h-[40px] px-3 sm:px-3.5 py-2 text-[12px] font-semibold rounded-[12px] bg-white dark:bg-[#1C1C1E] border border-black/[0.08] dark:border-white/[0.12] text-[#1C1C1E] dark:text-white hover:bg-neutral-50 transition-all shadow-sm flex items-center gap-1.5 shrink-0 whitespace-nowrap"
            >
              <Layers className="w-4 h-4" />
              <span className="hidden sm:inline">HPP & Margin</span>
              <span className="sm:hidden">Margin</span>
            </Link>
          </div>
        </div>

        {/* Banner Link to Full Analytics & Formal PnL */}
        <div className="mt-6 p-5 rounded-[20px] bg-gradient-to-r from-teal-900 to-[#00575D] text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md shadow-teal-900/15">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-[14px] bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0">
              <TrendingUp className="w-6 h-6 text-teal-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-[16px] tracking-tight">
                  Dashboard Analitik Pendapatan & Laporan Keuangan Formal
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-400/20 text-teal-200 border border-teal-400/30 uppercase">
                  SAK EMKM
                </span>
              </div>
              <p className="text-[12px] text-teal-100/80 mt-0.5">
                Pantau grafik omzet per shift, tren harian 30-hari, performa mingguan, sebaran jam sibuk, serta unduh/cetak Laporan Laba Rugi formal bulanan dengan TTD berjenjang.
              </p>
            </div>
          </div>

          <Link
            href="/analytics"
            className="flex items-center gap-2 px-4 py-2.5 rounded-[12px] bg-white text-[#00575D] hover:bg-teal-50 font-bold text-[12px] shrink-0 transition-all shadow-sm self-start md:self-auto"
          >
            <span>Buka Analitik & Rekap P&L</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Primary Financial Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
          {/* Gross Profit Card */}
          <div className="bg-white dark:bg-[#1C1C1E] p-5 rounded-[18px] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-semibold text-[#8E8E93] uppercase tracking-wider">
                  Laba Kotor Real-Time
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  +{grossMarginPercent}% Margin
                </span>
              </div>
              <div className="text-[26px] mt-2">
                {renderAmount(grossProfit, "text-emerald-600 dark:text-emerald-400")}
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between text-[12px] text-[#8E8E93]">
              <span>Omset: {renderAmount(totalRevenue, "text-[#1C1C1E] dark:text-white")}</span>
              <span>Total HPP: {renderAmount(totalCOGS, "text-[#1C1C1E] dark:text-white")}</span>
            </div>
          </div>

          {/* Total Asset Valuation at HPP */}
          <div className="bg-white dark:bg-[#1C1C1E] p-5 rounded-[18px] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-semibold text-[#8E8E93] uppercase tracking-wider">
                  Valuasi Aset Obat (HPP)
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                  {products.length} SKU
                </span>
              </div>
              <div className="text-[26px] mt-2">
                {renderAmount(inventoryAssetHPP, "text-[#1C1C1E] dark:text-white")}
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between text-[12px] text-[#8E8E93]">
              <span>Nilai Pasar (HJA):</span>
              <span className="font-semibold text-emerald-600">{renderAmount(inventoryAssetHJA)}</span>
            </div>
          </div>

          {/* Near Expired Risk Warning */}
          <div className="bg-white dark:bg-[#1C1C1E] p-5 rounded-[18px] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-semibold text-[#8E8E93] uppercase tracking-wider">
                  Risiko Kedaluwarsa (&lt;90 Hari)
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                  Retur PBF Segera
                </span>
              </div>
              <div className="text-[26px] mt-2">
                {renderAmount(nearExpiredRiskHPP, "text-rose-600 dark:text-rose-400")}
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between text-[12px] text-[#8E8E93]">
              <span>Rekomendasi Tindakan:</span>
              <Link href="/procurement" className="text-[#007AFF] font-medium flex items-center gap-1 hover:underline">
                Buat Retur PBF &rarr;
              </Link>
            </div>
          </div>
        </div>

        {/* Detailed Product Margin Intelligence */}
        <div className="mt-8 w-full max-w-full min-w-0 bg-white dark:bg-[#1C1C1E] rounded-[18px] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="px-6 py-4 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between">
            <div>
              <h2 className="text-[16px] font-bold text-[#1C1C1E] dark:text-white tracking-tight">
                Transparansi Margin & HPP Produk
              </h2>
              <p className="text-[12px] text-[#8E8E93]">
                Analisis perbandingan biaya beli murni distributor (HNA) terhadap harga jual dan kontribusi margin
              </p>
            </div>
            <Link
              href="/products"
              className="text-[12px] text-[#007AFF] font-medium hover:underline flex items-center gap-1"
            >
              Lihat Seluruh Katalog &rarr;
            </Link>
          </div>

          <div className="w-full max-w-full min-w-0 overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-[13px]">
              <thead className="bg-[#F5F5F7]/80 dark:bg-[#2C2C2E]/80 text-[#8E8E93] uppercase text-[11px] tracking-wider font-semibold border-b border-black/[0.06]">
                <tr>
                  <th className="py-3 px-4">Nama Produk Obat</th>
                  <th className="py-3 px-4">Golongan</th>
                  <th className="py-3 px-4 text-right">HPP Satuan Dasar</th>
                  <th className="py-3 px-4 text-right">Harga Jual (HJA)</th>
                  <th className="py-3 px-4 text-right">Laba Satuan</th>
                  <th className="py-3 px-4 text-right">Markup %</th>
                  <th className="py-3 px-4 text-center">Stok Total</th>
                  <th className="py-3 px-4 text-right">Total Nilai HPP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
                {products.slice(0, 8).map((p) => {
                  const totalUnits = p.batches.reduce((sum, b) => sum + b.currentStock, 0);
                  const totalHppValue = totalUnits * p.hpp;
                  const unitProfit = p.sellingPrice - p.hpp;

                  return (
                    <tr key={p.id} className="hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40">
                      <td className="py-3 px-4 font-semibold text-[#1C1C1E] dark:text-white">
                        {p.name}
                        <span className="block text-[11px] font-normal text-[#8E8E93]">
                          {p.genericName} &bull; {p.manufacturer}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-[#636366] dark:text-[#AEAEB2]">
                          {p.drugClass}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-medium">
                        {renderAmount(p.hpp)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600">
                        {renderAmount(p.sellingPrice)}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-[#007AFF]">
                        +{renderAmount(unitProfit)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold tabular-nums text-purple-600">
                        {p.markupPercent}%
                      </td>
                      <td className="py-3 px-4 text-center tabular-nums">
                        {totalUnits} {p.baseUnit}
                      </td>
                      <td className="py-3 px-4 text-right font-bold">
                        {renderAmount(totalHppValue)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
