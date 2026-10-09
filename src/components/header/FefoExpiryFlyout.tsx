"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { useApotekStore } from "@/lib/store";
import { soundEngine } from "@/lib/audio";
import {
  AlertTriangle,
  Clock,
  ChevronDown,
  ArrowRight,
  Package,
  Layers,
  ShieldAlert,
  Calendar,
  CheckCircle2,
} from "lucide-react";

interface ExpiringBatchInfo {
  productId: string;
  productName: string;
  drugClass: string;
  batchId: string;
  batchNumber: string;
  expiryDate: string;
  daysRemaining: number;
  currentStock: number;
  baseUnit: string;
  locationRack: string;
}

export const FefoExpiryFlyout: React.FC = () => {
  const { products } = useApotekStore();
  const [isOpen, setIsOpen] = useState(false);
  const flyoutRef = useRef<HTMLDivElement>(null);

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

  // Calculate batches expiring within 90 days
  const expiringBatches = useMemo(() => {
    const today = new Date("2026-10-07T00:00:00"); // Baseline context date
    const list: ExpiringBatchInfo[] = [];

    products.forEach((product) => {
      product.batches.forEach((batch) => {
        const exp = new Date(batch.expiryDate);
        const diffTime = exp.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 90 && batch.currentStock > 0) {
          list.push({
            productId: product.id,
            productName: product.name,
            drugClass: product.drugClass,
            batchId: batch.id,
            batchNumber: batch.batchNumber,
            expiryDate: batch.expiryDate,
            daysRemaining: diffDays,
            currentStock: batch.currentStock,
            baseUnit: product.baseUnit,
            locationRack: batch.locationRack,
          });
        }
      });
    });

    return list.sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [products]);

  const count = expiringBatches.length;

  if (count === 0) {
    return null;
  }

  return (
    <div className="relative" ref={flyoutRef}>
      {/* Trigger Pill */}
      <button
        type="button"
        onClick={() => {
          setIsOpen((prev) => !prev);
          soundEngine.playKeyTap();
        }}
        className="hidden md:inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-[12px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-100 border border-amber-400/30 text-[11px] font-semibold transition-all shadow-sm backdrop-blur-md"
        title={`${count} batch obat mendekati kedaluwarsa (<90 hari). Klik untuk melihat detail & tindakan retur.`}
      >
        <span className="p-0.5 rounded-full bg-amber-400/30 text-amber-200">
          <Clock className="w-3 h-3" />
        </span>
        <span className="text-amber-100 font-medium hidden 2xl:inline">Radar ED</span>
        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-400 text-amber-950">
          {count}
        </span>
        <ChevronDown
          className={`w-3 h-3 text-amber-200 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Flyout Popover / Apple HIG Mobile Sheet */}
      {isOpen && (
        <>
          {/* Mobile Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 sm:hidden animate-in fade-in duration-200"
            onClick={() => setIsOpen(false)}
          />

          {/* Apple HIG Sheet (Mobile) / Popover (Desktop) */}
          <div className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] rounded-t-[28px] sm:rounded-[22px] sm:fixed sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[420px] sm:max-h-[580px] bg-white dark:bg-[#1C1C1E] shadow-[0_25px_60px_rgba(0,0,0,0.35)] border border-black/[0.08] dark:border-white/[0.14] p-5 text-[#1C1C1E] dark:text-white flex flex-col animate-in slide-in-from-bottom-6 sm:slide-in-from-top-2 sm:zoom-in-95 duration-200">
            {/* Apple Drag Indicator (Mobile only) */}
            <div className="w-12 h-1.5 bg-neutral-300 dark:bg-neutral-700 rounded-full mx-auto mb-4 sm:hidden shrink-0" />

            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-neutral-100 dark:border-neutral-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-[10px] bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 shrink-0">
                  <AlertTriangle className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="text-[13px] font-bold tracking-tight">Radar FEFO & Expiring</h4>
                  <p className="text-[11px] text-[#8E8E93]">
                    {count} Batch Kedaluwarsa &le; 90 Hari
                  </p>
                </div>
              </div>
              <Link
                href="/inventory"
                onClick={() => setIsOpen(false)}
                className="text-[11px] font-semibold text-[#008B94] dark:text-teal-400 hover:underline flex items-center gap-1 shrink-0"
              >
                <span>Semua Stok</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {/* List of Expiring Batches */}
            <div className="py-3 space-y-2.5 overflow-y-auto max-h-[340px] pr-1.5 no-scrollbar">
              {expiringBatches.map((item) => {
                const isUrgent = item.daysRemaining <= 45;
                return (
                  <div
                    key={item.batchId}
                    className={`p-3 rounded-[14px] border text-[11px] transition-all ${
                      isUrgent
                        ? "bg-rose-50/80 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 shadow-sm"
                        : "bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-[13px] leading-tight text-[#1C1C1E] dark:text-white block truncate">
                          {item.productName}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] text-[#8E8E93] mt-0.5">
                          <span className="font-mono">Batch: {item.batchNumber}</span>
                          <span>&bull;</span>
                          <span>
                            Sisa:{" "}
                            <strong className="text-slate-800 dark:text-slate-200">
                              {item.currentStock} {item.baseUnit}
                            </strong>
                          </span>
                        </div>
                      </div>
                      <span
                        className={`whitespace-nowrap shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          isUrgent ? "bg-rose-500 text-white" : "bg-amber-500 text-white"
                        }`}
                      >
                        {item.daysRemaining > 0
                          ? `${item.daysRemaining} hari lagi`
                          : "Hari ini!"}
                      </span>
                    </div>

                    <div className="mt-2 pt-1.5 border-t border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between text-[10px]">
                      <span className="text-neutral-500 dark:text-neutral-400">
                        Rak:{" "}
                        <strong className="font-medium text-slate-700 dark:text-slate-300">
                          {item.locationRack}
                        </strong>
                      </span>
                      <span className="text-[#8E8E93]">
                        ED:{" "}
                        {new Date(item.expiryDate).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action Footer */}
            <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center gap-2 shrink-0">
              <Link
                href="/procurement"
                onClick={() => setIsOpen(false)}
                className="flex-1 py-2 text-center text-[11px] font-semibold rounded-[12px] bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-[#1C1C1E] dark:text-white transition-colors"
              >
                Ajukan Retur PBF
              </Link>
              <Link
                href="/"
                onClick={() => setIsOpen(false)}
                className="flex-1 py-2 text-center text-[11px] font-semibold rounded-[12px] bg-[#008B94] hover:bg-[#00767E] text-white shadow-sm transition-colors"
              >
                Prioritaskan di POS
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
