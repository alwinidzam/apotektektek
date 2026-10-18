"use client";

import { useState } from "react";
import {
  X,
  CreditCard,
  QrCode,
  Banknote,
  ShieldCheck,
  CheckCircle2,
  Calculator,
  Printer,
  Sparkles,
} from "lucide-react";
import confetti from "canvas-confetti";
import { useApotekStore } from "@/lib/store";
import { PaymentMethodType, Transaction } from "@/lib/types";
import { formatRupiah } from "@/lib/utils";
import { showAppleToast } from "@/components/ui/AppleToast";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (tx: Transaction) => void;
  transactionMode?: "SWAMEDIKASI" | "RESEP_DOKTER";
  patientName?: string;
  doctorName?: string;
  doctorSip?: string;
  prescriptionNumber?: string;
  isPrescriptionVerified?: boolean;
}

export function PaymentModal({
  isOpen,
  onClose,
  onSuccess,
  transactionMode = "SWAMEDIKASI",
  patientName,
  doctorName,
  doctorSip,
  prescriptionNumber,
  isPrescriptionVerified = true,
}: PaymentModalProps) {
  const { cart, processCheckout, currentShift, currentUser } = useApotekStore();
  const [method, setMethod] = useState<PaymentMethodType>("CASH");
  const [paidInput, setPaidInput] = useState<string>("");
  const [cardLastDigits, setCardLastDigits] = useState("");
  const [edcBank, setEdcBank] = useState("BCA");
  const [isQrisVerified, setIsQrisVerified] = useState(false);

  if (!isOpen) return null;

  const subtotal = cart.reduce((acc, it) => acc + it.quantity * it.unitPrice, 0);
  const tuslahTotal = cart.reduce((acc, it) => acc + (it.racikanData?.tuslahFee || 0), 0);
  const embalaseTotal = cart.reduce((acc, it) => acc + (it.racikanData?.packagingCost || 0), 0);

  const rawGrandTotal = subtotal + tuslahTotal + embalaseTotal;
  const grandTotal = method === "CASH" ? Math.round(rawGrandTotal / 100) * 100 : rawGrandTotal;
  const roundingDelta = grandTotal - rawGrandTotal;

  const paidAmount = Number(paidInput) || 0;
  const changeAmount = Math.max(0, paidAmount - grandTotal);

  const quickCashOptions = [
    { label: "Uang Pas (F10)", amount: grandTotal },
    { label: "Rp 50.000", amount: 50000 },
    { label: "Rp 100.000", amount: 100000 },
    { label: "Rp 200.000", amount: 200000 },
  ];

  const handleFinalize = () => {
    if (method === "CASH" && paidAmount < grandTotal) {
      showAppleToast({
        type: "error",
        title: "Pembayaran Kurang",
        message: "Nominal pembayaran tunai kurang dari total belanja!",
      });
      return;
    }

    const cashierName = currentShift?.cashierName || currentUser?.name || "Kasir";

    const tx = processCheckout({
      paymentMethod: method,
      paidAmount: method === "CASH" ? paidAmount : grandTotal,
      cashierName,
      transactionMode,
      customerName: patientName,
      doctorName: doctorName,
      doctorSip,
      prescriptionNumber,
      isPrescriptionVerified,
    });

    if (tx) {
      // Trigger Apple HIG delight confetti
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.7 },
        });
      } catch {}

      onSuccess(tx);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Calculator className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Pembayaran & Cetak Struk
              </h2>
              <p className="text-xs text-slate-500">
                Pilih metode pembayaran dan verifikasi nominal
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[75vh] overflow-y-auto">
          {/* Left Column: Totals & Summary */}
          <div className="flex flex-col justify-between bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-3">
                Ringkasan Transaksi
              </span>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Subtotal Obat ({cart.length} item)</span>
                  <span className="font-mono">{formatRupiah(subtotal)}</span>
                </div>
                {tuslahTotal > 0 && (
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Jasa Farmasi (Tuslah)</span>
                    <span className="font-mono">+{formatRupiah(tuslahTotal)}</span>
                  </div>
                )}
                {embalaseTotal > 0 && (
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Kemasan (Embalase)</span>
                    <span className="font-mono">+{formatRupiah(embalaseTotal)}</span>
                  </div>
                )}
                {roundingDelta !== 0 && (
                  <div className="flex justify-between text-slate-500 italic">
                    <span>Pembulatan Kasir (100)</span>
                    <span className="font-mono">
                      {roundingDelta > 0 ? `+${roundingDelta}` : roundingDelta}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
              <span className="text-xs text-slate-500 block mb-1">Total Pembayaran</span>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-tight">
                {formatRupiah(grandTotal)}
              </div>
            </div>
          </div>

          {/* Right Column: Payment Methods & Inputs */}
          <div className="space-y-4">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Metode Pembayaran
            </span>

            {/* Method Selectors */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setMethod("CASH")}
                className={`p-3 rounded-2xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
                  method === "CASH"
                    ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-sm"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 hover:border-slate-300"
                }`}
              >
                <Banknote className="h-5 w-5" />
                <span>Tunai</span>
              </button>

              <button
                type="button"
                onClick={() => setMethod("QRIS_DYNAMIC")}
                className={`p-3 rounded-2xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
                  method === "QRIS_DYNAMIC"
                    ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-sm"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 hover:border-slate-300"
                }`}
              >
                <QrCode className="h-5 w-5" />
                <span>QRIS</span>
              </button>

              <button
                type="button"
                onClick={() => setMethod("EDC_DEBIT")}
                className={`p-3 rounded-2xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
                  method === "EDC_DEBIT"
                    ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-sm"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 hover:border-slate-300"
                }`}
              >
                <CreditCard className="h-5 w-5" />
                <span>Kartu / EDC</span>
              </button>
            </div>

            {/* Conditional input based on method */}
            {method === "CASH" && (
              <div className="space-y-3 pt-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Uang Diterima dari Pasien (Rp)
                  </label>
                  <input
                    type="number"
                    value={paidInput}
                    onChange={(e) => setPaidInput(e.target.value)}
                    placeholder={grandTotal.toString()}
                    className="w-full py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-base font-bold focus:outline-none focus:border-emerald-500"
                    autoFocus
                  />
                </div>

                {/* Quick Cash Buttons */}
                <div className="grid grid-cols-2 gap-1.5">
                  {quickCashOptions.map((opt, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setPaidInput(opt.amount.toString())}
                      className="py-1.5 px-2 rounded-xl text-xs font-mono font-medium border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-50 hover:border-emerald-300 transition-colors"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* Kembalian */}
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 flex justify-between items-center">
                  <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                    Kembalian Pasien
                  </span>
                  <span className="text-lg font-black text-emerald-700 dark:text-emerald-400 font-mono">
                    {formatRupiah(changeAmount)}
                  </span>
                </div>
              </div>
            )}

            {method === "QRIS_DYNAMIC" && (
              <div className="text-center p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 space-y-3">
                <div className="h-32 w-32 mx-auto bg-white p-2 rounded-xl border shadow-inner flex items-center justify-center">
                  <QrCode className="h-28 w-28 text-slate-900" />
                </div>
                <div className="text-xs text-slate-500">
                  Pindai kode QRIS menggunakan aplikasi perbankan atau dompet digital
                </div>
                <button
                  type="button"
                  onClick={() => setIsQrisVerified(!isQrisVerified)}
                  className={`w-full py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                    isQrisVerified
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300"
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>
                    {isQrisVerified ? "Status: Pembayaran QRIS Lunas" : "Konfirmasi Pembayaran QRIS Diterima"}
                  </span>
                </button>
              </div>
            )}

            {method === "EDC_DEBIT" && (
              <div className="space-y-3 pt-2 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Pilih Mesin EDC Bank
                  </label>
                  <select
                    value={edcBank}
                    onChange={(e) => setEdcBank(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="BCA">EDC BCA Merchant</option>
                    <option value="MANDIRI">EDC Bank Mandiri</option>
                    <option value="BRI">EDC BRI Merchant</option>
                    <option value="BNI">EDC BNI</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    4 Digit Terakhir Nomor Kartu (Opsional)
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    value={cardLastDigits}
                    onChange={(e) => setCardLastDigits(e.target.value)}
                    placeholder="4321"
                    className="w-full py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Printer className="h-3.5 w-3.5 shrink-0" />
            <span>Struk pembayaran dan etiket obat langsung dicetak otomatis</span>
          </div>

          <div className="flex gap-2 shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-colors whitespace-nowrap"
            >
              Batal
            </button>
            <button
              onClick={handleFinalize}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center gap-2 transition-all whitespace-nowrap"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Selesaikan & Cetak Struk (F12)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
