"use client";

import { useState } from "react";
import {
  Layers,
  AlertTriangle,
  Calendar,
  Search,
  Plus,
  RefreshCw,
  TrendingDown,
  ShieldAlert,
  ArrowUpDown,
  PackagePlus,
  SlidersHorizontal,
} from "lucide-react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { useApotekStore } from "@/lib/store";
import { formatRupiah, getDaysUntilExpiry, getExpiryStatus } from "@/lib/utils";
import { FEFOEngine } from "@/lib/engines/fefo-engine";
import { AppleSegmentedControl } from "@/components/ui/AppleSegmentedControl";
import { AppleStatusPill } from "@/components/ui/AppleStatusPill";
import { BatchEntryModal } from "@/components/products/BatchEntryModal";
import { Product } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";

export default function InventoryPage() {
  const { products, currentUser, privacyMode } = useApotekStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const isCashier = currentUser.role === "KARYAWAN_KASIR";
  const isOwnerOrAdmin = currentUser.role === "OWNER" || currentUser.role === "SUPER_ADMIN";

  const router = useRouter();
  const swipeHandlers = useSwipeGesture({
    onEdgeSwipeRight: () => {
      if (typeof window !== "undefined" && window.history.length > 1) {
        router.back();
      } else {
        router.push("/");
      }
    },
  });

  // Flatten products into individual batches for deep FEFO inspection
  const allBatches = products.flatMap((product) =>
    product.batches.map((batch) => {
      const daysLeft = getDaysUntilExpiry(batch.expiryDate);
      const status = getExpiryStatus(daysLeft);
      return {
        product,
        batch,
        daysLeft,
        status,
      };
    })
  );

  const filteredBatches = allBatches.filter((item) => {
    const matchSearch =
      item.product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.batch.batchNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.batch.locationRack.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchSearch) return false;

    if (filterStatus === "CRITICAL") return item.daysLeft < 30;
    if (filterStatus === "WARNING") return item.daysLeft >= 30 && item.daysLeft <= 90;
    if (filterStatus === "SAFE") return item.daysLeft > 90;
    return true;
  });

  const criticalCount = allBatches.filter((b) => b.daysLeft < 30).length;
  const warningCount = allBatches.filter((b) => b.daysLeft >= 30 && b.daysLeft <= 90).length;
  const totalStockItems = products.reduce(
    (acc, p) => acc + p.batches.reduce((bAcc, b) => bAcc + b.currentStock, 0),
    0
  );
  const totalAssetValue = products.reduce(
    (acc, p) =>
      acc +
      p.batches.reduce(
        (bAcc, b) => bAcc + b.currentStock * b.purchasePriceHNA,
        0
      ),
    0
  );

  const formatPrivateAmount = (amount: number) => {
    if (isCashier) {
      return <span className="text-[#8E8E93] text-[11px] italic">[Dirahasiakan]</span>;
    }
    if (privacyMode) {
      return <span className="font-mono text-[#8E8E93] select-none">••••••••</span>;
    }
    return <span className="tabular-nums font-bold text-[#1C1C1E] dark:text-white">{formatRupiah(amount)}</span>;
  };

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#F5F5F7] dark:bg-[#000000] text-[#1C1C1E] dark:text-[#F5F5F7]">
      <Navbar />

      <main
        {...swipeHandlers}
        className="w-full max-w-full min-w-0 mx-auto p-3 sm:p-5 lg:p-6 space-y-5 sm:space-y-6 touch-pan-y"
      >
        {/* Page Header & Key Metrics */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-[18px] sm:text-[24px] font-bold text-[#1C1C1E] dark:text-white tracking-tight flex items-center gap-2 truncate">
                <Layers className="h-5 w-5 text-teal-600 shrink-0" />
                <span className="sm:hidden">Stok & Batch</span>
                <span className="hidden sm:inline">Stok Obat & Batch FEFO</span>
              </h1>
            </div>
            <p className="hidden sm:block text-[12px] sm:text-[13px] text-[#8E8E93] mt-0.5">
              Pemantauan stok dan masa simpan obat berdasarkan tanggal kedaluwarsa.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
            <Link
              href="/products"
              title="Buka Master Produk & Formulasi HPP"
              className="min-h-[40px] px-3.5 py-2 rounded-[12px] bg-white dark:bg-[#1C1C1E] border border-black/[0.08] dark:border-white/[0.12] text-[#1C1C1E] dark:text-white hover:bg-neutral-50 text-[12px] font-semibold flex items-center gap-1.5 transition-all shadow-sm shrink-0 whitespace-nowrap"
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span>Katalog</span>
            </Link>

            {!isCashier && (
              <button
                type="button"
                onClick={() => {
                  if (products.length > 0) {
                    setSelectedProduct(products[0]);
                    setIsBatchModalOpen(true);
                  }
                }}
                className="min-h-[40px] px-4 py-2 rounded-[12px] bg-[#008B94] hover:bg-[#00767E] text-white font-semibold text-[12px] shadow-sm flex items-center gap-1.5 transition-all shrink-0 whitespace-nowrap"
              >
                <Plus className="h-4 w-4" />
                <span>Terima Batch</span>
              </button>
            )}
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-[#1C1C1E] p-4 rounded-[16px] border border-black/[0.06] dark:border-white/[0.08] shadow-sm">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8E8E93] block mb-1">
              Total Stok Fisik
            </span>
            <div className="text-[22px] font-bold text-[#1C1C1E] dark:text-white tabular-nums">
              {totalStockItems} Unit
            </div>
            <span className="text-[11px] text-[#8E8E93] mt-1 block">
              {allBatches.length} batch aktif
            </span>
          </div>

          <div className="bg-white dark:bg-[#1C1C1E] p-4 rounded-[16px] border border-black/[0.06] dark:border-white/[0.08] shadow-sm">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8E8E93] block mb-1">
              Total Nilai Stok (HPP)
            </span>
            <div className="text-[22px]">
              {formatPrivateAmount(totalAssetValue)}
            </div>
            <span className="text-[11px] text-[#8E8E93] mt-1 block">
              HNA Netto
            </span>
          </div>

          <div className="bg-white dark:bg-[#1C1C1E] p-4 rounded-[16px] border border-black/[0.06] dark:border-white/[0.08] shadow-sm">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-600 block mb-1">
              Kedaluwarsa &lt;30 Hari
            </span>
            <div className="text-[22px] font-bold text-rose-600 tabular-nums">
              {criticalCount} Batch
            </div>
            <span className="text-[11px] text-rose-600/80 mt-1 block">
              Wajib retur / karantina
            </span>
          </div>

          <div className="bg-white dark:bg-[#1C1C1E] p-4 rounded-[16px] border border-black/[0.06] dark:border-white/[0.08] shadow-sm">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-600 block mb-1">
              Kedaluwarsa 30–90 Hari
            </span>
            <div className="text-[22px] font-bold text-amber-500 tabular-nums">
              {warningCount} Batch
            </div>
            <span className="text-[11px] text-amber-600/80 mt-1 block">
              Prioritas alokasi kasir FEFO
            </span>
          </div>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-[#8E8E93]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari obat, nomor batch, atau lokasi rak..."
              className="w-full pl-9 pr-3 py-2 text-[13px] bg-white dark:bg-[#1C1C1E] border border-black/[0.08] dark:border-white/[0.12] rounded-[10px] outline-none focus:border-[#007AFF] shadow-sm"
            />
          </div>

          <AppleSegmentedControl
            options={[
              { id: "ALL", label: "Semua", count: allBatches.length },
              { id: "CRITICAL", label: "Kritis (<30d)", count: criticalCount },
              { id: "WARNING", label: "Waspada (30-90d)", count: warningCount },
              { id: "SAFE", label: "Aman (>90d)" },
            ]}
            activeId={filterStatus}
            onChange={setFilterStatus}
            size="sm"
          />
        </div>

        {/* Batch Inventory Table */}
        <div className="w-full max-w-full min-w-0 bg-white dark:bg-[#1C1C1E] rounded-[18px] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="w-full max-w-full min-w-0 overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-[13px] border-collapse">
              <thead>
                <tr className="bg-[#F5F5F7]/80 dark:bg-[#2C2C2E]/80 text-[#8E8E93] uppercase text-[11px] tracking-wider font-semibold border-b border-black/[0.06] dark:border-white/[0.08]">
                  <th className="py-3 px-4">Nama Obat</th>
                  <th className="py-3 px-4">No. Batch</th>
                  <th className="py-3 px-4">Expired Date</th>
                  <th className="py-3 px-4">Status Masa Simpan</th>
                  <th className="py-3 px-4 text-center">Stok Batch</th>
                  <th className="py-3 px-4">Lokasi Rak</th>
                  <th className="py-3 px-4 text-right">HPP Satuan</th>
                  <th className="py-3 px-4 text-right">Harga Jual</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
                {filteredBatches.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-[#8E8E93]">
                      Tidak ada batch yang cocok dengan kriteria filter.
                    </td>
                  </tr>
                ) : (
                  filteredBatches.map((item) => (
                    <tr
                      key={item.batch.id}
                      className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors"
                    >
                      {/* Name */}
                      <td className="py-3.5 px-4 font-semibold text-[#1C1C1E] dark:text-white">
                        {item.product.name}
                        <span className="block text-[11px] font-normal text-[#8E8E93]">
                          {item.product.genericName}
                        </span>
                      </td>

                      {/* Batch No */}
                      <td className="py-3.5 px-4 font-mono text-[12px] font-semibold text-[#007AFF]">
                        {item.batch.batchNumber}
                      </td>

                      {/* Expiry Date */}
                      <td className="py-3.5 px-4 font-mono text-[12px]">
                        {item.batch.expiryDate.split("T")[0]}
                      </td>

                      {/* Expiry Status Pill */}
                      <td className="py-3.5 px-4">
                        <AppleStatusPill
                          variant={
                            item.daysLeft <= 0
                              ? "danger"
                              : item.daysLeft < 30
                              ? "danger"
                              : item.daysLeft <= 90
                              ? "warning"
                              : "safe"
                          }
                          label={
                            item.daysLeft <= 0
                              ? "KEDALUWARSA"
                              : `${item.daysLeft} hari lagi`
                          }
                          size="sm"
                        />
                      </td>

                      {/* Stock */}
                      <td className="py-3.5 px-4 text-center font-bold tabular-nums">
                        {item.batch.currentStock} {item.product.baseUnit}
                      </td>

                      {/* Rack */}
                      <td className="py-3.5 px-4 font-mono text-[12px] text-[#636366] dark:text-[#AEAEB2]">
                        {item.batch.locationRack || "—"}
                      </td>

                      {/* HPP */}
                      <td className="py-3.5 px-4 text-right">
                        {isCashier ? (
                          <span className="text-[#8E8E93] text-[11px] italic">[Dirahasiakan]</span>
                        ) : privacyMode ? (
                          <span className="font-mono text-[#8E8E93]">••••••</span>
                        ) : (
                          <span className="tabular-nums font-medium text-[#1C1C1E] dark:text-white">
                            {formatRupiah(item.batch.purchasePriceHNA)}
                          </span>
                        )}
                      </td>

                      {/* Selling Price */}
                      <td className="py-3.5 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {formatRupiah(item.batch.sellingPrice)}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-center">
                        {!isCashier && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedProduct(item.product);
                              setIsBatchModalOpen(true);
                            }}
                            className="p-1.5 text-[#007AFF] hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-[8px] transition-colors"
                            title="Tambah batch baru untuk obat ini"
                          >
                            <PackagePlus className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Batch Entry Modal */}
      <BatchEntryModal
        isOpen={isBatchModalOpen}
        onClose={() => {
          setIsBatchModalOpen(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
      />
    </div>
  );
}
