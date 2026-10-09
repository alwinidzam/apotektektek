"use client";

import React, { useRef } from "react";
import Image from "next/image";
import { CashierShift, APOTEK_KERSO_WARAS_INFO } from "@/lib/types";
import { formatRupiah } from "@/lib/utils";
import {
  X,
  Printer,
  FileCheck2,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Share2,
} from "lucide-react";

interface ShiftReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  shift: CashierShift;
  reportType: "X_REPORT" | "Z_REPORT";
}

export const ShiftReportModal: React.FC<ShiftReportModalProps> = ({
  isOpen,
  onClose,
  shift,
  reportType,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const isZReport = reportType === "Z_REPORT";

  const expectedCash =
    shift.expectedCashTotal !== null
      ? shift.expectedCashTotal
      : shift.openingCash +
        shift.cashSalesTotal +
        shift.cashInTotal -
        shift.cashOutTotal -
        shift.refundTotal;

  const actualCash = shift.actualCashCount ?? expectedCash;
  const difference = shift.cashDifference ?? (actualCash - expectedCash);

  const totalOmzet = shift.cashSalesTotal + shift.qrisSalesTotal + shift.edcSalesTotal;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-white dark:bg-[#1C1C1E] rounded-[24px] shadow-[0_25px_60px_rgba(0,0,0,0.3)] border border-black/[0.08] dark:border-white/[0.12] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <span
              className={`p-2 rounded-[10px] ${
                isZReport
                  ? "bg-rose-100 dark:bg-rose-950 text-rose-600"
                  : "bg-blue-100 dark:bg-blue-950 text-blue-600"
              }`}
            >
              <FileCheck2 className="w-4 h-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[15px] font-bold text-[#1C1C1E] dark:text-white">
                  {isZReport ? "Laporan Tutup Kasir (Z-Report)" : "Laporan Audit Kas (X-Report)"}
                </h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    isZReport
                      ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                      : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                  }`}
                >
                  {isZReport ? "Final / Locked" : "Interim / Spot Check"}
                </span>
              </div>
              <p className="text-[11px] text-[#8E8E93]">
                {isZReport
                  ? "Rekonsiliasi fiskal permanen akhir shift bertugas"
                  : "Bacaan sementara kas laci tanpa mereset angka kasir"}
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

        {/* Scrollable Receipt Preview (80mm ESC/POS Thermal Layout) */}
        <div className="p-6 overflow-y-auto flex-1 bg-neutral-100 dark:bg-neutral-900/60">
          <div
            ref={printRef}
            id="thermal-z-report"
            className="w-full max-w-[420px] mx-auto bg-white p-6 rounded-[14px] shadow-sm border border-neutral-200 text-black font-mono text-[11px] leading-relaxed selection:bg-neutral-200"
          >
            {/* Pharmacy Official Header */}
            <div className="text-center pb-3 border-b-2 border-dashed border-neutral-400">
              <div className="flex justify-center mb-1.5">
                <Image
                  src="/logo-dark.png"
                  alt="Apotek Kerso Waras"
                  width={44}
                  height={44}
                  className="object-contain"
                />
              </div>
              <h4 className="font-bold text-[14px] tracking-tight">
                {APOTEK_KERSO_WARAS_INFO.name.toUpperCase()}
              </h4>
              <p className="text-[9px] text-neutral-600 leading-tight">
                {APOTEK_KERSO_WARAS_INFO.address}
              </p>
              <p className="text-[9px] text-neutral-600">
                Telp: {APOTEK_KERSO_WARAS_INFO.phone} | WA: {APOTEK_KERSO_WARAS_INFO.whatsapp}
              </p>
              <p className="text-[9px] text-neutral-500">
                SIA: {APOTEK_KERSO_WARAS_INFO.siaNumber}
              </p>
              <p className="text-[9px] text-neutral-500">
                SIPA APJ: {APOTEK_KERSO_WARAS_INFO.sipaNumber}
              </p>

              <div className="mt-2 pt-2 border-t border-neutral-300">
                <span className="font-black text-[13px] tracking-wider px-2 py-0.5 bg-neutral-100 border border-neutral-300 rounded inline-block">
                  *** {isZReport ? "Z - REPORT (FINAL)" : "X - REPORT (INTERIM)"} ***
                </span>
              </div>
            </div>

            {/* Metadata Info */}
            <div className="py-2.5 border-b border-dashed border-neutral-300 text-[10px] space-y-0.5">
              <div className="flex justify-between">
                <span>Shift No / Terminal:</span>
                <span className="font-bold">
                  Shift {shift.shiftNumber} / {shift.terminalId}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Kasir Bertugas:</span>
                <span className="font-bold">{shift.cashierName}</span>
              </div>
              <div className="flex justify-between">
                <span>Waktu Buka Shift:</span>
                <span>{new Date(shift.startTime).toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between">
                <span>{isZReport ? "Waktu Tutup Shift:" : "Waktu Audit Interim:"}</span>
                <span>
                  {shift.endTime
                    ? new Date(shift.endTime).toLocaleString("id-ID")
                    : new Date().toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Status Rekonsiliasi:</span>
                <span className="font-bold">
                  {shift.status === "CLOSED" ? "TERTUTUP (PERMANEN)" : "SEDANG BERJALAN"}
                </span>
              </div>
            </div>

            {/* Sales Breakdown by Tender */}
            <div className="py-2.5 border-b border-dashed border-neutral-300 space-y-1">
              <div className="font-bold text-[11px] uppercase tracking-wide text-neutral-800">
                [1] REKAP PENJUALAN OBAT
              </div>
              <div className="flex justify-between text-[10px]">
                <span>Total Transaksi Sukses:</span>
                <span>{shift.totalTransactionsCount} Struk</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span>1. Pembayaran Tunai (Cash):</span>
                <span className="font-bold tabular-nums">
                  {formatRupiah(shift.cashSalesTotal)}
                </span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span>2. Non-Tunai QRIS:</span>
                <span className="tabular-nums">{formatRupiah(shift.qrisSalesTotal)}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span>3. Non-Tunai Debit / EDC:</span>
                <span className="tabular-nums">{formatRupiah(shift.edcSalesTotal)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-dotted border-neutral-300 font-bold text-[11px]">
                <span>TOTAL OMZET SHIFT:</span>
                <span className="tabular-nums">{formatRupiah(totalOmzet)}</span>
              </div>
            </div>

            {/* Cash Drawer Flow Reconciliation */}
            <div className="py-2.5 border-b border-dashed border-neutral-300 space-y-1">
              <div className="font-bold text-[11px] uppercase tracking-wide text-neutral-800">
                [2] ARUS KAS LACI (CASH DRAWER)
              </div>
              <div className="flex justify-between text-[10px]">
                <span>(+) Modal Awal Kasir:</span>
                <span className="tabular-nums">{formatRupiah(shift.openingCash)}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span>(+) Penjualan Kas Tunai:</span>
                <span className="tabular-nums">{formatRupiah(shift.cashSalesTotal)}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span>(+) Kas Masuk / Topup:</span>
                <span className="tabular-nums">{formatRupiah(shift.cashInTotal)}</span>
              </div>
              <div className="flex justify-between text-[10px] text-rose-700">
                <span>(-) Kas Keluar / Petty Cash:</span>
                <span className="tabular-nums">-{formatRupiah(shift.cashOutTotal)}</span>
              </div>
              {shift.refundTotal > 0 && (
                <div className="flex justify-between text-[10px] text-rose-700">
                  <span>(-) Retur Penjualan Tunai:</span>
                  <span className="tabular-nums">-{formatRupiah(shift.refundTotal)}</span>
                </div>
              )}
              <div className="flex justify-between pt-1 border-t border-dotted border-neutral-300 font-bold text-[11px]">
                <span>EKSPEKTASI SALDO SISTEM:</span>
                <span className="tabular-nums">{formatRupiah(expectedCash)}</span>
              </div>
            </div>

            {/* Physical Cash Count & Variance Analysis */}
            <div className="py-2.5 border-b-2 border-dashed border-neutral-400 space-y-1">
              <div className="font-bold text-[11px] uppercase tracking-wide text-neutral-800">
                [3] AUDIT FISIK & REKONSILIASI
              </div>

              {shift.denominationCount && (
                <div className="bg-neutral-50 p-2 rounded text-[9px] space-y-0.5 my-1">
                  <div className="flex justify-between">
                    <span>Uang Kertas (Banknotes):</span>
                    <span className="tabular-nums">
                      {formatRupiah(shift.denominationCount.totalBills)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Uang Logam (Coins):</span>
                    <span className="tabular-nums">
                      {formatRupiah(shift.denominationCount.totalCoins)}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex justify-between text-[11px] font-bold">
                <span>TOTAL FISIK DI LACI:</span>
                <span className="tabular-nums">{formatRupiah(actualCash)}</span>
              </div>

              <div
                className={`p-2 rounded mt-1.5 flex items-center justify-between font-bold text-[11px] ${
                  difference === 0
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
                    : difference > 0
                    ? "bg-blue-50 text-blue-800 border border-blue-300"
                    : "bg-rose-50 text-rose-800 border border-rose-300"
                }`}
              >
                <span>
                  {difference === 0
                    ? "STATUS: KAS KLOP (Rp 0)"
                    : difference > 0
                    ? "STATUS: SURPLUS (LEBIH)"
                    : "STATUS: MINUS (KURANG)"}
                </span>
                <span className="tabular-nums">
                  {difference > 0 ? `+${formatRupiah(difference)}` : formatRupiah(difference)}
                </span>
              </div>

              {/* Official Discrepancy Reconciliation & Supervisor Authorization Block */}
              {shift.cashDifference !== 0 && shift.supervisorAuth && (
                <div className="bg-amber-50/80 p-2.5 rounded border border-amber-300 text-[9px] space-y-1 my-1.5 text-neutral-800">
                  <div className="font-bold uppercase tracking-wider text-amber-900 border-b border-amber-200 pb-0.5 flex items-center justify-between">
                    <span>BERITA ACARA SELISIH KASIR</span>
                    <span className="text-[8px] bg-amber-200 px-1 rounded font-mono">PIN VERIFIED</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Kategori Penyebab:</span>
                    <span className="font-semibold">{shift.discrepancyCategory || "INVESTIGASI_KAS"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Keputusan Tindak Lanjut:</span>
                    <span className="font-semibold text-rose-700">
                      {shift.settlementAction === "PHARMACY_ABSORBED"
                        ? "DIBEBANKAN KE APOTEK"
                        : shift.settlementAction === "CASHIER_LIABILITY"
                        ? "TANGGUNG JAWAB KASIR"
                        : "INVESTIGASI LANJUTAN"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Otorisator Login:</span>
                    <span className="font-bold">{shift.supervisorAuth.supervisorName}</span>
                  </div>
                  <div className="flex justify-between text-[8px] text-neutral-500">
                    <span>Waktu Otorisasi:</span>
                    <span>{new Date(shift.supervisorAuth.authorizedAt).toLocaleString("id-ID")}</span>
                  </div>
                  {shift.discrepancyReasonText && (
                    <div className="pt-0.5 border-t border-dotted border-amber-200 text-[8px] italic text-neutral-600">
                      &quot;{shift.discrepancyReasonText}&quot;
                    </div>
                  )}
                </div>
              )}

              {shift.closingNote && (
                <div className="pt-1.5 text-[9px] text-neutral-700">
                  <span className="font-bold">Catatan Kasir: </span>
                  <span>{shift.closingNote}</span>
                </div>
              )}

              {shift.isAuditedByOwner && shift.auditNote && (
                <div className="pt-1 text-[9px] text-neutral-700">
                  <span className="font-bold">Catatan Owner/APJ: </span>
                  <span>{shift.auditNote}</span>
                </div>
              )}
            </div>

            {/* Dual Sign-off Block */}
            <div className="pt-4 grid grid-cols-2 text-center text-[9px] gap-4">
              <div>
                <p className="text-neutral-600">Diserahkan oleh (Kasir),</p>
                <div className="h-12 border-b border-dotted border-neutral-400 mb-1 flex items-end justify-center pb-1">
                  <span className="text-[8px] text-neutral-400 italic">Tanda Tangan</span>
                </div>
                <p className="font-bold text-[10px]">{shift.cashierName}</p>
                <p className="text-[8px] text-neutral-500">Kasir Shift {shift.shiftNumber}</p>
              </div>

              <div>
                <p className="text-neutral-600">Diverifikasi oleh (APJ / PSA),</p>
                <div className="h-12 border-b border-dotted border-neutral-400 mb-1 flex items-end justify-center pb-1">
                  <span className="text-[8px] text-neutral-400 italic">Tanda Tangan</span>
                </div>
                <p className="font-bold text-[10px]">
                  {shift.auditedBy || APOTEK_KERSO_WARAS_INFO.apjName}
                </p>
                <p className="text-[8px] text-neutral-500">
                  {shift.isAuditedByOwner ? "Disetujui Owner / APJ" : "SIPA / SIA Terverifikasi"}
                </p>
              </div>
            </div>

            {/* Fiscal Footer Note */}
            <div className="mt-4 pt-2 border-t border-dashed border-neutral-300 text-center text-[8px] text-neutral-500">
              <p>Simpan dokumen ini sebagai arsip rekonsiliasi kas resmi Apotek Kerso Waras.</p>
              <p>Dicetak pada: {new Date().toLocaleString("id-ID")}</p>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 bg-white dark:bg-[#1C1C1E] flex items-center justify-between shrink-0">
          <div className="text-[12px] text-[#8E8E93]">
            Format: Standard ESC/POS 80mm Roll Printer
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[12px] font-medium text-[#636366] hover:text-[#1C1C1E]"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-5 py-2.5 rounded-[12px] bg-[#007AFF] hover:bg-[#0062CC] text-white text-[12px] font-semibold flex items-center gap-1.5 shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Struk Rekap (80mm)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
