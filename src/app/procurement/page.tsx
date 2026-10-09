"use client";

import { useState } from "react";
import {
  ClipboardList,
  AlertCircle,
  Truck,
  CheckCircle2,
  Plus,
  ArrowRight,
  TrendingDown,
  Building,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { AccessDenied } from "@/components/AccessDenied";
import { useApotekStore } from "@/lib/store";
import { FEFOEngine } from "@/lib/engines/fefo-engine";
import { formatRupiah } from "@/lib/utils";
import { showAppleToast } from "@/components/ui/AppleToast";

export default function ProcurementPage() {
  const { products, currentUser } = useApotekStore();

  if (currentUser.role === "KARYAWAN_KASIR") {
    return (
      <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#000000]">
        <Navbar />
        <AccessDenied
          requiredRole="Apoteker / Owner / Super Admin"
          reason="Buku Defecta dan Pengadaan PBF memuat harga faktur distributor dan negosiasi supplier yang dibatasi untuk Apoteker dan Pemilik Apotek."
        />
      </div>
    );
  }

  // Defecta items: products where total current stock <= minStockAlert
  const defectaItems = products
    .map((prod) => {
      const currentStock = prod.batches.reduce((acc, b) => acc + b.currentStock, 0);
      const isDefecta = currentStock <= prod.minStockAlert;
      const rop = FEFOEngine.calculateROP(5, 3, 10); // Simulation: 5 unit/day, 3 day lead time, 10 safety stock = 25
      return {
        product: prod,
        currentStock,
        isDefecta,
        rop,
        suggestedOrderQty: Math.max(0, prod.maxStockAlert - currentStock),
      };
    })
    .filter((d) => d.isDefecta);

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#F5F5F7] dark:bg-[#000000] text-[#1C1C1E] dark:text-[#F5F5F7] flex flex-col">
      <Navbar />

      <main className="flex-1 w-full max-w-full min-w-0 mx-auto p-3 sm:p-5 lg:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <ClipboardList className="h-6 w-6 text-emerald-600" />
              <span>Buku Defecta Digital & Pengadaan PBF</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Otomatisasi pemesanan obat yang menyentuh batas Reorder Point (ROP) & verifikasi 3-Way
              Matching LPB
            </p>
          </div>

          <button
            onClick={() =>
              showAppleToast({
                type: "success",
                title: "Otomatisasi Defecta PBF",
                message: "Seluruh item defecta berhasil dikelompokkan ke draf Surat Pesanan (SP) masing-masing PBF rekanan.",
              })
            }
            disabled={defectaItems.length === 0}
            className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center gap-2 disabled:opacity-50 transition-all"
          >
            <Truck className="h-4 w-4" />
            <span>Generate Surat Pesanan (SP) Massal</span>
          </button>
        </div>

        {/* Defecta Alert Banner */}
        {defectaItems.length > 0 ? (
          <div className="p-4 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-amber-100 dark:bg-amber-900 flex items-center justify-center text-amber-600 shrink-0">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-sm block">
                {defectaItems.length} Obat Masuk Buku Defecta (Stok di bawah batas minimum)!
              </span>
              <p className="text-xs mt-0.5">
                Segera terbitkan Surat Pesanan kepada PBF rekanan agar tidak terjadi kekosongan obat
                pada pasien kronis.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-900 dark:text-emerald-200 flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
            <span className="text-xs font-semibold">
              Persediaan optimal. Tidak ada obat yang menyentuh batas minimum stok hari ini.
            </span>
          </div>
        )}

        {/* Defecta Items Table */}
        <div className="w-full max-w-full min-w-0 glass-panel p-4 sm:p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Daftar Item Defecta (Perlu Segera Dipesan)
            </h2>
            <span className="text-xs text-slate-400 font-mono">
              Formula ROP: (Lead Time x Konsumsi Harian) + Safety Stock
            </span>
          </div>

          <div className="w-full max-w-full min-w-0 overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full min-w-[850px] text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                  <th className="p-3">Nama Obat & Pabrik</th>
                  <th className="p-3">Golongan</th>
                  <th className="p-3 text-center">Stok Saat Ini</th>
                  <th className="p-3 text-center">Batas Min (ROP)</th>
                  <th className="p-3 text-center">Rekomendasi Pesan</th>
                  <th className="p-3">PBF Rekanan Utama</th>
                  <th className="p-3 text-right">Estimasi Anggaran HNA</th>
                  <th className="p-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {defectaItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      Buku defecta bersih. Seluruh stok di atas batas Reorder Point.
                    </td>
                  </tr>
                ) : (
                  defectaItems.map((item) => {
                    const priceHNA = item.product.batches[0]?.purchasePriceHNA || 1000;
                    const estimatedTotal = item.suggestedOrderQty * priceHNA;

                    return (
                      <tr key={item.product.id} className="hover:bg-slate-50/50">
                        <td className="p-3">
                          <span className="font-bold text-slate-900 dark:text-white block">
                            {item.product.name}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {item.product.genericName} • Produsen: {item.product.manufacturer}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                            {item.product.drugClass}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span className="font-black font-mono text-red-600 bg-red-50 dark:bg-red-950/60 px-2 py-0.5 rounded-full border border-red-200">
                            {item.currentStock} {item.product.baseUnit}
                          </span>
                        </td>
                        <td className="p-3 text-center font-mono font-medium text-slate-600">
                          {item.product.minStockAlert} {item.product.baseUnit}
                        </td>
                        <td className="p-3 text-center">
                          <span className="font-bold font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                            +{item.suggestedOrderQty} {item.product.baseUnit}
                          </span>
                        </td>
                        <td className="p-3 font-medium text-slate-700 dark:text-slate-300">
                          PT. Anugrah Argon Medica (AAM)
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                          {formatRupiah(estimatedTotal)}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() =>
                              showAppleToast({
                                type: "success",
                                title: "Surat Pesanan Dibuat",
                                message: `Draf Surat Pesanan (SP) untuk ${item.product.name} berhasil dibuat.`,
                              })
                            }
                            className="px-3 py-1 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold text-[11px] hover:bg-emerald-600 transition-colors"
                          >
                            + Buat SP
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 3-Way Matching Workflow Card */}
        <div className="glass-panel p-6 rounded-3xl space-y-3">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Prosedur 3-Way Matching Penerimaan Barang (LPB)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-2">
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <span className="font-bold text-slate-900 dark:text-white block mb-1">
                1. Surat Pesanan (SP)
              </span>
              <p className="text-slate-500 leading-relaxed">
                Verifikasi kesesuaian item obat, kuantitas satuan box/strip, dan izin SIPA APJ yang
                dilegalisir.
              </p>
            </div>
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <span className="font-bold text-slate-900 dark:text-white block mb-1">
                2. Surat Jalan PBF
              </span>
              <p className="text-slate-500 leading-relaxed">
                Pemeriksaan fisik nomor batch, tanggal expired (minimal &gt; 12 bulan), dan suhu cold
                chain (2-8°C).
              </p>
            </div>
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <span className="font-bold text-slate-900 dark:text-white block mb-1">
                3. Faktur Pajak PBF
              </span>
              <p className="text-slate-500 leading-relaxed">
                Pencocokan HNA neto dan pencatatan otomatis Hutang Usaha (TOP 14/30 hari).
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
