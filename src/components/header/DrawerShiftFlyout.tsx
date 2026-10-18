"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useApotekStore } from "@/lib/store";
import { formatRupiah } from "@/lib/utils";
import { soundEngine } from "@/lib/audio";
import {
  Wallet,
  Lock,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRightLeft,
  FileCheck2,
  Zap,
  ChevronDown,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";

interface DrawerShiftFlyoutProps {
  onOpenPettyCash: (type: "PAID_IN" | "PAID_OUT") => void;
  onOpenShiftOpen: () => void;
  onOpenShiftClose: () => void;
  onOpenXReport: () => void;
  onOpenHandover?: () => void;
}

export const DrawerShiftFlyout: React.FC<DrawerShiftFlyoutProps> = ({
  onOpenPettyCash,
  onOpenShiftOpen,
  onOpenShiftClose,
  onOpenXReport,
  onOpenHandover,
}) => {
  const { currentShift } = useApotekStore();
  const [isOpen, setIsOpen] = useState(false);
  const [drawerKickFeedback, setDrawerKickFeedback] = useState(false);
  const flyoutRef = useRef<HTMLDivElement>(null);

  const isShiftActive = currentShift && currentShift.status === "OPEN";

  const expectedCash = isShiftActive
    ? currentShift.openingCash +
      currentShift.cashSalesTotal +
      currentShift.cashInTotal -
      currentShift.cashOutTotal -
      currentShift.refundTotal
    : 0;

  // Close flyout on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (flyoutRef.current && !flyoutRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleDrawerKick = () => {
    soundEngine.playCheckoutChime();
    setDrawerKickFeedback(true);
    setTimeout(() => setDrawerKickFeedback(false), 2000);
  };

  if (!isShiftActive) {
    return (
      <button
        type="button"
        onClick={onOpenShiftOpen}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800/60 text-[11.5px] font-semibold transition-colors"
        title="Buka Shift Kasir"
      >
        <Wallet className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
        <span>Buka Shift</span>
      </button>
    );
  }

  return (
    <div className="relative" ref={flyoutRef}>
      {/* Trigger Pill */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-neutral-100/80 hover:bg-neutral-200/70 dark:bg-white/[0.06] dark:hover:bg-white/10 text-neutral-700 dark:text-neutral-200 border border-neutral-200/80 dark:border-white/10 text-[11.5px] font-medium transition-colors"
        title="Rincian kas laci & shift"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
        <span className="text-neutral-600 dark:text-neutral-400 hidden sm:inline">Shift {currentShift.shiftNumber}</span>
        <span className="text-neutral-600 dark:text-neutral-400 sm:hidden">S{currentShift.shiftNumber}</span>
        <span className="font-semibold text-neutral-900 dark:text-white font-mono tabular-nums hidden md:inline">
          &middot; {formatRupiah(expectedCash)}
        </span>
        <ChevronDown
          className={`w-3 h-3 text-neutral-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Flyout Menu / Apple HIG Mobile Bottom Sheet */}
      {isOpen && (
        <>
          {/* Mobile Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 sm:hidden animate-in fade-in duration-200"
            onClick={() => setIsOpen(false)}
          />

          {/* Apple HIG Sheet (Mobile) / Popover (Desktop) */}
          <div className="fixed inset-x-0 bottom-0 z-50 max-h-[88vh] overflow-y-auto rounded-t-[28px] sm:rounded-[22px] sm:fixed sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[420px] sm:max-h-none bg-white dark:bg-[#1C1C1E] shadow-[0_25px_60px_rgba(0,0,0,0.35)] border border-black/[0.08] dark:border-white/[0.14] p-5 text-[#1C1C1E] dark:text-white animate-in slide-in-from-bottom-6 sm:slide-in-from-top-2 sm:zoom-in-95 duration-200">
            {/* Apple Sheet Pull Bar (Mobile only) */}
            <div className="w-12 h-1.5 bg-neutral-300 dark:bg-neutral-700 rounded-full mx-auto mb-4 sm:hidden" />

            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 shrink-0">
                  <Wallet className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="text-[13px] font-bold tracking-tight">Laci Kasir Shift {currentShift.shiftNumber}</h4>
                  <p className="text-[11px] text-[#8E8E93]">
                    Petugas: {currentShift.cashierName} ({currentShift.terminalId})
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                AKTIF
              </span>
            </div>

          {/* Arus Kas Real-time Matrix */}
          <div className="py-3 space-y-1.5 text-[11px]">
            <div className="flex justify-between text-[#8E8E93]">
              <span>Modal Awal Kasir:</span>
              <span className="font-mono text-[#1C1C1E] dark:text-white tabular-nums">
                {formatRupiah(currentShift.openingCash)}
              </span>
            </div>
            <div className="flex justify-between text-[#8E8E93]">
              <span>Penjualan Tunai ({currentShift.totalTransactionsCount} struk):</span>
              <span className="font-mono text-emerald-600 font-semibold tabular-nums">
                +{formatRupiah(currentShift.cashSalesTotal)}
              </span>
            </div>
            <div className="flex justify-between text-[#8E8E93]">
              <span>Non-Tunai (QRIS, EDC, Transfer):</span>
              <span className="font-mono text-blue-600 tabular-nums">
                {formatRupiah(currentShift.nonCashSalesTotal || (currentShift.qrisSalesTotal + currentShift.edcSalesTotal))}
              </span>
            </div>
            <div className="flex justify-between text-[#8E8E93]">
              <span>Kas Masuk / Topup:</span>
              <span className="font-mono text-teal-600 tabular-nums">
                +{formatRupiah(currentShift.cashInTotal)}
              </span>
            </div>
            <div className="flex justify-between text-[#8E8E93]">
              <span>Kas Keluar Operasional (Petty Cash):</span>
              <span className="font-mono text-rose-600 tabular-nums">
                -{formatRupiah(currentShift.cashOutTotal)}
              </span>
            </div>
            <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex justify-between font-bold text-[13px]">
              <span>Ekspektasi Fisik Laci:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
                {formatRupiah(expectedCash)}
              </span>
            </div>
          </div>

          {/* Hardware Drawer Kick & Action Shortcuts */}
          <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 space-y-2">
            <button
              type="button"
              onClick={handleDrawerKick}
              className={`w-full py-2 rounded-[10px] text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all ${
                drawerKickFeedback
                  ? "bg-emerald-600 text-white"
                  : "bg-[#F5F5F7] dark:bg-[#2C2C2E] hover:bg-neutral-200 text-[#1C1C1E] dark:text-white"
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>{drawerKickFeedback ? "Laci Kasir Terbuka! (ESC/POS)" : "Buka Laci Kasir (Drawer Kick)"}</span>
            </button>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenPettyCash("PAID_OUT");
                }}
                className="py-1.5 rounded-[9px] bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 text-[11px] font-semibold flex items-center justify-center gap-1"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>Kas Keluar</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenPettyCash("PAID_IN");
                }}
                className="py-1.5 rounded-[9px] bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 text-[11px] font-semibold flex items-center justify-center gap-1"
              >
                <ArrowDownLeft className="w-3.5 h-3.5" />
                <span>Kas Masuk</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  if (onOpenHandover) onOpenHandover();
                }}
                className="py-1.5 rounded-[9px] bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 text-[#008B94] dark:text-teal-300 text-[11px] font-semibold flex items-center justify-center gap-1 border border-teal-200 dark:border-teal-800"
                title="Serah Terima & Ganti Shift Kasir"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>Ganti Shift</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenShiftClose();
                }}
                className="py-1.5 rounded-[9px] bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-semibold flex items-center justify-center gap-1 shadow-sm"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Tutup Shift</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenXReport();
              }}
              className="w-full py-1.5 rounded-[9px] bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-[#1C1C1E] dark:text-white text-[11px] font-semibold flex items-center justify-center gap-1"
            >
              <FileCheck2 className="w-3.5 h-3.5 text-blue-600" />
              <span>X-Report (Bacaan Kasir)</span>
            </button>

            <Link
              href="/shifts"
              onClick={() => setIsOpen(false)}
              className="w-full py-1 text-center text-[10px] text-[#008B94] dark:text-teal-400 font-bold hover:underline flex items-center justify-center gap-1 block"
            >
              <span>Buka Pusat Manajemen Shift Lengkap</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </>
    )}
    </div>
  );
};
