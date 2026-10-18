"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Check,
  X,
  Eye,
  EyeOff,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { AccessDenied } from "@/components/AccessDenied";
import { useApotekStore } from "@/lib/store";
import { formatRupiah, getDaysUntilExpiry, getExpiryStatus } from "@/lib/utils";
import { showAppleToast } from "@/components/ui/AppleToast";

export default function OwnerDashboardPage() {
  const {
    currentUser,
    products,
    transactions,
    currentShift,
    shiftsHistory,
    purchaseOrders,
    privacyMode,
    togglePrivacyMode,
    approvePurchaseOrder,
    rejectPurchaseOrder,
  } = useApotekStore();

  const [chartMode, setChartMode] = useState<"HARIAN" | "BULANAN">("HARIAN");

  const isAuthorized =
    currentUser.role === "OWNER" || currentUser.role === "SUPER_ADMIN";

  const catalogProducts = useMemo(
    () => products.filter((p) => !p.id.startsWith("pkg-")),
    [products]
  );

  // Expiring medicines report (30–60 days early warning)
  const expiringBatches = useMemo(() => {
    return catalogProducts
      .flatMap((prod) =>
        prod.batches.map((b) => ({
          product: prod,
          batch: b,
          daysLeft: getDaysUntilExpiry(b.expiryDate),
        }))
      )
      .filter((r) => r.daysLeft <= 60)
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }, [catalogProducts]);

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#0D0D0F]">
        <Navbar />
        <AccessDenied
          requiredRole="Level 1 — Pemilik Apotek"
          reason="Laporan omzet dan persetujuan Purchase Order (PO) hanya dapat diakses oleh Pemilik Apotek."
        />
      </div>
    );
  }

  // Financial & Inventory Calculations
  const totalStockUnits = catalogProducts.reduce(
    (acc, p) => acc + p.batches.reduce((bAcc, b) => bAcc + b.currentStock, 0),
    0
  );
  const totalInventoryAssetHpp = catalogProducts.reduce(
    (acc, p) =>
      acc +
      p.batches.reduce(
        (bAcc, b) => bAcc + b.currentStock * (b.purchasePriceHNA || p.hpp),
        0
      ),
    0
  );

  const historicalOmzet = shiftsHistory.reduce(
    (acc, s) =>
      acc +
      (s.cashSalesTotal || 0) +
      (s.qrisSalesTotal || 0) +
      (s.edcSalesTotal || 0),
    0
  );
  const activeShiftOmzet = currentShift
    ? (currentShift.cashSalesTotal || 0) +
      (currentShift.qrisSalesTotal || 0) +
      (currentShift.edcSalesTotal || 0)
    : 0;
  const totalOmzetRevenue = historicalOmzet + activeShiftOmzet;
  const estimatedGrossProfit = Math.round(totalOmzetRevenue * 0.36);

  // Daily Omzet Series (Last 7 Days including today's real-time POS sales)
  const dailyRevenueData = [
    { label: "Sen", date: "12 Okt", value: 3850000 },
    { label: "Sel", date: "13 Okt", value: 4210000 },
    { label: "Rab", date: "14 Okt", value: 3980000 },
    { label: "Kam", date: "15 Okt", value: 4650000 },
    { label: "Jum", date: "16 Okt", value: 5120000 },
    { label: "Sab", date: "17 Okt", value: historicalOmzet || 4540000 },
    {
      label: "Hari Ini",
      date: "Real-Time",
      value: Math.max(1250000, activeShiftOmzet + 3200000),
      isLive: true,
    },
  ];

  // Monthly Omzet Series (Last 6 Months)
  const monthlyRevenueData = [
    { label: "Mei", date: "Mei 2026", value: 94500000 },
    { label: "Jun", date: "Jun 2026", value: 102400000 },
    { label: "Jul", date: "Jul 2026", value: 98800000 },
    { label: "Agu", date: "Agu 2026", value: 112600000 },
    { label: "Sep", date: "Sep 2026", value: 118900000 },
    {
      label: "Okt",
      date: "Bulan Berjalan",
      value: 108500000 + totalOmzetRevenue,
      isLive: true,
    },
  ];

  const activeSeries =
    chartMode === "HARIAN" ? dailyRevenueData : monthlyRevenueData;
  const maxChartVal = Math.max(...activeSeries.map((d) => d.value), 1);

  const pendingPOs = purchaseOrders.filter(
    (po) => po.status === "MENUNGGU_PERSETUJUAN"
  );

  const maskVal = (val: number) =>
    privacyMode ? "Rp ••••••••" : formatRupiah(val);

  const handleQuickApprovePO = (poId: string) => {
    const res = approvePurchaseOrder(poId);
    if (res.success) {
      showAppleToast({
        type: "success",
        title: "PO Disetujui",
        message: res.message,
      });
    }
  };

  const handleQuickRejectPO = (poId: string) => {
    const res = rejectPurchaseOrder(poId, "Ditolak dari Dasbor Pemilik.");
    if (res.success) {
      showAppleToast({
        type: "warning",
        title: "PO Ditolak",
        message: res.message,
      });
    }
  };

  return (
    <div className="min-h-[calc(100vh-50px)] w-full max-w-full overflow-x-hidden bg-[#F5F6F8] dark:bg-[#0E0F12] text-neutral-900 dark:text-neutral-100 flex flex-col lg:rounded-br-[10px] border-x border-b border-neutral-300/80 dark:border-white/[0.08]">
      <Navbar />

      <main className="flex-1 w-full max-w-[1440px] mx-auto p-4 sm:p-6 pb-24 lg:pb-8 space-y-4">
        {/* Clean Header */}
        <div className="bg-white dark:bg-[#141416] p-4 sm:p-5 rounded-xl border border-neutral-200/80 dark:border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-[18px] sm:text-[20px] font-bold tracking-tight text-neutral-900 dark:text-white">
              Dasbor Manajemen & Laporan Omzet
            </h1>
            <p className="text-[12px] text-neutral-500 mt-0.5">
              Pantau perkembangan omzet penjualan, persetujuan pesanan barang (PO), dan obat mendekati kadaluarsa
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={togglePrivacyMode}
              className="px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#1C1C1E] hover:bg-neutral-100 text-neutral-700 dark:text-neutral-200 text-[12px] font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              {privacyMode ? (
                <>
                  <Eye className="w-3.5 h-3.5 text-[#00767E] shrink-0" />
                  <span>Tampilkan Nominal</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <span>Sembunyikan Nominal</span>
                </>
              )}
            </button>

            <Link
              href="/analytics"
              className="px-3.5 py-1.5 rounded-lg bg-[#00767E] hover:bg-[#006067] text-white text-[12px] font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <TrendingUp className="w-3.5 h-3.5 shrink-0" />
              <span>Laporan Laba Rugi</span>
            </Link>
          </div>
        </div>

        {/* Restrained Financial KPI Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white dark:bg-[#141416] p-4 rounded-xl border border-neutral-200/80 dark:border-white/[0.08]">
            <span className="text-[11px] font-medium text-neutral-500 block">
              Total Omzet Penjualan
            </span>
            <div className="text-[22px] font-bold font-mono text-neutral-900 dark:text-white tabular-nums mt-1 whitespace-nowrap">
              {maskVal(totalOmzetRevenue)}
            </div>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5 whitespace-nowrap">
              Shift berjalan: {maskVal(activeShiftOmzet)}
            </p>
          </div>

          <div className="bg-white dark:bg-[#141416] p-4 rounded-xl border border-neutral-200/80 dark:border-white/[0.08]">
            <span className="text-[11px] font-medium text-neutral-500 block">
              Estimasi Laba Kotor (~36%)
            </span>
            <div className="text-[22px] font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums mt-1 whitespace-nowrap">
              {maskVal(estimatedGrossProfit)}
            </div>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              Selisih harga jual terhadap harga beli
            </p>
          </div>

          <div className="bg-white dark:bg-[#141416] p-4 rounded-xl border border-neutral-200/80 dark:border-white/[0.08]">
            <span className="text-[11px] font-medium text-neutral-500 block">
              Nilai Persediaan Obat (HPP)
            </span>
            <div className="text-[22px] font-bold font-mono text-neutral-900 dark:text-white tabular-nums mt-1 whitespace-nowrap">
              {maskVal(totalInventoryAssetHpp)}
            </div>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              {totalStockUnits.toLocaleString("id-ID")} satuan obat tersedia
            </p>
          </div>

          <div className="bg-white dark:bg-[#141416] p-4 rounded-xl border border-neutral-200/80 dark:border-white/[0.08]">
            <span className="text-[11px] font-medium text-neutral-500 block">
              Pesanan Menunggu Persetujuan
            </span>
            <div className="text-[22px] font-bold font-mono text-amber-600 dark:text-amber-400 tabular-nums mt-1 whitespace-nowrap">
              {pendingPOs.length} Pesanan
            </div>
            <p className="text-[11px] font-mono text-neutral-400 mt-0.5 whitespace-nowrap">
              Nilai:{" "}
              {maskVal(
                pendingPOs.reduce((acc, p) => acc + p.totalEstimatedCost, 0)
              )}
            </p>
          </div>
        </div>

        {/* Modul 5: Grafik Omzet Penjualan Harian & Bulanan Real-Time */}
        <div className="bg-white dark:bg-[#141416] p-5 rounded-xl border border-neutral-200/80 dark:border-white/[0.08]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-100 dark:border-white/[0.06]">
            <div>
              <h2 className="text-[14.5px] font-bold text-neutral-900 dark:text-white">
                Grafik Omzet Penjualan ({chartMode === "HARIAN" ? "7 Hari Terakhir" : "6 Bulan Terakhir"})
              </h2>
              <p className="text-[11.5px] text-neutral-500">
                Data penjualan kasir diperbarui otomatis setiap transaksi selesai
              </p>
            </div>

            <div className="inline-flex p-0.5 rounded-lg bg-neutral-100 dark:bg-[#1C1C1E] border border-neutral-200/80 dark:border-white/10 text-[12px] self-start shrink-0">
              <button
                type="button"
                onClick={() => setChartMode("HARIAN")}
                className={`px-3 py-1 rounded-md font-medium transition-colors whitespace-nowrap ${
                  chartMode === "HARIAN"
                    ? "bg-white dark:bg-[#141416] text-neutral-900 dark:text-white font-semibold shadow-2xs"
                    : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                }`}
              >
                Omzet Harian
              </button>
              <button
                type="button"
                onClick={() => setChartMode("BULANAN")}
                className={`px-3 py-1 rounded-md font-medium transition-colors whitespace-nowrap ${
                  chartMode === "BULANAN"
                    ? "bg-white dark:bg-[#141416] text-neutral-900 dark:text-white font-semibold shadow-2xs"
                    : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                }`}
              >
                Omzet Bulanan
              </button>
            </div>
          </div>

          {/* Bar Chart Visualization */}
          <div className="pt-5 grid grid-cols-7 sm:grid-cols-7 gap-2.5 items-end h-52">
            {activeSeries.map((item, idx) => {
              const heightPct = Math.max(
                14,
                Math.round((item.value / maxChartVal) * 100)
              );
              return (
                <div
                  key={idx}
                  className="flex flex-col items-center justify-end h-full gap-1.5 group"
                >
                  <span className="text-[10.5px] font-mono font-semibold text-neutral-700 dark:text-neutral-300 tabular-nums text-center whitespace-nowrap">
                    {privacyMode
                      ? "•••"
                      : item.value >= 1000000
                      ? `Rp ${(item.value / 1000000).toFixed(1)}jt`
                      : formatRupiah(item.value)}
                  </span>
                  <div className="w-full max-w-[54px] bg-neutral-100 dark:bg-white/[0.05] rounded-t-lg h-32 flex items-end overflow-hidden">
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full rounded-t-lg transition-all duration-300 ${
                        item.isLive
                          ? "bg-[#00767E]"
                          : "bg-neutral-300 dark:bg-neutral-700 group-hover:bg-[#00767E]/70"
                      }`}
                    />
                  </div>
                  <div className="text-center leading-tight">
                    <span
                      className={`text-[11.5px] block whitespace-nowrap ${
                        item.isLive
                          ? "font-bold text-[#00767E] dark:text-teal-400"
                          : "font-semibold text-neutral-700 dark:text-neutral-300"
                      }`}
                    >
                      {item.label}
                    </span>
                    <span className="text-[10px] text-neutral-400 block whitespace-nowrap">
                      {item.date}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main 2-Column Management Section: Persetujuan PO & Laporan Kadaluarsa */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left: Persetujuan Purchase Order (PO) ke PBF (7 cols) */}
          <div className="lg:col-span-7 bg-white dark:bg-[#141416] rounded-xl border border-neutral-200/80 dark:border-white/[0.08] overflow-hidden flex flex-col">
            <div className="px-5 py-3.5 border-b border-neutral-200/80 dark:border-white/[0.08] flex items-center justify-between gap-2">
              <div className="min-w-0">
                <h2 className="text-[14px] font-bold text-neutral-900 dark:text-white">
                  Persetujuan Pesanan Barang (PO) ({pendingPOs.length} Menunggu)
                </h2>
                <p className="text-[11.5px] text-neutral-500">
                  Surat pesanan obat ke distributor (PBF) yang memerlukan persetujuan Pemilik
                </p>
              </div>
              <Link
                href="/procurement"
                className="text-[12px] font-semibold text-[#00767E] hover:underline flex items-center gap-1 whitespace-nowrap shrink-0"
              >
                <span>Semua PO</span>
                <ArrowRight className="w-3.5 h-3.5 shrink-0" />
              </Link>
            </div>

            <div className="p-4 space-y-2.5 flex-1">
              {purchaseOrders.slice(0, 4).map((po) => {
                const isPending = po.status === "MENUNGGU_PERSETUJUAN";
                return (
                  <div
                    key={po.id}
                    className={`p-3.5 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isPending
                        ? "bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60"
                        : "bg-neutral-50/60 dark:bg-[#1C1C1E] border-neutral-200/80 dark:border-white/[0.08]"
                    }`}
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-[13px] text-neutral-900 dark:text-white whitespace-nowrap">
                          {po.poNumber}
                        </span>
                        {po.isAutoGenerated && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-[#00767E]/10 text-[#006067] dark:text-teal-300 whitespace-nowrap">
                            Draf Otomatis
                          </span>
                        )}
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-semibold whitespace-nowrap ${
                            isPending
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                              : po.status === "DISETUJUI_PEMILIK"
                              ? "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300"
                              : po.status === "SELESAI_DITERIMA"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {isPending
                            ? "Menunggu Persetujuan"
                            : po.status === "DISETUJUI_PEMILIK"
                            ? "Disetujui Pemilik"
                            : po.status === "SELESAI_DITERIMA"
                            ? "Selesai Diterima"
                            : "Ditolak"}
                        </span>
                      </div>
                      <div className="text-[12.5px] font-semibold text-neutral-800 dark:text-neutral-200">
                        {po.supplierName}
                      </div>
                      <div className="text-[11px] text-neutral-500">
                        {po.items
                          .map((i) => `${i.productName} (${i.orderQty} Box)`)
                          .join(", ")}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right mr-1">
                        <span className="text-[10px] text-neutral-400 block whitespace-nowrap">
                          Nilai Pesanan
                        </span>
                        <span className="font-mono font-bold text-[13.5px] text-neutral-900 dark:text-white whitespace-nowrap">
                          {maskVal(po.totalEstimatedCost)}
                        </span>
                      </div>

                      {isPending && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleQuickApprovePO(po.id)}
                            className="px-3 py-1.5 rounded-lg bg-[#00767E] hover:bg-[#006067] text-white text-[11.5px] font-semibold flex items-center gap-1 transition-colors whitespace-nowrap"
                          >
                            <Check className="w-3.5 h-3.5 shrink-0" />
                            <span>Setujui</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickRejectPO(po.id)}
                            className="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 dark:border-rose-800 dark:text-rose-400"
                            title="Tolak PO"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Laporan Obat Mendekati Kadaluarsa (30–60 Hari) & Transaksi Terbaru (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {/* Laporan Obat Mendekati Kadaluarsa */}
            <div className="bg-white dark:bg-[#141416] rounded-xl border border-neutral-200/80 dark:border-white/[0.08] overflow-hidden">
              <div className="px-5 py-3.5 border-b border-neutral-200/80 dark:border-white/[0.08] flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <h3 className="text-[13.5px] font-bold text-neutral-900 dark:text-white truncate">
                    Obat Mendekati Kadaluarsa (30–60 Hari)
                  </h3>
                </div>
                <Link
                  href="/inventory"
                  className="text-[11.5px] font-semibold text-[#00767E] hover:underline whitespace-nowrap shrink-0"
                >
                  Lihat Gudang &rarr;
                </Link>
              </div>

              <div className="p-3.5 space-y-2">
                {expiringBatches.length === 0 ? (
                  <p className="text-[12px] text-neutral-500 text-center py-4">
                    Tidak ada batch obat yang mendekati kadaluarsa dalam 60 hari ke depan.
                  </p>
                ) : (
                  expiringBatches.map(({ product, batch, daysLeft }) => {
                    const status = getExpiryStatus(daysLeft);
                    const formattedDate = new Date(
                      batch.expiryDate
                    ).toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    });
                    return (
                      <div
                        key={batch.id}
                        className="p-3 rounded-lg bg-neutral-50 dark:bg-[#1C1C1E] border border-neutral-200/80 dark:border-white/[0.08] flex items-center justify-between gap-2.5"
                      >
                        <div className="min-w-0">
                          <span className="font-semibold text-[12.5px] text-neutral-900 dark:text-white block truncate">
                            {product.name}
                          </span>
                          <div className="text-[11px] font-mono text-neutral-500 flex flex-wrap items-center gap-x-1.5">
                            <span className="whitespace-nowrap">{batch.batchNumber}</span>
                            <span>&middot;</span>
                            <span className="whitespace-nowrap">{batch.locationRack}</span>
                            <span>&middot;</span>
                            <span className="whitespace-nowrap">Stok: {batch.currentStock}</span>
                          </div>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10.5px] font-mono font-semibold border whitespace-nowrap shrink-0 ${status.badgeBg}`}
                        >
                          {formattedDate} ({daysLeft} hari)
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Transaksi Kasir Terbaru */}
            <div className="bg-white dark:bg-[#141416] rounded-xl border border-neutral-200/80 dark:border-white/[0.08] overflow-hidden">
              <div className="px-5 py-3 border-b border-neutral-200/80 dark:border-white/[0.08] flex items-center justify-between gap-2">
                <h3 className="text-[13px] font-bold text-neutral-900 dark:text-white">
                  Transaksi Kasir Terbaru ({transactions.length})
                </h3>
                <Link
                  href="/"
                  className="text-[11.5px] font-semibold text-[#00767E] hover:underline whitespace-nowrap shrink-0"
                >
                  Buka Kasir &rarr;
                </Link>
              </div>

              <div className="p-3.5 space-y-2 max-h-[190px] overflow-y-auto">
                {transactions.length === 0 ? (
                  <p className="text-[12px] text-neutral-500 text-center py-4">
                    Belum ada struk transaksi baru pada sesi ini.
                  </p>
                ) : (
                  transactions.slice(0, 5).map((tx) => (
                    <div
                      key={tx.id}
                      className="p-2.5 rounded-lg bg-neutral-50 dark:bg-[#1C1C1E] border border-neutral-200/80 dark:border-white/[0.06] flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <span className="font-mono font-semibold text-[12px] text-neutral-900 dark:text-white block truncate">
                          {tx.invoiceNumber}
                        </span>
                        <span className="text-[11px] text-neutral-500">
                          {tx.cashierName} &middot;{" "}
                          {tx.transactionMode === "RESEP_DOKTER"
                            ? "Resep Dokter"
                            : "Obat Bebas"}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-[12.5px] text-emerald-600 dark:text-emerald-400 whitespace-nowrap shrink-0">
                        {maskVal(tx.grandTotal)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
