"use client";

import React, { useState } from "react";
import { useApotekStore } from "@/lib/store";
import { PettyCashCategory, APOTEK_KERSO_WARAS_INFO, PettyCashMovement } from "@/lib/types";
import { formatRupiah } from "@/lib/utils";
import { showAppleToast } from "@/components/ui/AppleToast";
import {
  X,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Printer,
  CheckCircle2,
  FileText,
  AlertCircle,
} from "lucide-react";

interface PettyCashModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: "PAID_IN" | "PAID_OUT";
}

const CATEGORY_OPTIONS: {
  id: PettyCashCategory;
  label: string;
  defaultReason: string;
  type: "PAID_OUT" | "PAID_IN" | "BOTH";
}[] = [
  {
    id: "COLD_CHAIN_ICE",
    label: "🧊 Es Batu Pendingin Cold Chain (Vaksin / Insulin)",
    defaultReason: "Beli es batu balok cooler box insulin Novorapid / Lantus",
    type: "PAID_OUT",
  },
  {
    id: "RECEIPT_PAPER",
    label: "🧾 Kertas Thermal Roll Struk Kasir 80mm",
    defaultReason: "Beli isi ulang kertas thermal printer kasir 80mm",
    type: "PAID_OUT",
  },
  {
    id: "COURIER_FEE",
    label: "🛵 Ongkir Kurir Antar Obat Cito (Grab/Gojek)",
    defaultReason: "Talangan ongkir pengantaran resep obat cito pasien",
    type: "PAID_OUT",
  },
  {
    id: "CASH_FLOAT_TOPUP",
    label: "💵 Tambahan Modal / Uang Kembalian Pecahan Kecil",
    defaultReason: "Tukar uang receh / penambahan modal kasir dari brankas",
    type: "PAID_IN",
  },
  {
    id: "CLEANING_SUPPLIES",
    label: "🧹 Sanitasi & Kebersihan Apotek",
    defaultReason: "Beli cairan disinfektan / sabun cuci tangan apotek",
    type: "PAID_OUT",
  },
  {
    id: "EMERGENCY_EXPENSE",
    label: "🚑 Keperluan Mendesak / Darurat",
    defaultReason: "Pengeluaran tak terduga operasional apotek",
    type: "PAID_OUT",
  },
  {
    id: "OTHER",
    label: "📦 Pengeluaran / Pemasukan Lainnya",
    defaultReason: "Keperluan operasional apotek",
    type: "BOTH",
  },
];

