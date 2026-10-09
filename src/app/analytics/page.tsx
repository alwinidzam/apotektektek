"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { AccessDenied } from "@/components/AccessDenied";
import { useApotekStore } from "@/lib/store";
import { formatRupiah } from "@/lib/utils";
import { soundEngine } from "@/lib/audio";
import {
  generateSeedTransactions,
  calculateShiftRevenueMetrics,
  calculateDailyRevenueMetrics,
  calculateWeeklyRevenueMetrics,
  calculateCategoryRevenueShare,
  calculatePaymentMethodBreakdown,
  calculateHourlyTraffic,
  generateFormalMonthlyPnL,
} from "@/lib/analytics/revenue-engine";
import { ShiftRevenueChart } from "@/components/analytics/ShiftRevenueChart";
import { DailyTrendChart } from "@/components/analytics/DailyTrendChart";
import { WeeklyGrowthChart } from "@/components/analytics/WeeklyGrowthChart";
import { MonthlyCategoryShare } from "@/components/analytics/MonthlyCategoryShare";
import { PaymentBreakdownCard } from "@/components/analytics/PaymentBreakdownCard";
import { HourlyPeakTrafficHeatmap } from "@/components/analytics/HourlyPeakTrafficHeatmap";
import { FormalMonthlyPnLView } from "@/components/analytics/FormalMonthlyPnLView";
import {
  TrendingUp,
  Clock,
  Calendar,
  Layers,
  PieChart,
  FileCheck2,
  Eye,
  EyeOff,
  Printer,
  DollarSign,
  ArrowUpRight,
  ShoppingBag,
  CreditCard,
  Building2,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";

type AnalyticsTab =
  | "SHIFT"
  | "DAILY"
  | "WEEKLY"
  | "CATEGORIES_PAYMENT"
  | "FORMAL_PNL";

export default function AnalyticsDashboardPage() {
  const {
    transactions,
    products,
    shiftsHistory,
    currentShift,
    currentUser,
    privacyMode,
    togglePrivacyMode,
  } = useApotekStore();

  const [activeTab, setActiveTab] = useState<AnalyticsTab>("DAILY");
  const router = useRouter();

  const ANALYTICS_TABS: AnalyticsTab[] = [
    "SHIFT",
    "DAILY",
    "WEEKLY",
    "CATEGORIES_PAYMENT",
    "FORMAL_PNL",
  ];

  const handleSwipeLeft = () => {
    const idx = ANALYTICS_TABS.indexOf(activeTab);
    if (idx < ANALYTICS_TABS.length - 1) {
      soundEngine.playKeyTap();
      setActiveTab(ANALYTICS_TABS[idx + 1]);
    }
  };

  const handleSwipeRight = () => {
    const idx = ANALYTICS_TABS.indexOf(activeTab);
    if (idx > 0) {
      soundEngine.playKeyTap();
      setActiveTab(ANALYTICS_TABS[idx - 1]);
    }
  };

  const handleEdgeSwipeRight = () => {
    soundEngine.playKeyTap();
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  const swipeHandlers = useSwipeGesture({
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight,
    onEdgeSwipeRight: handleEdgeSwipeRight,
  });

  // Merge store transactions with realistic historical transactions if empty
  const activeTransactions = useMemo(() => {
    if (transactions && transactions.length >= 20) {
      return transactions;
    }
    const seed = generateSeedTransactions(products);
    return [...seed, ...(transactions || [])];
  }, [transactions, products]);

  // Analytics Engine Calculations
  const shiftMetrics = useMemo(() => {
    return calculateShiftRevenueMetrics(shiftsHistory, currentShift, activeTransactions);
  }, [shiftsHistory, currentShift, activeTransactions]);

  const dailyMetrics = useMemo(() => {
    return calculateDailyRevenueMetrics(activeTransactions, products, 30);
  }, [activeTransactions, products]);

  const weeklyMetrics = useMemo(() => {
    return calculateWeeklyRevenueMetrics(activeTransactions, products);
  }, [activeTransactions, products]);

  const categoryShare = useMemo(() => {
    return calculateCategoryRevenueShare(activeTransactions, products);
  }, [activeTransactions, products]);

  const paymentBreakdown = useMemo(() => {
    return calculatePaymentMethodBreakdown(activeTransactions);
  }, [activeTransactions]);

  const hourlyTraffic = useMemo(() => {
    return calculateHourlyTraffic(activeTransactions);
  }, [activeTransactions]);

  const formalPnL = useMemo(() => {
    return generateFormalMonthlyPnL(activeTransactions, products, 0);
  }, [activeTransactions, products]);

  // Top summary KPIs
  const totalMonthRevenue = formalPnL.revenue.netRevenue;
  const totalMonthGrossProfit = formalPnL.grossProfit;
  const totalMonthNetProfit = formalPnL.netProfit;
  const grossMargin = formalPnL.grossMarginPercent;
  const netMargin = formalPnL.netMarginPercent;

  const renderAmount = (amount: number, color = "text-[#1C1C1E] dark:text-white") => {
    if (privacyMode) return <span className="font-mono text-[#8E8E93]">••••••••</span>;
    return <span className={`tabular-nums font-bold ${color}`}>{formatRupiah(amount)}</span>;
  };

  const handleTabChange = (tab: AnalyticsTab) => {
    soundEngine.playKeyTap();
    setActiveTab(tab);
  };

  // RBAC Access Check (Kasir is forbidden from sensitive executive financial analytics)
  if (currentUser.role === "KARYAWAN_KASIR") {
    return (
      <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#000000]">
        <Navbar />
        <AccessDenied
          requiredRole="Owner (PSA) / Super Admin / Apoteker"
          reason="Dashboard Analitik Pendapatan & Laporan Keuangan Formal memuat data HPP, margin laba kotor, dan evaluasi performa bisnis yang dilindungi."
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#F5F5F7] dark:bg-[#000000] text-[#1C1C1E] dark:text-[#F5F5F7] pb-20">
      <Navbar />

      {/* Main Container with Swipe Gesture Support */}
      <main
        {...swipeHandlers}
        className="max-w-7xl mx-auto px-3 sm:px-6 pt-4 sm:pt-8 space-y-5 sm:space-y-6 touch-pan-y"
      >
        {/* Executive Header Banner */}
        <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="p-1.5 rounded-[8px] bg-teal-100 dark:bg-teal-950 text-[#008B94] shrink-0">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
              </span>
              <h1 className="text-[18px] sm:text-[26px] font-bold tracking-tight text-[#1C1C1E] dark:text-white truncate">
                <span className="sm:hidden">Analitik & Laporan</span>
                <span className="hidden sm:inline">Analitik Pendapatan & Laporan Keuangan</span>
              </h1>
              <span className="hidden sm:inline-block text-[11px] uppercase font-bold px-2.5 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-[#008B94] shrink-0">
                SAK EMKM
              </span>
            </div>
            <p className="hidden sm:block text-[13px] text-[#8E8E93] mt-1 max-w-2xl">
              Visualisasi tren omzet shift, harian, mingguan, serta penyusunan rekapitulasi Laporan Laba Rugi formal bulanan Apotek Kerso Waras
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0 flex-wrap sm:flex-nowrap">
            <button
              type="button"
              onClick={togglePrivacyMode}
              title={privacyMode ? "Tampilkan Angka" : "Sembunyikan Angka (Mode Privasi)"}
              className={`min-h-[40px] px-3.5 py-2 text-[12px] font-semibold rounded-[12px] border transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                privacyMode
                  ? "bg-amber-500 text-white border-amber-600 shadow-sm"
                  : "bg-white dark:bg-[#1C1C1E] border-black/[0.08] dark:border-white/[0.12] text-[#1C1C1E] dark:text-white hover:bg-neutral-50 shadow-sm"
              }`}
            >
              {privacyMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span>{privacyMode ? "Privasi Aktif" : "Privasi"}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("FORMAL_PNL");
                setTimeout(() => window.print(), 200);
              }}
              title="Cetak Laporan Keuangan Formal A4"
              className="min-h-[40px] px-3.5 py-2 text-[12px] font-semibold rounded-[12px] bg-[#008B94] hover:bg-[#00767E] text-white transition-all shadow-sm flex items-center gap-1.5 shrink-0 whitespace-nowrap"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak P&L</span>
            </button>
          </div>
        </div>

        {/* Top 4 KPI Executive Metric Cards */}
        <div className="no-print grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white dark:bg-[#1C1C1E] p-4 sm:p-5 rounded-[20px] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-semibold text-[#8E8E93] uppercase tracking-wider block">
                Omzet Bersih Bulan Ini (MTD)
              </span>
              <div className="text-[20px] sm:text-[24px] mt-1.5">
                {renderAmount(totalMonthRevenue, "text-[#008B94]")}
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between text-[11px] text-[#8E8E93]">
              <span>Periode: {formalPnL.periodMonthName}</span>
              <span className="font-semibold text-emerald-600">Realisasi 100%</span>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1C1C1E] p-4 sm:p-5 rounded-[20px] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#8E8E93] uppercase tracking-wider">
                  Laba Kotor (Gross Profit)
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  +{grossMargin}%
                </span>
              </div>
              <div className="text-[20px] sm:text-[24px] mt-1.5">
                {renderAmount(totalMonthGrossProfit, "text-emerald-600 dark:text-emerald-400")}
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between text-[11px] text-[#8E8E93]">
              <span>Beban HPP:</span>
              <span>{renderAmount(formalPnL.cogs.totalCOGS)}</span>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1C1C1E] p-4 sm:p-5 rounded-[20px] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#8E8E93] uppercase tracking-wider">
                  Laba Bersih (Net Profit)
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                  Net {netMargin}%
                </span>
              </div>
              <div className="text-[20px] sm:text-[24px] mt-1.5">
                {renderAmount(totalMonthNetProfit, "text-blue-600 dark:text-blue-400")}
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between text-[11px] text-[#8E8E93]">
              <span>PPh Final 0.5%:</span>
              <span>{renderAmount(formalPnL.incomeTaxUMKM)}</span>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1C1C1E] p-4 sm:p-5 rounded-[20px] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-semibold text-[#8E8E93] uppercase tracking-wider block">
                Total Struk & Transaksi
              </span>
              <div className="text-[20px] sm:text-[24px] mt-1.5 font-bold font-mono text-[#1C1C1E] dark:text-white">
                {activeTransactions.length} <span className="text-[14px] font-normal text-[#8E8E93]">struk</span>
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between text-[11px] text-[#8E8E93]">
              <span>Rata-Rata Harian:</span>
              <span className="font-semibold text-[#1C1C1E] dark:text-white">
                {Math.round(activeTransactions.length / 28)} struk/hari
              </span>
            </div>
          </div>
        </div>

        {/* Apple HIG Segmented Control Navigation Tabs */}
        <div className="no-print w-full overflow-x-auto pb-1 touch-pan-x">
          <div className="flex items-center gap-1.5 p-1.5 bg-black/[0.04] dark:bg-white/[0.06] rounded-[16px] border border-black/[0.04] dark:border-white/[0.06] min-w-max">
            <button
              type="button"
              onClick={() => handleTabChange("SHIFT")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-[12px] text-[12px] font-semibold transition-all shrink-0 whitespace-nowrap min-h-[38px] ${
                activeTab === "SHIFT"
                  ? "bg-white dark:bg-[#1C1C1E] text-[#008B94] shadow-sm"
                  : "text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white"
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Per Shift</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange("DAILY")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-[12px] text-[12px] font-semibold transition-all shrink-0 whitespace-nowrap min-h-[38px] ${
                activeTab === "DAILY"
                  ? "bg-white dark:bg-[#1C1C1E] text-[#008B94] shadow-sm"
                  : "text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white"
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Harian</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange("WEEKLY")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-[12px] text-[12px] font-semibold transition-all shrink-0 whitespace-nowrap min-h-[38px] ${
                activeTab === "WEEKLY"
                  ? "bg-white dark:bg-[#1C1C1E] text-[#008B94] shadow-sm"
                  : "text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white"
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Mingguan</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange("CATEGORIES_PAYMENT")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-[12px] text-[12px] font-semibold transition-all shrink-0 whitespace-nowrap min-h-[38px] ${
                activeTab === "CATEGORIES_PAYMENT"
                  ? "bg-white dark:bg-[#1C1C1E] text-[#008B94] shadow-sm"
                  : "text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white"
              }`}
            >
              <PieChart className="w-4 h-4" />
              <span>Kategori & Bayar</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange("FORMAL_PNL")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-[12px] text-[12px] font-semibold transition-all shrink-0 whitespace-nowrap min-h-[38px] ${
                activeTab === "FORMAL_PNL"
                  ? "bg-[#008B94] text-white shadow-sm"
                  : "text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white"
              }`}
            >
              <FileCheck2 className="w-4 h-4" />
              <span>Laporan P&L</span>
            </button>
          </div>
        </div>

        {/* Mobile Swipe Hint Indicator */}
        <div className="no-print sm:hidden text-center text-[10px] text-neutral-400 dark:text-neutral-500 pt-0.5 flex items-center justify-center gap-1 select-none">
          <span>&larr;</span>
          <span>Geser layar ke kiri / kanan untuk ganti tab analitik</span>
          <span>&rarr;</span>
        </div>

        {/* Tab 1: Per Shift */}
        {activeTab === "SHIFT" && (
          <div className="space-y-6">
            <ShiftRevenueChart shifts={shiftMetrics} privacyMode={privacyMode} />
          </div>
        )}

        {/* Tab 2: Tren Harian */}
        {activeTab === "DAILY" && (
          <div className="space-y-6">
            <DailyTrendChart data={dailyMetrics} privacyMode={privacyMode} />
            <HourlyPeakTrafficHeatmap hourly={hourlyTraffic} privacyMode={privacyMode} />
          </div>
        )}

        {/* Tab 3: Mingguan */}
        {activeTab === "WEEKLY" && (
          <div className="space-y-6">
            <WeeklyGrowthChart weeks={weeklyMetrics} privacyMode={privacyMode} />
            <HourlyPeakTrafficHeatmap hourly={hourlyTraffic} privacyMode={privacyMode} />
          </div>
        )}

        {/* Tab 4: Kategori & Pembayaran */}
        {activeTab === "CATEGORIES_PAYMENT" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MonthlyCategoryShare categories={categoryShare} privacyMode={privacyMode} />
            <PaymentBreakdownCard payments={paymentBreakdown} privacyMode={privacyMode} />
          </div>
        )}

        {/* Tab 5: Laporan Formal P&L */}
        {activeTab === "FORMAL_PNL" && (
          <div className="space-y-6">
            <FormalMonthlyPnLView pnl={formalPnL} privacyMode={privacyMode} />
          </div>
        )}
      </main>
    </div>
  );
}
