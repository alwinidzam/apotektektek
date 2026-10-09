"use client";

import { useState, useRef } from "react";
import {
  Barcode,
  Search,
  ShoppingCart,
  User,
  Stethoscope,
  Clock,
  Layers,
  FlaskConical,
  CreditCard,
  Trash2,
  PackagePlus,
  ShieldAlert,
  Thermometer,
  Lock,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { CartTable } from "@/components/pos/CartTable";
import { ClinicalAlertBanner } from "@/components/pos/ClinicalAlertBanner";
import { PaymentModal } from "@/components/pos/PaymentModal";
import { ReceiptModal } from "@/components/pos/ReceiptModal";
import { HeldBillsModal } from "@/components/pos/HeldBillsModal";
import { CustomerDoctorModal } from "@/components/pos/CustomerDoctorModal";
import { ShortcutHelpModal } from "@/components/pos/ShortcutHelpModal";
import { ShiftOpenModal } from "@/components/pos/ShiftOpenModal";
import { CommandPalette } from "@/components/CommandPalette";
import { AppleSegmentedControl } from "@/components/ui/AppleSegmentedControl";
import { showAppleToast } from "@/components/ui/AppleToast";
import { AppleStatusPill } from "@/components/ui/AppleStatusPill";
import { useApotekStore } from "@/lib/store";
import { useGlobalShortcuts } from "@/lib/shortcuts";
import { formatRupiah } from "@/lib/utils";
import { Transaction } from "@/lib/types";
import { soundEngine } from "@/lib/audio";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import Link from "next/link";

export default function POSPage() {
  const {
    products,
    cart,
    selectedPatient,
    selectedDoctor,
    addToCart,
    parkBill,
    clearCart,
    heldBills,
    currentUser,
    currentShift,
  } = useApotekStore();

  const [barcodeInput, setBarcodeInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [mobileTab, setMobileTab] = useState<"CART" | "CATALOG">("CART");
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isHeldOpen, setIsHeldOpen] = useState(false);
  const [isCustomerDoctorOpen, setIsCustomerDoctorOpen] = useState(false);
  const [customerDoctorTab, setCustomerDoctorTab] = useState<"PATIENT" | "DOCTOR">("PATIENT");
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isCmdKOpen, setIsCmdKOpen] = useState(false);
  const [isShiftOpenModalOpen, setIsShiftOpenModalOpen] = useState(false);
  const [completedTx, setCompletedTx] = useState<Transaction | null>(null);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

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

  // Global Shortcuts Hook
  useGlobalShortcuts({
    onF1Help: () => setIsHelpOpen(true),
    onF2Search: () => barcodeInputRef.current?.focus(),
    onF3Racikan: () => {}, // Handled by direct link or router
    onF4Patient: () => {
      setCustomerDoctorTab("PATIENT");
      setIsCustomerDoctorOpen(true);
    },
    onF5Doctor: () => {
      setCustomerDoctorTab("DOCTOR");
      setIsCustomerDoctorOpen(true);
    },
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

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const query = barcodeInput.trim().toLowerCase();
    const matched = products.find(
      (p) =>
        p.barcode.toLowerCase() === query ||
        p.name.toLowerCase().includes(query) ||
        p.genericName.toLowerCase().includes(query)
    );

    if (matched) {
      addToCart(matched);
      setBarcodeInput("");
    } else {
      showAppleToast({
        type: "warning",
        title: "Obat Tidak Ditemukan",
        message: `Obat dengan barcode atau kata kunci "${barcodeInput}" tidak terdaftar di sistem.`,
      });
    }
  };

  const filteredCatalog = products.filter((p) => {
    if (selectedCategory === "ALL") return true;
    if (selectedCategory === "BEBAS") return p.drugClass === "BEBAS" || p.drugClass === "BEBAS_TERBATAS";
    if (selectedCategory === "KERAS") return p.drugClass === "KERAS";
    if (selectedCategory === "CONTROLLED")
      return p.drugClass === "NARKOTIKA" || p.drugClass === "PSIKOTROPIKA" || p.drugClass === "OOT";
    return true;
  });

  const grandTotal = cart.reduce((acc, it) => acc + it.subtotal, 0);
  const isCashier = currentUser.role === "KARYAWAN_KASIR";

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#F5F5F7] dark:bg-[#000000] text-[#1C1C1E] dark:text-[#F5F5F7] flex flex-col">
      <Navbar onOpenHelp={() => setIsHelpOpen(true)} onOpenCmdK={() => setIsCmdKOpen(true)} />

      {/* Unopened Shift Prompt Banner */}
      {(!currentShift || currentShift.status !== "OPEN") && (
        <div className="w-full max-w-full bg-amber-500/10 dark:bg-amber-950/40 border-b border-amber-500/20 px-4 sm:px-6 py-2.5 flex items-center justify-between text-[12px] text-amber-900 dark:text-amber-300">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
            <span className="font-bold">Shift Kasir Belum Dibuka:</span>
            <span className="hidden sm:inline text-amber-800 dark:text-amber-400">
              Masukkan modal awal (float kas) untuk memulai transaksi tunai.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsShiftOpenModalOpen(true)}
            className="px-3 py-1 rounded-[8px] bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[11px] shadow-sm transition-all shrink-0"
          >
            Buka Shift Sekarang &rarr;
          </button>
        </div>
      )}

      <main
        {...swipeHandlers}
        className="flex-1 w-full max-w-full mx-auto p-3 sm:p-5 lg:p-6 flex flex-col gap-4 min-w-0 pb-28 lg:pb-6 touch-pan-y"
      >
        {/* Top Bar: Barcode Input + Patient/Doctor Context Header */}
        <div className="bg-white dark:bg-[#1C1C1E] p-3.5 sm:p-4 rounded-[20px] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Barcode scanner textfield */}
          <form onSubmit={handleBarcodeSubmit} className="flex-1 relative">
            <Barcode className="h-5 w-5 text-[#8E8E93] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              ref={barcodeInputRef}
              type="text"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              placeholder="Scan barcode obat atau ketik nama... (F2)"
              className="w-full pl-11 pr-20 py-2.5 rounded-[12px] border border-black/[0.08] dark:border-white/[0.12] bg-[#F5F5F7] dark:bg-[#2C2C2E] text-[13px] text-[#1C1C1E] dark:text-white placeholder:text-[#8E8E93] focus:outline-none focus:border-[#008B94] focus:bg-white dark:focus:bg-[#1C1C1E] transition-all"
              autoFocus
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 kbd-badge text-[10px]">
              F2
            </span>
          </form>

          {/* Quick Context Tags: Patient & Doctor */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setCustomerDoctorTab("PATIENT");
                setIsCustomerDoctorOpen(true);
              }}
              className={`px-3 py-2 rounded-[12px] border text-[12px] font-semibold flex items-center gap-1.5 transition-all ${
                selectedPatient
                  ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 shadow-sm"
                  : "bg-white dark:bg-[#2C2C2E] border-black/[0.08] dark:border-white/[0.12] text-[#636366] hover:border-black/[0.2]"
              }`}
            >
              <User className="h-3.5 w-3.5 text-emerald-600" />
              <span className="truncate max-w-[110px]">
                {selectedPatient ? selectedPatient.fullName : "Pasien (F4)"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCustomerDoctorTab("DOCTOR");
                setIsCustomerDoctorOpen(true);
              }}
              className={`px-3 py-2 rounded-[12px] border text-[12px] font-semibold flex items-center gap-1.5 transition-all ${
                selectedDoctor
                  ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 shadow-sm"
                  : "bg-white dark:bg-[#2C2C2E] border-black/[0.08] dark:border-white/[0.12] text-[#636366] hover:border-black/[0.2]"
              }`}
            >
              <Stethoscope className="h-3.5 w-3.5 text-emerald-600" />
              <span className="truncate max-w-[110px]">
                {selectedDoctor ? selectedDoctor.name : "Dokter (F5)"}
              </span>
            </button>
          </div>
        </div>

        {/* Apple Segmented Control for Mobile Screen Switcher (Keranjang vs Katalog) */}
        <div className="lg:hidden flex items-center p-1 rounded-[14px] bg-neutral-200/70 dark:bg-neutral-800 text-[12px] font-semibold w-full shrink-0 shadow-inner">
          <button
            type="button"
            onClick={() => {
              soundEngine.playKeyTap();
              setMobileTab("CART");
            }}
            className={`flex-1 py-2 rounded-[11px] flex items-center justify-center gap-1.5 transition-all ${
              mobileTab === "CART"
                ? "bg-white dark:bg-[#1C1C1E] text-[#008B94] shadow-sm font-bold"
                : "text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white"
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Keranjang ({cart.length})</span>
          </button>
          <button
            type="button"
            onClick={() => {
              soundEngine.playKeyTap();
              setMobileTab("CATALOG");
            }}
            className={`flex-1 py-2 rounded-[11px] flex items-center justify-center gap-1.5 transition-all ${
              mobileTab === "CATALOG"
                ? "bg-white dark:bg-[#1C1C1E] text-[#008B94] shadow-sm font-bold"
                : "text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Katalog & Racikan</span>
          </button>
        </div>

        {/* Mobile Swipe Hint */}
        <div className="lg:hidden text-center text-[10px] text-neutral-400 dark:text-neutral-500 -mt-2 pb-0.5 flex items-center justify-center gap-1 select-none">
          <span>&larr;</span>
          <span>Geser layar untuk beralih antara Keranjang & Katalog</span>
          <span>&rarr;</span>
        </div>

        {/* Main Grid Viewport */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 min-w-0">
          {/* Left Side: Cart & Clinical Safety & Checkouts (7 cols) */}
          <section
            className={`lg:col-span-7 flex flex-col gap-4 min-w-0 ${
              mobileTab === "CART" ? "flex" : "hidden lg:flex"
            }`}
          >
            {/* Clinical Decision Support Alert Banner */}
            <ClinicalAlertBanner />

            {/* Active Cart Table */}
            <div className="flex-1">
              <CartTable />
            </div>

            {/* Bottom Bar: Action Buttons & Checkout Pill */}
            <div className="bg-white dark:bg-[#1C1C1E] p-4 rounded-[20px] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Quick Actions */}
              <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar touch-pan-x">
                <button
                  type="button"
                  onClick={() => parkBill()}
                  disabled={cart.length === 0}
                  className="flex-1 sm:flex-none px-3.5 py-2.5 min-h-[40px] rounded-[12px] border border-black/[0.08] dark:border-white/[0.12] bg-[#F5F5F7] dark:bg-[#2C2C2E] hover:bg-neutral-200 text-[#1C1C1E] dark:text-white text-[12px] font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50 transition-colors shrink-0 whitespace-nowrap"
                  title="Tahan transaksi untuk antrean lain (F6)"
                >
                  <Clock className="h-4 w-4 shrink-0" />
                  <span>Parkir</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-black/10 dark:bg-white/10 font-mono">F6</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsHeldOpen(true)}
                  className="flex-1 sm:flex-none px-3.5 py-2.5 min-h-[40px] rounded-[12px] border border-black/[0.08] dark:border-white/[0.12] bg-[#F5F5F7] dark:bg-[#2C2C2E] hover:bg-neutral-200 text-[#1C1C1E] dark:text-white text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-colors shrink-0 whitespace-nowrap"
                  title="Lihat antrean transaksi tertahan (F7)"
                >
                  <Layers className="h-4 w-4 shrink-0" />
                  <span>Antrean ({heldBills.length})</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-black/10 dark:bg-white/10 font-mono">F7</span>
                </button>

                <button
                  type="button"
                  onClick={clearCart}
                  disabled={cart.length === 0}
                  className="p-2.5 min-h-[40px] min-w-[40px] rounded-[12px] border border-black/[0.08] dark:border-white/[0.12] bg-[#F5F5F7] dark:bg-[#2C2C2E] hover:text-red-600 hover:bg-rose-50 text-[#8E8E93] disabled:opacity-50 transition-colors shrink-0 flex items-center justify-center"
                  title="Kosongkan Keranjang"
                >
                  <Trash2 className="h-4 w-4 shrink-0" />
                </button>
              </div>

              {/* Grand Total & Checkout Button */}
              <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                <div className="text-right">
                  <span className="text-[11px] text-[#8E8E93] font-medium block">Total Pembayaran</span>
                  <span className="text-[22px] font-bold text-[#1C1C1E] dark:text-white font-mono tracking-tight tabular-nums">
                    {formatRupiah(grandTotal)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsPaymentOpen(true)}
                  disabled={cart.length === 0}
                  className="px-6 py-2.5 min-h-[44px] rounded-[14px] bg-[#34C759] hover:bg-[#2EB34F] text-white font-bold text-[13px] shadow-[0_2px_10px_rgba(52,199,89,0.3)] flex items-center gap-2 disabled:opacity-50 transition-all hover:scale-[1.01] active:scale-[0.99] shrink-0 whitespace-nowrap"
                >
                  <CreditCard className="h-4 w-4 shrink-0" />
                  <span>Bayar</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-white/25 font-mono">F12</span>
                </button>
              </div>
            </div>
          </section>

          {/* Right Side: Quick Product Catalog & Racikan Shortcut (5 cols) */}
          <section
            className={`lg:col-span-5 flex flex-col gap-4 min-w-0 ${
              mobileTab === "CATALOG" ? "flex" : "hidden lg:flex"
            }`}
          >
          {/* Quick Racikan Card */}
          <div className="p-3.5 rounded-[16px] bg-white dark:bg-[#1C1C1E] border border-black/[0.08] dark:border-white/[0.08] flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-[10px] bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0">
                <FlaskConical className="h-4.5 w-4.5" />
              </div>
              <div>
                <h4 className="text-[13px] font-bold text-[#1C1C1E] dark:text-white">
                  Resep Racikan Dokter
                </h4>
                <p className="text-[11px] text-[#8E8E93]">
                  Puyer, kapsul, sirup & kalkulator dosis (F3)
                </p>
              </div>
            </div>

            <Link
              href="/compounding"
              className="px-3 py-1.5 rounded-[10px] bg-teal-600 hover:bg-teal-700 text-white font-semibold text-[11px] shadow-sm flex items-center gap-1 transition-all"
            >
              <span>Buat R/</span>
              <span className="kbd-badge text-[9px] bg-teal-700 text-white border-teal-500">
                F3
              </span>
            </Link>
          </div>

          {/* Catalog Filter Tabs (Apple Segmented Control) */}
          <div className="overflow-x-auto pb-1">
            <AppleSegmentedControl
              options={[
                { id: "ALL", label: "Semua" },
                { id: "BEBAS", label: "OTC / Bebas" },
                { id: "KERAS", label: "Obat Keras" },
                { id: "CONTROLLED", label: "Narkotika/Psiko" },
              ]}
              activeId={selectedCategory}
              onChange={setSelectedCategory}
              size="sm"
            />
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[calc(100vh-270px)] overflow-y-auto pr-1">
            {filteredCatalog.map((prod) => {
              const earliestBatch = [...prod.batches].sort(
                (a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
              )[0];
              const totalStock = prod.batches.reduce((acc, b) => acc + b.currentStock, 0);

              return (
                <div
                  key={prod.id}
                  onClick={() => addToCart(prod)}
                  className="bg-white dark:bg-[#1C1C1E] p-3.5 rounded-[16px] border border-black/[0.06] dark:border-white/[0.08] hover:border-teal-500 dark:hover:border-teal-400 hover:shadow-sm cursor-pointer transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <span className="font-bold text-[13px] text-[#1C1C1E] dark:text-white line-clamp-1 group-hover:text-[#007AFF] transition-colors">
                        {prod.isLasa && prod.tallManName ? prod.tallManName : prod.name}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                          prod.drugClass === "NARKOTIKA"
                            ? "bg-red-100 text-red-800"
                            : prod.drugClass === "KERAS"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-neutral-100 text-neutral-700"
                        }`}
                      >
                        {prod.drugClass}
                      </span>
                    </div>

                    <p className="text-[11px] text-[#8E8E93] line-clamp-1">{prod.genericName}</p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between text-[12px]">
                    <div>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono text-[13px] tabular-nums">
                        {formatRupiah(prod.unitConversions[0]?.pricePerUnit || prod.sellingPrice)}
                      </span>
                      <span className="text-[10px] text-[#8E8E93] block">
                        per {prod.baseUnit}
                      </span>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full tabular-nums ${
                          totalStock < prod.minStockAlert
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                        }`}
                      >
                        Stok: {totalStock}
                      </span>
                      {earliestBatch && (
                        <span className="text-[9px] text-[#8E8E93] block font-mono mt-0.5">
                          Exp: {earliestBatch.expiryDate.split("T")[0]}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Floating Quick Checkout Bar on Mobile (Thumb Zone) */}
      {cart.length > 0 && (
        <div className="lg:hidden fixed bottom-[calc(env(safe-area-inset-bottom)+3.75rem)] inset-x-3 z-30 animate-in slide-in-from-bottom-3 duration-200">
          <div className="p-3 rounded-[18px] bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-xl border border-black/[0.08] dark:border-white/[0.12] shadow-[0_10px_35px_rgba(0,0,0,0.22)] flex items-center justify-between gap-3">
            <div className="pl-1">
              <span className="text-[10px] text-[#8E8E93] font-semibold block uppercase">
                {cart.length} Obat di Keranjang
              </span>
              <span className="text-[17px] font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums leading-none">
                {formatRupiah(grandTotal)}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsPaymentOpen(true)}
              className="px-5 py-2.5 min-h-[44px] rounded-[14px] bg-[#34C759] hover:bg-[#2EB34F] active:scale-95 text-white font-bold text-[13px] shadow-[0_2px_10px_rgba(52,199,89,0.3)] flex items-center gap-2 transition-all shrink-0"
            >
              <CreditCard className="w-4 h-4 shrink-0" />
              <span>Bayar Sekarang</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-white/20 font-mono">F12</span>
            </button>
          </div>
        </div>
      )}
    </main>

      {/* Modals */}
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
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

      <CustomerDoctorModal
        isOpen={isCustomerDoctorOpen}
        defaultTab={customerDoctorTab}
        onClose={() => setIsCustomerDoctorOpen(false)}
      />

      <ShortcutHelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      <CommandPalette isOpen={isCmdKOpen} onClose={() => setIsCmdKOpen(false)} />

      <ShiftOpenModal
        isOpen={isShiftOpenModalOpen}
        onClose={() => setIsShiftOpenModalOpen(false)}
      />
    </div>
  );
}
