"use client";

import { useState } from "react";
import { X, Printer, CheckCircle, Tag, FileText } from "lucide-react";
import { Transaction } from "@/lib/types";
import { formatRupiah } from "@/lib/utils";

interface ReceiptModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ReceiptModal({ transaction, isOpen, onClose }: ReceiptModalProps) {
  const [printMode, setPrintMode] = useState<"BOTH" | "RECEIPT" | "ETIKET">("BOTH");

  if (!isOpen || !transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(transaction.timestamp).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-3xl bg-white dark:bg-[#141416] rounded-xl shadow-2xl border border-neutral-200 dark:border-white/10 overflow-hidden flex flex-col">
        {/* Modal Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 border-b border-neutral-200/80 dark:border-white/[0.08] bg-neutral-50 dark:bg-[#1C1C1E]">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-[12.5px] font-semibold">
            <CheckCircle className="h-4 w-4" />
            <span>
              Transaksi Selesai &middot; Struk & Etiket Siap Cetak
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex p-0.5 rounded-lg bg-neutral-200/70 dark:bg-white/10 text-[11px] font-medium">
              <button
                type="button"
                onClick={() => setPrintMode("BOTH")}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  printMode === "BOTH"
                    ? "bg-white dark:bg-[#141416] text-neutral-900 dark:text-white font-semibold shadow-2xs"
                    : "text-neutral-600 dark:text-neutral-400"
                }`}
              >
                Struk + Etiket ({transaction.items.length})
              </button>
              <button
                type="button"
                onClick={() => setPrintMode("RECEIPT")}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  printMode === "RECEIPT"
                    ? "bg-white dark:bg-[#141416] text-neutral-900 dark:text-white font-semibold shadow-2xs"
                    : "text-neutral-600 dark:text-neutral-400"
                }`}
              >
                Struk Pembayaran
              </button>
              <button
                type="button"
                onClick={() => setPrintMode("ETIKET")}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  printMode === "ETIKET"
                    ? "bg-white dark:bg-[#141416] text-neutral-900 dark:text-white font-semibold shadow-2xs"
                    : "text-neutral-600 dark:text-neutral-400"
                }`}
              >
                Etiket Aturan Pakai
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Printable Container: Receipt + Automatic Medicine Etiket Labels */}
        <div className="p-5 overflow-y-auto max-h-[72vh] bg-neutral-100/70 dark:bg-[#0D0D0F] grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
          {/* Column 1: Struk Bukti Pembayaran */}
          {(printMode === "BOTH" || printMode === "RECEIPT") && (
            <div
              className={`${
                printMode === "BOTH" ? "md:col-span-6" : "md:col-span-12 max-w-sm mx-auto w-full"
              } bg-white text-neutral-900 p-5 rounded-xl border border-neutral-200 font-mono text-[11px] leading-snug shadow-2xs`}
            >
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-200 font-sans text-[10px] font-semibold uppercase tracking-wider text-neutral-400 no-print">
                <span className="flex items-center gap-1">
                  <FileText className="w-3 h-3" /> Struk Pembayaran (80mm)
                </span>
                <span>{transaction.transactionMode === "RESEP_DOKTER" ? "Resep Dokter" : "Swamedikasi"}</span>
              </div>

              {/* Header */}
              <div className="text-center pb-3 border-b border-dashed border-neutral-300">
                <h2 className="font-bold text-[13px] tracking-tight text-neutral-900 uppercase">
                  Apotek Kerso Waras
                </h2>
                <p className="text-[10px] text-neutral-600 mt-0.5">
                  Jl. Raya Jepara-Bugel, Kerso, Kedung, Jepara
                </p>
                <p className="text-[9.5px] text-neutral-500">
                  SIA: 440/0912/DPMPTSP/JEPARA/2021
                </p>
              </div>

              {/* Meta */}
              <div className="py-2.5 border-b border-dashed border-neutral-300 space-y-1 text-[10px]">
                <div className="flex justify-between">
                  <span>No. Struk:</span>
                  <span className="font-bold">{transaction.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Waktu:</span>
                  <span>{new Date(transaction.timestamp).toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kasir:</span>
                  <span>{transaction.cashierName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pasien:</span>
                  <span className="font-bold">{transaction.customerName}</span>
                </div>
                {transaction.doctorName && (
                  <div className="flex justify-between">
                    <span>Dokter:</span>
                    <span>
                      {transaction.doctorName}
                      {transaction.prescriptionNumber ? ` (${transaction.prescriptionNumber})` : ""}
                    </span>
                  </div>
                )}
              </div>

              {/* Items */}
              <div className="py-2.5 border-b border-dashed border-neutral-300 space-y-2">
                {transaction.items.map((item, idx) => (
                  <div key={idx}>
                    <div className="font-bold text-[11px] text-neutral-900">
                      {item.product.name}
                    </div>
                    <div className="flex justify-between text-neutral-600 text-[10px] mt-0.5">
                      <span>
                        {item.quantity} {item.selectedUnit} x {formatRupiah(item.unitPrice)}
                      </span>
                      <span className="font-bold">{formatRupiah(item.subtotal)}</span>
                    </div>
                    {item.signaUsage && (
                      <div className="text-[9.5px] text-neutral-500">
                        Aturan: {item.signaUsage}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="py-2.5 border-b border-dashed border-neutral-300 space-y-1 text-[10px]">
                <div className="flex justify-between font-bold text-[11.5px] pt-1 text-neutral-900">
                  <span>TOTAL BAYAR:</span>
                  <span>{formatRupiah(transaction.grandTotal)}</span>
                </div>
                <div className="flex justify-between pt-0.5">
                  <span>Metode:</span>
                  <span className="font-bold">{transaction.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span>Diterima:</span>
                  <span>{formatRupiah(transaction.paidAmount)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Kembali:</span>
                  <span>{formatRupiah(transaction.changeAmount)}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center pt-2.5 text-[9.5px] text-neutral-500 space-y-0.5">
                <p>Terima kasih, semoga lekas sembuh.</p>
                <p>Barang yang sudah dibeli tidak dapat ditukar.</p>
              </div>
            </div>
          )}

          {/* Column 2: Etiket Aturan Pakai Obat Otomatis */}
          {(printMode === "BOTH" || printMode === "ETIKET") && (
            <div
              className={`${
                printMode === "BOTH" ? "md:col-span-6" : "md:col-span-12 max-w-md mx-auto w-full"
              } space-y-3`}
            >
              <div className="flex items-center justify-between px-1 font-sans text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 no-print">
                <span className="flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[#00767E]" />
                  Etiket Aturan Pakai Otomatis ({transaction.items.length} Label)
                </span>
                <span>Tanpa Tulis Manual</span>
              </div>

              {transaction.items.map((item, idx) => {
                const isObatLuar = item.product.usageType === "OBAT_LUAR";
                const signaText =
                  item.signaUsage ||
                  item.product.defaultSigna ||
                  `3 x sehari 1 ${item.product.baseUnit} — Sesudah Makan`;

                return (
                  <div
                    key={idx}
                    className={`rounded-xl border-2 p-3.5 font-sans shadow-2xs ${
                      isObatLuar
                        ? "bg-sky-50 border-sky-400 text-slate-900"
                        : "bg-white border-neutral-300 text-neutral-900"
                    }`}
                  >
                    {/* Etiket Header */}
                    <div className="flex items-start justify-between border-b border-neutral-300 pb-1.5 mb-2">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-tight leading-none">
                          Apotek Kerso Waras
                        </p>
                        <p className="text-[9px] text-neutral-600 mt-0.5">
                          Kedung, Jepara &middot; SIPA: 19930812/APJ
                        </p>
                      </div>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                          isObatLuar
                            ? "bg-sky-600 text-white"
                            : "bg-neutral-900 text-white"
                        }`}
                      >
                        {isObatLuar ? "Obat Luar (Biru)" : "Obat Dalam (Putih)"}
                      </span>
                    </div>

                    {/* Patient & Date Row */}
                    <div className="flex justify-between text-[10px] text-neutral-700 mb-2">
                      <span>
                        Pasien: <strong className="text-neutral-900">{transaction.customerName}</strong>
                      </span>
                      <span className="font-mono">{formattedDate}</span>
                    </div>

                    {/* Drug Name & Quantity */}
                    <div className="bg-neutral-100/90 rounded-lg px-2.5 py-1.5 mb-2 flex items-center justify-between">
                      <span className="text-[12px] font-bold text-neutral-900">
                        {item.product.name}
                      </span>
                      <span className="text-[11px] font-mono font-bold text-neutral-700">
                        {item.quantity} {item.selectedUnit}
                      </span>
                    </div>

                    {/* Automatic Dosage / Signa Box */}
                    <div className="text-center py-1.5 px-2 rounded-lg border border-dashed border-neutral-400 bg-white">
                      <p className="text-[9px] uppercase tracking-wider text-neutral-500 font-semibold">
                        Aturan Pakai
                      </p>
                      <p className="text-[12.5px] font-bold text-neutral-900 mt-0.5">
                        {signaText}
                      </p>
                    </div>

                    {/* Expiry & Batch Footer */}
                    <div className="mt-2 pt-1.5 border-t border-neutral-200 flex items-center justify-between text-[9px] text-neutral-500 font-mono">
                      <span>Batch: {item.selectedBatch.batchNumber}</span>
                      <span>ED: {item.selectedBatch.expiryDate.split("T")[0]}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="px-5 py-3.5 bg-white dark:bg-[#141416] border-t border-neutral-200/80 dark:border-white/[0.08] flex gap-2.5">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-neutral-200 dark:border-white/10 text-[12.5px] font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-white/[0.04]"
          >
            Tutup
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 py-2 rounded-lg bg-[#00767E] hover:bg-[#006067] text-white text-[12.5px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Printer className="h-4 w-4" />
            <span>
              {printMode === "BOTH"
                ? "Cetak Struk & Etiket Otomatis"
                : printMode === "RECEIPT"
                ? "Cetak Struk Pembayaran"
                : "Cetak Etiket Aturan Pakai"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
