"use client";

import React, { useState } from "react";
import { useApotekStore } from "@/lib/store";
import { BaseUnit, DrugClass, Product, StorageCondition } from "@/lib/types";
import { formatRupiah } from "@/lib/utils";
import { X, Sparkles, AlertCircle, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { AppleSegmentedControl } from "@/components/ui/AppleSegmentedControl";
import { AppleStatusPill } from "@/components/ui/AppleStatusPill";
import { showAppleToast } from "@/components/ui/AppleToast";

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
}) => {
  const { addProduct, updateProduct } = useApotekStore();
  const [activeTab, setActiveTab] = useState<"info" | "hpp" | "batch">("info");

  // Form states
  const [barcode, setBarcode] = useState(productToEdit?.barcode || "");
  const [name, setName] = useState(productToEdit?.name || "");
  const [genericName, setGenericName] = useState(productToEdit?.genericName || "");
  const [manufacturer, setManufacturer] = useState(productToEdit?.manufacturer || "");
  const [kfaCode, setKfaCode] = useState(productToEdit?.kfaCode || "");
  const [bpomNie, setBpomNie] = useState(productToEdit?.bpomNie || "");
  const [drugClass, setDrugClass] = useState<DrugClass>(productToEdit?.drugClass || "BEBAS");
  const [baseUnit, setBaseUnit] = useState<BaseUnit>(productToEdit?.baseUnit || "TABLET");
  const [storageCondition, setStorageCondition] = useState<StorageCondition>(
    productToEdit?.storageCondition || "ROOM_TEMP"
  );
  const [shelfLocation, setShelfLocation] = useState(productToEdit?.shelfLocation || "RAK-A1-01");
  const [isHighAlert, setIsHighAlert] = useState(productToEdit?.isHighAlert || false);
  const [isLasa, setIsLasa] = useState(productToEdit?.isLasa || false);
  const [tallManName, setTallManName] = useState(productToEdit?.tallManName || "");

  // HPP & Margin
  const [hpp, setHpp] = useState(productToEdit?.hpp || 1000);
  const [markupPercent, setMarkupPercent] = useState(productToEdit?.markupPercent || 25);
  const [het, setHet] = useState(productToEdit?.het || 0);

  // Multi-unit conversions
  const [conversions, setConversions] = useState(
    productToEdit?.unitConversions || [
      { unitName: baseUnit, multiplier: 1, pricePerUnit: Math.round(1000 * 1.25) },
      { unitName: "STRIP", multiplier: 10, pricePerUnit: Math.round(1000 * 1.25 * 9.5) },
      { unitName: "BOX", multiplier: 100, pricePerUnit: Math.round(1000 * 1.25 * 90) },
    ]
  );

  // Batch & Initial Stock
  const [batchNumber, setBatchNumber] = useState(
    productToEdit?.batches[0]?.batchNumber || `B-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [expiryDate, setExpiryDate] = useState(
    productToEdit?.batches[0]?.expiryDate || "2027-12-31"
  );
  const [initialStock, setInitialStock] = useState(
    productToEdit?.batches[0]?.currentStock || 100
  );
  const [minStockAlert, setMinStockAlert] = useState(productToEdit?.minStockAlert || 20);
  const [maxStockAlert, setMaxStockAlert] = useState(productToEdit?.maxStockAlert || 500);

  if (!isOpen) return null;

  // Real-time calculations
  const calculatedSellingPrice = Math.round(hpp * (1 + markupPercent / 100));
  const isExceedingHet = het > 0 && calculatedSellingPrice > het;

  // Expiry calculation
  const getExpiryMonths = (dateStr: string) => {
    if (!dateStr) return 0;
    const now = new Date();
    const exp = new Date(dateStr);
    return Math.max(0, Math.round((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30.4)));
  };
  const expiryMonths = getExpiryMonths(expiryDate);

  const applyCategoryPreset = (preset: number) => {
    setMarkupPercent(preset);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showAppleToast({
        type: "warning",
        title: "Nama Produk Kosong",
        message: "Nama produk/obat wajib diisi sebelum menyimpan!",
      });
      return;
    }

    const finalSellingPrice = isExceedingHet ? het : calculatedSellingPrice;

    const updatedConversions = conversions.map((c) => ({
      ...c,
      pricePerUnit:
        c.multiplier === 1
          ? finalSellingPrice
          : Math.round(finalSellingPrice * c.multiplier * 0.95), // wholesale incentive
    }));

    if (productToEdit) {
      updateProduct(productToEdit.id, {
        name,
        genericName,
        manufacturer,
        kfaCode,
        bpomNie,
        drugClass,
        baseUnit,
        storageCondition,
        shelfLocation,
        isHighAlert,
        isLasa,
        tallManName: isLasa ? tallManName : undefined,
        hpp,
        markupPercent,
        sellingPrice: finalSellingPrice,
        het: het > 0 ? het : undefined,
        unitConversions: updatedConversions,
        minStockAlert,
        maxStockAlert,
      });
    } else {
      const newProduct: Product = {
        id: `prod-${Date.now()}`,
        barcode: barcode.trim() || `899${Math.floor(100000000 + Math.random() * 900000000)}`,
        name,
        genericName,
        manufacturer: manufacturer || "Pabrikan Farmasi",
        kfaCode: kfaCode || undefined,
        bpomNie: bpomNie || undefined,
        drugClass,
        baseUnit,
        storageCondition,
        shelfLocation,
        isHighAlert,
        isLasa,
        tallManName: isLasa ? tallManName : undefined,
        hpp,
        markupPercent,
        sellingPrice: finalSellingPrice,
        het: het > 0 ? het : undefined,
        minStockAlert,
        maxStockAlert,
        unitConversions: updatedConversions,
        batches: [
          {
            id: `batch-${Date.now()}`,
            productId: `prod-${Date.now()}`,
            batchNumber,
            expiryDate,
            purchasePriceHNA: hpp,
            sellingPrice: finalSellingPrice,
            currentStock: initialStock,
            reservedStock: 0,
            locationRack: shelfLocation,
          },
        ],
      };
      addProduct(newProduct);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white dark:bg-[#1C1C1E] rounded-[22px] shadow-[0_25px_60px_rgba(0,0,0,0.25)] border border-black/[0.08] dark:border-white/[0.12] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 shrink-0">
          <div>
            <h2 className="text-[17px] font-semibold text-[#1C1C1E] dark:text-white tracking-tight">
              {productToEdit ? "Edit Master Produk & HPP" : "Input Master Produk Baru"}
            </h2>
            <p className="text-[12px] text-[#8E8E93]">
              Pengaturan katalog, harga pokok HNA murni (tanpa diskon/PPN), dan alokasi batch
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

        {/* Tab Navigation (Apple HIG Segmented Control) */}
        <div className="px-6 py-3 bg-[#F5F5F7] dark:bg-[#2C2C2E] border-b border-black/[0.04] shrink-0">
          <AppleSegmentedControl
            options={[
              { id: "info", label: "1. Data Produk & Regulasi" },
              { id: "hpp", label: "2. Setting HPP & Harga Jual" },
              { id: "batch", label: "3. Batch & Stok Awal" },
            ]}
            activeId={activeTab}
            onChange={(id) => setActiveTab(id as any)}
          />
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* TAB 1: INFO & REGULASI */}
          {activeTab === "info" && (
            <div className="space-y-4 animate-in fade-in duration-100">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#8E8E93] mb-1">
                    Nama Dagang Obat *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    placeholder="cth: Sanmol Forte 650 mg"
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-[13px] font-medium px-3 py-2 rounded-[10px] bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-transparent focus:border-[#007AFF] focus:bg-white dark:focus:bg-[#1C1C1E] outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#8E8E93] mb-1">
                    Nama Generik / Zat Aktif
                  </label>
                  <input
                    type="text"
                    value={genericName}
                    placeholder="cth: Paracetamol 650 mg"
                    onChange={(e) => setGenericName(e.target.value)}
                    className="w-full text-[13px] font-medium px-3 py-2 rounded-[10px] bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-transparent focus:border-[#007AFF] focus:bg-white dark:focus:bg-[#1C1C1E] outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#8E8E93] mb-1">
                    Barcode EAN-13
                  </label>
                  <input
                    type="text"
                    value={barcode}
                    placeholder="Scan barcode..."
                    onChange={(e) => setBarcode(e.target.value)}
                    className="w-full text-[13px] font-mono px-3 py-2 rounded-[10px] bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-transparent focus:border-[#007AFF] focus:bg-white dark:focus:bg-[#1C1C1E] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#8E8E93] mb-1">
                    KFA Code (SatuSehat)
                  </label>
                  <input
                    type="text"
                    value={kfaCode}
                    placeholder="9 digit KFA..."
                    onChange={(e) => setKfaCode(e.target.value)}
                    className="w-full text-[13px] font-mono px-3 py-2 rounded-[10px] bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-transparent focus:border-[#007AFF] focus:bg-white dark:focus:bg-[#1C1C1E] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#8E8E93] mb-1">
                    NIE BPOM
                  </label>
                  <input
                    type="text"
                    value={bpomNie}
                    placeholder="DKL1234567890A1"
                    onChange={(e) => setBpomNie(e.target.value)}
                    className="w-full text-[13px] font-mono px-3 py-2 rounded-[10px] bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-transparent focus:border-[#007AFF] focus:bg-white dark:focus:bg-[#1C1C1E] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#8E8E93] mb-1">
                    Golongan Obat
                  </label>
                  <select
                    value={drugClass}
                    onChange={(e) => setDrugClass(e.target.value as DrugClass)}
                    className="w-full text-[13px] font-medium px-3 py-2 rounded-[10px] bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-transparent focus:border-[#007AFF] outline-none"
                  >
                    <option value="BEBAS">Obat Bebas (Hijau)</option>
                    <option value="BEBAS_TERBATAS">Obat Bebas Terbatas (Biru)</option>
                    <option value="KERAS">Obat Keras (Merah K)</option>
                    <option value="PREKURSOR">Prekursor Farmasi</option>
                    <option value="OOT">Obat-Obat Tertentu (OOT)</option>
                    <option value="PSIKOTROPIKA">Psikotropika (Lapor SIPNAP)</option>
                    <option value="NARKOTIKA">Narkotika (SP Khusus N-9)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#8E8E93] mb-1">
                    Satuan Terkecil (Base)
                  </label>
                  <select
                    value={baseUnit}
                    onChange={(e) => setBaseUnit(e.target.value as BaseUnit)}
                    className="w-full text-[13px] font-medium px-3 py-2 rounded-[10px] bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-transparent focus:border-[#007AFF] outline-none"
                  >
                    <option value="TABLET">TABLET</option>
                    <option value="KAPSUL">KAPSUL</option>
                    <option value="KAPLET">KAPLET</option>
                    <option value="BOTOL">BOTOL</option>
                    <option value="TUBE">TUBE</option>
                    <option value="SACHET">SACHET</option>
                    <option value="AMPUL">AMPUL</option>
                    <option value="VIAL">VIAL</option>
                    <option value="POT">POT</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#8E8E93] mb-1">
                    Suhu Penyimpanan
                  </label>
                  <select
                    value={storageCondition}
                    onChange={(e) => setStorageCondition(e.target.value as StorageCondition)}
                    className="w-full text-[13px] font-medium px-3 py-2 rounded-[10px] bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-transparent focus:border-[#007AFF] outline-none"
                  >
                    <option value="ROOM_TEMP">Suhu Kamar (15-30°C)</option>
                    <option value="COOL">Sejuk (8-15°C)</option>
                    <option value="CHILLER_2_8">Chiller Cold Chain (2-8°C)</option>
                    <option value="FREEZER">Freezer Beku (&lt;0°C)</option>
                  </select>
                </div>
              </div>

              {/* Safety Toggles */}
              <div className="p-3 bg-[#F5F5F7] dark:bg-[#2C2C2E] rounded-[14px] flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 text-[13px] font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isHighAlert}
                      onChange={(e) => setIsHighAlert(e.target.checked)}
                      className="rounded accent-[#FF3B30] w-4 h-4"
                    />
                    <span>High-Alert Drug (Kewaspadaan Tinggi)</span>
                  </label>
                  <label className="flex items-center gap-2 text-[13px] font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isLasa}
                      onChange={(e) => setIsLasa(e.target.checked)}
                      className="rounded accent-[#FF9500] w-4 h-4"
                    />
                    <span>LASA / NORUM (Nama/Rupa Mirip)</span>
                  </label>
                </div>
              </div>

              {isLasa && (
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#8E8E93] mb-1">
                    Penulisan Tall Man Lettering
                  </label>
                  <input
                    type="text"
                    value={tallManName}
                    placeholder="cth: cloNAZEpam atau metFORMIN"
                    onChange={(e) => setTallManName(e.target.value)}
                    className="w-full text-[13px] font-mono px-3 py-2 rounded-[10px] bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-transparent focus:border-[#007AFF] outline-none"
                  />
                </div>
              )}
            </div>
          )}

          {/* TAB 2: HPP & MARGIN */}
          {activeTab === "hpp" && (
            <div className="space-y-5 animate-in fade-in duration-100">
              <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-800/40 rounded-[14px] text-[12px] text-blue-900 dark:text-blue-200">
                <span className="font-semibold block mb-0.5">Standar Akuntansi Apotek Bersih:</span>
                HPP dihitung berdasarkan <strong>Harga Netto Apotek (HNA)</strong> per satuan dasar. Sesuai instruksi kebijakan, fitur diskon & PPN telah dihilangkan sehingga margin keuntungan dihitung langsung dan stabil.
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#8E8E93] mb-1">
                    HPP Dasar (HNA per {baseUnit}) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-[13px] font-medium text-[#8E8E93]">Rp</span>
                    <input
                      type="number"
                      required
                      min="1"
                      value={hpp}
                      onChange={(e) => setHpp(Number(e.target.value))}
                      className="w-full text-[14px] font-bold text-[#1C1C1E] dark:text-white pl-10 pr-3 py-2 rounded-[10px] bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-transparent focus:border-[#007AFF] outline-none tabular-nums"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-[#8E8E93]">
                      Margin Markup (%)
                    </label>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => applyCategoryPreset(15)}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 font-medium hover:bg-neutral-300"
                      >
                        OTC 15%
                      </button>
                      <button
                        type="button"
                        onClick={() => applyCategoryPreset(25)}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 font-medium hover:bg-neutral-300"
                      >
                        Keras 25%
                      </button>
                      <button
                        type="button"
                        onClick={() => applyCategoryPreset(35)}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 font-medium hover:bg-neutral-300"
                      >
                        Etikal 35%
                      </button>
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={markupPercent}
                      onChange={(e) => setMarkupPercent(Number(e.target.value))}
                      className="w-full text-[14px] font-bold text-[#007AFF] px-3 py-2 rounded-[10px] bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-transparent focus:border-[#007AFF] outline-none tabular-nums"
                    />
                    <span className="absolute right-3 top-2.5 text-[13px] font-medium text-[#8E8E93]">%</span>
                  </div>
                </div>
              </div>

              {/* Price Preview Card */}
              <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-[16px] flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
                    Kalkulasi Harga Jual Apotek (HJA per {baseUnit})
                  </span>
                  <div className="text-[20px] font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                    {formatRupiah(calculatedSellingPrice)}
                  </div>
                  <span className="text-[11px] text-[#8E8E93]">
                    Laba Bersih per {baseUnit}: {formatRupiah(calculatedSellingPrice - hpp)}
                  </span>
                </div>
                <div className="text-right">
                  <AppleStatusPill
                    variant={isExceedingHet ? "danger" : "safe"}
                    label={isExceedingHet ? "Melebihi HET!" : "Harga Sesuai Standar"}
                  />
                </div>
              </div>

              {/* HET Validation */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#8E8E93] mb-1">
                  Batas HET Pemerintah (Harga Eceran Tertinggi) - Opsional
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-[13px] font-medium text-[#8E8E93]">Rp</span>
                  <input
                    type="number"
                    min="0"
                    value={het}
                    onChange={(e) => setHet(Number(e.target.value))}
                    placeholder="Kosongkan jika bukan obat regulasi HET"
                    className="w-full text-[13px] pl-10 pr-3 py-2 rounded-[10px] bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-transparent focus:border-[#007AFF] outline-none tabular-nums"
                  />
                </div>
                {isExceedingHet && (
                  <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Harga jual melampaui batas HET ({formatRupiah(het)}). Sistem otomatis membatasi ke HET saat transaksi.
                  </p>
                )}
              </div>

              {/* Multi-unit Conversion Table */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#8E8E93] mb-2">
                  Hirarki Konversi Satuan & Harga Bertingkat
                </label>
                <div className="border border-[#E5E5EA] dark:border-[#38383A] rounded-[12px] overflow-hidden">
                  <table className="w-full text-left text-[12px]">
                    <thead className="bg-[#F5F5F7] dark:bg-[#2C2C2E] text-[#8E8E93] border-b border-[#E5E5EA] dark:border-[#38383A]">
                      <tr>
                        <th className="p-2.5 font-semibold">Nama Satuan</th>
                        <th className="p-2.5 font-semibold">Isi ({baseUnit})</th>
                        <th className="p-2.5 font-semibold text-right">Harga Jual Estimasi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E5EA] dark:divide-[#38383A]">
                      {conversions.map((conv, idx) => (
                        <tr key={idx} className="hover:bg-neutral-50/50">
                          <td className="p-2.5 font-medium">{conv.unitName}</td>
                          <td className="p-2.5 tabular-nums">{conv.multiplier} {baseUnit}</td>
                          <td className="p-2.5 text-right font-bold tabular-nums text-emerald-700">
                            {formatRupiah(Math.round(calculatedSellingPrice * conv.multiplier * (conv.multiplier > 1 ? 0.95 : 1)))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BATCH & STOK */}
          {activeTab === "batch" && (
            <div className="space-y-4 animate-in fade-in duration-100">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#8E8E93] mb-1">
                    Nomor Batch Awal *
                  </label>
                  <input
                    type="text"
                    required
                    value={batchNumber}
                    placeholder="cth: B250109"
                    onChange={(e) => setBatchNumber(e.target.value)}
                    className="w-full text-[13px] font-mono px-3 py-2 rounded-[10px] bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-transparent focus:border-[#007AFF] outline-none"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-[#8E8E93]">
                      Tanggal Expired *
                    </label>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                        expiryMonths <= 6
                          ? "bg-rose-100 text-rose-700"
                          : expiryMonths <= 12
                          ? "bg-amber-100 text-amber-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {expiryMonths} bln ({expiryMonths <= 6 ? "Kritis" : expiryMonths <= 12 ? "Waspada" : "Aman"})
                    </span>
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

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#8E8E93] mb-1">
                    Stok Masuk ({baseUnit}) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={initialStock}
                    onChange={(e) => setInitialStock(Number(e.target.value))}
                    className="w-full text-[14px] font-bold text-right px-3 py-2 rounded-[10px] bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-transparent focus:border-[#007AFF] outline-none tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#8E8E93] mb-1">
                    Min Alert (ROP)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={minStockAlert}
                    onChange={(e) => setMinStockAlert(Number(e.target.value))}
                    className="w-full text-[13px] text-right px-3 py-2 rounded-[10px] bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-transparent focus:border-[#007AFF] outline-none tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#8E8E93] mb-1">
                    Lokasi Rak / Bin
                  </label>
                  <input
                    type="text"
                    value={shelfLocation}
                    placeholder="Rak A-01"
                    onChange={(e) => setShelfLocation(e.target.value)}
                    className="w-full text-[13px] px-3 py-2 rounded-[10px] bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-transparent focus:border-[#007AFF] outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-neutral-100 dark:border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[13px] font-medium text-[#636366] hover:text-[#1C1C1E] transition-colors"
            >
              Batal
            </button>
            <div className="flex gap-2">
              {activeTab !== "info" && (
                <button
                  type="button"
                  onClick={() =>
                    setActiveTab(activeTab === "batch" ? "hpp" : "info")
                  }
                  className="px-4 py-2 text-[13px] font-medium rounded-[10px] bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 transition-colors"
                >
                  Kembali
                </button>
              )}
              {activeTab !== "batch" ? (
                <button
                  type="button"
                  onClick={() =>
                    setActiveTab(activeTab === "info" ? "hpp" : "batch")
                  }
                  className="px-4 py-2 text-[13px] font-semibold rounded-[10px] bg-[#007AFF] text-white hover:bg-[#0062CC] transition-colors shadow-sm"
                >
                  Lanjut &rarr;
                </button>
              ) : (
                <button
                  type="submit"
                  className="px-5 py-2 text-[13px] font-semibold rounded-[10px] bg-[#34C759] text-white hover:bg-[#2EB34F] transition-colors shadow-sm flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Simpan Produk & HPP
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
