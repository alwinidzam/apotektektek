"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { useApotekStore } from "@/lib/store";
import { formatRupiah } from "@/lib/utils";
import { CashierShift, PettyCashMovement, APOTEK_KERSO_WARAS_INFO } from "@/lib/types";
import { DenominationCounter } from "@/components/shifts/DenominationCounter";
import { PettyCashModal } from "@/components/shifts/PettyCashModal";
import { ShiftOpenModal } from "@/components/pos/ShiftOpenModal";
import { ShiftCloseModal } from "@/components/pos/ShiftCloseModal";
import { ShiftHandoverModal } from "@/components/shifts/ShiftHandoverModal";
import { ShiftReportModal } from "@/components/shifts/ShiftReportModal";
import {
  Wallet,
  Lock,
  PlayCircle,
  FileCheck2,
  Printer,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRightLeft,
  CheckCircle2,
  AlertTriangle,
  History,
  Calculator,
  Coins,
  Banknote,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Filter,
  FileSpreadsheet,
  Search,
  Clock,
  UserCheck,
  Sparkles,
  TrendingDown,
  BadgeAlert,
  TrendingUp,
  MoreHorizontal,
  ChevronRight,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import { soundEngine } from "@/lib/audio";

export default function ShiftsPage() {
  const {
    currentShift,
    shiftsHistory,
    pettyCashMovements,
    currentUser,
    auditShift,
    recordXReport,
  } = useApotekStore();

  const [activeTab, setActiveTab] = useState<
    "ACTIVE" | "PETTY_CASH" | "COUNTER" | "RECONCILIATION_LOG" | "HISTORY"
  >("ACTIVE");
  const [reconciliationFilter, setReconciliationFilter] = useState<
    "ALL" | "DISCREPANCY_ONLY" | "EXACT_MATCH"
  >("ALL");
  const [reconciliationCategoryFilter, setReconciliationCategoryFilter] =
    useState<string>("ALL");
  const [reconciliationSearch, setReconciliationSearch] = useState("");

  const [isShiftOpenOpen, setIsShiftOpenOpen] = useState(false);
  const [isShiftCloseOpen, setIsShiftCloseOpen] = useState(false);
  const [isShiftHandoverOpen, setIsShiftHandoverOpen] = useState(false);
  const [isPettyCashOpen, setIsPettyCashOpen] = useState(false);
  const [pettyCashDefaultType, setPettyCashDefaultType] = useState<"PAID_IN" | "PAID_OUT">("PAID_OUT");

  // Report Modal states
  const [selectedReportShift, setSelectedReportShift] = useState<CashierShift | null>(null);
  const [reportType, setReportType] = useState<"X_REPORT" | "Z_REPORT">("X_REPORT");
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Owner Audit state
  const [auditTargetShift, setAuditTargetShift] = useState<CashierShift | null>(null);
  const [auditNoteInput, setAuditNoteInput] = useState("");
  const [isAuditDialogOpen, setIsAuditDialogOpen] = useState(false);

  // Mobile navigation & Apple HIG states
  const router = useRouter();
  const [isMobileActionsOpen, setIsMobileActionsOpen] = useState(false);

  const SHIFT_TAB_LIST: Array<"ACTIVE" | "RECONCILIATION_LOG" | "PETTY_CASH" | "COUNTER" | "HISTORY"> = [
    "ACTIVE",
    "RECONCILIATION_LOG",
    "PETTY_CASH",
    "COUNTER",
    "HISTORY",
  ];

  const handleSwipeLeft = () => {
    const currentIndex = SHIFT_TAB_LIST.indexOf(activeTab);
    if (currentIndex < SHIFT_TAB_LIST.length - 1) {
      soundEngine.playKeyTap();
      setActiveTab(SHIFT_TAB_LIST[currentIndex + 1]);
    }
  };

  const handleSwipeRight = () => {
    const currentIndex = SHIFT_TAB_LIST.indexOf(activeTab);
    if (currentIndex > 0) {
      soundEngine.playKeyTap();
      setActiveTab(SHIFT_TAB_LIST[currentIndex - 1]);
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

  const isShiftActive = currentShift && currentShift.status === "OPEN";

  const expectedDrawerCash = isShiftActive
    ? currentShift.openingCash +
      currentShift.cashSalesTotal +
      currentShift.cashInTotal -
      currentShift.cashOutTotal -
      currentShift.refundTotal
    : 0;

  const handleOpenXReport = () => {
    if (!currentShift) return;
    recordXReport();
    setSelectedReportShift(currentShift);
    setReportType("X_REPORT");
    setIsReportModalOpen(true);
  };

  const handleOpenZReport = (shift: CashierShift) => {
    setSelectedReportShift(shift);
    setReportType("Z_REPORT");
    setIsReportModalOpen(true);
  };

  const handleTriggerAudit = (shift: CashierShift) => {
    setAuditTargetShift(shift);
    setAuditNoteInput(
      shift.cashDifference === 0
        ? "Kas klop sempurna. Audit disetujui PSA."
        : `Selisih ${formatRupiah(Math.abs(shift.cashDifference || 0))}. Disetujui dengan catatan.`
    );
    setIsAuditDialogOpen(true);
  };

  const handleConfirmAudit = (status: "APPROVED" | "DISCREPANCY_FLAGGED") => {
    if (!auditTargetShift) return;
    auditShift(auditTargetShift.id, status, auditNoteInput);
    setIsAuditDialogOpen(false);
    setAuditTargetShift(null);
  };

  const isOwnerOrAdmin = currentUser.role === "OWNER" || currentUser.role === "SUPER_ADMIN";

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#F5F5F7] dark:bg-[#000000] text-[#1C1C1E] dark:text-[#F5F5F7] flex flex-col">
      <Navbar />

      {/* Page Title & Context Header */}
      <div className="w-full max-w-full bg-white dark:bg-[#1C1C1E] border-b border-black/[0.06] dark:border-white/[0.08] px-3 sm:px-6 py-3.5 sm:py-5">
        <div className="w-full max-w-full flex items-center justify-between gap-2 sm:gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="p-1.5 rounded-[9px] bg-[#008B94]/10 text-[#008B94] shrink-0">
                <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
              </span>
              <h1 className="text-[17px] sm:text-[20px] font-bold tracking-tight text-[#1C1C1E] dark:text-white truncate">
                <span className="sm:hidden">Shift & Kas</span>
                <span className="hidden sm:inline">Kelola Shift & Rekonsiliasi Kas Laci</span>
              </h1>
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#008B94]/15 text-[#008B94] shrink-0">
                {APOTEK_KERSO_WARAS_INFO.name}
              </span>
            </div>
            <p className="hidden sm:block text-[12px] text-[#8E8E93] mt-0.5">
              Pencatatan kas laci, mutasi kas kecil, dan rekonsiliasi shift.
            </p>
          </div>

          {/* DESKTOP Quick Header Actions (Visible on sm+) */}
          <div className="hidden sm:flex items-center gap-2 sm:gap-2.5 shrink-0">
            {isOwnerOrAdmin && (
              <Link
                href="/analytics"
                title="Buka Dashboard Analitik Pendapatan & Laporan Keuangan"
                className="min-h-[40px] px-3 sm:px-3.5 py-2 rounded-[12px] bg-teal-50 dark:bg-teal-950/50 hover:bg-teal-100 text-[#008B94] dark:text-teal-300 border border-teal-200 dark:border-teal-800 text-[12px] font-semibold flex items-center gap-1.5 transition-all shadow-sm shrink-0 whitespace-nowrap"
              >
                <TrendingUp className="w-4 h-4" />
                <span>Analitik</span>
              </Link>
            )}
            {isShiftActive ? (
              <>
                <button
                  type="button"
                  onClick={handleOpenXReport}
                  className="min-h-[40px] px-3 sm:px-3.5 py-2 rounded-[12px] bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-[#1C1C1E] dark:text-white text-[12px] font-semibold flex items-center gap-1.5 transition-all shrink-0 whitespace-nowrap"
                  title="Cetak X-Report (Bacaan sementara kasir tanpa mereset angka)"
                >
                  <FileCheck2 className="w-4 h-4 text-blue-600" />
                  <span>X-Report</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPettyCashDefaultType("PAID_OUT");
                    setIsPettyCashOpen(true);
                  }}
                  className="min-h-[40px] px-3 sm:px-3.5 py-2 rounded-[12px] bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50 text-[12px] font-semibold flex items-center gap-1.5 transition-all shrink-0 whitespace-nowrap"
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span>Kas Keluar</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPettyCashDefaultType("PAID_IN");
                    setIsPettyCashOpen(true);
                  }}
                  className="min-h-[40px] px-3 sm:px-3.5 py-2 rounded-[12px] bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50 text-[12px] font-semibold flex items-center gap-1.5 transition-all shrink-0 whitespace-nowrap"
                >
                  <ArrowDownLeft className="w-4 h-4" />
                  <span>Kas Masuk</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playKeyTap();
                    setIsShiftHandoverOpen(true);
                  }}
                  className="min-h-[40px] px-3 sm:px-3.5 py-2 rounded-[12px] bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 text-[#008B94] dark:text-teal-300 border border-teal-200 dark:border-teal-800 text-[12px] font-semibold flex items-center gap-1.5 transition-all shadow-sm shrink-0 whitespace-nowrap"
                  title="Serah Terima & Ganti Shift Kasir"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  <span>Ganti Shift</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsShiftCloseOpen(true)}
                  className="min-h-[40px] px-3.5 sm:px-4 py-2 rounded-[12px] bg-rose-600 hover:bg-rose-700 text-white text-[12px] font-semibold flex items-center gap-1.5 transition-all shadow-sm shrink-0 whitespace-nowrap"
                >
                  <Lock className="w-4 h-4" />
                  <span>Tutup Shift</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setIsShiftOpenOpen(true)}
                className="min-h-[40px] px-4 py-2 rounded-[12px] bg-[#008B94] hover:bg-[#00767E] text-white text-[12px] font-semibold flex items-center gap-1.5 transition-all shadow-sm shrink-0 whitespace-nowrap"
              >
                <PlayCircle className="w-4 h-4" />
                <span>Buka Shift</span>
              </button>
            )}
          </div>

          {/* MOBILE Minimalist Action Bar (Apple HIG Single-Line Zero-Clutter) */}
          <div className="sm:hidden flex items-center gap-1.5 shrink-0">
            {isShiftActive ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playKeyTap();
                    setIsShiftHandoverOpen(true);
                  }}
                  className="h-8 px-2 rounded-[9px] bg-teal-50 dark:bg-teal-950/40 text-[#008B94] dark:text-teal-300 border border-teal-200 dark:border-teal-800 text-[11px] font-semibold flex items-center gap-1 active:scale-95 transition-all shrink-0"
                  title="Ganti Shift"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>Ganti</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playKeyTap();
                    setPettyCashDefaultType("PAID_OUT");
                    setIsPettyCashOpen(true);
                  }}
                  className="h-8 px-2.5 rounded-[9px] bg-neutral-100 dark:bg-neutral-800 text-[#1C1C1E] dark:text-white border border-neutral-200 dark:border-neutral-700 text-[11px] font-semibold flex items-center gap-1 active:scale-95 transition-all shrink-0"
                  title="Kas Keluar / Kas Masuk"
                >
                  <Coins className="w-3.5 h-3.5 text-[#008B94]" />
                  <span>Kas Kecil</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playKeyTap();
                    setIsShiftCloseOpen(true);
                  }}
                  className="h-8 px-2.5 rounded-[9px] bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-semibold flex items-center gap-1 active:scale-95 transition-all shadow-sm shrink-0"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Tutup</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playKeyTap();
                    setIsMobileActionsOpen(true);
                  }}
                  className="h-8 w-8 rounded-[9px] bg-neutral-100 dark:bg-neutral-800 text-[#1C1C1E] dark:text-white border border-neutral-200 dark:border-neutral-700 flex items-center justify-center active:scale-95 transition-all shrink-0"
                  title="Aksi Lainnya (X-Report, Analitik)"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  soundEngine.playKeyTap();
                  setIsShiftOpenOpen(true);
                }}
                className="h-8 px-3 rounded-[9px] bg-[#008B94] text-white text-[11px] font-semibold flex items-center gap-1 active:scale-95 transition-all shadow-sm shrink-0"
              >
                <PlayCircle className="w-3.5 h-3.5" />
                <span>Buka Shift</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation Segmented Bar */}
        <div className="w-full max-w-full mt-3 sm:mt-4 flex items-center gap-1.5 border-t border-neutral-100 dark:border-neutral-800 pt-2.5 sm:pt-3 overflow-x-auto no-scrollbar touch-pan-x">
          {[
            { id: "ACTIVE", label: "Shift Aktif", icon: Wallet },
            { id: "RECONCILIATION_LOG", label: "Rekonsiliasi", icon: ShieldAlert },
            { id: "PETTY_CASH", label: "Kas Kecil", icon: ArrowUpRight },
            { id: "COUNTER", label: "Pecahan Uang", icon: Calculator },
            { id: "HISTORY", label: "Arsip Shift", icon: History },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  soundEngine.playKeyTap();
                  setActiveTab(tab.id as any);
                }}
                className={`min-h-[36px] sm:min-h-[38px] px-3 sm:px-3.5 py-1.5 rounded-[10px] text-[11px] sm:text-[12px] font-semibold flex items-center gap-1.5 transition-all shrink-0 whitespace-nowrap ${
                  isActive
                    ? "bg-[#1C1C1E] text-white dark:bg-white dark:text-[#1C1C1E] shadow-sm"
                    : "text-[#636366] hover:text-[#1C1C1E] dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Mobile Swipe Hint Indicator */}
        <div className="sm:hidden text-center text-[10px] text-neutral-400 dark:text-neutral-500 pt-1.5 flex items-center justify-center gap-1 select-none">
          <span>&larr;</span>
          <span>Geser layar ke kiri / kanan untuk ganti tab</span>
          <span>&rarr;</span>
        </div>
      </div>

      {/* Main Content Area with Swipe Gesture Support */}
      <main
        {...swipeHandlers}
        className="flex-1 w-full max-w-full min-w-0 p-3 sm:p-6 lg:p-8 touch-pan-y"
      >
        {/* TAB 1: ACTIVE SHIFT OVERVIEW */}
        {activeTab === "ACTIVE" && (
          <div className="space-y-6">
            {isShiftActive ? (
              <>
                {/* Active Shift Status Banner */}
                <div className="p-3 sm:p-4 rounded-[16px] sm:rounded-[18px] bg-white dark:bg-[#1C1C1E] border border-black/[0.08] dark:border-white/[0.08] flex items-center justify-between gap-3 shadow-sm">
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="text-[14px] sm:text-[16px] font-bold text-[#1C1C1E] dark:text-white truncate">
                          Shift {currentShift.shiftNumber} Sedang Aktif
                        </h2>
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 shrink-0">
                          {currentShift.terminalId}
                        </span>
                      </div>
                      <p className="text-[11px] sm:text-[12px] text-[#8E8E93] truncate">
                        Kasir: <strong className="text-[#1C1C1E] dark:text-white">{currentShift.cashierName}</strong> &bull; Buka: {new Date(currentShift.startTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
                      </p>
                    </div>
                  </div>

                  <div className="hidden sm:flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleOpenXReport}
                      className="px-3.5 py-1.5 rounded-[10px] bg-white dark:bg-[#2C2C2E] border border-black/[0.08] dark:border-white/[0.08] text-[12px] font-semibold text-[#1C1C1E] dark:text-white hover:bg-neutral-50 flex items-center gap-1.5 shadow-sm"
                    >
                      <FileCheck2 className="w-3.5 h-3.5 text-blue-600" />
                      <span>Lihat X-Report</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playKeyTap();
                        setIsShiftHandoverOpen(true);
                      }}
                      className="px-3.5 py-1.5 rounded-[10px] bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 text-[#008B94] dark:text-teal-300 border border-teal-200 dark:border-teal-800 text-[12px] font-semibold flex items-center gap-1.5 shadow-sm"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                      <span>Ganti Shift</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsShiftCloseOpen(true)}
                      className="px-3.5 py-1.5 rounded-[10px] bg-rose-600 hover:bg-rose-700 text-white text-[12px] font-semibold flex items-center gap-1.5 shadow-sm"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Tutup Kasir</span>
                    </button>
                  </div>
                </div>

                {/* Handover Notice Banner if active shift was handed over */}
                {currentShift.handoverLog && (
                  <div className="p-3.5 rounded-[16px] bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900/50 flex items-center justify-between gap-3 text-[12px]">
                    <div className="flex items-center gap-2 text-teal-900 dark:text-teal-200">
                      <ArrowRightLeft className="w-4 h-4 text-[#008B94] shrink-0" />
                      <span>
                        Shift ini aktif hasil serah terima dari <strong>{currentShift.handoverLog.previousCashierName}</strong> pada {new Date(currentShift.handoverLog.handoverTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB. Setoran ke brankas: {formatRupiah(currentShift.handoverLog.cashDroppedToVault)}.
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-200/50 dark:bg-teal-900 text-[#008B94] dark:text-teal-300 shrink-0">
                      Serah Terima Resmi
                    </span>
                  </div>
                )}

                {/* 6 Real-time Financial KPI Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
                  {/* 1. Modal Awal */}
                  <div className="p-3.5 rounded-[16px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] shadow-sm">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8E8E93] block mb-1 truncate">
                      Modal Awal Laci
                    </span>
                    <div className="text-[17px] font-bold text-[#1C1C1E] dark:text-white tabular-nums truncate">
                      {formatRupiah(currentShift.openingCash)}
                    </div>
                    <span className="text-[10px] text-[#8E8E93] mt-1 block">
                      Kas dasar kembalian
                    </span>
                  </div>

                  {/* 2. Penjualan Tunai */}
                  <div className="p-3.5 rounded-[16px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] shadow-sm">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-1 truncate">
                      Penjualan Tunai
                    </span>
                    <div className="text-[17px] font-bold text-emerald-600 dark:text-emerald-400 tabular-nums truncate">
                      {formatRupiah(currentShift.cashSalesTotal)}
                    </div>
                    <span className="text-[10px] text-[#8E8E93] mt-1 block">
                      {currentShift.totalTransactionsCount} transaksi
                    </span>
                  </div>

                  {/* 3. Non-Tunai QRIS / EDC / Transfer */}
                  <div className="p-3.5 rounded-[16px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] shadow-sm">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 block mb-1 truncate">
                      Non-Tunai Bank
                    </span>
                    <div className="text-[17px] font-bold text-blue-600 dark:text-blue-400 tabular-nums truncate">
                      {formatRupiah(currentShift.nonCashSalesTotal || (currentShift.qrisSalesTotal + currentShift.edcSalesTotal))}
                    </div>
                    <span className="text-[10px] text-[#8E8E93] mt-1 block">
                      QRIS, EDC & Transfer
                    </span>
                  </div>

                  {/* 4. Kas Masuk / Topup */}
                  <div className="p-3.5 rounded-[16px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] shadow-sm">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400 block mb-1 truncate">
                      Kas Masuk (In)
                    </span>
                    <div className="text-[17px] font-bold text-teal-600 dark:text-teal-400 tabular-nums truncate">
                      {formatRupiah(currentShift.cashInTotal)}
                    </div>
                    <span className="text-[10px] text-[#8E8E93] mt-1 block">
                      Tambahan float
                    </span>
                  </div>

                  {/* 5. Kas Keluar Operasional */}
                  <div className="p-3.5 rounded-[16px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] shadow-sm">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400 block mb-1 truncate">
                      Kas Keluar (Out)
                    </span>
                    <div className="text-[17px] font-bold text-rose-600 dark:text-rose-400 tabular-nums truncate">
                      -{formatRupiah(currentShift.cashOutTotal)}
                    </div>
                    <span className="text-[10px] text-[#8E8E93] mt-1 block">
                      Petty cash
                    </span>
                  </div>

                  {/* 6. Ekspektasi Saldo Laci */}
                  <div className="p-3.5 rounded-[16px] bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300/60 dark:border-emerald-800/40 shadow-sm">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 block mb-1 truncate">
                      Saldo Laci Sistem
                    </span>
                    <div className="text-[18px] font-black text-emerald-700 dark:text-emerald-300 tabular-nums truncate">
                      {formatRupiah(expectedDrawerCash)}
                    </div>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 block">
                      Wajib klop fisik
                    </span>
                  </div>
                </div>

                {/* Split Two-Column Section: Petty Cash Recent + Quick Denomination Preview */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column: Recent Petty Cash Movements (7 cols) */}
                  <div className="lg:col-span-7 bg-white dark:bg-[#1C1C1E] p-6 rounded-[22px] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-[15px] font-bold text-[#1C1C1E] dark:text-white">
                          Mutasi Kas Kecil Shift Ini
                        </h3>
                        <p className="text-[11px] text-[#8E8E93]">
                          Pencatatan es pendingin vaksin, kertas thermal roll, ongkir obat
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setPettyCashDefaultType("PAID_OUT");
                          setIsPettyCashOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-[10px] bg-[#007AFF] hover:bg-[#0062CC] text-white text-[11px] font-semibold flex items-center gap-1 shadow-sm"
                      >
                        + Catat Kas Baru
                      </button>
                    </div>

                    {currentShift.pettyCashMovements && currentShift.pettyCashMovements.length > 0 ? (
                      <div className="space-y-2">
                        {currentShift.pettyCashMovements.map((item) => (
                          <div
                            key={item.id}
                            className="p-3 rounded-[14px] bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-black/[0.04] flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className={`p-2 rounded-[10px] ${
                                  item.type === "PAID_OUT"
                                    ? "bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400"
                                    : "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
                                }`}
                              >
                                {item.type === "PAID_OUT" ? (
                                  <ArrowUpRight className="w-4 h-4" />
                                ) : (
                                  <ArrowDownLeft className="w-4 h-4" />
                                )}
                              </span>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="text-[12px] font-bold text-[#1C1C1E] dark:text-white">
                                    {item.categoryLabel}
                                  </h4>
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/[0.05] dark:bg-white/[0.1] text-[#8E8E93]">
                                    {new Date(item.timestamp).toLocaleTimeString("id-ID")}
                                  </span>
                                </div>
                                <p className="text-[11px] text-[#636366] dark:text-[#AEAEB2] mt-0.5">
                                  {item.reason} &bull; <span className="text-[#8E8E93]">{item.recipientOrSource}</span>
                                </p>
                              </div>
                            </div>

                            <div className="text-right">
                              <span
                                className={`text-[13px] font-bold tabular-nums block ${
                                  item.type === "PAID_OUT"
                                    ? "text-rose-600 dark:text-rose-400"
                                    : "text-emerald-600 dark:text-emerald-400"
                                }`}
                              >
                                {item.type === "PAID_OUT" ? "-" : "+"}
                                {formatRupiah(item.amount)}
                              </span>
                              <span className="text-[10px] text-[#8E8E93]">
                                oleh {item.recordedBy}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-[#8E8E93] border border-dashed border-neutral-300 dark:border-neutral-800 rounded-[16px]">
                        <p className="text-[13px]">Belum ada mutasi kas kecil pada shift ini.</p>
                        <p className="text-[11px] mt-1">
                          Klik "+ Catat Kas Baru" jika kasir mengeluarkan uang untuk es batu vaksin, kertas thermal roll, atau ongkir grab cito.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Denomination Counting Guide & X-Report Card (5 cols) */}
                  <div className="lg:col-span-5 space-y-4">
                    {/* X-Report Spot Check Card */}
                    <div className="bg-white dark:bg-[#1C1C1E] p-5 rounded-[20px] border border-black/[0.06] dark:border-white/[0.08] shadow-sm">
                      <div className="flex items-center gap-2.5 mb-3">
                        <span className="p-2 rounded-[10px] bg-blue-100 dark:bg-blue-950 text-blue-600">
                          <FileCheck2 className="w-4 h-4" />
                        </span>
                        <div>
                          <h3 className="text-[14px] font-bold text-[#1C1C1E] dark:text-white">
                            Cek Kas Laci (X-Report)
                          </h3>
                          <p className="text-[11px] text-[#8E8E93]">
                            Audit kas tengah shift tanpa mereset angka akumulator
                          </p>
                        </div>
                      </div>

                      <div className="p-3 bg-neutral-50 dark:bg-neutral-900 rounded-[12px] text-[11px] text-[#8E8E93] mb-4 space-y-1">
                        <div className="flex justify-between">
                          <span>Total Cetak X-Report:</span>
                          <span className="font-semibold text-[#1C1C1E] dark:text-white">
                            {currentShift.xReportsCount || 0} kali
                          </span>
                        </div>
                        {currentShift.lastXReportTime && (
                          <div className="flex justify-between">
                            <span>Pemeriksaan Terakhir:</span>
                            <span className="font-semibold text-[#1C1C1E] dark:text-white">
                              {new Date(currentShift.lastXReportTime).toLocaleTimeString("id-ID")} WIB
                            </span>
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={handleOpenXReport}
                        className="w-full py-2.5 rounded-[12px] bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-semibold flex items-center justify-center gap-2 shadow-sm transition-all"
                      >
                        <Printer className="w-4 h-4" />
                        <span>Buka & Cetak X-Report</span>
                      </button>
                    </div>

                    {/* Quick Calculator Shortcut Card */}
                    <div className="bg-white dark:bg-[#1C1C1E] p-5 rounded-[20px] border border-black/[0.06] dark:border-white/[0.08] shadow-sm">
                      <div className="flex items-center gap-2.5 mb-3">
                        <span className="p-2 rounded-[10px] bg-amber-100 dark:bg-amber-950 text-amber-700">
                          <Calculator className="w-4 h-4" />
                        </span>
                        <div>
                          <h3 className="text-[14px] font-bold text-[#1C1C1E] dark:text-white">
                            Hitung Fisik Uang (Denominasi)
                          </h3>
                          <p className="text-[11px] text-[#8E8E93]">
                            Lembar hitung uang kertas & uang logam laci
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setActiveTab("COUNTER")}
                        className="w-full py-2.5 rounded-[12px] bg-[#F5F5F7] dark:bg-[#2C2C2E] hover:bg-neutral-200 dark:hover:bg-neutral-700 text-[#1C1C1E] dark:text-white text-[12px] font-semibold flex items-center justify-center gap-2 transition-all"
                      >
                        <span>Buka Lembar Denominasi &rarr;</span>
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* SHIFT IS CLOSED STATE */
              <div className="max-w-xl mx-auto p-8 rounded-[24px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] text-center shadow-lg my-12">
                <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center mx-auto mb-4">
                  <Wallet className="w-7 h-7" />
                </div>
                <h2 className="text-[18px] font-bold text-[#1C1C1E] dark:text-white">
                  Kasir Belum Membuka Shift
                </h2>
                <p className="text-[13px] text-[#8E8E93] mt-2 mb-6">
                  Terminal kasir Apotek Kerso Waras saat ini dalam kondisi tertutup. Kasir yang bertugas wajib menghitung modal awal (float kas) dan membuka shift sebelum melayani transaksi POS.
                </p>

                <button
                  type="button"
                  onClick={() => setIsShiftOpenOpen(true)}
                  className="px-6 py-3 rounded-[14px] bg-[#34C759] hover:bg-[#2EB34F] text-white text-[14px] font-semibold inline-flex items-center gap-2 shadow-md transition-transform hover:scale-105"
                >
                  <PlayCircle className="w-5 h-5" />
                  <span>Buka Shift Sekarang (Modal Awal)</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB: RECONCILIATION LOG & CASH VARIANCE AUDIT */}
        {activeTab === "RECONCILIATION_LOG" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-[20px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] shadow-sm">
                <div className="flex items-center justify-between text-[#8E8E93] text-[11px] font-bold uppercase tracking-wider mb-2">
                  <span>Total Shift Direkonsiliasi</span>
                  <History className="w-4 h-4 text-neutral-400" />
                </div>
                <div className="text-[26px] font-black text-[#1C1C1E] dark:text-white tabular-nums">
                  {shiftsHistory.length}
                </div>
                <p className="text-[11px] text-[#8E8E93] mt-1">
                  Arsip penutupan laci & blind count
                </p>
              </div>

              <div className="p-5 rounded-[20px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] shadow-sm">
                <div className="flex items-center justify-between text-[#8E8E93] text-[11px] font-bold uppercase tracking-wider mb-2">
                  <span>Tingkat Akurasi Kasir</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="text-[26px] font-black text-emerald-600 tabular-nums">
                  {shiftsHistory.length > 0
                    ? `${(
                        (shiftsHistory.filter((s) => (s.cashDifference || 0) === 0).length /
                          shiftsHistory.length) *
                        100
                      ).toFixed(0)}%`
                    : "100%"}
                </div>
                <p className="text-[11px] text-[#8E8E93] mt-1">
                  {shiftsHistory.filter((s) => (s.cashDifference || 0) === 0).length} dari{" "}
                  {shiftsHistory.length} shift kas klop sempurna
                </p>
              </div>

              <div className="p-5 rounded-[20px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] shadow-sm">
                <div className="flex items-center justify-between text-[#8E8E93] text-[11px] font-bold uppercase tracking-wider mb-2">
                  <span>Netto Selisih Kas</span>
                  <Coins className="w-4 h-4 text-amber-500" />
                </div>
                {(() => {
                  const netDiff = shiftsHistory.reduce(
                    (acc, s) => acc + (s.cashDifference || 0),
                    0
                  );
                  return (
                    <div
                      className={`text-[26px] font-black tabular-nums font-mono ${
                        netDiff === 0
                          ? "text-emerald-600"
                          : netDiff > 0
                          ? "text-blue-600"
                          : "text-rose-600"
                      }`}
                    >
                      {netDiff > 0 ? `+${formatRupiah(netDiff)}` : formatRupiah(netDiff)}
                    </div>
                  );
                })()}
                <p className="text-[11px] text-[#8E8E93] mt-1">
                  Akumulasi surplus (+) / minus (-) kasir
                </p>
              </div>

              <div className="p-5 rounded-[20px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] shadow-sm">
                <div className="flex items-center justify-between text-[#8E8E93] text-[11px] font-bold uppercase tracking-wider mb-2">
                  <span>Otorisasi Supervisor</span>
                  <KeyRound className="w-4 h-4 text-purple-500" />
                </div>
                <div className="text-[26px] font-black text-purple-600 tabular-nums">
                  {shiftsHistory.filter((s) => s.supervisorAuth?.isAuthorized).length} Kasus
                </div>
                <p className="text-[11px] text-[#8E8E93] mt-1">
                  Disahkan via login PIN digital APJ/Owner
                </p>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="w-full max-w-full min-w-0 overflow-hidden bg-white dark:bg-[#1C1C1E] p-4 sm:p-5 rounded-[22px] border border-black/[0.06] dark:border-white/[0.08] shadow-sm space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <h3 className="text-[16px] font-bold text-[#1C1C1E] dark:text-white flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-teal-600" />
                    <span>Log Audit Rekonsiliasi & Berita Acara Selisih Kas</span>
                  </h3>
                  <p className="text-[12px] text-[#8E8E93]">
                    Daftar resmi perbandingan uang fisik vs ekspektasi sistem per penutupan shift, riwayat login otorisasi PIN supervisor, dan surat pertanggungjawaban.
                  </p>
                </div>

                {/* Status Switcher Buttons */}
                <div className="flex items-center gap-1 bg-[#F5F5F7] dark:bg-[#2C2C2E] p-1 rounded-[12px] shrink-0">
                  <button
                    type="button"
                    onClick={() => setReconciliationFilter("ALL")}
                    className={`px-3 py-1.5 rounded-[9px] text-[11px] font-bold transition-all ${
                      reconciliationFilter === "ALL"
                        ? "bg-white dark:bg-[#3A3A3C] text-[#1C1C1E] dark:text-white shadow-sm"
                        : "text-[#8E8E93] hover:text-[#1C1C1E]"
                    }`}
                  >
                    Semua ({shiftsHistory.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setReconciliationFilter("DISCREPANCY_ONLY")}
                    className={`px-3 py-1.5 rounded-[9px] text-[11px] font-bold transition-all flex items-center gap-1.5 ${
                      reconciliationFilter === "DISCREPANCY_ONLY"
                        ? "bg-rose-600 text-white shadow-sm"
                        : "text-rose-600 hover:text-rose-700"
                    }`}
                  >
                    <AlertTriangle className="w-3 h-3" />
                    <span>
                      Ada Selisih ({shiftsHistory.filter((s) => (s.cashDifference || 0) !== 0).length})
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setReconciliationFilter("EXACT_MATCH")}
                    className={`px-3 py-1.5 rounded-[9px] text-[11px] font-bold transition-all flex items-center gap-1.5 ${
                      reconciliationFilter === "EXACT_MATCH"
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "text-emerald-600 hover:text-emerald-700"
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    <span>
                      Klop (Rp 0) ({shiftsHistory.filter((s) => (s.cashDifference || 0) === 0).length})
                    </span>
                  </button>
                </div>
              </div>

              {/* Sub-Filters: Search & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <div className="relative">
                  <Search className="w-4 h-4 text-[#8E8E93] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={reconciliationSearch}
                    onChange={(e) => setReconciliationSearch(e.target.value)}
                    placeholder="Cari nama kasir, shift, atau supervisor..."
                    className="w-full text-[12px] pl-9 pr-3 py-2 rounded-[10px] bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-black/[0.04] dark:border-white/[0.04] outline-none focus:border-[#008B94]"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-[#8E8E93] shrink-0" />
                  <select
                    value={reconciliationCategoryFilter}
                    onChange={(e) => setReconciliationCategoryFilter(e.target.value)}
                    className="w-full text-[12px] px-3 py-2 rounded-[10px] bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-black/[0.04] dark:border-white/[0.04] outline-none font-medium text-[#1C1C1E] dark:text-white"
                  >
                    <option value="ALL">Semua Kategori Penyebab</option>
                    <option value="NONE_EXACT_MATCH">✅ Kas Sesuai (Klop)</option>
                    <option value="COIN_ROUNDING">🪙 Pembulatan Koin Receh</option>
                    <option value="WRONG_CHANGE">⚠️ Salah Hitung Kembalian</option>
                    <option value="OFFLINE_RECEIPT">🧾 Struk Manual Tertinggal</option>
                    <option value="PETTY_CASH_MISMATCH">📦 Selisih Bon Kas Kecil</option>
                    <option value="DAMAGED_OR_COUNTERFEIT">❌ Uang Rusak Sobek / Ditolak</option>
                    <option value="OTHER">🔍 Lainnya / Investigasi Khusus</option>
                  </select>
                </div>

                <div className="text-right text-[11px] text-[#8E8E93] self-center">
                  Menampilkan{" "}
                  <strong className="text-[#1C1C1E] dark:text-white">
                    {
                      shiftsHistory.filter((shift) => {
                        const diff = shift.cashDifference || 0;
                        if (reconciliationFilter === "DISCREPANCY_ONLY" && diff === 0) return false;
                        if (reconciliationFilter === "EXACT_MATCH" && diff !== 0) return false;
                        if (
                          reconciliationCategoryFilter !== "ALL" &&
                          shift.discrepancyCategory !== reconciliationCategoryFilter
                        )
                          return false;
                        if (reconciliationSearch.trim()) {
                          const q = reconciliationSearch.toLowerCase();
                          const matchName = shift.cashierName.toLowerCase().includes(q);
                          const matchNote = (shift.closingNote || "").toLowerCase().includes(q);
                          const matchReason = (shift.discrepancyReasonText || "").toLowerCase().includes(q);
                          const matchSuper = (shift.supervisorAuth?.supervisorName || "").toLowerCase().includes(q);
                          if (!matchName && !matchNote && !matchReason && !matchSuper) return false;
                        }
                        return true;
                      }).length
                    }
                  </strong>{" "}
                  dari {shiftsHistory.length} rekonsiliasi
                </div>
              </div>

              {/* Table of Reconciliation Logs */}
              <div className="w-full max-w-full min-w-0 overflow-x-auto pt-2">
                <table className="w-full min-w-[850px] text-left text-[12px]">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-800 text-[#8E8E93] text-[11px] uppercase tracking-wider font-semibold">
                      <th className="pb-3">Waktu & Shift</th>
                      <th className="pb-3">Kasir Bertugas</th>
                      <th className="pb-3 text-right">Ekspektasi Sistem</th>
                      <th className="pb-3 text-right">Fisik di Laci</th>
                      <th className="pb-3 text-center">Selisih Kas</th>
                      <th className="pb-3">Penyebab & Catatan</th>
                      <th className="pb-3">Login Otorisasi Supervisor</th>
                      <th className="pb-3">Tindakan</th>
                      <th className="pb-3 text-right">Berita Acara</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
                    {shiftsHistory
                      .filter((shift) => {
                        const diff = shift.cashDifference || 0;
                        if (reconciliationFilter === "DISCREPANCY_ONLY" && diff === 0) return false;
                        if (reconciliationFilter === "EXACT_MATCH" && diff !== 0) return false;
                        if (
                          reconciliationCategoryFilter !== "ALL" &&
                          shift.discrepancyCategory !== reconciliationCategoryFilter
                        )
                          return false;
                        if (reconciliationSearch.trim()) {
                          const q = reconciliationSearch.toLowerCase();
                          const matchName = shift.cashierName.toLowerCase().includes(q);
                          const matchNote = (shift.closingNote || "").toLowerCase().includes(q);
                          const matchReason = (shift.discrepancyReasonText || "").toLowerCase().includes(q);
                          const matchSuper = (shift.supervisorAuth?.supervisorName || "").toLowerCase().includes(q);
                          if (!matchName && !matchNote && !matchReason && !matchSuper) return false;
                        }
                        return true;
                      })
                      .map((shift) => {
                        const diff = shift.cashDifference || 0;
                        const isKlop = diff === 0;
                        const isSurplus = diff > 0;

                        return (
                          <tr
                            key={shift.id}
                            className="hover:bg-neutral-50 dark:hover:bg-neutral-900/40 transition-colors"
                          >
                            <td className="py-3.5">
                              <span className="font-bold text-[#1C1C1E] dark:text-white block">
                                Shift {shift.shiftNumber}
                              </span>
                              <span className="text-[10px] text-[#8E8E93] font-mono">
                                {new Date(shift.startTime).toLocaleDateString("id-ID", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </span>
                            </td>

                            <td className="py-3.5">
                              <span className="font-semibold text-[#1C1C1E] dark:text-white block">
                                {shift.cashierName}
                              </span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] text-[#8E8E93]">
                                  {shift.terminalId}
                                </span>
                                {shift.handoverLog && (
                                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-teal-50 text-[#008B94] dark:bg-teal-950 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                                    <ArrowRightLeft className="w-2.5 h-2.5" />
                                    <span>Serah Terima</span>
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="py-3.5 text-right font-mono text-[#8E8E93] tabular-nums">
                              {formatRupiah(shift.expectedCashTotal || 0)}
                            </td>

                            <td className="py-3.5 text-right font-mono font-bold text-[#1C1C1E] dark:text-white tabular-nums">
                              {formatRupiah(shift.actualCashCount || 0)}
                            </td>

                            {/* Difference Badge */}
                            <td className="py-3.5 text-center">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-[8px] text-[11px] font-black font-mono tabular-nums ${
                                  isKlop
                                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                                    : isSurplus
                                    ? "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                                    : "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                                }`}
                              >
                                {isKlop ? (
                                  <>
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    <span>KLOP (Rp 0)</span>
                                  </>
                                ) : isSurplus ? (
                                  <span>+{formatRupiah(diff)}</span>
                                ) : (
                                  <span>{formatRupiah(diff)}</span>
                                )}
                              </span>
                            </td>

                            {/* Discrepancy Category & Reason */}
                            <td className="py-3.5 max-w-[220px]">
                              <span className="text-[11px] font-semibold text-[#1C1C1E] dark:text-white block">
                                {shift.discrepancyCategory === "COIN_ROUNDING"
                                  ? "🪙 Pembulatan Receh"
                                  : shift.discrepancyCategory === "WRONG_CHANGE"
                                  ? "⚠️ Salah Kembalian"
                                  : shift.discrepancyCategory === "OFFLINE_RECEIPT"
                                  ? "🧾 Struk Manual"
                                  : shift.discrepancyCategory === "PETTY_CASH_MISMATCH"
                                  ? "📦 Bon Kas Kecil"
                                  : shift.discrepancyCategory === "DAMAGED_OR_COUNTERFEIT"
                                  ? "❌ Uang Rusak / Ditolak"
                                  : isKlop
                                  ? "✅ Kas Sesuai (Klop)"
                                  : "🔍 Khusus"}
                              </span>
                              <p
                                className="text-[10px] text-[#8E8E93] truncate"
                                title={shift.discrepancyReasonText || shift.closingNote}
                              >
                                {shift.discrepancyReasonText || shift.closingNote || "-"}
                              </p>
                            </td>

                            {/* Supervisor Login Auth */}
                            <td className="py-3.5">
                              {shift.supervisorAuth?.isAuthorized ? (
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-1 text-[11px] font-bold text-purple-700 dark:text-purple-300">
                                    <KeyRound className="w-3 h-3 text-purple-600" />
                                    <span>{shift.supervisorAuth.supervisorName.split(",")[0]}</span>
                                  </div>
                                  <span className="inline-block px-1.5 py-0.2 rounded text-[8px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                                    PIN DIGITAL VERIFIED
                                  </span>
                                </div>
                              ) : isKlop ? (
                                <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Otomatis (Kas Klop)</span>
                                </span>
                              ) : (
                                <span className="text-[10px] text-neutral-400 italic">
                                  Menunggu Otorisasi
                                </span>
                              )}
                            </td>

                            {/* Settlement Action */}
                            <td className="py-3.5">
                              <span
                                className={`px-2 py-0.5 rounded-[6px] text-[10px] font-bold ${
                                  shift.settlementAction === "PHARMACY_ABSORBED"
                                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                    : shift.settlementAction === "CASHIER_LIABILITY"
                                    ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                                    : "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                                }`}
                              >
                                {shift.settlementAction === "PHARMACY_ABSORBED"
                                  ? "Beban Apotek"
                                  : shift.settlementAction === "CASHIER_LIABILITY"
                                  ? "Tanggung Jawab Kasir"
                                  : "Disetujui"}
                              </span>
                            </td>

                            {/* Action: Print Berita Acara & Z-Report */}
                            <td className="py-3.5 text-right">
                              <button
                                type="button"
                                onClick={() => handleOpenZReport(shift)}
                                className="px-3 py-1.5 rounded-[8px] bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-[#1C1C1E] dark:text-white text-[11px] font-bold inline-flex items-center gap-1 transition-all"
                                title="Buka dan Cetak Berita Acara Rekonsiliasi & Z-Report (80mm)"
                              >
                                <Printer className="w-3 h-3 text-[#008B94]" />
                                <span>Cetak Berita Acara</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PETTY CASH LEDGER */}
        {activeTab === "PETTY_CASH" && (
          <div className="w-full max-w-full min-w-0 overflow-hidden bg-white dark:bg-[#1C1C1E] p-4 sm:p-6 rounded-[22px] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-100 dark:border-neutral-800">
              <div>
                <h2 className="text-[17px] font-bold text-[#1C1C1E] dark:text-white">
                  Buku Kas Kecil Apotek (Petty Cash Ledger)
                </h2>
                <p className="text-[12px] text-[#8E8E93]">
                  Catatan mutasi operasional apotek (es pendingin vaksin, thermal struk kasir, kurir cito, topup modal)
                </p>
              </div>

              {isShiftActive && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPettyCashDefaultType("PAID_OUT");
                      setIsPettyCashOpen(true);
                    }}
                    className="px-3.5 py-2 rounded-[10px] bg-rose-600 hover:bg-rose-700 text-white text-[12px] font-semibold flex items-center gap-1.5 shadow-sm"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    <span>Catat Kas Keluar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPettyCashDefaultType("PAID_IN");
                      setIsPettyCashOpen(true);
                    }}
                    className="px-3.5 py-2 rounded-[10px] bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-semibold flex items-center gap-1.5 shadow-sm"
                  >
                    <ArrowDownLeft className="w-4 h-4" />
                    <span>Catat Kas Masuk</span>
                  </button>
                </div>
              )}
            </div>

            {/* Petty Cash Table */}
            <div className="w-full max-w-full min-w-0 overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-[12px]">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-800 text-[#8E8E93]">
                    <th className="pb-3 font-semibold">Waktu & Tanggal</th>
                    <th className="pb-3 font-semibold">Jenis Mutasi</th>
                    <th className="pb-3 font-semibold">Kategori</th>
                    <th className="pb-3 font-semibold">Keperluan / Keterangan</th>
                    <th className="pb-3 font-semibold">Pihak Terkait</th>
                    <th className="pb-3 font-semibold">Petugas Kasir</th>
                    <th className="pb-3 font-semibold text-right">Nominal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
                  {pettyCashMovements.map((movement) => (
                    <tr key={movement.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/40">
                      <td className="py-3 font-mono text-[#8E8E93]">
                        {new Date(movement.timestamp).toLocaleString("id-ID")}
                      </td>
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] font-bold text-[10px] ${
                            movement.type === "PAID_OUT"
                              ? "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300"
                              : "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300"
                          }`}
                        >
                          {movement.type === "PAID_OUT" ? (
                            <>
                              <ArrowUpRight className="w-3 h-3" />
                              <span>KAS KELUAR</span>
                            </>
                          ) : (
                            <>
                              <ArrowDownLeft className="w-3 h-3" />
                              <span>KAS MASUK</span>
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3 font-semibold text-[#1C1C1E] dark:text-white">
                        {movement.categoryLabel}
                      </td>
                      <td className="py-3 text-[#636366] dark:text-[#AEAEB2] max-w-[280px]">
                        {movement.reason}
                      </td>
                      <td className="py-3 text-[#8E8E93]">
                        {movement.recipientOrSource}
                      </td>
                      <td className="py-3 font-medium text-[#1C1C1E] dark:text-white">
                        {movement.recordedBy}
                      </td>
                      <td
                        className={`py-3 text-right font-bold tabular-nums ${
                          movement.type === "PAID_OUT"
                            ? "text-rose-600 dark:text-rose-400"
                            : "text-emerald-600 dark:text-emerald-400"
                        }`}
                      >
                        {movement.type === "PAID_OUT" ? "-" : "+"}
                        {formatRupiah(movement.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: DENOMINATION COUNTER WORKSHEET */}
        {activeTab === "COUNTER" && (
          <div className="w-full max-w-full min-w-0 overflow-hidden bg-white dark:bg-[#1C1C1E] p-4 sm:p-6 rounded-[22px] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-6">
            <div className="pb-4 border-b border-neutral-100 dark:border-neutral-800">
              <h2 className="text-[17px] font-bold text-[#1C1C1E] dark:text-white">
                Kalkulator Pecahan Mata Uang Rupiah (Denomination Worksheet)
              </h2>
              <p className="text-[12px] text-[#8E8E93]">
                Alat bantu hitung fisik uang di laci kasir Apotek Kerso Waras sebelum serah terima shift
              </p>
            </div>

            <DenominationCounter
              onChange={(res) => {
                // Denomination calculated live
              }}
            />
          </div>
        )}

        {/* TAB 4: HISTORICAL SHIFTS & OWNER AUDIT */}
        {activeTab === "HISTORY" && (
          <div className="w-full max-w-full min-w-0 overflow-hidden bg-white dark:bg-[#1C1C1E] p-4 sm:p-6 rounded-[22px] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-4">
            <div className="pb-4 border-b border-neutral-100 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-[17px] font-bold text-[#1C1C1E] dark:text-white">
                  Arsip Laporan Shift & Audit Owner / PSA
                </h2>
                <p className="text-[12px] text-[#8E8E93]">
                  Histori rekapitulasi pergantian shift kasir, status selisih kas (Klop/Surplus/Minus), dan tanda tangan audit
                </p>
              </div>

              {isOwnerOrAdmin && (
                <span className="px-3 py-1 rounded-[10px] bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-[11px] font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Mode Verifikasi Owner Aktif</span>
                </span>
              )}
            </div>

            {/* Shifts History Table */}
            <div className="w-full max-w-full min-w-0 overflow-x-auto">
              <table className="w-full min-w-[800px] text-left text-[12px]">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-800 text-[#8E8E93]">
                    <th className="pb-3 font-semibold">Shift & Waktu</th>
                    <th className="pb-3 font-semibold">Kasir Bertugas</th>
                    <th className="pb-3 font-semibold">Modal Awal</th>
                    <th className="pb-3 font-semibold">Penjualan Tunai</th>
                    <th className="pb-3 font-semibold">Fisik Laci</th>
                    <th className="pb-3 font-semibold">Status Selisih</th>
                    <th className="pb-3 font-semibold">Audit Owner / APJ</th>
                    <th className="pb-3 font-semibold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
                  {shiftsHistory.map((shift) => {
                    const diff = shift.cashDifference || 0;
                    const isKlop = diff === 0;
                    const isSurplus = diff > 0;

                    return (
                      <tr key={shift.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/40">
                        <td className="py-3.5">
                          <span className="font-bold text-[#1C1C1E] dark:text-white block">
                            Shift {shift.shiftNumber}
                          </span>
                          <span className="text-[10px] font-mono text-[#8E8E93]">
                            {new Date(shift.startTime).toLocaleDateString("id-ID")} &bull;{" "}
                            {new Date(shift.startTime).toLocaleTimeString("id-ID", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            -
                            {shift.endTime
                              ? new Date(shift.endTime).toLocaleTimeString("id-ID", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "Aktif"}
                          </span>
                        </td>
                        <td className="py-3.5 font-semibold text-[#1C1C1E] dark:text-white">
                          <div>{shift.cashierName}</div>
                          {shift.handoverLog && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[5px] text-[9px] font-bold bg-teal-50 text-[#008B94] dark:bg-teal-950 dark:text-teal-300 border border-teal-200 dark:border-teal-800 mt-1">
                              <ArrowRightLeft className="w-2.5 h-2.5" />
                              <span>Ke: {shift.handoverLog.nextCashierName.split(" ")[0]}</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 tabular-nums text-[#8E8E93]">
                          {formatRupiah(shift.openingCash)}
                        </td>
                        <td className="py-3.5 font-semibold tabular-nums text-emerald-600">
                          {formatRupiah(shift.cashSalesTotal)}
                        </td>
                        <td className="py-3.5 font-bold tabular-nums text-[#1C1C1E] dark:text-white">
                          {formatRupiah(shift.actualCashCount || 0)}
                        </td>
                        <td className="py-3.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-[8px] text-[10px] font-bold tabular-nums ${
                              isKlop
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                : isSurplus
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                                : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                            }`}
                          >
                            {isKlop ? (
                              <>
                                <CheckCircle2 className="w-3 h-3" />
                                <span>KLOP (Rp 0)</span>
                              </>
                            ) : isSurplus ? (
                              <span>LEBIH +{formatRupiah(diff)}</span>
                            ) : (
                              <span>MINUS {formatRupiah(diff)}</span>
                            )}
                          </span>
                          {shift.closingNote && (
                            <p className="text-[10px] text-[#8E8E93] mt-0.5 max-w-[200px] truncate" title={shift.closingNote}>
                              {shift.closingNote}
                            </p>
                          )}
                        </td>
                        <td className="py-3.5">
                          {shift.isAuditedByOwner ? (
                            <div>
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Terverifikasi</span>
                              </span>
                              <p className="text-[10px] text-[#8E8E93] truncate max-w-[180px]" title={shift.auditNote}>
                                {shift.auditedBy?.split(",")[0]}
                              </p>
                            </div>
                          ) : isOwnerOrAdmin ? (
                            <button
                              type="button"
                              onClick={() => handleTriggerAudit(shift)}
                              className="px-2.5 py-1 rounded-[8px] bg-purple-100 hover:bg-purple-200 text-purple-800 text-[11px] font-bold transition-colors"
                            >
                              Verifikasi Sekarang
                            </button>
                          ) : (
                            <span className="text-[11px] text-[#8E8E93] italic">
                              Menunggu Verifikasi
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => handleOpenZReport(shift)}
                            className="px-3 py-1.5 rounded-[10px] bg-[#F5F5F7] dark:bg-[#2C2C2E] hover:bg-neutral-200 text-[#1C1C1E] dark:text-white text-[11px] font-semibold inline-flex items-center gap-1.5 transition-colors"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Z-Report 80mm</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Modals Suite */}
      <ShiftOpenModal isOpen={isShiftOpenOpen} onClose={() => setIsShiftOpenOpen(false)} />
      <ShiftCloseModal isOpen={isShiftCloseOpen} onClose={() => setIsShiftCloseOpen(false)} />
      <ShiftHandoverModal isOpen={isShiftHandoverOpen} onClose={() => setIsShiftHandoverOpen(false)} />
      <PettyCashModal
        isOpen={isPettyCashOpen}
        onClose={() => setIsPettyCashOpen(false)}
        defaultType={pettyCashDefaultType}
      />
      {selectedReportShift && (
        <ShiftReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          shift={selectedReportShift}
          reportType={reportType}
        />
      )}

      {/* Owner Audit Sign-off Dialog */}
      {isAuditDialogOpen && auditTargetShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#1C1C1E] rounded-[22px] p-6 shadow-2xl border border-black/[0.08] dark:border-white/[0.12] space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-[10px] bg-purple-100 text-purple-700">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-[16px] font-bold text-[#1C1C1E] dark:text-white">
                  Verifikasi Audit Kas Shift
                </h3>
                <p className="text-[11px] text-[#8E8E93]">
                  Shift {auditTargetShift.shiftNumber} &bull; {auditTargetShift.cashierName}
                </p>
              </div>
            </div>

            <div className="p-3 bg-neutral-50 dark:bg-neutral-900 rounded-[12px] text-[12px] space-y-1">
              <div className="flex justify-between">
                <span>Ekspektasi Kas Laci:</span>
                <span className="font-semibold tabular-nums">
                  {formatRupiah(auditTargetShift.expectedCashTotal || 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Fisik Dilaporkan Kasir:</span>
                <span className="font-semibold tabular-nums">
                  {formatRupiah(auditTargetShift.actualCashCount || 0)}
                </span>
              </div>
              <div className="flex justify-between font-bold border-t border-neutral-200 dark:border-neutral-800 pt-1">
                <span>Selisih Rekonsiliasi:</span>
                <span
                  className={
                    auditTargetShift.cashDifference === 0
                      ? "text-emerald-600"
                      : "text-rose-600"
                  }
                >
                  {formatRupiah(auditTargetShift.cashDifference || 0)}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[12px] font-semibold text-[#1C1C1E] dark:text-white">
                Catatan Verifikasi Owner / PSA:
              </label>
              <textarea
                rows={2}
                value={auditNoteInput}
                onChange={(e) => setAuditNoteInput(e.target.value)}
                className="w-full p-2.5 rounded-[10px] border border-black/[0.1] dark:border-white/[0.12] bg-[#F5F5F7] dark:bg-[#2C2C2E] text-[12px] text-[#1C1C1E] dark:text-white focus:outline-none focus:border-[#007AFF]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setIsAuditDialogOpen(false)}
                className="px-4 py-2 text-[12px] text-[#636366] hover:text-[#1C1C1E]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleConfirmAudit("APPROVED")}
                className="px-4 py-2 rounded-[10px] bg-purple-600 hover:bg-purple-700 text-white text-[12px] font-bold shadow-sm"
              >
                Tandatangani & Setujui
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Apple HIG Mobile Actions Bottom Sheet */}
      {isMobileActionsOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:hidden animate-in fade-in duration-200">
          <div
            className="fixed inset-0"
            onClick={() => setIsMobileActionsOpen(false)}
          />
          <div className="relative w-full max-w-lg bg-white dark:bg-[#1C1C1E] rounded-t-[24px] p-5 pb-8 shadow-2xl border-t border-black/[0.08] dark:border-white/[0.1] space-y-3 z-10 animate-in slide-in-from-bottom duration-200">
            <div className="w-10 h-1 bg-neutral-300 dark:bg-neutral-700 rounded-full mx-auto mb-1" />

            <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
              <div>
                <h3 className="text-[15px] font-bold text-[#1C1C1E] dark:text-white">
                  Menu & Aksi Shift Kasir
                </h3>
                <p className="text-[11px] text-[#8E8E93]">
                  Apotek Kerso Waras &bull; Shift {currentShift?.shiftNumber || 1}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileActionsOpen(false)}
                className="p-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-neutral-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsMobileActionsOpen(false);
                  handleOpenXReport();
                }}
                className="w-full p-3 rounded-[14px] bg-neutral-50 dark:bg-[#2C2C2E] text-left flex items-center justify-between active:scale-[0.99] transition-transform"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 shrink-0">
                    <FileCheck2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[13px] font-semibold text-[#1C1C1E] dark:text-white block">
                      Cetak X-Report
                    </span>
                    <span className="text-[11px] text-[#8E8E93] block">
                      Bacaan sementara omzet kasir tanpa mereset angka
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-400" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMobileActionsOpen(false);
                  setPettyCashDefaultType("PAID_IN");
                  setIsPettyCashOpen(true);
                }}
                className="w-full p-3 rounded-[14px] bg-neutral-50 dark:bg-[#2C2C2E] text-left flex items-center justify-between active:scale-[0.99] transition-transform"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 shrink-0">
                    <ArrowDownLeft className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[13px] font-semibold text-[#1C1C1E] dark:text-white block">
                      Catat Kas Masuk (Paid In)
                    </span>
                    <span className="text-[11px] text-[#8E8E93] block">
                      Tambahan modal kembalian atau titipan uang
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-400" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMobileActionsOpen(false);
                  setPettyCashDefaultType("PAID_OUT");
                  setIsPettyCashOpen(true);
                }}
                className="w-full p-3 rounded-[14px] bg-neutral-50 dark:bg-[#2C2C2E] text-left flex items-center justify-between active:scale-[0.99] transition-transform"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-rose-100 dark:bg-rose-950 flex items-center justify-center text-rose-600 shrink-0">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[13px] font-semibold text-[#1C1C1E] dark:text-white block">
                      Catat Kas Keluar (Paid Out)
                    </span>
                    <span className="text-[11px] text-[#8E8E93] block">
                      Biaya operasional kas kecil (kertas, es batu, kurir)
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-400" />
              </button>

              {isOwnerOrAdmin && (
                <Link
                  href="/analytics"
                  onClick={() => setIsMobileActionsOpen(false)}
                  className="w-full p-3 rounded-[14px] bg-teal-50 dark:bg-teal-950/40 text-left flex items-center justify-between active:scale-[0.99] transition-transform block"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-teal-100 dark:bg-teal-900 flex items-center justify-center text-[#008B94] shrink-0">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[13px] font-semibold text-[#008B94] dark:text-teal-300 block">
                        Dashboard Analitik & Rekap P&L
                      </span>
                      <span className="text-[11px] text-teal-700/80 dark:text-teal-400 block">
                        Laporan keuangan formal, omzet shift & bulanan
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-teal-600" />
                </Link>
              )}

              <button
                type="button"
                onClick={() => {
                  setIsMobileActionsOpen(false);
                  setIsShiftHandoverOpen(true);
                }}
                className="w-full p-3 rounded-[14px] bg-teal-50 dark:bg-teal-950/40 text-left flex items-center justify-between active:scale-[0.99] transition-transform border border-teal-200 dark:border-teal-800"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-teal-100 dark:bg-teal-900 flex items-center justify-center text-[#008B94] shrink-0">
                    <ArrowRightLeft className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[13px] font-bold text-[#008B94] dark:text-teal-300 block">
                      Serah Terima & Ganti Shift
                    </span>
                    <span className="text-[11px] text-[#8E8E93] block">
                      Hitung uang fisik laci, setor brankas, serah modal kasir berikutnya
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#008B94]" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMobileActionsOpen(false);
                  setIsShiftCloseOpen(true);
                }}
                className="w-full p-3 rounded-[14px] bg-rose-600 text-white text-left flex items-center justify-between active:scale-[0.99] transition-transform shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white shrink-0">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[13px] font-bold text-white block">
                      Tutup Shift Kasir & Rekonsiliasi (Z-Report)
                    </span>
                    <span className="text-[11px] text-white/80 block">
                      Hitung fisik laci, kunci shift, dan cetak Z-Report
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-white/70" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
