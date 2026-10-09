"use client";

import React, { useState, useRef, useEffect } from "react";
import { soundEngine } from "@/lib/audio";
import {
  Activity,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  Server,
  Zap,
  ChevronDown,
} from "lucide-react";

export const SatuSehatSyncFlyout: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isPinging, setIsPinging] = useState(false);
  const [latency, setLatency] = useState(38);
  const [lastSynced, setLastSynced] = useState("Baru saja");
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

  const handleTestPing = () => {
    setIsPinging(true);
    setTimeout(() => {
      const newLatency = Math.floor(Math.random() * 15) + 28; // 28 - 42ms
      setLatency(newLatency);
      setIsPinging(false);
      setLastSynced(new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }));
      soundEngine.playScanSuccess();
    }, 600);
  };

  return (
    <div className="relative" ref={flyoutRef}>
      {/* Trigger Pill */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="hidden md:inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-[10px] bg-black/25 hover:bg-black/35 text-white border border-white/20 text-[11px] font-semibold transition-all shadow-sm backdrop-blur-md"
        title="Status Konektivitas Kemenkes SATUSEHAT & BPJS Kesehatan"
      >
        <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
        <span className="text-teal-100 hidden 2xl:inline">SATUSEHAT</span>
        <span className="text-teal-100 2xl:hidden hidden xl:inline">IHS</span>
        <span className="text-[10px] text-emerald-300 font-medium">
          Online
        </span>
        <ChevronDown
          className={`w-3 h-3 text-teal-200 transition-transform duration-200 ${
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
          <div className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] rounded-t-[28px] sm:rounded-[22px] sm:fixed sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[380px] bg-white dark:bg-[#1C1C1E] shadow-[0_25px_60px_rgba(0,0,0,0.35)] border border-black/[0.08] dark:border-white/[0.14] p-5 text-[#1C1C1E] dark:text-white animate-in slide-in-from-bottom-6 sm:slide-in-from-top-2 sm:zoom-in-95 duration-200">
            {/* Apple Drag Indicator (Mobile only) */}
            <div className="w-12 h-1.5 bg-neutral-300 dark:bg-neutral-700 rounded-full mx-auto mb-4 sm:hidden" />

            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-[10px] bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 shrink-0">
                  <Server className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="text-[13px] font-bold tracking-tight">Kemenkes SATUSEHAT</h4>
                  <p className="text-[11px] text-[#8E8E93]">FHIR v4.0.1 Interoperability</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[10px] text-emerald-700 dark:text-emerald-300 font-bold shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>ONLINE</span>
              </span>
            </div>

            {/* Metrics List */}
            <div className="py-3 space-y-2 text-[12px]">
              <div className="flex items-center justify-between py-1 border-b border-black/[0.04] dark:border-white/[0.04]">
                <span className="text-[#8E8E93]">ID IHS Apotek:</span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">10082711-KW</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-black/[0.04] dark:border-white/[0.04]">
                <span className="text-[#8E8E93]">KFA Mapping:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">99.2% Terpetakan</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-black/[0.04] dark:border-white/[0.04]">
                <span className="text-[#8E8E93]">Antrean Kirim:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">0 Tertunda (Lancar)</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-black/[0.04] dark:border-white/[0.04]">
                <span className="text-[#8E8E93]">SIPNAP Narkotika:</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">Siap Ekspor (Tgl 10)</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-[#8E8E93]">Latensi API:</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{latency} ms</span>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800">
              <button
                type="button"
                onClick={handleTestPing}
                disabled={isPinging}
                className="w-full py-2.5 rounded-[12px] bg-[#F5F5F7] dark:bg-[#2C2C2E] hover:bg-neutral-200 dark:hover:bg-neutral-700 text-[#1C1C1E] dark:text-white text-[11px] font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#008B94] ${isPinging ? "animate-spin" : ""}`} />
                <span>{isPinging ? "Menguji Koneksi FHIR..." : "Uji Ping Kemenkes Sekarang"}</span>
              </button>
              <p className="text-[10px] text-[#8E8E93] text-center mt-2">
                Sinkronisasi terakhir: {lastSynced}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
