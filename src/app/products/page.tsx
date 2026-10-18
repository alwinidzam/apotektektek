"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import { useApotekStore } from "@/lib/store";
import { DrugClass, Product } from "@/lib/types";
import { formatRupiah } from "@/lib/utils";
import {
  Search,
  Plus,
  Filter,
  PackagePlus,
  Edit3,
  Trash2,
  AlertTriangle,
  Layers,
  Thermometer,
  ShieldAlert,
  Eye,
  EyeOff,
  CheckCircle2,
  FileSpreadsheet,
} from "lucide-react";
import { AppleSegmentedControl } from "@/components/ui/AppleSegmentedControl";
import { AppleStatusPill, PillVariant } from "@/components/ui/AppleStatusPill";
import { ProductFormModal } from "@/components/products/ProductFormModal";
import { BatchEntryModal } from "@/components/products/BatchEntryModal";
import { Navbar } from "@/components/Navbar";
import { AccessDenied } from "@/components/AccessDenied";
import { useRouter, useSearchParams } from "next/navigation";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";

function ProductsPageContent() {
  const { products, deleteProduct, currentUser, privacyMode, togglePrivacyMode } = useApotekStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedForBatch, setSelectedForBatch] = useState<Product | null>(null);

  const searchParams = useSearchParams();

  useEffect(() => {
    const category = searchParams.get("category");
    if (category) {
      setSelectedCategory(category);
    }
    const action = searchParams.get("action");
    if (action === "new") {
      setIsProductModalOpen(true);
      setEditingProduct(null);
    }
  }, [searchParams]);

  // Role permissions
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

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.genericName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.barcode.includes(searchQuery) ||
        (p.kfaCode && p.kfaCode.includes(searchQuery));

      if (!matchesSearch) return false;

      if (selectedCategory === "ALL") return true;
      if (selectedCategory === "BEBAS") return p.drugClass === "BEBAS";
      if (selectedCategory === "BEBAS_TERBATAS") return p.drugClass === "BEBAS_TERBATAS";
      if (selectedCategory === "KERAS") return p.drugClass === "KERAS";
      if (selectedCategory === "CONTROLLED")
        return (
          p.drugClass === "NARKOTIKA" ||
          p.drugClass === "PSIKOTROPIKA" ||
          p.drugClass === "PREKURSOR" ||
          p.drugClass === "OOT"
        );
      if (selectedCategory === "HIGH_ALERT") return p.isHighAlert || p.isLasa;
      return true;
    });
  }, [products, searchQuery, selectedCategory]);

  // Executive KPI summary (Only visible to Owner / Super Admin)
  const totalValuationHPP = useMemo(() => {
    return products.reduce((acc, p) => {
      const totalUnits = p.batches.reduce((bAcc, b) => bAcc + b.currentStock, 0);
      return acc + totalUnits * p.hpp;
    }, 0);
  }, [products]);

  const totalValuationHJA = useMemo(() => {
    return products.reduce((acc, p) => {
      const totalUnits = p.batches.reduce((bAcc, b) => bAcc + b.currentStock, 0);
      return acc + totalUnits * p.sellingPrice;
    }, 0);
  }, [products]);

  const lowStockCount = useMemo(() => {
    return products.filter((p) => {
      const totalUnits = p.batches.reduce((bAcc, b) => bAcc + b.currentStock, 0);
      return totalUnits <= p.minStockAlert;
    }).length;
  }, [products]);

  const avgMarkup = useMemo(() => {
    if (products.length === 0) return 0;
    const sum = products.reduce((acc, p) => acc + (p.markupPercent || 0), 0);
    return (sum / products.length).toFixed(1);
  }, [products]);

  const getDrugClassPillVariant = (drugClass: DrugClass): PillVariant => {
    switch (drugClass) {
      case "BEBAS":
        return "bebas";
      case "BEBAS_TERBATAS":
        return "bebas_terbatas";
      case "KERAS":
        return "keras";
      case "NARKOTIKA":
        return "narkotika";
      case "PSIKOTROPIKA":
        return "psikotropika";
      case "OOT":
        return "oot";
      case "PREKURSOR":
        return "warning";
      default:
        return "neutral";
    }
  };

  const formatPrivateAmount = (amount: number) => {
    if (isCashier) {
      return <span className="text-[#8E8E93] text-[11px] italic">[Dirahasiakan]</span>;
    }
    if (privacyMode) {
      return <span className="font-mono text-[#8E8E93] select-none">••••••••</span>;
    }
    return <span className="tabular-nums font-semibold">{formatRupiah(amount)}</span>;
  };

  if (isCashier) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#000000]">
        <Navbar />
        <AccessDenied
          requiredRole="Apoteker / Owner / Super Admin"
          reason="Modul Master Produk dan Setting HPP memuat harga beli distributor dan marjin profit apotek yang dirahasiakan dari akun kasir demi menjaga privasi bisnis."
        />
      </div>
    );
  }

  return (
    <div
      {...swipeHandlers}
      className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#F5F5F7] dark:bg-[#000000] text-[#1C1C1E] dark:text-[#F5F5F7] pb-16 touch-pan-y"
    >
      <Navbar />
      {/* Page Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 sm:pt-7 pb-4 sm:pb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-[18px] sm:text-[22px] font-bold tracking-tight text-[#1C1C1E] dark:text-white truncate">
                <span className="sm:hidden">Katalog Obat</span>
                <span className="hidden sm:inline">Katalog Obat & Pengaturan Harga</span>
              </h1>
              {isCashier && (
                <span className="text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 font-semibold shrink-0 whitespace-nowrap">
                  Mode Kasir
                </span>
              )}
            </div>
            <p className="hidden sm:block text-[13px] text-[#8E8E93] mt-0.5">
              Daftar produk obat, harga beli distributor (HNA), margin laba, dan lokasi penyimpanan rak.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
            {isOwnerOrAdmin && (
              <button
                type="button"
                onClick={togglePrivacyMode}
                className={`min-h-[38px] px-3.5 py-2 text-[12px] font-semibold rounded-[10px] border transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                  privacyMode
                    ? "bg-amber-500 text-white border-amber-600 shadow-sm"
                    : "bg-white dark:bg-[#1C1C1E] border-black/[0.08] dark:border-white/[0.12] text-[#1C1C1E] dark:text-white hover:bg-neutral-50 shadow-sm"
                }`}
                title="Sembunyikan angka harga beli & margin di layar"
              >
                {privacyMode ? <EyeOff className="w-4 h-4 shrink-0" /> : <Eye className="w-4 h-4 shrink-0" />}
                <span>{privacyMode ? "Sembunyikan Harga Aktif" : "Sembunyikan Harga"}</span>
              </button>
            )}

            {!isCashier && (
              <button
                type="button"
                onClick={() => {
                  setEditingProduct(null);
                  setIsProductModalOpen(true);
                }}
                className="min-h-[38px] px-4 py-2 text-[12px] font-semibold rounded-[10px] bg-[#008B94] hover:bg-[#00767E] text-white transition-all shadow-sm flex items-center gap-1.5 shrink-0 whitespace-nowrap"
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span>Tambah Obat Baru</span>
              </button>
            )}
          </div>
        </div>

        {/* Executive Stats Bar (Owner / Super Admin Only) */}
        {isOwnerOrAdmin && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
            <div className="bg-white dark:bg-[#1C1C1E] p-4 rounded-[14px] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
              <span className="text-[11px] font-semibold text-[#8E8E93] uppercase tracking-wider block mb-1 whitespace-nowrap">
                Nilai Modal Stok (HNA)
              </span>
              <div className="text-[20px] font-bold text-[#1C1C1E] dark:text-white whitespace-nowrap">
                {formatPrivateAmount(totalValuationHPP)}
              </div>
              <span className="text-[11px] text-[#8E8E93] mt-1 block">
                Total modal obat di gudang & rak
              </span>
            </div>

            <div className="bg-white dark:bg-[#1C1C1E] p-4 rounded-[14px] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
              <span className="text-[11px] font-semibold text-[#8E8E93] uppercase tracking-wider block mb-1 whitespace-nowrap">
                Potensi Omzet Penjualan
              </span>
              <div className="text-[20px] font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                {formatPrivateAmount(totalValuationHJA)}
              </div>
              <span className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 mt-1 block whitespace-nowrap">
                Estimasi Laba Kotor: {formatPrivateAmount(totalValuationHJA - totalValuationHPP)}
              </span>
            </div>

            <div className="bg-white dark:bg-[#1C1C1E] p-4 rounded-[14px] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
              <span className="text-[11px] font-semibold text-[#8E8E93] uppercase tracking-wider block mb-1 whitespace-nowrap">
                Rata-Rata Margin Laba
              </span>
              <div className="text-[20px] font-bold text-[#007AFF] whitespace-nowrap">
                +{avgMarkup}%
              </div>
              <span className="text-[11px] text-[#8E8E93] mt-1 block">
                Rata-rata margin seluruh produk
              </span>
            </div>

            <div className="bg-white dark:bg-[#1C1C1E] p-4 rounded-[14px] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
              <span className="text-[11px] font-semibold text-[#8E8E93] uppercase tracking-wider block mb-1 whitespace-nowrap">
                Perlu Dipesan Ulang
              </span>
              <div className="text-[20px] font-bold text-rose-600 whitespace-nowrap">
                {lowStockCount} Obat
              </div>
              <span className="text-[11px] text-[#8E8E93] mt-1 block">
                Stok menyentuh batas minimum
              </span>
            </div>
          </div>
        )}

        {/* Toolbar & Filters */}
        <div className="mt-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#8E8E93]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama obat, zat aktif, atau nomor barcode..."
              className="w-full pl-9 pr-3 py-2 text-[13px] bg-white dark:bg-[#1C1C1E] border border-black/[0.08] dark:border-white/[0.12] rounded-[10px] outline-none focus:border-[#008B94] shadow-sm"
            />
          </div>

          <div className="overflow-x-auto pb-1 md:pb-0">
            <AppleSegmentedControl
              options={[
                { id: "ALL", label: "Semua", count: products.length },
                { id: "BEBAS", label: "Bebas" },
                { id: "BEBAS_TERBATAS", label: "Bebas Terbatas" },
                { id: "KERAS", label: "Keras" },
                { id: "CONTROLLED", label: "Narkotika / Psikotropika" },
                { id: "HIGH_ALERT", label: "Kewaspadaan Tinggi" },
              ]}
              activeId={selectedCategory}
              onChange={setSelectedCategory}
            />
          </div>
        </div>

        {/* Product Data Table */}
        <div className="mt-5 w-full max-w-full min-w-0 bg-white dark:bg-[#1C1C1E] rounded-[14px] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="w-full max-w-full min-w-0 overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-[13px] border-collapse">
              <thead>
                <tr className="bg-[#F5F5F7]/80 dark:bg-[#2C2C2E]/80 backdrop-blur-md text-[#8E8E93] uppercase text-[10px] tracking-wider font-semibold border-b border-black/[0.06] dark:border-white/[0.08]">
                  <th className="py-3 px-4 min-w-[260px] whitespace-nowrap">Nama Obat & Kandungan</th>
                  <th className="py-3 px-4 whitespace-nowrap">Golongan</th>
                  <th className="py-3 px-4 whitespace-nowrap">Satuan</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">
                    Harga Beli {isCashier ? "" : "(HNA)"}
                  </th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Margin (%)</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Harga Jual</th>
                  <th className="py-3 px-4 text-center whitespace-nowrap">Stok Tersedia</th>
                  <th className="py-3 px-4 whitespace-nowrap">Lokasi Rak</th>
                  <th className="py-3 px-4 text-center whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-[#8E8E93]">
                      Tidak ada produk obat yang sesuai dengan pencarian atau filter.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => {
                    const totalStock = p.batches.reduce((sum, b) => sum + b.currentStock, 0);
                    const isLowStock = totalStock <= p.minStockAlert;
                    const unitLabel = p.baseUnit.charAt(0).toUpperCase() + p.baseUnit.slice(1).toLowerCase();

                    return (
                      <tr
                        key={p.id}
                        className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors"
                      >
                        {/* Name & Generic */}
                        <td className="py-3.5 px-4 min-w-[260px]">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-[#1C1C1E] dark:text-white whitespace-nowrap">
                                {p.name}
                              </span>
                              {p.isHighAlert && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 whitespace-nowrap shrink-0">
                                  High Alert
                                </span>
                              )}
                              {p.storageCondition === "CHILLER_2_8" && (
                                <span className="p-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-950 shrink-0" title="Simpan di Chiller (2–8°C)">
                                  <Thermometer className="w-3 h-3" />
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-[#8E8E93] mt-0.5">{p.genericName} &bull; {p.manufacturer}</span>
                            <div className="text-[10px] font-mono text-[#AEAEB2] mt-0.5 whitespace-nowrap">
                              Barcode: {p.barcode} {p.kfaCode ? `• KFA: ${p.kfaCode}` : ""}
                            </div>
                          </div>
                        </td>

                        {/* Drug Class */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <AppleStatusPill
                            variant={getDrugClassPillVariant(p.drugClass)}
                            label={p.drugClass.replace(/_/g, " ")}
                            size="sm"
                          />
                        </td>

                        {/* Base Unit */}
                        <td className="py-3.5 px-4 whitespace-nowrap font-medium text-[#636366] dark:text-[#AEAEB2]">
                          {unitLabel}
                        </td>

                        {/* HPP (Harga Netto Apotek) */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          {formatPrivateAmount(p.hpp)}
                        </td>

                        {/* Markup */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          {isCashier ? (
                            <span className="text-[#8E8E93] text-[11px]">—</span>
                          ) : (
                            <span className="text-[#007AFF] font-bold tabular-nums">
                              +{p.markupPercent}%
                            </span>
                          )}
                        </td>

                        {/* Selling Price */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <span className="font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                            {formatRupiah(p.sellingPrice)}
                          </span>
                        </td>

                        {/* Total Stock */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 font-bold tabular-nums px-2.5 py-0.5 rounded-full text-[12px] whitespace-nowrap ${
                              isLowStock
                                ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                                : "bg-neutral-100 text-[#1C1C1E] dark:bg-neutral-800 dark:text-white"
                            }`}
                          >
                            {isLowStock && <AlertTriangle className="w-3 h-3 shrink-0" />}
                            {totalStock} {unitLabel}
                          </span>
                          <span className="block text-[10px] text-[#8E8E93] mt-0.5 whitespace-nowrap">
                            {p.batches.length} batch
                          </span>
                        </td>

                        {/* Shelf Location */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-[#636366] dark:text-[#AEAEB2] font-mono text-[12px]">
                          {p.shelfLocation || "—"}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            {!isCashier && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedForBatch(p);
                                  setIsBatchModalOpen(true);
                                }}
                                className="p-1.5 text-[#007AFF] hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-[8px] transition-colors"
                                title="Tambah Batch Barang Masuk"
                              >
                                <PackagePlus className="w-4 h-4" />
                              </button>
                            )}

                            {!isCashier && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingProduct(p);
                                  setIsProductModalOpen(true);
                                }}
                                className="p-1.5 text-[#636366] hover:text-[#1C1C1E] hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-[8px] transition-colors"
                                title="Ubah Data Obat & Harga"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                            )}

                            {currentUser.role === "SUPER_ADMIN" && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Yakin ingin menghapus ${p.name}?`)) {
                                    deleteProduct(p.id);
                                  }
                                }}
                                className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-[8px] transition-colors"
                                title="Hapus Produk"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ProductFormModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        productToEdit={editingProduct}
      />

      <BatchEntryModal
        isOpen={isBatchModalOpen}
        onClose={() => {
          setIsBatchModalOpen(false);
          setSelectedForBatch(null);
        }}
        product={selectedForBatch}
      />
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={null}>
      <ProductsPageContent />
    </Suspense>
  );
}
