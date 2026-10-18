"use client";

import { useState, useRef, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Search,
  ShoppingCart,
  Clock,
  Layers,
  CreditCard,
  Trash2,
  WifiOff,
  Plus,
  ArrowRightLeft,
  Stethoscope,
  Check,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { CartTable } from "@/components/pos/CartTable";
import { ClinicalAlertBanner } from "@/components/pos/ClinicalAlertBanner";
import { PaymentModal } from "@/components/pos/PaymentModal";
import { ReceiptModal } from "@/components/pos/ReceiptModal";
import { HeldBillsModal } from "@/components/pos/HeldBillsModal";
import { ShortcutHelpModal } from "@/components/pos/ShortcutHelpModal";
import { ShiftOpenModal } from "@/components/pos/ShiftOpenModal";
import { CommandPalette } from "@/components/CommandPalette";
import { AppleSegmentedControl } from "@/components/ui/AppleSegmentedControl";
import { showAppleToast } from "@/components/ui/AppleToast";
import { useApotekStore } from "@/lib/store";
import { useGlobalShortcuts } from "@/lib/shortcuts";
import { formatRupiah } from "@/lib/utils";
import { Product, Transaction } from "@/lib/types";
import { soundEngine } from "@/lib/audio";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";

function formatIndonesianDate(isoStr: string): string {
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return isoStr.split("T")[0];
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatUnitLabel(unit: string): string {
  if (!unit) return "Unit";
  return unit.charAt(0).toUpperCase() + unit.slice(1).toLowerCase();
}

function POSPageContent() {
  const {
    products,
    cart,
    addToCart,
    parkBill,
    clearCart,
    heldBills,
    currentShift,
    isOfflineSimulated,
    offlineQueueIds,
    lastSearchLatencyMs,
    setLastSearchLatencyMs,
  } = useApotekStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [transactionMode, setTransactionMode] = useState<"SWAMEDIKASI" | "RESEP_DOKTER">(
    "SWAMEDIKASI"
  );

  const searchParams = useSearchParams();

  useEffect(() => {
    const mode = searchParams.get("mode");
    if (mode === "swamedikasi") setTransactionMode("SWAMEDIKASI");
    else if (mode === "resep") setTransactionMode("RESEP_DOKTER");

    const view = searchParams.get("view");
    if (view === "held") setIsHeldOpen(true);

    const action = searchParams.get("action");
    if (action === "help") setIsHelpOpen(true);
  }, [searchParams]);

  const [patientName, setPatientName] = useState("Pasien Umum");
  const [doctorName, setDoctorName] = useState("dr. Hendra Wijaya, Sp.PD");
  const [prescriptionNumber, setPrescriptionNumber] = useState("RX-202610-08");
  const [doctorSip, setDoctorSip] = useState("SIP.503/442/DS/2024");
  const [isPrescriptionVerified, setIsPrescriptionVerified] = useState(true);
  const [selectedOutStockProduct, setSelectedOutStockProduct] = useState<Product | null>(
    null
  );

  const [mobileTab, setMobileTab] = useState<"CART" | "CATALOG">("CART");
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isHeldOpen, setIsHeldOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isCmdKOpen, setIsCmdKOpen] = useState(false);
  const [isShiftOpenModalOpen, setIsShiftOpenModalOpen] = useState(false);
  const [completedTx, setCompletedTx] = useState<Transaction | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const swipeHandlers = useSwipeGesture({
    onSwipeLeft: () => {
      if (mobileTab === "CART") {
        soundEngine.playKeyTap();
        setMobileTab("CATALOG");
      }
    },
    onSwipeRight: () => {
      if (mobileTab === "CATALOG") {
        soundEngine.playKeyTap();
        setMobileTab("CART");
      }
    },
  });

  useGlobalShortcuts({
    onF1Help: () => setIsHelpOpen(true),
    onF2Search: () => searchInputRef.current?.focus(),
    onF3Racikan: () => {},
    onF4Patient: () => {},
    onF5Doctor: () => {},
    onF6ParkBill: () => parkBill(),
    onF7RecallBill: () => setIsHeldOpen(true),
    onF9SplitPay: () => setIsPaymentOpen(true),
    onF10QuickCash: () => {
      if (cart.length > 0) setIsPaymentOpen(true);
    },
    onF12Checkout: () => {
      if (cart.length > 0) setIsPaymentOpen(true);
    },
    onCmdK: () => setIsCmdKOpen((prev) => !prev),
  });

  // Pre-indexed in-memory search map (< 0.2s instant lookup)
  const indexedProducts = useMemo(() => {
    return products
      .filter((p) => !p.id.startsWith("pkg-"))
      .map((p) => {
        const totalStock = p.batches.reduce((acc, b) => acc + b.currentStock, 0);
        const searchKey = `${p.barcode} ${p.name} ${p.genericName} ${
          p.shelfLocation || ""
        }`.toLowerCase();
        return {
          product: p,
          totalStock,
          searchKey,
        };
      });
  }, [products]);

  // Generic Mapping Helper: Find in-stock substitutes with equivalent active ingredient
  const getGenericSubstitutes = (targetProd: Product): Product[] => {
    const activeIngredient = targetProd.genericName.trim().toLowerCase();
    return indexedProducts
      .filter(
        ({ product, totalStock }) =>
          product.id !== targetProd.id &&
          totalStock > 0 &&
          (product.genericName.trim().toLowerCase() === activeIngredient ||
            product.genericName.toLowerCase().includes(activeIngredient) ||
            activeIngredient.includes(product.genericName.toLowerCase()))
      )
      .map((x) => x.product);
  };

  const filteredCatalog = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return indexedProducts
      .filter(({ product, totalStock, searchKey }) => {
        if (
          selectedCategory === "BEBAS" &&
          product.drugClass !== "BEBAS" &&
          product.drugClass !== "BEBAS_TERBATAS"
        ) {
          return false;
        }
        if (
          selectedCategory === "KERAS" &&
          product.drugClass !== "KERAS" &&
          product.drugClass !== "PSIKOTROPIKA" &&
          product.drugClass !== "OOT"
        ) {
          return false;
        }
        if (selectedCategory === "KOSONG" && totalStock > 0) {
          return false;
        }
        if (q && !searchKey.includes(q)) {
          return false;
        }
        return true;
      })
      .map((entry) => entry.product);
  }, [indexedProducts, selectedCategory, searchQuery]);

  const handleSearchChange = (val: string) => {
    const t0 = typeof performance !== "undefined" ? performance.now() : 0;
    setSearchQuery(val);
    setSelectedOutStockProduct(null);
    const q = val.trim().toLowerCase();
    if (q) {
      const _match = indexedProducts.find((item) => item.searchKey.includes(q));
      const t1 = typeof performance !== "undefined" ? performance.now() : 0.3;
      const elapsedMs = Math.max(0.2, Number((t1 - t0).toFixed(2)));
      setLastSearchLatencyMs(elapsedMs);
    } else {
      setLastSearchLatencyMs(0.3);
    }
  };

  const handleAddProductWithValidation = (prod: Product, unitName?: string) => {
    const totalStock = prod.batches.reduce((acc, b) => acc + b.currentStock, 0);
    if (totalStock <= 0) {
      setSelectedOutStockProduct(prod);
      const substitutes = getGenericSubstitutes(prod);
      if (substitutes.length > 0) {
        showAppleToast({
          type: "warning",
          title: `Stok ${prod.name} Kosong`,
          message: `Tersedia obat pengganti zat aktif sama (${prod.genericName}): ${substitutes[0].name}.`,
        });
      } else {
        showAppleToast({
          type: "error",
          title: "Stok Habis",
          message: `${prod.name} sedang kosong di rak gudang.`,
        });
      }
      return;
    }

    // Automatically switch to Resep Dokter mode if drug requires prescription
    if (
      (prod.drugClass === "KERAS" ||
        prod.drugClass === "PSIKOTROPIKA" ||
        prod.drugClass === "NARKOTIKA") &&
      transactionMode === "SWAMEDIKASI"
    ) {
      setTransactionMode("RESEP_DOKTER");
      if (patientName === "Pasien Umum") {
        setPatientName("Tn. Ahmad Fauzi");
      }
    }

    const added = addToCart(prod, 1, unitName);
    if (!added) {
      showAppleToast({
        type: "warning",
        title: "Batas Stok Fisik",
        message: `Jumlah ${prod.name} di keranjang telah mencapai sisa stok rak (${totalStock} ${prod.baseUnit}).`,
      });
    } else {
      setSelectedOutStockProduct(null);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const t0 = typeof performance !== "undefined" ? performance.now() : 0;
    const q = searchQuery.trim().toLowerCase();
    const exactOrFirst =
      indexedProducts.find((item) => item.product.barcode.toLowerCase() === q) ||
      indexedProducts.find((item) => item.searchKey.includes(q));
    const t1 = typeof performance !== "undefined" ? performance.now() : 0.4;
    setLastSearchLatencyMs(Math.max(0.2, Number((t1 - t0).toFixed(2))));

    if (exactOrFirst) {
      const totalStock = exactOrFirst.totalStock;
      if (totalStock <= 0) {
        setSelectedOutStockProduct(exactOrFirst.product);
      } else {
        handleAddProductWithValidation(exactOrFirst.product);
        setSearchQuery("");
      }
    } else {
      showAppleToast({
        type: "warning",
        title: "Obat Tidak Ditemukan",
        message: `Obat "${searchQuery}" tidak ditemukan di katalog.`,
      });
    }
  };

  const grandTotal = cart.reduce((acc, it) => acc + it.subtotal, 0);
  const topMatchedProduct =
    searchQuery.trim().length >= 2 ? filteredCatalog[0] || null : null;
  const activeOutStockTarget =
    selectedOutStockProduct ||
    (topMatchedProduct &&
    topMatchedProduct.batches.reduce((s, b) => s + b.currentStock, 0) === 0
      ? topMatchedProduct
      : null);
  const activeSubstitutes = activeOutStockTarget
    ? getGenericSubstitutes(activeOutStockTarget)
    : [];

  return (
    <div className="min-h-[calc(100vh-50px)] lg:h-[calc(100vh-50px)] lg:max-h-[calc(100vh-50px)] lg:overflow-hidden w-full max-w-full overflow-x-hidden bg-[#F5F6F8] dark:bg-[#0E0F12] text-neutral-900 dark:text-neutral-100 flex flex-col lg:rounded-br-[10px] border-x border-b border-neutral-300/80 dark:border-white/[0.08]">
      <Navbar
        onOpenHelp={() => setIsHelpOpen(true)}
        onOpenCmdK={() => setIsCmdKOpen(true)}
      />

      {/* Offline Local Cache Active Banner */}
      {isOfflineSimulated && (
        <div className="w-full bg-amber-50 dark:bg-amber-950/60 border-b border-amber-200 dark:border-amber-800/60 px-4 sm:px-5 py-1.5 flex items-center justify-between text-[11.5px] text-amber-900 dark:text-amber-200 shrink-0">
          <div className="flex items-center gap-2">
            <WifiOff className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="font-semibold">Mode Offline Aktif:</span>
            <span>
              Transaksi tetap berjalan melalui penyimpanan lokal (Local Caching).
            </span>
          </div>
          <span className="font-mono font-semibold text-[11px] px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/25 shrink-0">
            {offlineQueueIds?.length || 0} antrean lokal
          </span>
        </div>
      )}

      {/* Unopened Shift Prompt Banner */}
      {(!currentShift || currentShift.status !== "OPEN") && (
        <div className="w-full bg-amber-50/80 dark:bg-amber-950/40 border-b border-amber-200/80 px-4 sm:px-5 py-1.5 flex items-center justify-between text-[11.5px] text-amber-900 dark:text-amber-300 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
            <span className="font-semibold">Shift kasir belum dibuka.</span>
          </div>
          <button
            type="button"
            onClick={() => setIsShiftOpenModalOpen(true)}
            className="px-2.5 py-1 rounded-md bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[11px] transition-colors shrink-0"
          >
            Buka Shift
          </button>
        </div>
      )}

      <main
        {...swipeHandlers}
        className="flex-1 w-full max-w-full mx-auto p-3 sm:p-4 flex flex-col gap-3 min-w-0 pb-24 lg:pb-3 touch-pan-y lg:overflow-hidden min-h-0"
      >
        {/* Top Control Row: Instant Search (< 0.2s) + Mode Transaksi (Swamedikasi / Resep Dokter) */}
        <div className="shrink-0 bg-white dark:bg-[#141416] p-3 rounded-xl border border-neutral-200/80 dark:border-white/[0.08] flex flex-col gap-2.5">
          <div className="flex flex-col lg:flex-row gap-2.5 items-stretch lg:items-center justify-between">
            {/* Instant Search Input */}
            <form
              onSubmit={handleSearchSubmit}
              className="flex-1 relative flex items-center"
            >
              <Search className="h-4 w-4 text-neutral-400 absolute left-3.5 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Cari nama obat, zat aktif, atau scan barcode (F2)"
                className="w-full pl-9 pr-16 py-2 rounded-lg border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#1C1C1E] text-[13px] text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-[#00767E] focus:bg-white dark:focus:bg-[#141416] transition-colors"
                autoFocus
              />
              {searchQuery && (
                <div className="absolute right-2.5 flex items-center">
                  <button
                    type="button"
                    onClick={() => handleSearchChange("")}
                    className="text-[11px] font-medium text-neutral-400 hover:text-neutral-700 dark:hover:text-white px-1.5 py-0.5 rounded hover:bg-neutral-200/60"
                  >
                    Hapus
                  </button>
                </div>
              )}
            </form>

            {/* Swamedikasi vs Resep Dokter Switcher */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="inline-flex p-0.5 rounded-lg bg-neutral-100 dark:bg-[#1C1C1E] border border-neutral-200/80 dark:border-white/10 text-[12px]">
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playKeyTap();
                    setTransactionMode("SWAMEDIKASI");
                  }}
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap ${
                    transactionMode === "SWAMEDIKASI"
                      ? "bg-white dark:bg-[#141416] text-neutral-900 dark:text-white font-semibold shadow-2xs"
                      : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                  }`}
                >
                  Obat Bebas (Swamedikasi)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playKeyTap();
                    setTransactionMode("RESEP_DOKTER");
                    if (patientName === "Pasien Umum") {
                      setPatientName("Tn. Ahmad Fauzi");
                    }
                  }}
                  className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                    transactionMode === "RESEP_DOKTER"
                      ? "bg-[#00767E] text-white font-semibold shadow-2xs"
                      : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                  }`}
                >
                  <Stethoscope className="w-3.5 h-3.5 shrink-0" />
                  <span>Resep Dokter</span>
                </button>
              </div>
            </div>
          </div>

          {/* Instant Lookup Result Strip */}
          {topMatchedProduct && (
            <div className="px-3 py-2 rounded-lg bg-neutral-50 dark:bg-[#1C1C1E] border border-neutral-200/80 dark:border-white/10 flex flex-wrap items-center justify-between gap-2 text-[12px]">
              {(() => {
                const earliestBatch = [...topMatchedProduct.batches].sort(
                  (a, b) =>
                    new Date(a.expiryDate).getTime() -
                    new Date(b.expiryDate).getTime()
                )[0];
                const totalStock = topMatchedProduct.batches.reduce(
                  (s, b) => s + b.currentStock,
                  0
                );
                const stripConv = topMatchedProduct.unitConversions.find(
                  (u) => u.unitName.toUpperCase() === "STRIP"
                );

                return (
                  <>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="font-semibold text-neutral-900 dark:text-white">
                        {topMatchedProduct.name}
                      </span>
                      <span className="text-neutral-500 text-[11.5px]">
                        Zat Aktif: <strong>{topMatchedProduct.genericName}</strong>
                      </span>
                      <span className="font-mono font-semibold text-[#00767E] dark:text-teal-400 whitespace-nowrap">
                        {formatRupiah(topMatchedProduct.sellingPrice)} /{" "}
                        {formatUnitLabel(topMatchedProduct.baseUnit)}
                        {stripConv
                          ? ` · ${formatRupiah(stripConv.pricePerUnit)} / Strip`
                          : ""}
                      </span>
                      <span
                        className={`font-mono text-[11.5px] font-semibold whitespace-nowrap ${
                          totalStock === 0
                            ? "text-rose-600 dark:text-rose-400"
                            : "text-emerald-700 dark:text-emerald-400"
                        }`}
                      >
                        Stok Rak: {totalStock} {formatUnitLabel(topMatchedProduct.baseUnit)} (
                        {earliestBatch?.locationRack ||
                          topMatchedProduct.shelfLocation ||
                          "Rak A-01"}
                        )
                      </span>
                      {earliestBatch && (
                        <span className="font-mono text-[11.5px] text-neutral-500 whitespace-nowrap">
                          ED {formatIndonesianDate(earliestBatch.expiryDate)}
                        </span>
                      )}
                    </div>

                    {totalStock > 0 && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            handleAddProductWithValidation(
                              topMatchedProduct,
                              topMatchedProduct.baseUnit
                            );
                            setSearchQuery("");
                          }}
                          className="px-2.5 py-1 rounded-md bg-[#00767E] hover:bg-[#006067] text-white text-[11.5px] font-semibold flex items-center gap-1 whitespace-nowrap"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+1 {formatUnitLabel(topMatchedProduct.baseUnit)}</span>
                        </button>
                        {stripConv && totalStock >= stripConv.multiplier && (
                          <button
                            type="button"
                            onClick={() => {
                              handleAddProductWithValidation(
                                topMatchedProduct,
                                "STRIP"
                              );
                              setSearchQuery("");
                            }}
                            className="px-2.5 py-1 rounded-md border border-neutral-300 dark:border-white/15 hover:bg-neutral-100 dark:hover:bg-white/10 text-neutral-800 dark:text-white text-[11.5px] font-semibold whitespace-nowrap"
                          >
                            +1 Strip
                          </button>
                        )}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}

          {/* Modul 4: Rekomendasi Obat Pengganti Otomatis (Generic Mapping) */}
          {activeOutStockTarget && activeSubstitutes.length > 0 && (
            <div className="px-3.5 py-2.5 rounded-lg bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
              <div className="flex items-start gap-2.5">
                <ArrowRightLeft className="w-4 h-4 text-amber-700 dark:text-amber-400 mt-0.5 shrink-0" />
                <div className="text-[12px] leading-snug">
                  <span className="font-semibold text-amber-950 dark:text-amber-200">
                    Stok {activeOutStockTarget.name} Habis &mdash; Rekomendasi Obat Pengganti ({activeOutStockTarget.genericName}):
                  </span>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    {activeSubstitutes.map((sub) => {
                      const subStock = sub.batches.reduce(
                        (s, b) => s + b.currentStock,
                        0
                      );
                      return (
                        <span
                          key={sub.id}
                          className="text-[11.5px] font-mono text-amber-900 dark:text-amber-300 whitespace-nowrap"
                        >
                          <strong>{sub.name}</strong> &middot;{" "}
                          {formatRupiah(sub.sellingPrice)}/{formatUnitLabel(sub.baseUnit)} &middot;{" "}
                          Stok: {subStock} {formatUnitLabel(sub.baseUnit)}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {activeSubstitutes.map((sub) => (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => {
                      handleAddProductWithValidation(sub);
                      setSelectedOutStockProduct(null);
                      setSearchQuery("");
                      showAppleToast({
                        type: "success",
                        title: "Obat Pengganti Ditambahkan",
                        message: `${sub.name} (${sub.genericName}) ditambahkan menggantikan ${activeOutStockTarget.name}.`,
                      });
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#00767E] hover:bg-[#006067] text-white text-[11.5px] font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Pilih {sub.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Resep Dokter Verification Bar (Apple HIG Fluid Adaptive Grid) */}
          {transactionMode === "RESEP_DOKTER" && (
            <div className="pt-2.5 border-t border-neutral-100 dark:border-white/[0.06] grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5 items-end">
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 block mb-1">
                  Nama Pasien
                </label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Nama pasien..."
                  className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#1C1C1E] text-[12px] font-medium focus:outline-none focus:border-[#00767E] transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 block mb-1">
                  Dokter Penulis Resep
                </label>
                <input
                  type="text"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  placeholder="Nama dokter..."
                  className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#1C1C1E] text-[12px] font-medium focus:outline-none focus:border-[#00767E] transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 block mb-1">
                  Nomor Resep / SIP
                </label>
                <input
                  type="text"
                  value={prescriptionNumber}
                  onChange={(e) => setPrescriptionNumber(e.target.value)}
                  placeholder="Nomor resep..."
                  className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#1C1C1E] text-[12px] font-mono focus:outline-none focus:border-[#00767E] transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 block mb-1">
                  Status Verifikasi
                </label>
                <button
                  type="button"
                  onClick={() => setIsPrescriptionVerified((v) => !v)}
                  className={`w-full h-[34px] px-3 rounded-lg border text-[11.5px] font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap ${
                    isPrescriptionVerified
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-300"
                      : "bg-neutral-100 border-neutral-200 text-neutral-600 dark:bg-white/[0.06] dark:border-white/10 dark:text-neutral-300"
                  }`}
                >
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {isPrescriptionVerified
                      ? "Resep Terverifikasi"
                      : "Verifikasi Resep"}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Segmented Switcher */}
        <div className="lg:hidden flex items-center p-1 rounded-xl bg-neutral-200/70 dark:bg-neutral-800 text-[12px] font-medium w-full shrink-0">
          <button
            type="button"
            onClick={() => {
              soundEngine.playKeyTap();
              setMobileTab("CART");
            }}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              mobileTab === "CART"
                ? "bg-white dark:bg-[#141416] text-neutral-900 dark:text-white font-semibold shadow-2xs"
                : "text-neutral-500"
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Keranjang ({cart.length})</span>
          </button>
          <button
            type="button"
            onClick={() => {
              soundEngine.playKeyTap();
              setMobileTab("CATALOG");
            }}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              mobileTab === "CATALOG"
                ? "bg-white dark:bg-[#141416] text-neutral-900 dark:text-white font-semibold shadow-2xs"
                : "text-neutral-500"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Katalog Obat ({filteredCatalog.length})</span>
          </button>
        </div>

        {/* Main 2-Column POS Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 min-w-0 flex-1 min-h-0">
          {/* Left Column: Active Cart & Checkout (7 cols) */}
          <section
            className={`lg:col-span-7 flex flex-col gap-3 min-w-0 h-full min-h-0 ${
              mobileTab === "CART" ? "flex" : "hidden lg:flex"
            }`}
          >
            <ClinicalAlertBanner />

            {/* Cart Table */}
            <div className="flex-1 min-h-0 overflow-y-auto rounded-xl">
              <CartTable />
            </div>

            {/* Bottom Checkout Bar */}
            <div className="shrink-0 bg-white dark:bg-[#141416] p-3 rounded-xl border border-neutral-200/80 dark:border-white/[0.08] flex flex-wrap items-center justify-between gap-2.5">
              {/* Secondary Queue Actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => parkBill()}
                  disabled={cart.length === 0}
                  className="px-2.5 py-2 rounded-lg border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#1C1C1E] hover:bg-neutral-100 text-neutral-800 dark:text-white text-[12px] font-medium flex items-center justify-center gap-1.5 disabled:opacity-40 transition-colors whitespace-nowrap shrink-0"
                  title="Tunda struk sementara (F6)"
                >
                  <Clock className="h-3.5 w-3.5 shrink-0" />
                  <span>Tunda</span>
                  <span className="px-1 py-0.2 rounded text-[10px] bg-neutral-200/70 dark:bg-white/10 font-mono">
                    F6
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsHeldOpen(true)}
                  className="px-2.5 py-2 rounded-lg border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#1C1C1E] hover:bg-neutral-100 text-neutral-800 dark:text-white text-[12px] font-medium flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                  title="Panggil struk tertunda (F7)"
                >
                  <Layers className="h-3.5 w-3.5 shrink-0" />
                  <span>Antrean ({heldBills.length})</span>
                  <span className="px-1 py-0.2 rounded text-[10px] bg-neutral-200/70 dark:bg-white/10 font-mono">
                    F7
                  </span>
                </button>

                <button
                  type="button"
                  onClick={clearCart}
                  disabled={cart.length === 0}
                  className="p-2 rounded-lg border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#1C1C1E] hover:text-rose-600 hover:bg-rose-50 text-neutral-400 disabled:opacity-40 transition-colors shrink-0"
                  title="Kosongkan keranjang"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Total & Primary Pay Action */}
              <div className="flex items-center gap-3 ml-auto shrink-0">
                <div className="text-right shrink-0">
                  <span className="text-[11px] text-neutral-500 font-medium block whitespace-nowrap">
                    Total Pembayaran
                  </span>
                  <span className="text-[19px] font-bold text-neutral-900 dark:text-white font-mono tracking-tight tabular-nums whitespace-nowrap block leading-tight">
                    {formatRupiah(grandTotal)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsPaymentOpen(true)}
                  disabled={cart.length === 0}
                  className="px-4 py-2.5 rounded-lg bg-[#00767E] hover:bg-[#006067] text-white font-semibold text-[13px] flex items-center gap-2 disabled:opacity-40 transition-colors whitespace-nowrap shrink-0"
                >
                  <CreditCard className="h-4 w-4 shrink-0" />
                  <span>Bayar & Cetak</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-white/20 font-mono">
                    F12
                  </span>
                </button>
              </div>
            </div>
          </section>

          {/* Right Column: Drug Catalog & Generic Mapping Substitutes (5 cols) */}
          <section
            className={`lg:col-span-5 flex flex-col gap-2.5 min-w-0 h-full min-h-0 ${
              mobileTab === "CATALOG" ? "flex" : "hidden lg:flex"
            }`}
          >
            {/* Clean Category Filter Header */}
            <div className="shrink-0 bg-white dark:bg-[#141416] p-2 rounded-xl border border-neutral-200/80 dark:border-white/[0.08] flex items-center justify-between gap-2">
              <div className="flex-1 overflow-x-auto">
                <AppleSegmentedControl
                  options={[
                    { id: "ALL", label: `Semua (${indexedProducts.length})` },
                    { id: "BEBAS", label: "Obat Bebas" },
                    { id: "KERAS", label: "Resep" },
                    { id: "KOSONG", label: "Stok Habis" },
                  ]}
                  activeId={selectedCategory}
                  onChange={setSelectedCategory}
                  size="sm"
                />
              </div>
            </div>

            {/* Product Grid */}
            <div className="flex-1 min-h-0 overflow-y-auto pr-0.5 grid grid-cols-1 sm:grid-cols-2 gap-2 content-start">
              {filteredCatalog.length === 0 ? (
                <div className="col-span-full py-10 px-4 text-center bg-white dark:bg-[#141416] rounded-xl border border-neutral-200/80 dark:border-white/[0.08]">
                  <Search className="w-6 h-6 text-neutral-400 mx-auto mb-2" />
                  <p className="text-[13px] font-semibold text-neutral-900 dark:text-white">
                    Obat tidak ditemukan
                  </p>
                  <p className="text-[11.5px] text-neutral-500 mt-0.5">
                    Coba kata kunci atau nama zat aktif lain.
                  </p>
                </div>
              ) : (
                filteredCatalog.map((prod) => {
                  const earliestBatch = [...prod.batches].sort(
                    (a, b) =>
                      new Date(a.expiryDate).getTime() -
                      new Date(b.expiryDate).getTime()
                  )[0];
                  const totalStock = prod.batches.reduce(
                    (acc, b) => acc + b.currentStock,
                    0
                  );
                  const isLowStock = totalStock > 0 && totalStock <= prod.minStockAlert;
                  const stripConv = prod.unitConversions.find(
                    (u) => u.unitName.toUpperCase() === "STRIP"
                  );
                  const substitutes =
                    totalStock === 0 ? getGenericSubstitutes(prod) : [];

                  return (
                    <div
                      key={prod.id}
                      onClick={() => handleAddProductWithValidation(prod)}
                      className={`bg-white dark:bg-[#141416] p-3 rounded-xl border transition-colors flex flex-col justify-between cursor-pointer select-none ${
                        totalStock === 0
                          ? "border-amber-200/90 dark:border-amber-800/50 bg-amber-50/20 dark:bg-amber-950/10"
                          : "border-neutral-200/80 dark:border-white/[0.08] hover:border-[#00767E] dark:hover:border-teal-500"
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-1.5 mb-0.5">
                          <span className="font-semibold text-[12.5px] text-neutral-900 dark:text-white line-clamp-1">
                            {prod.name}
                          </span>
                          <span
                            className={`text-[9.5px] font-semibold px-1.5 py-0.2 rounded shrink-0 whitespace-nowrap ${
                              prod.drugClass === "KERAS"
                                ? "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                                : "bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-300"
                            }`}
                          >
                            {prod.drugClass === "BEBAS_TERBATAS"
                              ? "Terbatas"
                              : prod.drugClass === "KERAS"
                              ? "Resep"
                              : "Bebas"}
                          </span>
                        </div>

                        <p className="text-[11px] text-neutral-500 line-clamp-1">
                          {prod.genericName} &middot;{" "}
                          <span className="font-mono">
                            {earliestBatch?.locationRack ||
                              prod.shelfLocation ||
                              "Rak A-01"}
                          </span>
                        </p>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-neutral-100 dark:border-white/[0.06] flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <span className="font-bold text-neutral-900 dark:text-white font-mono text-[13px] tabular-nums whitespace-nowrap block">
                            {formatRupiah(prod.sellingPrice)}
                          </span>
                          <span className="text-[10px] text-neutral-500 truncate block">
                            per {formatUnitLabel(prod.baseUnit)}
                            {stripConv
                              ? ` · ${formatRupiah(stripConv.pricePerUnit)}/Strip`
                              : ""}
                          </span>
                        </div>

                        <div className="text-right shrink-0">
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md font-mono tabular-nums inline-block whitespace-nowrap ${
                              totalStock === 0
                                ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                                : isLowStock
                                ? "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300"
                                : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                            }`}
                          >
                            {totalStock === 0 ? "Habis" : `Stok: ${totalStock}`}
                          </span>
                          {earliestBatch && (
                            <span className="text-[9.5px] text-neutral-400 block font-mono mt-0.5 whitespace-nowrap">
                              ED {formatIndonesianDate(earliestBatch.expiryDate)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Generic Mapping Substitute Button when Out of Stock */}
                      {totalStock === 0 && substitutes.length > 0 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddProductWithValidation(substitutes[0]);
                            showAppleToast({
                              type: "success",
                              title: "Obat Pengganti Ditambahkan",
                              message: `${substitutes[0].name} (${substitutes[0].genericName}) dipilih menggantikan ${prod.name}.`,
                            });
                          }}
                          className="mt-2 w-full py-1 px-2 rounded-lg bg-[#00767E]/10 hover:bg-[#00767E] text-[#006067] hover:text-white dark:text-teal-300 text-[10.5px] font-semibold flex items-center justify-center gap-1 transition-colors"
                        >
                          <ArrowRightLeft className="w-3 h-3 shrink-0" />
                          <span className="truncate">
                            Pengganti: {substitutes[0].name}
                          </span>
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>

        {/* Floating Quick Checkout Bar on Mobile */}
        {cart.length > 0 && (
          <div className="lg:hidden fixed bottom-[calc(env(safe-area-inset-bottom)+3.75rem)] inset-x-3 z-30">
            <div className="p-3 rounded-xl bg-white/95 dark:bg-[#141416]/95 backdrop-blur-xl border border-neutral-200 dark:border-white/10 shadow-lg flex items-center justify-between gap-3">
              <div className="pl-1">
                <span className="text-[10px] text-neutral-500 font-medium block uppercase">
                  {cart.length} Item
                </span>
                <span className="text-[16px] font-bold text-neutral-900 dark:text-white font-mono tabular-nums leading-none">
                  {formatRupiah(grandTotal)}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsPaymentOpen(true)}
                className="px-4 py-2 rounded-lg bg-[#00767E] hover:bg-[#006067] text-white font-semibold text-[12.5px] flex items-center gap-1.5 transition-colors shrink-0"
              >
                <CreditCard className="w-4 h-4" />
                <span>Bayar</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        transactionMode={transactionMode}
        patientName={
          transactionMode === "RESEP_DOKTER" ? patientName : "Pasien Umum (Swamedikasi)"
        }
        doctorName={transactionMode === "RESEP_DOKTER" ? doctorName : undefined}
        doctorSip={transactionMode === "RESEP_DOKTER" ? doctorSip : undefined}
        prescriptionNumber={
          transactionMode === "RESEP_DOKTER" ? prescriptionNumber : undefined
        }
        isPrescriptionVerified={isPrescriptionVerified}
        onSuccess={(tx) => {
          setCompletedTx(tx);
          setIsReceiptOpen(true);
        }}
      />

      <ReceiptModal
        isOpen={isReceiptOpen}
        transaction={completedTx}
        onClose={() => setIsReceiptOpen(false)}
      />

      <HeldBillsModal isOpen={isHeldOpen} onClose={() => setIsHeldOpen(false)} />

      <ShortcutHelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      <CommandPalette isOpen={isCmdKOpen} onClose={() => setIsCmdKOpen(false)} />

      <ShiftOpenModal
        isOpen={isShiftOpenModalOpen}
        onClose={() => setIsShiftOpenModalOpen(false)}
      />
    </div>
  );
}

export default function POSPage() {
  return (
    <Suspense fallback={null}>
      <POSPageContent />
    </Suspense>
  );
}
