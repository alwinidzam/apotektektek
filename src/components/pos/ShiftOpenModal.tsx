"use client";

import React, { useState } from "react";
import { useApotekStore } from "@/lib/store";
import { formatRupiah } from "@/lib/utils";
import { showAppleToast } from "@/components/ui/AppleToast";
import { X, KeyRound, PlayCircle, DollarSign, Wallet } from "lucide-react";

interface ShiftOpenModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShiftOpenModal: React.FC<ShiftOpenModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { openShift, currentUser } = useApotekStore();
  const [openingCash, setOpeningCash] = useState(200000);
  const [shiftNumber, setShiftNumber] = useState<1 | 2 | 3>(1);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (openingCash < 0) {
      showAppleToast({
        type: "error",
        title: "Input Tidak Valid",
        message: "Modal awal laci kasir tidak boleh bernilai negatif!",
      });
      return;
    }
    openShift(openingCash, shiftNumber);
    showAppleToast({
      type: "success",
      title: "Shift Dibuka",
      message: `Shift ${shiftNumber} berhasil dibuka dengan modal awal ${formatRupiah(openingCash)}.`,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white dark:bg-[#1C1C1E] rounded-[22px] shadow-[0_25px_60px_rgba(0,0,0,0.25)] border border-black/[0.08] dark:border-white/[0.12] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-[8px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700">
              <Wallet className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-[17px] font-semibold text-[#1C1C1E] dark:text-white tracking-tight">
                Buka Shift Kasir Baru
              </h2>
              <p className="text-[12px] text-[#8E8E93]">
                {currentUser.name} &bull; Terminal 01
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-[#8E8E93] hover:text-[#1C1C1E] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#8E8E93] mb-1">
              Pilih Waktu Shift
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { shift: 1 as const, label: "Shift 1 Pagi", time: "07:30 - 15:00" },
                { shift: 2 as const, label: "Shift 2 Siang", time: "15:00 - 22:00" },
                { shift: 3 as const, label: "Shift 3 Malam", time: "22:00 - 07:30" },
              ].map((s) => (
                <button
                  key={s.shift}
                  type="button"
                  onClick={() => setShiftNumber(s.shift)}
                  className={`p-2.5 rounded-[12px] border text-left transition-all ${
                    shiftNumber === s.shift
                      ? "border-[#007AFF] bg-blue-50/60 dark:bg-blue-950/40 text-[#007AFF]"
                      : "border-black/[0.08] dark:border-white/[0.12] hover:bg-neutral-50"
                  }`}
                >
                  <span className="text-[12px] font-bold block">{s.label}</span>
                  <span className="text-[10px] text-[#8E8E93] block">{s.time}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#8E8E93] mb-1">
              Modal Awal Uang Kembalian (Laci Kasir) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-[14px] font-medium text-[#8E8E93]">Rp</span>
              <input
                type="number"
                required
                min="0"
                step="5000"
                value={openingCash}
                onChange={(e) => setOpeningCash(Number(e.target.value))}
                className="w-full text-[16px] font-bold text-[#1C1C1E] dark:text-white pl-10 pr-3 py-2.5 rounded-[12px] bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-transparent focus:border-[#007AFF] outline-none tabular-nums"
              />
            </div>
            {/* Quick Chips */}
            <div className="flex gap-2 mt-2">
              {[100000, 200000, 300000, 500000].map((nominal) => (
                <button
                  key={nominal}
                  type="button"
                  onClick={() => setOpeningCash(nominal)}
                  className="text-[11px] px-2.5 py-1 rounded-[8px] bg-neutral-100 dark:bg-neutral-800 text-[#636366] hover:bg-neutral-200 font-medium"
                >
                  {formatRupiah(nominal)}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 bg-neutral-50 dark:bg-neutral-900 rounded-[12px] border border-black/[0.04] text-[12px] text-[#8E8E93]">
            Pastikan fisik uang di laci dihitung bersama sebelum membuka terminal. Modal awal ini akan menjadi dasar perhitungan selisih saat tutup shift.
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[13px] font-medium text-[#636366] hover:text-[#1C1C1E]"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-[13px] font-semibold rounded-[10px] bg-[#34C759] text-white hover:bg-[#2EB34F] transition-colors shadow-sm flex items-center gap-1.5"
            >
              <PlayCircle className="w-4 h-4" />
              <span>Buka Kasir Sekarang</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
