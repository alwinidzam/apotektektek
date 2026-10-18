"use client";

import React, { useState, useMemo, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Search,
  Package,
  ClipboardCheck,
  Truck,
  AlertTriangle,
  Lock,
  PlusCircle,
  Camera,
  X,
  ArrowRightLeft,
  Keyboard,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { useApotekStore } from "@/lib/store";
import { formatRupiah, getDaysUntilExpiry, getExpiryStatus, formatIndonesianDate, formatUnitLabel } from "@/lib/utils";
import { showAppleToast } from "@/components/ui/AppleToast";
import { soundEngine } from "@/lib/audio";

function InventoryPageContent() {
  const {
    products,
    currentUser,
    stockOpnameRecords,
    incomingGoodsRecords,
    executeStockOpname,
    recordIncomingGoods,
  } = useApotekStore();

  const isCashier = currentUser.role === "KARYAWAN_KASIR";
  const catalogProducts = useMemo(
    () => products.filter((p) => !p.id.startsWith("pkg-")),
    [products]
  );

  const [activeTab, setActiveTab] = useState<
    "STOCK_LIST" | "INCOMING_GOODS" | "STOCK_OPNAME" | "GENERIC_MAPPING"
  >("STOCK_LIST");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<
    "ALL" | "LOW_STOCK" | "EXPIRING_30_60"
  >("ALL");

  const searchParams = useSearchParams();

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "rak") setActiveTab("STOCK_LIST");
    else if (tab === "pengganti") setActiveTab("GENERIC_MAPPING");
    else if (tab === "masuk") setActiveTab("INCOMING_GOODS");
    else if (tab === "opname") setActiveTab("STOCK_OPNAME");

    const filter = searchParams.get("filter");
    if (filter === "semua") setFilterMode("ALL");
    else if (filter === "menipis") setFilterMode("LOW_STOCK");
    else if (filter === "kadaluarsa") setFilterMode("EXPIRING_30_60");

    const rack = searchParams.get("rack");
    if (rack) {
      setSearchQuery(rack);
      setActiveTab("STOCK_LIST");
    }
  }, [searchParams]);

  // Camera Barcode Scanner Modal State (for Mobile/Tablet Warehouse)
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerTarget, setScannerTarget] = useState<"INCOMING" | "OPNAME">(
    "OPNAME"
  );
  const [manualFallbackQuery, setManualFallbackQuery] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop camera stream when modal closes
  useEffect(() => {
    if (!isScannerOpen && streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setCameraActive(false);
    }
  }, [isScannerOpen]);

  const startMobileCamera = async () => {
    try {
      if (
        typeof navigator !== "undefined" &&
        navigator.mediaDevices &&
        navigator.mediaDevices.getUserMedia
      ) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        streamRef.current = stream;
        setCameraActive(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }
    } catch {
      setCameraActive(false);
    }
  };

  const openBarcodeScanner = (target: "INCOMING" | "OPNAME") => {
    soundEngine.playKeyTap();
    setScannerTarget(target);
    setManualFallbackQuery("");
    setIsScannerOpen(true);
    startMobileCamera();
  };

  // Stock Opname Form State
  const [opnameProductId, setOpnameProductId] = useState<string>(
    catalogProducts[0]?.id || ""
  );
  const selectedOpnameProduct = useMemo(
    () =>
      catalogProducts.find((p) => p.id === opnameProductId) || catalogProducts[0],
    [catalogProducts, opnameProductId]
  );
  const [opnameBatchId, setOpnameBatchId] = useState<string>(
    catalogProducts[0]?.batches[0]?.id || ""
  );
  const selectedOpnameBatch = useMemo(() => {
    if (!selectedOpnameProduct) return null;
    return (
      selectedOpnameProduct.batches.find((b) => b.id === opnameBatchId) ||
      selectedOpnameProduct.batches[0] ||
      null
    );
  }, [selectedOpnameProduct, opnameBatchId]);

  const [physicalStockInput, setPhysicalStockInput] = useState<string>("");
  const [opnameReason, setOpnameReason] = useState<string>("");

  // Incoming Goods Form State
  const [invoiceNo, setInvoiceNo] = useState("");
  const [supplierName, setSupplierName] = useState(
    "PT. Kimia Farma Trading & Distribution"
  );
  const [inProductId, setInProductId] = useState<string>(
    catalogProducts[0]?.id || ""
  );
  const [inBatchNo, setInBatchNo] = useState("");
  const [inExpiryDate, setInExpiryDate] = useState("2028-06-30");
  const [inQty, setInQty] = useState("");
  const [inHna, setInHna] = useState("");
  const [inRack, setInRack] = useState("RAK-A1-01");

  const handleBarcodeScanned = (productId: string) => {
    const prod = catalogProducts.find((p) => p.id === productId);
    if (!prod) return;

    soundEngine.playScanSuccess();
    if (scannerTarget === "INCOMING") {
      setInProductId(prod.id);
      setInHna(String(prod.hpp));
      setInRack(prod.batches[0]?.locationRack || prod.shelfLocation || "RAK-A1-01");
      setInBatchNo(`B-${prod.barcode.slice(-4)}-${new Date().getMonth() + 1}`);
      setActiveTab("INCOMING_GOODS");
    } else {
      setOpnameProductId(prod.id);
      if (prod.batches[0]) {
        setOpnameBatchId(prod.batches[0].id);
        setPhysicalStockInput(String(prod.batches[0].currentStock));
      }
      setActiveTab("STOCK_OPNAME");
    }

    setIsScannerOpen(false);
    showAppleToast({
      type: "success",
      title: ` Terpindai: ${prod.name}`,
      message: `Barcode ${prod.barcode} berhasil dimuat ke formulir ${
        scannerTarget === "INCOMING" ? "Barang Masuk" : "Stock Opname"
      }.`,
    });
  };

  // Flatten all batches
  const allBatchRows = useMemo(() => {
    return catalogProducts.flatMap((prod) =>
      prod.batches.map((b) => ({
        product: prod,
        batch: b,
        daysLeft: getDaysUntilExpiry(b.expiryDate),
        searchKey: `${prod.name} ${prod.genericName} ${prod.barcode} ${b.batchNumber} ${b.locationRack}`.toLowerCase(),
      }))
    );
  }, [catalogProducts]);

  // Expiring within 30–60 days (or < 60 days early warning)
  const expiring30To60Rows = useMemo(
    () => allBatchRows.filter((r) => r.daysLeft <= 60),
    [allBatchRows]
  );

  const lowStockCount = useMemo(
    () =>
      allBatchRows.filter(
        (r) => r.batch.currentStock <= r.product.minStockAlert
      ).length,
    [allBatchRows]
  );

  const filteredBatchRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allBatchRows
      .filter((row) => {
        if (q && !row.searchKey.includes(q)) return false;
        if (
          filterMode === "LOW_STOCK" &&
          row.batch.currentStock > row.product.minStockAlert
        )
          return false;
        if (filterMode === "EXPIRING_30_60" && row.daysLeft > 60) return false;
        return true;
      })
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }, [allBatchRows, searchQuery, filterMode]);

  // Group products by Active Ingredient (Generic Mapping)
  const genericMappingGroups = useMemo(() => {
    const map = new Map<string, typeof catalogProducts>();
    catalogProducts.forEach((p) => {
      const key = p.genericName.trim();
      const existing = map.get(key) || [];
      existing.push(p);
      map.set(key, existing);
    });
    return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [catalogProducts]);

  const handleJumpToOpname = (
    productId: string,
    batchId: string,
    currentStock: number
  ) => {
    soundEngine.playKeyTap();
    setOpnameProductId(productId);
    setOpnameBatchId(batchId);
    setPhysicalStockInput(String(currentStock));
    setOpnameReason("");
    setActiveTab("STOCK_OPNAME");
  };

  const handleExecuteOpname = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOpnameProduct || !selectedOpnameBatch) return;

    const parsedPhysical = parseInt(physicalStockInput, 10);
    const res = executeStockOpname({
      productId: selectedOpnameProduct.id,
      batchId: selectedOpnameBatch.id,
      physicalStock: parsedPhysical,
      reason: opnameReason,
    });

    if (!res.success) {
      showAppleToast({
        type: "error",
        title: "Stock Opname Ditolak",
        message: res.message,
      });
      return;
    }

    showAppleToast({
      type: "success",
      title: "Stock Opname Tersimpan",
      message: res.message,
    });
    setPhysicalStockInput("");
    setOpnameReason("");
  };

  const handleRecordIncoming = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedQty = parseInt(inQty, 10);
    const parsedHna = parseInt(inHna, 10);

    const res = recordIncomingGoods({
      invoiceNumber: invoiceNo,
      supplierName,
      productId: inProductId,
      batchNumber: inBatchNo,
      expiryDate: inExpiryDate,
      quantity: parsedQty,
      purchasePriceHNA: parsedHna,
      locationRack: inRack,
    });

    if (!res.success) {
      showAppleToast({
        type: "error",
        title: "Input Barang Masuk Ditolak",
        message: res.message,
      });
      return;
    }

    showAppleToast({
      type: "success",
      title: "Barang Masuk Tercatat",
      message: res.message,
    });
    setInvoiceNo("");
    setInBatchNo("");
    setInQty("");
    setInHna("");
  };

  const totalUnitsInWarehouse = allBatchRows.reduce(
    (acc, r) => acc + r.batch.currentStock,
    0
  );

  const manualFallbackMatches = useMemo(() => {
    const q = manualFallbackQuery.trim().toLowerCase();
    if (!q) return catalogProducts.slice(0, 6);
    return catalogProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.barcode.toLowerCase().includes(q) ||
        p.genericName.toLowerCase().includes(q)
    );
  }, [catalogProducts, manualFallbackQuery]);

  return (
    <div className="min-h-[calc(100vh-50px)] w-full max-w-full overflow-x-hidden bg-[#F5F6F8] dark:bg-[#0E0F12] text-neutral-900 dark:text-neutral-100 flex flex-col lg:rounded-br-[10px] border-x border-b border-neutral-300/80 dark:border-white/[0.08]">
      <Navbar />

      <main className="flex-1 w-full max-w-[1440px] mx-auto p-4 sm:p-6 pb-24 lg:pb-8 space-y-4">
        {/* Clean Page Header */}
        <div className="bg-white dark:bg-[#141416] p-4 sm:p-5 rounded-xl border border-neutral-200/80 dark:border-white/[0.08] flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          <div className="flex items-center justify-between gap-3 min-w-0">
            <div className="min-w-0">
              <h1 className="text-[18px] sm:text-[19px] font-bold tracking-tight text-neutral-900 dark:text-white truncate">
                {isCashier ? "Cek Sisa Stok & Obat Pengganti" : "Stok & Opname Gudang"}
              </h1>
              <p className="text-[12px] text-neutral-500 mt-0.5 truncate">
                {totalUnitsInWarehouse.toLocaleString("id-ID")} satuan tersedia &middot;{" "}
                {expiring30To60Rows.length} batch mendekati kadaluarsa (30–60 hari)
              </p>
            </div>

            {!isCashier && (
              <button
                type="button"
                onClick={() =>
                  openBarcodeScanner(
                    activeTab === "INCOMING_GOODS" ? "INCOMING" : "OPNAME"
                  )
                }
                className="xl:hidden px-3 py-2 rounded-lg bg-[#00767E] text-white text-[12px] font-semibold flex items-center gap-1.5 shrink-0 whitespace-nowrap"
              >
                <Camera className="w-4 h-4" />
                <span>Scan Barcode</span>
              </button>
            )}
          </div>

          <div className="flex items-center justify-between xl:justify-end gap-2 shrink-0 overflow-x-auto">
            {/* Segmented Navigation Tabs */}
            <div className="flex items-center p-1 rounded-lg bg-neutral-100 dark:bg-[#1C1C1E] border border-neutral-200/80 dark:border-white/10 shrink-0">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playKeyTap();
                  setActiveTab("STOCK_LIST");
                }}
                className={`px-2.5 py-1.5 rounded-md text-[12px] font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                  activeTab === "STOCK_LIST"
                    ? "bg-white dark:bg-[#141416] text-neutral-900 dark:text-white font-semibold shadow-2xs"
                    : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Stok Rak ({allBatchRows.length})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundEngine.playKeyTap();
                  setActiveTab("GENERIC_MAPPING");
                }}
                className={`px-2.5 py-1.5 rounded-md text-[12px] font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                  activeTab === "GENERIC_MAPPING"
                    ? "bg-white dark:bg-[#141416] text-neutral-900 dark:text-white font-semibold shadow-2xs"
                    : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                }`}
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>Obat Pengganti</span>
              </button>

              {!isCashier && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playKeyTap();
                      setActiveTab("INCOMING_GOODS");
                    }}
                    className={`px-2.5 py-1.5 rounded-md text-[12px] font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                      activeTab === "INCOMING_GOODS"
                        ? "bg-white dark:bg-[#141416] text-neutral-900 dark:text-white font-semibold shadow-2xs"
                        : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                    }`}
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Barang Masuk</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playKeyTap();
                      setActiveTab("STOCK_OPNAME");
                    }}
                    className={`px-2.5 py-1.5 rounded-md text-[12px] font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                      activeTab === "STOCK_OPNAME"
                        ? "bg-white dark:bg-[#141416] text-neutral-900 dark:text-white font-semibold shadow-2xs"
                        : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                    }`}
                  >
                    <ClipboardCheck className="w-3.5 h-3.5" />
                    <span>Stock Opname</span>
                  </button>
                </>
              )}
            </div>

            {!isCashier ? (
              <button
                type="button"
                onClick={() =>
                  openBarcodeScanner(
                    activeTab === "INCOMING_GOODS" ? "INCOMING" : "OPNAME"
                  )
                }
                className="hidden xl:inline-flex px-3.5 py-2 rounded-lg bg-[#00767E] hover:bg-[#006067] text-white text-[12px] font-semibold items-center gap-1.5 transition-colors shrink-0 whitespace-nowrap"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Scan Barcode</span>
              </button>
            ) : (
              <div className="px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-white/[0.06] border border-neutral-200 dark:border-white/10 text-neutral-600 dark:text-neutral-300 text-[11.5px] font-medium flex items-center gap-1.5 whitespace-nowrap shrink-0">
                <Lock className="w-3.5 h-3.5 text-neutral-400" />
                <span>Mode Lihat Stok</span>
              </div>
            )}
          </div>
        </div>

        {/* Modul 3: Pengingat Kadaluarsa (Expired Date Alert 30–60 Hari Sebelumnya) */}
        {expiring30To60Rows.length > 0 && activeTab === "STOCK_LIST" && (
          <div className="bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5 min-w-0">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <div className="text-[12px] leading-relaxed">
                <span className="font-semibold text-amber-950 dark:text-amber-200">
                  Peringatan Kadaluarsa (30–60 Hari):
                </span>{" "}
                <span className="text-amber-900 dark:text-amber-300">
                  {expiring30To60Rows.map((r, i) => (
                    <span key={r.batch.id}>
                      {i > 0 ? " · " : ""}
                      <strong className="font-semibold">{r.product.name}</strong> ({r.batch.locationRack}, sisa {r.daysLeft} hari)
                    </span>
                  ))}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                setFilterMode((prev) =>
                  prev === "EXPIRING_30_60" ? "ALL" : "EXPIRING_30_60"
                )
              }
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11.5px] font-semibold shrink-0 whitespace-nowrap transition-colors"
            >
              {filterMode === "EXPIRING_30_60"
                ? "Tampilkan Semua"
                : "Lihat Obat Mendekati ED"}
            </button>
          </div>
        )}

        {/* TAB 1: STOK RAK */}
        {activeTab === "STOCK_LIST" && (
          <div className="space-y-3">
            <div className="bg-white dark:bg-[#141416] p-3 rounded-xl border border-neutral-200/80 dark:border-white/[0.08] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
              <div className="flex-1 relative flex items-center">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama obat, zat aktif, lokasi rak, atau nomor batch..."
                  className="w-full pl-9 pr-4 py-2 rounded-lg border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#1C1C1E] text-[13px] text-neutral-900 dark:text-white focus:outline-none focus:border-[#00767E]"
                />
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setFilterMode("ALL")}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-medium whitespace-nowrap transition-colors ${
                    filterMode === "ALL"
                      ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold"
                      : "bg-neutral-100 dark:bg-[#1C1C1E] text-neutral-600 dark:text-neutral-400"
                  }`}
                >
                  Semua ({allBatchRows.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode("LOW_STOCK")}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-medium whitespace-nowrap transition-colors ${
                    filterMode === "LOW_STOCK"
                      ? "bg-amber-600 text-white font-semibold"
                      : "bg-neutral-100 dark:bg-[#1C1C1E] text-neutral-600 dark:text-neutral-400"
                  }`}
                >
                  Stok Menipis ({lowStockCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode("EXPIRING_30_60")}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-medium whitespace-nowrap transition-colors ${
                    filterMode === "EXPIRING_30_60"
                      ? "bg-rose-600 text-white font-semibold"
                      : "bg-neutral-100 dark:bg-[#1C1C1E] text-neutral-600 dark:text-neutral-400"
                  }`}
                >
                  Mendekati ED ({expiring30To60Rows.length})
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-[#141416] rounded-xl border border-neutral-200/80 dark:border-white/[0.08] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-200/80 dark:border-white/[0.08] text-neutral-500 font-semibold text-[11px] uppercase tracking-wider bg-neutral-50/80 dark:bg-white/[0.03] whitespace-nowrap">
                      <th className="py-3 px-4">Nama Obat & Zat Aktif</th>
                      <th className="py-3 px-3">Lokasi Rak</th>
                      <th className="py-3 px-3">Nomor Batch</th>
                      <th className="py-3 px-3">Tanggal Kadaluarsa</th>
                      {!isCashier && (
                        <th className="py-3 px-3 text-right">Harga Beli (HNA)</th>
                      )}
                      <th className="py-3 px-3 text-right">Harga Jual</th>
                      <th className="py-3 px-4 text-right">Sisa Stok</th>
                      {!isCashier && (
                        <th className="py-3 px-4 text-center">Penyesuaian</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-white/[0.06]">
                    {filteredBatchRows.map(({ product, batch, daysLeft }) => {
                      const expiryStatus = getExpiryStatus(daysLeft);
                      const isLow = batch.currentStock <= product.minStockAlert;
                      const formattedExpiry = new Date(
                        batch.expiryDate
                      ).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      });
                      const unitFormatted =
                        product.baseUnit.charAt(0) +
                        product.baseUnit.slice(1).toLowerCase();

                      return (
                        <tr
                          key={batch.id}
                          className="hover:bg-neutral-50/60 dark:hover:bg-white/[0.02] transition-colors"
                        >
                          <td className="py-3 px-4 min-w-[210px]">
                            <div className="font-semibold text-[13px] text-neutral-900 dark:text-white">
                              {product.name}
                            </div>
                            <div className="text-[11px] text-neutral-500 mt-0.5">
                              {product.genericName} &middot;{" "}
                              <span className="font-mono">{product.barcode}</span>
                            </div>
                          </td>

                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className="inline-flex px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-white/[0.06] font-medium text-[11.5px] text-neutral-800 dark:text-neutral-200 whitespace-nowrap">
                              {batch.locationRack}
                            </span>
                          </td>

                          <td className="py-3 px-3 font-mono font-medium text-[12px] text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
                            {batch.batchNumber}
                          </td>

                          <td className="py-3 px-3 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-medium border whitespace-nowrap ${expiryStatus.badgeBg}`}
                            >
                              {daysLeft <= 60 && (
                                <AlertTriangle className="w-3 h-3 shrink-0" />
                              )}
                              <span>
                                {formattedExpiry} ({daysLeft} hari)
                              </span>
                            </span>
                          </td>

                          {!isCashier && (
                            <td className="py-3 px-3 text-right font-mono text-[12px] text-neutral-500 tabular-nums whitespace-nowrap">
                              {formatRupiah(batch.purchasePriceHNA)}
                            </td>
                          )}

                          <td className="py-3 px-3 text-right font-mono font-semibold text-[12.5px] text-neutral-900 dark:text-white tabular-nums whitespace-nowrap">
                            {formatRupiah(batch.sellingPrice)}
                          </td>

                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-md font-mono font-semibold text-[11.5px] tabular-nums whitespace-nowrap ${
                                batch.currentStock === 0
                                  ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                                  : isLow
                                  ? "bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300"
                                  : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                              }`}
                            >
                              {batch.currentStock} {unitFormatted}
                            </span>
                          </td>

                          {!isCashier && (
                            <td className="py-3 px-4 text-center whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() =>
                                  handleJumpToOpname(
                                    product.id,
                                    batch.id,
                                    batch.currentStock
                                  )
                                }
                                className="px-2.5 py-1 rounded-md bg-neutral-100 hover:bg-[#00767E] text-neutral-700 hover:text-white dark:bg-white/[0.06] dark:text-neutral-200 font-semibold text-[11px] transition-colors inline-flex items-center gap-1 whitespace-nowrap"
                              >
                                <ClipboardCheck className="w-3 h-3" />
                                <span>Opname</span>
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PEMETAAN ZAT AKTIF (GENERIC MAPPING) */}
        {activeTab === "GENERIC_MAPPING" && (
          <div className="bg-white dark:bg-[#141416] rounded-xl border border-neutral-200/80 dark:border-white/[0.08] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-neutral-200/80 dark:border-white/[0.08] flex items-center justify-between">
              <div>
                <h2 className="text-[14px] font-bold text-neutral-900 dark:text-white">
                  Daftar Obat Pengganti Berdasarkan Zat Aktif
                </h2>
                <p className="text-[11.5px] text-neutral-500">
                  Merek obat alternatif dengan kandungan zat aktif dan dosis yang sama jika stok utama habis
                </p>
              </div>
            </div>

            <div className="divide-y divide-neutral-100 dark:divide-white/[0.06]">
              {genericMappingGroups.map(([genericName, groupProds]) => (
                <div
                  key={genericName}
                  className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div className="md:w-1/3">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 block">
                      Kandungan Zat Aktif
                    </span>
                    <h3 className="text-[14px] font-bold text-neutral-900 dark:text-white mt-0.5">
                      {genericName}
                    </h3>
                    <span className="text-[11px] text-neutral-500">
                      {groupProds.length} pilihan merek tersedia
                    </span>
                  </div>

                  <div className="md:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {groupProds.map((prod) => {
                      const stock = prod.batches.reduce(
                        (s, b) => s + b.currentStock,
                        0
                      );
                      return (
                        <div
                          key={prod.id}
                          className={`p-3 rounded-lg border flex items-center justify-between gap-2.5 ${
                            stock === 0
                              ? "border-rose-200 bg-rose-50/40 dark:border-rose-900/50 dark:bg-rose-950/20"
                              : "border-neutral-200/80 dark:border-white/10 bg-neutral-50/60 dark:bg-[#1C1C1E]"
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="font-semibold text-[12.5px] text-neutral-900 dark:text-white truncate">
                              {prod.name}
                            </div>
                            <div className="text-[11px] font-mono text-neutral-500 whitespace-nowrap">
                              {formatRupiah(prod.sellingPrice)} / {formatUnitLabel(prod.baseUnit)} &middot;{" "}
                              {prod.shelfLocation || "Rak A-01"}
                            </div>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold whitespace-nowrap shrink-0 ${
                              stock === 0
                                ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                                : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                            }`}
                          >
                            {stock === 0
                              ? "Stok Habis"
                              : `${stock} ${formatUnitLabel(prod.baseUnit)}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: BARANG MASUK SUPPLIER */}
        {!isCashier && activeTab === "INCOMING_GOODS" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-5 bg-white dark:bg-[#141416] p-5 rounded-xl border border-neutral-200/80 dark:border-white/[0.08]">
              <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-neutral-100 dark:border-white/[0.08]">
                <div>
                  <h2 className="text-[15px] font-bold text-neutral-900 dark:text-white">
                    Penerimaan Barang Masuk
                  </h2>
                  <p className="text-[11.5px] text-neutral-500">
                    Catat obat yang baru datang dari distributor resmi (PBF)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openBarcodeScanner("INCOMING")}
                  className="px-2.5 py-1.5 rounded-lg bg-[#00767E]/10 hover:bg-[#00767E] text-[#006067] hover:text-white dark:text-teal-300 text-[11.5px] font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                >
                  <Camera className="w-3.5 h-3.5 shrink-0" />
                  <span>Scan Barcode</span>
                </button>
              </div>

              <form onSubmit={handleRecordIncoming} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 block mb-1">
                      Nomor Faktur *
                    </label>
                    <input
                      type="text"
                      required
                      value={invoiceNo}
                      onChange={(e) => setInvoiceNo(e.target.value)}
                      placeholder="FKT/KFTD/2026/099"
                      className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#1C1C1E] text-[12.5px] font-mono focus:outline-none focus:border-[#00767E]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 block mb-1">
                      Distributor (PBF) *
                    </label>
                    <input
                      type="text"
                      required
                      value={supplierName}
                      onChange={(e) => setSupplierName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#1C1C1E] text-[12.5px] focus:outline-none focus:border-[#00767E]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 block mb-1">
                    Pilih Obat *
                  </label>
                  <select
                    value={inProductId}
                    onChange={(e) => setInProductId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#1C1C1E] text-[12.5px] font-medium focus:outline-none focus:border-[#00767E]"
                  >
                    {catalogProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.barcode}) — Harga Beli: {formatRupiah(p.hpp)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 block mb-1">
                      Nomor Batch *
                    </label>
                    <input
                      type="text"
                      required
                      value={inBatchNo}
                      onChange={(e) => setInBatchNo(e.target.value)}
                      placeholder="B-2026-881"
                      className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#1C1C1E] text-[12.5px] font-mono focus:outline-none focus:border-[#00767E]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 block mb-1">
                      Tanggal Kadaluarsa *
                    </label>
                    <input
                      type="date"
                      required
                      value={inExpiryDate}
                      onChange={(e) => setInExpiryDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#1C1C1E] text-[12.5px] font-mono focus:outline-none focus:border-[#00767E]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 block mb-1">
                      Jumlah Masuk *
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={inQty}
                      onChange={(e) => setInQty(e.target.value)}
                      placeholder="100"
                      className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#1C1C1E] text-[12.5px] font-mono font-semibold focus:outline-none focus:border-[#00767E]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 block mb-1">
                      Harga Beli Satuan *
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={inHna}
                      onChange={(e) => setInHna(e.target.value)}
                      placeholder="600"
                      className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#1C1C1E] text-[12.5px] font-mono font-semibold focus:outline-none focus:border-[#00767E]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 block mb-1">
                      Lokasi Rak *
                    </label>
                    <input
                      type="text"
                      required
                      value={inRack}
                      onChange={(e) => setInRack(e.target.value)}
                      placeholder="Rak A-01"
                      className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#1C1C1E] text-[12.5px] font-mono focus:outline-none focus:border-[#00767E]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-lg bg-[#00767E] hover:bg-[#006067] text-white font-semibold text-[12.5px] flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
                >
                  <PlusCircle className="w-4 h-4 shrink-0" />
                  <span>Simpan Barang Masuk</span>
                </button>
              </form>
            </div>

            <div className="lg:col-span-7 bg-white dark:bg-[#141416] rounded-xl border border-neutral-200/80 dark:border-white/[0.08] overflow-hidden flex flex-col">
              <div className="px-5 py-3.5 border-b border-neutral-200/80 dark:border-white/[0.08] flex items-center justify-between">
                <h3 className="text-[13.5px] font-bold text-neutral-900 dark:text-white">
                  Riwayat Barang Masuk ({incomingGoodsRecords.length})
                </h3>
              </div>

              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-200/80 dark:border-white/[0.08] text-neutral-500 font-semibold text-[10.5px] uppercase bg-neutral-50/80 dark:bg-white/[0.03] whitespace-nowrap">
                      <th className="py-3 px-4">Faktur & Waktu</th>
                      <th className="py-3 px-3">Distributor</th>
                      <th className="py-3 px-3">Obat & Batch</th>
                      <th className="py-3 px-3 text-right">Jumlah</th>
                      <th className="py-3 px-4">Petugas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-white/[0.06]">
                    {incomingGoodsRecords.map((rec) => (
                      <tr
                        key={rec.id}
                        className="hover:bg-neutral-50/60 dark:hover:bg-white/[0.02]"
                      >
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-mono font-semibold text-neutral-900 dark:text-white">
                            {rec.invoiceNumber}
                          </div>
                          <div className="text-[10.5px] text-neutral-500">
                            {new Date(rec.timestamp).toLocaleString("id-ID")}
                          </div>
                        </td>
                        <td className="py-3 px-3 font-medium text-neutral-800 dark:text-neutral-200 whitespace-nowrap">
                          {rec.supplierName}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-neutral-900 dark:text-white">
                            {rec.productName}
                          </div>
                          <div className="text-[10.5px] font-mono text-neutral-500 whitespace-nowrap">
                            {rec.batchNumber} &middot; ED {formatIndonesianDate(rec.expiryDate)}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-mono font-semibold">
                            +{rec.quantity}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[11px] text-neutral-500 whitespace-nowrap">
                          {rec.recordedBy}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: STOCK OPNAME */}
        {!isCashier && activeTab === "STOCK_OPNAME" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-5 bg-white dark:bg-[#141416] p-5 rounded-xl border border-neutral-200/80 dark:border-white/[0.08]">
              <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-neutral-100 dark:border-white/[0.08]">
                <div>
                  <h2 className="text-[15px] font-bold text-neutral-900 dark:text-white">
                    Penyesuaian Stok Fisik (Stock Opname)
                  </h2>
                  <p className="text-[11.5px] text-neutral-500">
                    Cocokkan jumlah obat fisik di rak dengan catatan sistem
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openBarcodeScanner("OPNAME")}
                  className="px-2.5 py-1.5 rounded-lg bg-[#00767E]/10 hover:bg-[#00767E] text-[#006067] hover:text-white dark:text-teal-300 text-[11.5px] font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                >
                  <Camera className="w-3.5 h-3.5 shrink-0" />
                  <span>Scan Barcode</span>
                </button>
              </div>

              <form onSubmit={handleExecuteOpname} className="space-y-3.5">
                <div>
                  <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 block mb-1">
                    1. Pilih Obat *
                  </label>
                  <select
                    value={opnameProductId}
                    onChange={(e) => {
                      const nextId = e.target.value;
                      setOpnameProductId(nextId);
                      const prod = catalogProducts.find((p) => p.id === nextId);
                      if (prod && prod.batches[0]) {
                        setOpnameBatchId(prod.batches[0].id);
                        setPhysicalStockInput(String(prod.batches[0].currentStock));
                      }
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#1C1C1E] text-[12.5px] font-medium focus:outline-none focus:border-[#00767E]"
                  >
                    {catalogProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.barcode})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 block mb-1">
                    2. Pilih Nomor Batch & Rak *
                  </label>
                  <select
                    value={selectedOpnameBatch?.id || ""}
                    onChange={(e) => {
                      const bId = e.target.value;
                      setOpnameBatchId(bId);
                      const b = selectedOpnameProduct?.batches.find(
                        (x) => x.id === bId
                      );
                      if (b) setPhysicalStockInput(String(b.currentStock));
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#1C1C1E] text-[12.5px] font-mono focus:outline-none focus:border-[#00767E]"
                  >
                    {selectedOpnameProduct?.batches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.batchNumber} ({b.locationRack}) — Stok Sistem: {b.currentStock}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedOpnameBatch && (
                  <div className="p-3.5 rounded-lg bg-neutral-50 dark:bg-[#1C1C1E] border border-neutral-200/80 dark:border-white/10 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <span className="text-[10px] font-semibold uppercase text-neutral-400 block">
                        Stok Sistem
                      </span>
                      <span className="text-[17px] font-bold font-mono text-neutral-900 dark:text-white">
                        {selectedOpnameBatch.currentStock}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold uppercase text-neutral-400 block">
                        Stok Fisik
                      </span>
                      <span className="text-[17px] font-bold font-mono text-[#00767E] dark:text-teal-400">
                        {physicalStockInput !== "" ? physicalStockInput : "-"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold uppercase text-neutral-400 block">
                        Selisih
                      </span>
                      {(() => {
                        const diff =
                          (parseInt(physicalStockInput, 10) || 0) -
                          selectedOpnameBatch.currentStock;
                        return (
                          <span
                            className={`text-[17px] font-bold font-mono ${
                              diff === 0
                                ? "text-emerald-600"
                                : diff > 0
                                ? "text-blue-600"
                                : "text-rose-600"
                            }`}
                          >
                            {physicalStockInput === ""
                              ? "0"
                              : diff > 0
                              ? `+${diff}`
                              : diff}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 block mb-1">
                    3. Jumlah Fisik di Rak ({formatUnitLabel(selectedOpnameProduct?.baseUnit || "Unit")}) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={physicalStockInput}
                    onChange={(e) => setPhysicalStockInput(e.target.value)}
                    placeholder="Masukkan hasil hitung fisik..."
                    className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#1C1C1E] text-[14px] font-mono font-bold focus:outline-none focus:border-[#00767E]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 block mb-1">
                    4. Keterangan Pemeriksaan *
                  </label>
                  <textarea
                    rows={2}
                    value={opnameReason}
                    onChange={(e) => setOpnameReason(e.target.value)}
                    placeholder="Contoh: Pemeriksaan rutin rak bulanan..."
                    className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#1C1C1E] text-[12px] focus:outline-none focus:border-[#00767E]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-lg bg-[#00767E] hover:bg-[#006067] text-white font-semibold text-[12.5px] flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
                >
                  <ClipboardCheck className="w-4 h-4 shrink-0" />
                  <span>Simpan Hasil Opname</span>
                </button>
              </form>
            </div>

            <div className="lg:col-span-7 bg-white dark:bg-[#141416] rounded-xl border border-neutral-200/80 dark:border-white/[0.08] overflow-hidden flex flex-col">
              <div className="px-5 py-3.5 border-b border-neutral-200/80 dark:border-white/[0.08] flex items-center justify-between">
                <h3 className="text-[13.5px] font-bold text-neutral-900 dark:text-white">
                  Riwayat Stock Opname ({stockOpnameRecords.length})
                </h3>
              </div>

              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-200/80 dark:border-white/[0.08] text-neutral-500 font-semibold text-[10.5px] uppercase bg-neutral-50/80 dark:bg-white/[0.03] whitespace-nowrap">
                      <th className="py-3 px-4">Waktu</th>
                      <th className="py-3 px-3">Obat & Batch</th>
                      <th className="py-3 px-3 text-center">Sistem &rarr; Fisik</th>
                      <th className="py-3 px-3 text-center">Selisih</th>
                      <th className="py-3 px-4">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-white/[0.06]">
                    {stockOpnameRecords.map((rec) => (
                      <tr
                        key={rec.id}
                        className="hover:bg-neutral-50/60 dark:hover:bg-white/[0.02]"
                      >
                        <td className="py-3 px-4 font-mono text-[11px] text-neutral-500 whitespace-nowrap">
                          {new Date(rec.timestamp).toLocaleString("id-ID")}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-neutral-900 dark:text-white">
                            {rec.productName}
                          </div>
                          <div className="text-[10.5px] font-mono text-neutral-500 whitespace-nowrap">
                            {rec.batchNumber}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-semibold text-[12px] whitespace-nowrap">
                          {rec.systemStock} &rarr;{" "}
                          <span className="text-[#00767E] dark:text-teal-400">
                            {rec.physicalStock}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-md font-mono font-semibold text-[11px] ${
                              rec.difference === 0
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                                : rec.difference > 0
                                ? "bg-blue-50 text-blue-700"
                                : "bg-rose-50 text-rose-700"
                            }`}
                          >
                            {rec.difference === 0
                              ? "Sesuai (0)"
                              : rec.difference > 0
                              ? `+${rec.difference}`
                              : rec.difference}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-[11.5px] text-neutral-800 dark:text-neutral-200">
                            {rec.reason}
                          </div>
                          <div className="text-[10px] text-neutral-500 mt-0.5">
                            {rec.executedBy}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL PEMINDAI BARCODE KAMERA HP/TABLET + PENANGANAN MANUAL BARCODE RUSAK */}
      {isScannerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white dark:bg-[#141416] rounded-xl shadow-2xl border border-neutral-200 dark:border-white/10 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-neutral-200/80 dark:border-white/[0.08] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#00767E]" />
                <h3 className="text-[14px] font-bold text-neutral-900 dark:text-white">
                  Scan Barcode Obat (
                  {scannerTarget === "INCOMING" ? "Barang Masuk" : "Stock Opname"})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsScannerOpen(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-800 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Camera Viewfinder */}
              <div className="relative h-44 rounded-xl bg-neutral-900 overflow-hidden flex flex-col items-center justify-center border border-neutral-800">
                {cameraActive ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center px-4">
                    <Camera className="w-7 h-7 text-teal-400 mx-auto mb-1.5" />
                    <p className="text-[12px] font-semibold text-white">
                      Arahkan Kamera ke Barcode Kemasan Obat
                    </p>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      Pilih produk di bawah atau ketik nama obat jika kemasan rusak
                    </p>
                  </div>
                )}
                {/* Laser guide line */}
                <div className="absolute inset-x-10 top-1/2 h-0.5 bg-teal-400/80 shadow-[0_0_8px_#2dd4bf] pointer-events-none" />
              </div>

              {/* Quick Scan Simulation Buttons */}
              <div>
                <span className="text-[10.5px] font-semibold uppercase tracking-wider text-neutral-400 block mb-1.5">
                  Pilih Cepat dari Rak
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {catalogProducts.slice(0, 4).map((prod) => (
                    <button
                      key={prod.id}
                      type="button"
                      onClick={() => handleBarcodeScanned(prod.id)}
                      className="p-2 rounded-lg border border-neutral-200 dark:border-white/10 hover:border-[#00767E] bg-neutral-50 dark:bg-[#1C1C1E] text-left flex items-center justify-between transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-[12px] font-semibold text-neutral-900 dark:text-white truncate">
                          {prod.name}
                        </p>
                        <p className="text-[10.5px] font-mono text-neutral-500">
                          {prod.barcode}
                        </p>
                      </div>
                      <span className="text-[10.5px] font-semibold text-[#00767E] dark:text-teal-400 whitespace-nowrap shrink-0 ml-2">
                        Pilih &rarr;
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Penanganan Manual (Jika Barcode Fisik Rusak) */}
              <div className="pt-3 border-t border-neutral-200/80 dark:border-white/[0.08]">
                <label className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5 mb-1.5">
                  <Keyboard className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Barcode Rusak? Cari Manual Nama / Kode Obat:</span>
                </label>
                <input
                  type="text"
                  value={manualFallbackQuery}
                  onChange={(e) => setManualFallbackQuery(e.target.value)}
                  placeholder="Ketik nama obat atau kode barcode..."
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#1C1C1E] text-[12.5px] focus:outline-none focus:border-[#00767E]"
                />
                {manualFallbackQuery.trim().length > 0 && (
                  <div className="mt-2 max-h-32 overflow-y-auto divide-y divide-neutral-100 dark:divide-white/[0.06] rounded-lg border border-neutral-200 dark:border-white/10">
                    {manualFallbackMatches.map((prod) => (
                      <button
                        key={prod.id}
                        type="button"
                        onClick={() => handleBarcodeScanned(prod.id)}
                        className="w-full px-3 py-2 text-left text-[12px] hover:bg-neutral-100 dark:hover:bg-white/[0.06] flex items-center justify-between"
                      >
                        <span className="font-semibold">{prod.name}</span>
                        <span className="font-mono text-[11px] text-neutral-500">
                          {prod.barcode}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function InventoryPage() {
  return (
    <Suspense fallback={null}>
      <InventoryPageContent />
    </Suspense>
  );
}
