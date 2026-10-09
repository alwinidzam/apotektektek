"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FlaskConical,
  Plus,
  Trash2,
  AlertTriangle,
  Printer,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { AccessDenied } from "@/components/AccessDenied";
import { useApotekStore } from "@/lib/store";
import { CompoundingEngine } from "@/lib/engines/compounding-engine";
import { CompoundingIngredient, CompoundingRecipe } from "@/lib/types";
import { formatRupiah } from "@/lib/utils";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import { showAppleToast } from "@/components/ui/AppleToast";

export default function CompoundingPage() {
  const router = useRouter();
  const { products, addRacikanToCart, currentUser } = useApotekStore();

  const swipeHandlers = useSwipeGesture({
    onEdgeSwipeRight: () => {
      if (typeof window !== "undefined" && window.history.length > 1) {
        router.back();
      } else {
        router.push("/");
      }
    },
  });

  if (currentUser.role === "KARYAWAN_KASIR") {
    return (
      <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#000000]">
        <Navbar />
        <AccessDenied
          requiredRole="Apoteker (APJ) / TTK"
          reason="Sesuai regulasi Permenkes No. 73 Tahun 2016, peracikan obat puyer/kapsul (Formula Magistralis) hanya berwenang dilakukan oleh Apoteker dan Tenaga Teknis Kefarmasian ber-SIPTTK."
        />
      </div>
    );
  }

  // Compounding Form State
  const [recipeName, setRecipeName] = useState("Puyer Batuk Pilek Anak");
  const [method, setMethod] = useState<"DTD" | "NON_DTD">("DTD");
  const [packetCount, setPacketCount] = useState<number>(10);
  const [dosageSigna, setDosageSigna] = useState("3 x sehari 1 bungkus sesudah makan");
  const [patientName, setPatientName] = useState("Ananda Rayyan");
  const [patientAgeYears, setPatientAgeYears] = useState<number>(6);
  const [patientWeightKg, setPatientWeightKg] = useState<number>(18);
  const [packagingType, setPackagingType] = useState<
    "KAPSUL" | "PUYER_PERKAMEN" | "POT_SALEP" | "BOTOL_SIRUP"
  >("PUYER_PERKAMEN");

  // Selected Ingredients
  const [ingredients, setIngredients] = useState<
    {
      productId: string;
      doseMg: number;
    }[]
  >([
    { productId: "prod-001", doseMg: 250 }, // Paracetamol 250mg per packet
    { productId: "prod-006", doseMg: 2 }, // CTM 2mg per packet
  ]);

  const handleAddIngredient = () => {
    setIngredients([...ingredients, { productId: products[0].id, doseMg: 100 }]);
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleUpdateIngredient = (index: number, field: "productId" | "doseMg", value: any) => {
    const next = [...ingredients];
    next[index] = { ...next[index], [field]: value };
    setIngredients(next);
  };

  // Calculate detailed ingredient math and pricing
  const calculatedIngredients: CompoundingIngredient[] = ingredients.map((item) => {
    const prod = products.find((p) => p.id === item.productId) || products[0];
    const earliestBatch = prod.batches[0];
    const strengthMg = prod.name.includes("500") ? 500 : prod.name.includes("4") ? 4 : 100;

    const calc = CompoundingEngine.calculateIngredientRequirement(
      method,
      strengthMg,
      packetCount,
      method === "DTD" ? item.doseMg : undefined,
      method === "NON_DTD" ? item.doseMg : undefined
    );

    const cost = Math.ceil(calc.tabletsNeeded) * (earliestBatch?.sellingPrice || 1000);

    return {
      productId: prod.id,
      productName: prod.name,
      selectedBatchId: earliestBatch?.id || "",
      strengthPerTabletMg: strengthMg,
      prescribedDosePerPacketMg: method === "DTD" ? item.doseMg : undefined,
      totalPrescribedDoseMg: method === "NON_DTD" ? item.doseMg : undefined,
      requiredQuantityTablets: calc.tabletsNeeded,
      cost,
    };
  });

  const subtotalIngredients = calculatedIngredients.reduce((acc, it) => acc + it.cost, 0);
  const fees = CompoundingEngine.calculateFees(packagingType, packetCount);
  const grandTotal = subtotalIngredients + fees.embalaseCost + fees.tuslahFee;
  const beyondUseDate = CompoundingEngine.calculateBeyondUseDate(packagingType);

  // Pediatric Evaluation for primary ingredient (Paracetamol)
  const primaryIng = calculatedIngredients[0];
  const primaryProd = products.find((p) => p.id === primaryIng?.productId);
  const dailyPrescribedMg = (primaryIng?.prescribedDosePerPacketMg || 0) * 3; // 3x sehari

  const pediatricCheck = primaryProd?.maxDailyDoseAdultMg
    ? CompoundingEngine.evaluatePediatricDose({
        patientAgeYears,
        patientWeightKg,
        adultMaxDailyDoseMg: primaryProd.maxDailyDoseAdultMg,
        prescribedDailyDoseMg: dailyPrescribedMg,
      })
    : null;

  const handleSendToPOS = () => {
    const recipe: CompoundingRecipe = {
      id: `rck-${Date.now()}`,
      recipeName,
      method,
      packetCount,
      dosageSigna,
      patientAgeYears,
      patientWeightKg,
      patientName,
      ingredients: calculatedIngredients,
      packagingType,
      packagingCost: fees.embalaseCost,
      tuslahFee: fees.tuslahFee,
      subtotalIngredients,
      grandTotal,
      beyondUseDate,
    };

    addRacikanToCart(recipe);
    showAppleToast({
      type: "success",
      title: "Racikan Disimpan",
      message: `Racikan "${recipeName}" berhasil dibuat dan ditambahkan ke keranjang Kasir POS!`,
    });
    router.push("/");
  };

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#F5F5F7] dark:bg-[#000000] text-[#1C1C1E] dark:text-[#F5F5F7] flex flex-col">
      <Navbar />

      <main
        {...swipeHandlers}
        className="flex-1 w-full max-w-full min-w-0 mx-auto p-3 sm:p-5 lg:p-6 space-y-5 sm:space-y-6 touch-pan-y"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="min-w-0">
            <h1 className="text-[18px] sm:text-2xl font-bold text-[#1C1C1E] dark:text-white tracking-tight flex items-center gap-2 truncate">
              <FlaskConical className="h-5 sm:h-6 w-5 sm:w-6 text-[#008B94] shrink-0" />
              <span>Peracikan Resep</span>
            </h1>
            <p className="hidden sm:block text-[12px] text-[#8E8E93] mt-0.5">
              Kalkulator DTD/Non-DTD, verifikasi dosis Young & Clark, otomatisasi tuslah dan embalase.
            </p>
          </div>

          <button
            onClick={handleSendToPOS}
            className="px-4 py-2 min-h-[40px] rounded-[12px] bg-[#008B94] hover:bg-[#00767E] active:scale-[0.98] text-white font-semibold text-[12px] shadow-sm flex items-center gap-2 transition-all shrink-0 whitespace-nowrap"
          >
            <span>Kirim ke POS</span>
            <kbd className="px-1.5 py-0.5 rounded text-[10px] bg-white/20 font-mono">F3</kbd>
            <ArrowRight className="h-3.5 w-3.5 shrink-0" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Form: Recipe Parameters & Ingredients (8 cols) */}
          <section className="lg:col-span-8 space-y-6">
            {/* General Info Card */}
            <div className="glass-panel p-6 rounded-3xl space-y-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs">
                1. Identitas Resep & Pasien
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Nama Formula Racikan
                  </label>
                  <input
                    type="text"
                    value={recipeName}
                    onChange={(e) => setRecipeName(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Nama Pasien
                  </label>
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Usia & Berat Badan Pasien
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Usia"
                      value={patientAgeYears}
                      onChange={(e) => setPatientAgeYears(Number(e.target.value))}
                      className="w-1/2 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono"
                    />
                    <input
                      type="number"
                      placeholder="BB (kg)"
                      value={patientWeightKg}
                      onChange={(e) => setPatientWeightKg(Number(e.target.value))}
                      className="w-1/2 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Method Switch: DTD vs Non-DTD */}
              <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Metode Dosis:
                  </span>
                  <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    <button
                      onClick={() => setMethod("DTD")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        method === "DTD"
                          ? "bg-white dark:bg-slate-900 text-emerald-600 shadow-sm"
                          : "text-slate-500"
                      }`}
                    >
                      DTD (Dosis per Bungkus)
                    </button>
                    <button
                      onClick={() => setMethod("NON_DTD")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        method === "NON_DTD"
                          ? "bg-white dark:bg-slate-900 text-emerald-600 shadow-sm"
                          : "text-slate-500"
                      }`}
                    >
                      Non-DTD (Total Resep)
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Jumlah Bungkus:
                  </span>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={packetCount}
                    onChange={(e) => setPacketCount(Number(e.target.value) || 1)}
                    className="w-16 py-1 px-2 text-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Ingredients Builder */}
            <div className="glass-panel p-6 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs">
                  2. Komposisi Bahan Racikan & Miligram
                </h2>
                <button
                  onClick={handleAddIngredient}
                  className="px-3 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center gap-1 hover:bg-emerald-100 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Tambah Obat</span>
                </button>
              </div>

              <div className="space-y-3">
                {ingredients.map((item, idx) => {
                  const calculated = calculatedIngredients[idx];
                  return (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                    >
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                            Pilih Obat Sumber
                          </label>
                          <select
                            value={item.productId}
                            onChange={(e) =>
                              handleUpdateIngredient(idx, "productId", e.target.value)
                            }
                            className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold"
                          >
                            {products
                              .filter((p) => p.baseUnit === "TABLET" || p.baseUnit === "KAPSUL")
                              .map((prod) => (
                                <option key={prod.id} value={prod.id}>
                                  {prod.name} ({prod.genericName})
                                </option>
                              ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                            {method === "DTD"
                              ? "Dosis per Bungkus (mg)"
                              : "Total Resep Diminta (mg)"}
                          </label>
                          <input
                            type="number"
                            value={item.doseMg}
                            onChange={(e) =>
                              handleUpdateIngredient(idx, "doseMg", Number(e.target.value) || 0)
                            }
                            className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold"
                          />
                        </div>
                      </div>

                      {/* Calculated Result */}
                      <div className="text-right shrink-0 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-slate-200 flex md:flex-col justify-between items-center md:items-end">
                        <div>
                          <span className="text-[10px] text-slate-400 block">Kebutuhan Fisik:</span>
                          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                            {calculated?.requiredQuantityTablets} tab
                          </span>
                        </div>
                        <button
                          onClick={() => handleRemoveIngredient(idx)}
                          disabled={ingredients.length <= 1}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-30"
                          title="Hapus bahan"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Packaging, Signa, & Fees */}
            <div className="glass-panel p-6 rounded-3xl space-y-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs">
                3. Kemasan, Aturan Pakai, & Biaya Layanan
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Bentuk Kemasan / Sediaan (Embalase)
                  </label>
                  <select
                    value={packagingType}
                    onChange={(e) => setPackagingType(e.target.value as any)}
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-semibold"
                  >
                    <option value="PUYER_PERKAMEN">Puyer / Kertas Perkamen (Rp 200/bks)</option>
                    <option value="KAPSUL">Cangkang Kapsul Gelatin (Rp 300/kapsul)</option>
                    <option value="POT_SALEP">Pot Salep Plastik (Rp 2.500/pot)</option>
                    <option value="BOTOL_SIRUP">Botol Kaca/PET Sirup (Rp 3.500/botol)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Aturan Pakai (Signa Etiket)
                  </label>
                  <input
                    type="text"
                    value={dosageSigna}
                    onChange={(e) => setDosageSigna(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-medium"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Right Column: Pediatric Safety Check & Live Etiket Generator (4 cols) */}
          <section className="lg:col-span-4 space-y-6">
            {/* Pediatric Clinical Safety Card */}
            {pediatricCheck && (
              <div
                className={`p-5 rounded-3xl border shadow-sm ${
                  pediatricCheck.isOverdose
                    ? "bg-red-50 dark:bg-red-950/60 border-red-300 text-red-900 dark:text-red-200"
                    : "glass-panel"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck
                    className={`h-5 w-5 ${
                      pediatricCheck.isOverdose ? "text-red-600" : "text-emerald-600"
                    }`}
                  />
                  <h3 className="font-bold text-xs uppercase tracking-wider">
                    Uji Dosis Pediatrik (Clark / Young)
                  </h3>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Dosis Harian Diresepkan:</span>
                    <span className="font-bold font-mono">
                      {pediatricCheck.calculatedPrescribedDailyDoseMg} mg/hari
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Maksimum Aman Pasien:</span>
                    <span className="font-bold font-mono">
                      {pediatricCheck.maxAllowableDailyDoseMg} mg/hari
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold pt-1 border-t border-slate-200 dark:border-slate-700">
                    <span>Persentase Dosis Maksimum:</span>
                    <span
                      className={`font-mono ${
                        pediatricCheck.isOverdose ? "text-red-600 font-black" : "text-emerald-600"
                      }`}
                    >
                      {pediatricCheck.percentageOfMaxDose}%
                    </span>
                  </div>
                </div>

                {pediatricCheck.warningMessage && (
                  <p className="mt-3 p-2 rounded-xl bg-red-100 dark:bg-red-900/80 text-[11px] font-bold text-red-800 dark:text-red-200 leading-tight">
                    {pediatricCheck.warningMessage}
                  </p>
                )}
              </div>
            )}

            {/* Live Etiket Digital Preview (Standar Kemenkes) */}
            <div className="glass-panel p-5 rounded-3xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Preview Etiket Digital Kemenkes
                </span>
                <button
                  onClick={() => window.print()}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                  title="Cetak Etiket"
                >
                  <Printer className="h-4 w-4" />
                </button>
              </div>

              {/* Etiket Putih Oral */}
              <div className="bg-white text-slate-900 p-4 rounded-2xl border-2 border-slate-300 shadow-sm font-sans text-xs space-y-2">
                <div className="text-center pb-2 border-b border-slate-200">
                  <div className="font-black text-xs uppercase tracking-tight text-[#008B94]">
                    APOTEK KERSO WARAS
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Kedung, Jepara &bull; SIPA: 19930812/SIPA_33.20/2022/2001
                  </div>
                </div>

                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span>No. Resep: RCK-{Date.now().toString().slice(-4)}</span>
                    <span>Tgl: {new Date().toLocaleDateString("id-ID")}</span>
                  </div>
                  <div className="font-bold text-xs">Pasien: {patientName}</div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center font-bold text-xs text-slate-900 my-1">
                  {dosageSigna}
                </div>

                <div className="text-[10px] text-slate-500 flex justify-between pt-1 border-t border-slate-200">
                  <span>Sediaan: {recipeName}</span>
                  <span className="font-semibold text-emerald-700">BUD: {beyondUseDate}</span>
                </div>
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className="glass-panel p-5 rounded-3xl space-y-2.5 text-xs">
              <span className="font-bold text-slate-400 uppercase tracking-wider text-[11px] block">
                Rincian Biaya Racikan
              </span>

              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Bahan Aktif ({ingredients.length} jenis)</span>
                <span className="font-mono">{formatRupiah(subtotalIngredients)}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Kemasan ({packagingType})</span>
                <span className="font-mono">{formatRupiah(fees.embalaseCost)}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Jasa Farmasi (Tuslah)</span>
                <span className="font-mono">{formatRupiah(fees.tuslahFee)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t font-black text-sm text-emerald-600 dark:text-emerald-400 font-mono">
                <span>TOTAL RESEP</span>
                <span>{formatRupiah(grandTotal)}</span>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
