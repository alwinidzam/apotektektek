"use client";

import React, { useState } from "react";
import { PharmacyPnLStatement, APOTEK_KERSO_WARAS_INFO } from "@/lib/types";
import { formatRupiah } from "@/lib/utils";
import Image from "next/image";
import {
  Printer,
  FileCheck2,
  Calendar,
  CheckCircle2,
  ShieldCheck,
  Building2,
  DollarSign,
  TrendingUp,
  Percent,
} from "lucide-react";

interface FormalMonthlyPnLViewProps {
  pnl: PharmacyPnLStatement;
  privacyMode?: boolean;
  onApprove?: () => void;
}

export const FormalMonthlyPnLView: React.FC<FormalMonthlyPnLViewProps> = ({
  pnl,
  privacyMode = false,
  onApprove,
}) => {
  const [isApproved, setIsApproved] = useState(pnl.status === "APPROVED_BY_OWNER");

  const renderAmount = (amount: number, isNegative = false) => {
    if (privacyMode) return "••••••••";
    const formatted = formatRupiah(Math.abs(amount));
    return isNegative ? `(${formatted})` : formatted;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleTriggerApprove = () => {
    setIsApproved(true);
    if (onApprove) onApprove();
  };

  return (
    <div className="space-y-6">
      {/* Top Action Toolbar (Hidden during print) */}
      <div className="no-print bg-white dark:bg-[#1C1C1E] p-4 sm:p-5 rounded-[20px] border border-black/[0.06] dark:border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[12px] bg-teal-50 dark:bg-teal-950/50 flex items-center justify-center text-[#008B94]">
            <FileCheck2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-[16px] font-bold text-[#1C1C1E] dark:text-white leading-tight">
              Laporan Laba Rugi Formal (Standar SAK EMKM)
            </h3>
            <p className="text-[12px] text-[#8E8E93]">
              Periode: {pnl.periodMonthName} &bull; Siap dicetak fisik format A4 dengan KOP & TTD 3-Tier Berjenjang
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
          {!isApproved ? (
            <button
              type="button"
              onClick={handleTriggerApprove}
              className="flex items-center gap-1.5 px-4 py-2 rounded-[10px] bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-semibold transition-all shadow-sm whitespace-nowrap shrink-0"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Setujui Laporan (Pemilik)</span>
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[12px] font-bold whitespace-nowrap shrink-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Disetujui Pemilik</span>
            </span>
          )}

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 rounded-[10px] bg-[#008B94] hover:bg-[#00767E] text-white text-[12px] font-semibold transition-all shadow-sm whitespace-nowrap shrink-0"
          >
            <Printer className="w-4 h-4 shrink-0" />
            <span>Cetak Dokumen Resmi A4</span>
          </button>
        </div>
      </div>

      {/* Formal Paper Document View (Print-optimized) */}
      <div className="bg-white text-black p-6 sm:p-10 rounded-[24px] border border-black/10 shadow-[0_4px_24px_rgba(0,0,0,0.06)] print:p-0 print:border-none print:shadow-none print:rounded-none max-w-4xl mx-auto font-sans">
        {/* Official Pharmacy Letterhead (KOP Resmi Apotek) */}
        <div className="border-b-2 border-black pb-4 mb-6 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 flex items-center justify-center shrink-0">
              <Image
                src="/logo-dark.png"
                alt="Logo Apotek Kerso Waras"
                width={48}
                height={48}
                className="object-contain"
              />
            </div>
            <div>
              <h1 className="text-[20px] font-black tracking-tight uppercase text-black">
                {APOTEK_KERSO_WARAS_INFO.name}
              </h1>
              <p className="text-[11px] text-neutral-700 leading-tight">
                {APOTEK_KERSO_WARAS_INFO.address}, {APOTEK_KERSO_WARAS_INFO.district}, {APOTEK_KERSO_WARAS_INFO.regency} {APOTEK_KERSO_WARAS_INFO.postalCode}
              </p>
              <p className="text-[10px] text-neutral-600 font-mono mt-0.5">
                SIA: {APOTEK_KERSO_WARAS_INFO.siaNumber} &bull; SIPA APJ: {APOTEK_KERSO_WARAS_INFO.sipaNumber} &bull; Telp: {APOTEK_KERSO_WARAS_INFO.phone}
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="inline-block border border-black px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">
              SAK EMKM / IAI
            </span>
            <p className="text-[10px] text-neutral-600 mt-1 font-mono">
              Dokumen: KW-FIN-{pnl.periodYear}-{String(pnl.periodMonth).padStart(2, "0")}
            </p>
          </div>
        </div>

        {/* Document Title */}
        <div className="text-center my-4">
          <h2 className="text-[16px] font-bold uppercase tracking-wide underline underline-offset-4">
            LAPORAN LABA RUGI FORMAL BULANAN
          </h2>
          <p className="text-[12px] font-semibold text-neutral-700 mt-1">
            Periode: Bulan {pnl.periodMonthName}
          </p>
        </div>

        {/* P&L Financial Table */}
        <div className="space-y-4 text-[12px]">
          {/* Section 1: Revenue */}
          <div>
            <div className="bg-neutral-100 font-bold px-3 py-1.5 border-y border-neutral-300 uppercase tracking-wide flex justify-between">
              <span>1. PENDAPATAN USAHA</span>
              <span>Jumlah (Rp)</span>
            </div>
            <div className="divide-y divide-neutral-200">
              <div className="py-1 px-3 flex justify-between pl-6">
                <span>Penjualan Obat Keras & Resep Dokter</span>
                <span className="font-mono tabular-nums">{renderAmount(pnl.revenue.salesEthical)}</span>
              </div>
              <div className="py-1 px-3 flex justify-between pl-6">
                <span>Penjualan Obat Bebas & P3K</span>
                <span className="font-mono tabular-nums">{renderAmount(pnl.revenue.salesOTC)}</span>
              </div>
              <div className="py-1 px-3 flex justify-between pl-6">
                <span>Penjualan Vitamin, Nutrisi & Suplemen</span>
                <span className="font-mono tabular-nums">{renderAmount(pnl.revenue.salesSupplements)}</span>
              </div>
              <div className="py-1 px-3 flex justify-between pl-6">
                <span>Penjualan Alat Kesehatan & PKRT</span>
                <span className="font-mono tabular-nums">{renderAmount(pnl.revenue.salesAlkes)}</span>
              </div>
              <div className="py-1 px-3 flex justify-between pl-6">
                <span>Jasa Pelayanan Kefarmasian Resep (Tuslah)</span>
                <span className="font-mono tabular-nums">{renderAmount(pnl.revenue.feeTuslahJasaResep)}</span>
              </div>
              <div className="py-1 px-3 flex justify-between pl-6">
                <span>Wadah & Bahan Pengemas Racikan (Embalase)</span>
                <span className="font-mono tabular-nums">{renderAmount(pnl.revenue.feeEmbalaseWadah)}</span>
              </div>
              <div className="py-1.5 px-3 flex justify-between font-semibold bg-neutral-50/70">
                <span>Total Penjualan Kotor</span>
                <span className="font-mono tabular-nums">{renderAmount(pnl.revenue.grossRevenue)}</span>
              </div>
              <div className="py-1 px-3 flex justify-between pl-6 text-neutral-600">
                <span>Dikurangi: Diskon Penjualan & Promosi</span>
                <span className="font-mono tabular-nums">{renderAmount(pnl.revenue.discountsSales, true)}</span>
              </div>
              <div className="py-1 px-3 flex justify-between pl-6 text-neutral-600">
                <span>Dikurangi: Retur Penjualan Pasien</span>
                <span className="font-mono tabular-nums">{renderAmount(pnl.revenue.returnsSales, true)}</span>
              </div>
              <div className="py-2 px-3 flex justify-between font-bold bg-neutral-100/80 border-t border-neutral-300">
                <span>TOTAL PENDAPATAN BERSIH</span>
                <span className="font-mono tabular-nums text-teal-800">{renderAmount(pnl.revenue.netRevenue)}</span>
              </div>
            </div>
          </div>

          {/* Section 2: COGS / HPP */}
          <div>
            <div className="bg-neutral-100 font-bold px-3 py-1.5 border-y border-neutral-300 uppercase tracking-wide flex justify-between">
              <span>2. HARGA POKOK PENJUALAN (HPP)</span>
              <span>Jumlah (Rp)</span>
            </div>
            <div className="divide-y divide-neutral-200">
              <div className="py-1 px-3 flex justify-between pl-6">
                <span>Persediaan Awal Obat & Alkes (Hasil Opname Awal Bulan)</span>
                <span className="font-mono tabular-nums">{renderAmount(pnl.cogs.beginningInventory)}</span>
              </div>
              <div className="py-1 px-3 flex justify-between pl-6">
                <span>Pembelian Bersih dari PBF (Pedagang Besar Farmasi)</span>
                <span className="font-mono tabular-nums">{renderAmount(pnl.cogs.netPurchasesPBF)}</span>
              </div>
              <div className="py-1 px-3 flex justify-between pl-6 font-semibold bg-neutral-50/70">
                <span>Barang Tersedia untuk Dijual</span>
                <span className="font-mono tabular-nums">{renderAmount(pnl.cogs.goodsAvailableForSale)}</span>
              </div>
              <div className="py-1 px-3 flex justify-between pl-6 text-neutral-600">
                <span>Dikurangi: Persediaan Akhir Obat & Alkes (Opname Akhir Bulan)</span>
                <span className="font-mono tabular-nums">{renderAmount(pnl.cogs.endingInventory, true)}</span>
              </div>
              <div className="py-2 px-3 flex justify-between font-bold bg-neutral-100/80 border-t border-neutral-300">
                <span>TOTAL HARGA POKOK PENJUALAN (HPP)</span>
                <span className="font-mono tabular-nums">{renderAmount(pnl.cogs.totalCOGS)}</span>
              </div>
            </div>
          </div>

          {/* Gross Profit Highlight */}
          <div className="p-3 bg-teal-50 border border-teal-200 font-bold flex justify-between items-center text-[13px]">
            <span className="text-teal-900">LABA KOTOR &bull; Margin: {pnl.grossMarginPercent}%</span>
            <span className="font-mono tabular-nums text-teal-900">{renderAmount(pnl.grossProfit)}</span>
          </div>

          {/* Section 3: OPEX */}
          <div>
            <div className="bg-neutral-100 font-bold px-3 py-1.5 border-y border-neutral-300 uppercase tracking-wide flex justify-between">
              <span>3. BEBAN OPERASIONAL APOTEK</span>
              <span>Jumlah (Rp)</span>
            </div>
            <div className="divide-y divide-neutral-200">
              <div className="py-1 px-3 flex justify-between pl-6">
                <span>Beban Gaji & Jasa Profesi (APJ, TTK, Kasir Shift, Tunjangan)</span>
                <span className="font-mono tabular-nums">{renderAmount(pnl.opex.totalPersonnelCost)}</span>
              </div>
              <div className="py-1 px-3 flex justify-between pl-6">
                <span>Beban Utilitas (Listrik Chiller/AC Obat, PDAM, Internet Apotek)</span>
                <span className="font-mono tabular-nums">{renderAmount(pnl.opex.totalUtilitiesCost)}</span>
              </div>
              <div className="py-1 px-3 flex justify-between pl-6">
                <span>Beban Sewa Sarana Bangunan & Amortisasi Izin Apotek (SIA/SIPA)</span>
                <span className="font-mono tabular-nums">{renderAmount(pnl.opex.totalOccupancyCost)}</span>
              </div>
              <div className="py-1 px-3 flex justify-between pl-6">
                <span>Beban Pengemas Farmasi (Plastik Klip, Pot Salep, Kertas Struk Kasir)</span>
                <span className="font-mono tabular-nums">{renderAmount(pnl.opex.totalPackagingCost)}</span>
              </div>
              <div className="py-1 px-3 flex justify-between pl-6">
                <span>Beban Kas Kecil Operasional Harian</span>
                <span className="font-mono tabular-nums">{renderAmount(pnl.opex.totalPettyCashMovementCost)}</span>
              </div>
              <div className="py-2 px-3 flex justify-between font-bold bg-neutral-100/80 border-t border-neutral-300">
                <span>TOTAL BEBAN OPERASIONAL</span>
                <span className="font-mono tabular-nums">{renderAmount(pnl.opex.totalOPEX)}</span>
              </div>
            </div>
          </div>

          {/* Section 4: Operating Profit & Net Profit */}
          <div className="space-y-1.5 pt-2">
            <div className="py-1.5 px-3 flex justify-between font-bold bg-neutral-100 border border-neutral-300">
              <span>LABA OPERASIONAL</span>
              <span className="font-mono tabular-nums">{renderAmount(pnl.ebitdaOperatingProfit)}</span>
            </div>
            <div className="py-1 px-3 flex justify-between text-neutral-600 pl-6">
              <span>Pendapatan / (Beban) Lain-lain Bersih (Bunga Bank & Potongan QRIS/EDC)</span>
              <span className="font-mono tabular-nums">{renderAmount(pnl.netOtherGainLoss)}</span>
            </div>
            <div className="py-1 px-3 flex justify-between font-semibold pl-6">
              <span>Laba Sebelum Pajak</span>
              <span className="font-mono tabular-nums">{renderAmount(pnl.ebtPreTaxProfit)}</span>
            </div>
            <div className="py-1 px-3 flex justify-between text-neutral-600 pl-6">
              <span>Beban Pajak Penghasilan PPh Final 0.5% (PP No. 55/2022)</span>
              <span className="font-mono tabular-nums">{renderAmount(pnl.incomeTaxUMKM, true)}</span>
            </div>
            <div className="p-3 bg-emerald-50 border-2 border-emerald-600 font-bold flex justify-between items-center text-[14px]">
              <span className="text-emerald-950">LABA BERSIH BULAN BERJALAN &bull; Margin Bersih: {pnl.netMarginPercent}%</span>
              <span className="font-mono tabular-nums text-emerald-950">{renderAmount(pnl.netProfit)}</span>
            </div>
          </div>

          {/* Cash Physical Recap */}
          <div className="mt-4 p-3 bg-neutral-50 border border-neutral-200 rounded-[8px] text-[11px] space-y-1">
            <div className="font-bold text-neutral-800 uppercase tracking-wide">
              Rekapitulasi Kas Fisik & Rekonsiliasi Bank:
            </div>
            <div className="flex justify-between text-neutral-700">
              <span>Total Penerimaan Fisik Kasir (Setoran Tunai ke Brankas)</span>
              <span className="font-mono">{renderAmount(pnl.physicalCashDeposited)}</span>
            </div>
            <div className="flex justify-between text-neutral-700">
              <span>Total Penerimaan Non-Tunai (Rekening Giro Bank / Settlement QRIS)</span>
              <span className="font-mono">{renderAmount(pnl.digitalFundsBankSettled)}</span>
            </div>
            <div className="flex justify-between font-medium text-emerald-800">
              <span>Akumulasi Selisih Kasir (Net Variance Rekonsiliasi Shift Bulan Ini)</span>
              <span className="font-mono">+{renderAmount(pnl.accumulatedCashVariance)} (Wajar)</span>
            </div>
          </div>

          {/* 3-Tier Official Signatures */}
          <div className="pt-8 grid grid-cols-3 gap-6 text-center text-[11px]">
            <div>
              <p className="text-neutral-600">Disusun oleh:</p>
              <p className="font-semibold text-neutral-800">Staf Keuangan / Kasir Kepala</p>
              <div className="h-16 flex items-center justify-center">
                <span className="text-neutral-400 font-serif italic">[Tanda Tangan Digital]</span>
              </div>
              <p className="font-bold underline text-neutral-900">{pnl.preparedByStaffName}</p>
              <p className="text-[10px] text-neutral-500 font-mono">Staff ID: KASIR-KW-01</p>
            </div>

            <div>
              <p className="text-neutral-600">Diverifikasi oleh:</p>
              <p className="font-semibold text-neutral-800">Apoteker Penanggung Jawab (APJ)</p>
              <div className="h-16 flex items-center justify-center">
                <span className="text-teal-700 font-serif italic font-bold">[Telah Diverifikasi APJ]</span>
              </div>
              <p className="font-bold underline text-neutral-900">{pnl.verifiedByApjName}</p>
              <p className="text-[10px] text-neutral-500 font-mono">SIPA: {pnl.verifiedByApjSipa}</p>
            </div>

            <div>
              <p className="text-neutral-600">Disetujui oleh:</p>
              <p className="font-semibold text-neutral-800">Pemilik Sarana Apotek (PSA)</p>
              <div className="h-16 flex items-center justify-center">
                {isApproved ? (
                  <span className="text-emerald-700 font-bold border border-emerald-600 px-2 py-0.5 rounded text-[10px]">
                    RESMI DISETUJUI
                  </span>
                ) : (
                  <span className="text-neutral-400 italic">[Menunggu Persetujuan]</span>
                )}
              </div>
              <p className="font-bold underline text-neutral-900">{pnl.approvedByOwnerName}</p>
              <p className="text-[10px] text-neutral-500 font-mono">Pemilik Sarana Apotek (Owner)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
