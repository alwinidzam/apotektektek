"use client";

import React, { useState } from "react";
import { useApotekStore } from "@/lib/store";
import { BatchItem, Product } from "@/lib/types";
import { formatRupiah } from "@/lib/utils";
import { X, Plus, Calendar, PackageCheck, AlertCircle } from "lucide-react";
import { AppleStatusPill } from "@/components/ui/AppleStatusPill";
import { showAppleToast } from "@/components/ui/AppleToast";

interface BatchEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

export const BatchEntryModal: React.FC<BatchEntryModalProps> = ({
  isOpen,
  onClose,
  product,
}) => {
  const { addBatchToProduct } = useApotekStore();

  const [batchNumber, setBatchNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [incomingQty, setIncomingQty] = useState(50);
  const [purchasePriceHNA, setPurchasePriceHNA] = useState(product?.hpp || 1000);
  const [shelfLocation, setShelfLocation] = useState(product?.shelfLocation || "RAK-A1");

  if (!isOpen || !product) return null;

  const getExpiryMonths = (dateStr: string) => {
    if (!dateStr) return 0;
    const now = new Date();
    const exp = new Date(dateStr);
    return Math.max(0, Math.round((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30.4)));
  };

  const expiryMonths = getExpiryMonths(expiryDate);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchNumber.trim() || !expiryDate) {
      showAppleToast({
        type: "warning",
        title: "Data Batch Belum Lengkap",
        message: "Nomor Batch dan Tanggal Kedaluwarsa wajib diisi lengkap!",
      });
      return;
    }

    const newBatch: BatchItem = {
      id: `batch-${Date.now()}`,
      productId: product.id,
      batchNumber: batchNumber.trim(),
      expiryDate,
      purchasePriceHNA,
      sellingPrice: product.sellingPrice,
      currentStock: incomingQty,
      reservedStock: 0,
      locationRack: shelfLocation,
    };

    addBatchToProduct(product.id, newBatch);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white dark:bg-[#1C1C1E] rounded-[22px] shadow-[0_25px_60px_rgba(0,0,0,0.25)] border border-black/[0.08] dark:border-white/[0.12] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <h2 className="text-[17px] font-semibold text-[#1C1C1E] dark:text-white tracking-tight">
              Penerimaan Batch Baru (FEFO)
            </h2>
            <p className="text-[12px] text-[#8E8E93]">
              {product.name} ({product.baseUnit})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-[#8E8E93] hover:text-[#1C1C1E] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#8E8E93] mb-1">
                Nomor Batch PBF *
              </label>
              <input
                type="text"
                required
                value={batchNumber}
                placeholder="cth: LOT-2026X"
                onChange={(e) => setBatchNumber(e.target.value)}
                className="w-full text-[13px] font-mono px-3 py-2 rounded-[10px] bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-transparent focus:border-[#007AFF] outline-none"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[#8E8E93]">
                  Tanggal Kedaluwarsa *
                </label>
                {expiryDate && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                      expiryMonths <= 6
                        ? "bg-rose-100 text-rose-700"
                        : expiryMonths <= 12
                        ? "bg-amber-100 text-amber-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {expiryMonths} bln
                  </span>
                )}
              </div>
              <input
                type="date"
                required
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full text-[13px] font-medium px-3 py-2 rounded-[10px] bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-transparent focus:border-[#007AFF] outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#8E8E93] mb-1">
                Jumlah Masuk ({product.baseUnit}) *
              </label>
              <input
                type="number"
                required
                min="1"
                value={incomingQty}
                onChange={(e) => setIncomingQty(Number(e.target.value))}
                className="w-full text-[14px] font-bold text-right px-3 py-2 rounded-[10px] bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-transparent focus:border-[#007AFF] outline-none tabular-nums"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#8E8E93] mb-1">
                HPP Beli Baru (HNA Netto)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-[13px] font-medium text-[#8E8E93]">Rp</span>
                <input
                  type="number"
                  min="1"
                  value={purchasePriceHNA}
                  onChange={(e) => setPurchasePriceHNA(Number(e.target.value))}
                  className="w-full text-[13px] font-semibold pl-10 pr-3 py-2 rounded-[10px] bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-transparent focus:border-[#007AFF] outline-none tabular-nums"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#8E8E93] mb-1">
              Lokasi Rak / Lemari Penyimpanan
            </label>
            <input
              type="text"
              value={shelfLocation}
              onChange={(e) => setShelfLocation(e.target.value)}
              placeholder="cth: Rak A1, Chiller-1"
              className="w-full text-[13px] px-3 py-2 rounded-[10px] bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-transparent focus:border-[#007AFF] outline-none"
            />
          </div>

          {expiryMonths <= 6 && expiryDate && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 rounded-[12px] flex items-start gap-2 text-[12px] text-rose-800 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                <strong>Perhatian:</strong> Masa kedaluwarsa &le; 6 bulan ({expiryMonths} bulan). Pastikan distributor PBF menyepakati klausul retur obat mendekati ED.
              </span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-neutral-100 dark:border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[13px] font-medium text-[#636366] hover:text-[#1C1C1E]"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-[13px] font-semibold rounded-[10px] bg-[#007AFF] text-white hover:bg-[#0062CC] transition-colors shadow-sm flex items-center gap-1.5"
            >
              <PackageCheck className="w-4 h-4" />
              Simpan Batch FEFO
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