export const PettyCashModal: React.FC<PettyCashModalProps> = ({
  isOpen,
  onClose,
  defaultType = "PAID_OUT",
}) => {
  const { currentShift, currentUser, recordPettyCash } = useApotekStore();
  const [movementType, setMovementType] = useState<"PAID_IN" | "PAID_OUT">(defaultType);
  const [category, setCategory] = useState<PettyCashCategory>(
    defaultType === "PAID_IN" ? "CASH_FLOAT_TOPUP" : "COLD_CHAIN_ICE"
  );
  const [amount, setAmount] = useState<number>(15000);
  const [reason, setReason] = useState<string>(
    "Beli es batu balok cooler box insulin Novorapid / Lantus"
  );
  const [recipientOrSource, setRecipientOrSource] = useState<string>("Toko Es Mojo");
  const [savedMovement, setSavedMovement] = useState<PettyCashMovement | null>(null);

  if (!isOpen) return null;

  const handleCategorySelect = (catId: PettyCashCategory) => {
    setCategory(catId);
    const found = CATEGORY_OPTIONS.find((c) => c.id === catId);
    if (found) {
      setReason(found.defaultReason);
      if (catId === "CASH_FLOAT_TOPUP") {
        setMovementType("PAID_IN");
        setRecipientOrSource("Brankas Owner / Kas Utama");
      } else if (catId === "COLD_CHAIN_ICE") {
        setMovementType("PAID_OUT");
        setRecipientOrSource("Toko Es Mojo Berkah");
      } else if (catId === "COURIER_FEE") {
        setMovementType("PAID_OUT");
        setRecipientOrSource("Driver Grab/Gojek Express");
      } else if (catId === "RECEIPT_PAPER") {
        setMovementType("PAID_OUT");
        setRecipientOrSource("Toko Alat Tulis Jepara");
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      showAppleToast({
        type: "error",
        title: "Input Tidak Valid",
        message: "Nominal operasional kas harus lebih besar dari Rp 0!",
      });
      return;
    }
    if (!reason.trim()) {
      showAppleToast({
        type: "warning",
        title: "Keterangan Wajib",
        message: "Harap isi keterangan keperluan operasional kas!",
      });
      return;
    }

    const selectedCatObj = CATEGORY_OPTIONS.find((c) => c.id === category);
    const categoryLabel = selectedCatObj ? selectedCatObj.label : "Operasional Kasir";

    const result = recordPettyCash({
      type: movementType,
      category,
      categoryLabel,
      amount,
      reason,
      recipientOrSource: recipientOrSource || (movementType === "PAID_IN" ? "Kas Utama" : "Petugas"),
    });

    if (result) {
      setSavedMovement(result);
    }
  };

  const handlePrintVoucher = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white dark:bg-[#1C1C1E] rounded-[24px] shadow-[0_25px_60px_rgba(0,0,0,0.25)] border border-black/[0.08] dark:border-white/[0.12] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <span
              className={`p-2 rounded-[10px] ${
                movementType === "PAID_OUT"
                  ? "bg-rose-100 dark:bg-rose-950 text-rose-600"
                  : "bg-emerald-100 dark:bg-emerald-950 text-emerald-600"
              }`}
            >
              <Wallet className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-[15px] font-bold text-[#1C1C1E] dark:text-white">
                Buku Kas Kecil (Petty Cash)
              </h3>
              <p className="text-[11px] text-[#8E8E93]">
                Catat mutasi kas masuk / keluar di tengah shift berjalan
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-[8px] text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {!savedMovement ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Type Switcher Segment */}
              <div className="grid grid-cols-2 gap-1 p-1 bg-[#F5F5F7] dark:bg-[#2C2C2E] rounded-[12px] border border-black/[0.04]">
                <button
                  type="button"
                  onClick={() => {
                    setMovementType("PAID_OUT");
                    setCategory("COLD_CHAIN_ICE");
                  }}
                  className={`py-2 rounded-[9px] text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    movementType === "PAID_OUT"
                      ? "bg-rose-600 text-white shadow-sm"
                      : "text-[#636366] hover:text-[#1C1C1E] dark:hover:text-white"
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span>Kas Keluar (Paid Out)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMovementType("PAID_IN");
                    setCategory("CASH_FLOAT_TOPUP");
                    setReason("Tambah modal uang kembalian pecahan kecil");
                  }}
                  className={`py-2 rounded-[9px] text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    movementType === "PAID_IN"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-[#636366] hover:text-[#1C1C1E] dark:hover:text-white"
                  }`}
                >
                  <ArrowDownLeft className="w-4 h-4" />
                  <span>Kas Masuk (Paid In)</span>
                </button>
              </div>

              {/* Category Presets */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold text-[#1C1C1E] dark:text-white">
                  Kategori Keperluan:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {CATEGORY_OPTIONS.filter(
                    (c) => c.type === "BOTH" || c.type === movementType
                  ).map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleCategorySelect(cat.id)}
                      className={`text-left p-2.5 rounded-[12px] border text-[11px] font-medium transition-all ${
                        category === cat.id
                          ? "bg-[#007AFF]/10 border-[#007AFF] text-[#007AFF] font-bold"
                          : "bg-white dark:bg-[#2C2C2E] border-black/[0.08] dark:border-white/[0.08] text-[#1C1C1E] dark:text-[#AEAEB2] hover:border-black/[0.2]"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount Input */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold text-[#1C1C1E] dark:text-white">
                  Nominal Uang (Rp):
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[14px] font-bold text-[#8E8E93]">
                    Rp
                  </span>
                  <input
                    type="number"
                    step={500}
                    min={500}
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full pl-10 pr-4 py-2.5 rounded-[12px] border border-black/[0.1] dark:border-white/[0.12] bg-[#F5F5F7] dark:bg-[#2C2C2E] text-[16px] font-bold text-[#1C1C1E] dark:text-white focus:outline-none focus:border-[#007AFF] tabular-nums"
                    required
                  />
                </div>
                {/* Quick nominal chips */}
                <div className="flex gap-1.5">
                  {[10000, 15000, 20000, 50000, 100000].map((nom) => (
                    <button
                      key={nom}
                      type="button"
                      onClick={() => setAmount(nom)}
                      className="px-2 py-0.5 rounded-[8px] bg-neutral-100 dark:bg-neutral-800 text-[10px] font-semibold text-[#636366] hover:bg-neutral-200"
                    >
                      {formatRupiah(nom)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold text-[#1C1C1E] dark:text-white">
                  Rincian Keterangan:
                </label>
                <textarea
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Contoh: Beli es batu pendingin cooler box insulin..."
                  className="w-full px-3 py-2 rounded-[12px] border border-black/[0.1] dark:border-white/[0.12] bg-[#F5F5F7] dark:bg-[#2C2C2E] text-[12px] text-[#1C1C1E] dark:text-white focus:outline-none focus:border-[#007AFF]"
                  required
                />
              </div>

              {/* Recipient / Source */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold text-[#1C1C1E] dark:text-white">
                  {movementType === "PAID_OUT"
                    ? "Diberikan Kepada (Penerima):"
                    : "Sumber Dana (Dari):"}
                </label>
                <input
                  type="text"
                  value={recipientOrSource}
                  onChange={(e) => setRecipientOrSource(e.target.value)}
                  placeholder={
                    movementType === "PAID_OUT"
                      ? "Nama Toko / Driver Grab / Petugas"
                      : "Brankas Utama / Owner"
                  }
                  className="w-full px-3 py-2 rounded-[12px] border border-black/[0.1] dark:border-white/[0.12] bg-[#F5F5F7] dark:bg-[#2C2C2E] text-[12px] text-[#1C1C1E] dark:text-white focus:outline-none focus:border-[#007AFF]"
                  required
                />
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-[12px] border border-amber-200 dark:border-amber-900/50 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Transaksi kas kecil akan langsung mengubah ekspektasi saldo fisik laci
                  pada shift kasir aktif saat ini.
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-[12px] font-medium text-[#636366] hover:text-[#1C1C1E]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 text-[12px] font-semibold rounded-[10px] text-white transition-all shadow-sm ${
                    movementType === "PAID_OUT"
                      ? "bg-rose-600 hover:bg-rose-700"
                      : "bg-emerald-600 hover:bg-emerald-700"
                  }`}
                >
                  Simpan Mutasi Kas
                </button>
              </div>
            </form>
          ) : (
            /* PRINTABLE VOUCHER SUCCESS VIEW */
            <div className="space-y-4">
              <div className="text-center py-2">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h4 className="text-[14px] font-bold text-[#1C1C1E] dark:text-white">
                  Mutasi Kas Kecil Tercatat
                </h4>
                <p className="text-[11px] text-[#8E8E93]">
                  Saldo ekspektasi laci berhasil diperbarui.
                </p>
              </div>

              {/* ESC/POS Thermal Voucher Preview (80mm) */}
              <div
                id="thermal-petty-voucher"
                className="bg-white p-4 rounded-[12px] border border-neutral-300 text-black font-mono text-[11px] leading-relaxed shadow-inner"
              >
                <div className="text-center pb-2 border-b border-dashed border-neutral-400">
                  <p className="font-bold text-[12px]">
                    {APOTEK_KERSO_WARAS_INFO.name.toUpperCase()}
                  </p>
                  <p className="text-[9px]">{APOTEK_KERSO_WARAS_INFO.address}</p>
                  <p className="text-[9px]">SIA: {APOTEK_KERSO_WARAS_INFO.siaNumber}</p>
                  <p className="font-bold mt-1 text-[11px]">
                    BUKTI PENGELUARAN / KAS KECIL (VOUCHER)
                  </p>
                </div>

                <div className="py-2 border-b border-dashed border-neutral-400 space-y-1 text-[10px]">
                  <div className="flex justify-between">
                    <span>No. Voucher</span>
                    <span className="font-bold">{savedMovement.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Waktu</span>
                    <span>{new Date(savedMovement.timestamp).toLocaleString("id-ID")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Kasir Bertugas</span>
                    <span>{savedMovement.recordedBy}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Jenis Mutasi</span>
                    <span className="font-bold">
                      {savedMovement.type === "PAID_OUT" ? "KAS KELUAR" : "KAS MASUK"}
                    </span>
                  </div>
                </div>

                <div className="py-2 border-b border-dashed border-neutral-400 space-y-1 text-[10px]">
                  <div className="flex justify-between">
                    <span>Kategori:</span>
                    <span className="font-semibold">{savedMovement.category}</span>
                  </div>
                  <div>
                    <span className="text-neutral-600">Keperluan:</span>
                    <p className="font-bold text-neutral-800">{savedMovement.reason}</p>
                  </div>
                  <div className="flex justify-between">
                    <span>Pihak Penerima / Sumber:</span>
                    <span>{savedMovement.recipientOrSource}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-neutral-200 text-[12px]">
                    <span className="font-bold">TOTAL NOMINAL</span>
                    <span className="font-bold">{formatRupiah(savedMovement.amount)}</span>
                  </div>
                </div>

                <div className="pt-3 grid grid-cols-2 text-center text-[9px] gap-2">
                  <div>
                    <p>Petugas Kasir,</p>
                    <div className="h-10 border-b border-dotted border-neutral-400 mb-1"></div>
                    <p className="font-bold">{savedMovement.recordedBy}</p>
                  </div>
                  <div>
                    <p>Penerima Dana,</p>
                    <div className="h-10 border-b border-dotted border-neutral-400 mb-1"></div>
                    <p className="font-bold">{savedMovement.recipientOrSource}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handlePrintVoucher}
                  className="flex-1 py-2.5 rounded-[12px] bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-[#1C1C1E] dark:text-white text-[12px] font-semibold flex items-center justify-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Slip Kas Kecil (80mm)</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-[12px] bg-[#007AFF] hover:bg-[#0062CC] text-white text-[12px] font-semibold"
                >
                  Selesai
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
