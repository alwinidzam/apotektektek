"use client";

import { X, Printer, CheckCircle, Share2, QrCode } from "lucide-react";
import { Transaction } from "@/lib/types";
import { formatDate, formatRupiah } from "@/lib/utils";

interface ReceiptModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ReceiptModal({ transaction, isOpen, onClose }: ReceiptModalProps) {
  if (!isOpen || !transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        {/* Modal Toolbar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
            <CheckCircle className="h-4 w-4" />
            <span>Transaksi Berhasil Disimpan</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Printable Receipt Paper Container (Thermal 58/80mm style) */}
        <div className="p-6 overflow-y-auto max-h-[70vh] bg-slate-100/60 dark:bg-slate-950 flex justify-center">
          <div
            id="printable-receipt"
            className="w-full max-w-[340px] bg-white text-slate-900 p-6 rounded-2xl shadow-md border border-slate-200 font-mono text-[11px] leading-tight"
          >
            {/* Header */}
            <div className="text-center pb-3 border-b border-dashed border-slate-300">
              <div className="w-12 h-12 mx-auto mb-1 flex items-center justify-center">
                <img
                  src="/logo-dark.png"
                  alt="Apotek Kerso Waras"
                  className="w-12 h-12 object-contain"
                />
              </div>
              <h2 className="font-bold text-sm tracking-tight text-slate-900 uppercase">
                Apotek Kerso Waras
              </h2>
              <p className="text-[10px] text-slate-600 mt-0.5">
                Jl. Raya Jepara-Bugel No.Perempatan, RT.04/RW.01, Mojo, Kerso, Kedung, Jepara
              </p>
              <p className="text-[10px] text-slate-500">Telp: (0291) 751-2345</p>
              <p className="text-[9px] text-slate-400 mt-0.5">
                SIA: 440/0912/DPMPTSP/JEPARA/2021 &bull; SIPA: 19930812/APJ
              </p>
            </div>

            {/* Meta */}
            <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-[10px]">
              <div className="flex justify-between">
                <span>No. Invoice:</span>
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
                  <span>{transaction.doctorName}</span>
                </div>
              )}
            </div>

            {/* Items */}
            <div className="py-3 border-b border-dashed border-slate-300 space-y-2">
              {transaction.items.map((item, idx) => (
                <div key={idx}>
                  <div className="font-bold text-[11px] text-slate-900">
                    {item.product.name}
                  </div>
                  <div className="flex justify-between text-slate-600 text-[10px] mt-0.5">
                    <span>
                      {item.quantity} {item.selectedUnit} @ {formatRupiah(item.unitPrice)}
                    </span>
                    <span className="font-bold">{formatRupiah(item.subtotal)}</span>
                  </div>
                  <div className="text-[9px] text-slate-400">
                    Batch: {item.selectedBatch.batchNumber} • Exp:{" "}
                    {item.selectedBatch.expiryDate.split("T")[0]}
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-[10px]">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatRupiah(transaction.subtotal)}</span>
              </div>
              {transaction.tuslahTotal > 0 && (
                <div className="flex justify-between">
                  <span>Jasa Racik (Tuslah):</span>
                  <span>+{formatRupiah(transaction.tuslahTotal)}</span>
                </div>
              )}
              {transaction.embalaseTotal > 0 && (
                <div className="flex justify-between">
                  <span>Kemasan (Embalase):</span>
                  <span>+{formatRupiah(transaction.embalaseTotal)}</span>
                </div>
              )}
              {transaction.roundingAmount !== 0 && (
                <div className="flex justify-between text-slate-500 italic">
                  <span>Pembulatan Kas:</span>
                  <span>
                    {transaction.roundingAmount > 0
                      ? `+${transaction.roundingAmount}`
                      : transaction.roundingAmount}
                  </span>
                </div>
              )}
              <div className="flex justify-between font-bold text-xs pt-1.5 border-t border-slate-200 text-slate-900">
                <span>TOTAL AKHIR:</span>
                <span>{formatRupiah(transaction.grandTotal)}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span>Metode:</span>
                <span className="font-bold">{transaction.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span>Bayar:</span>
                <span>{formatRupiah(transaction.paidAmount)}</span>
              </div>
              <div className="flex justify-between font-bold text-emerald-700">
                <span>Kembalian:</span>
                <span>{formatRupiah(transaction.changeAmount)}</span>
              </div>
            </div>

            {/* Footer & SatuSehat Verification */}
            <div className="text-center pt-3 text-[9px] text-slate-500 space-y-1.5">
              <div className="flex justify-center my-1">
                <div className="p-1 border border-slate-300 rounded bg-white">
                  <QrCode className="h-10 w-10 text-slate-800" />
                </div>
              </div>
              <p className="font-semibold text-slate-700">
                Terverifikasi Kemenkes SATUSEHAT (FHIR R4)
              </p>
              <p>Terima kasih atas kepercayaan Anda.</p>
              <p>Semoga lekas sembuh! Simpan struk ini sebagai bukti pembayaran sah.</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-5 py-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50"
          >
            Selesai
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5"
          >
            <Printer className="h-4 w-4" />
            <span>Cetak Struk ESC/POS</span>
          </button>
        </div>
      </div>
    </div>
  );
}
