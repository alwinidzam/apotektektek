"use client";

import React, { useState, useMemo } from "react";
import { useApotekStore } from "@/lib/store";
import { formatRupiah } from "@/lib/utils";
import { soundEngine } from "@/lib/audio";
import { showAppleToast } from "@/components/ui/AppleToast";
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Printer,
  ArrowRightLeft,
  Calculator,
  ArrowRight,
  Coins,
  Banknote,
  ShieldCheck,
  KeyRound,
  UserCheck,
  FileText,
  BadgeAlert,
  Vault,
  Wallet,
} from "lucide-react";
import {
  CashierShift,
  RupiahDenominationCount,
  ShiftHandoverLog,
  APOTEK_KERSO_WARAS_INFO,
} from "@/lib/types";
import { DenominationCounter } from "./DenominationCounter";

interface ShiftHandoverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (log: ShiftHandoverLog) => void;
}

export const ShiftHandoverModal: React.FC<ShiftHandoverModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { currentShift, users, handoverShift, verifySupervisorPin } = useApotekStore();

  // Steps: 1 = Count, 2 = Allocate Vault vs Float, 3 = Next Cashier & PIN, 4 = Slip
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Cash Counting
  const [countMethod, setCountMethod] = useState<"DIRECT" | "DENOMINATION">("DIRECT");
  const [actualCashInput, setActualCashInput] = useState<number>(0);
  const [denominationResult, setDenominationResult] = useState<RupiahDenominationCount | undefined>(undefined);

  // Step 2: Cash Distribution (Setor Brankas vs Modal Kasir Berikutnya)
  const [openingCashForNextShift, setOpeningCashForNextShift] = useState<number>(200000);

  // Step 3: Incoming Cashier & Security Handshake
  const availableNextCashiers = useMemo(() => {
    return users.filter(
      (u) =>
        u.role === "KARYAWAN_KASIR" ||
        u.role === "KARYAWAN_APOTEKER" ||
        u.role === "OWNER" ||
        u.role === "SUPER_ADMIN"
    );
  }, [users]);

  // Default incoming cashier to someone other than current cashier if possible
  const defaultNextCashier = useMemo(() => {
    const others = availableNextCashiers.filter((u) => u.id !== currentShift?.cashierId);
    return others.length > 0 ? others[0] : availableNextCashiers[0];
  }, [availableNextCashiers, currentShift]);

  const [nextCashierId, setNextCashierId] = useState<string>(defaultNextCashier?.id || "");
  const [nextShiftNumber, setNextShiftNumber] = useState<1 | 2 | 3>(
    currentShift ? (((currentShift.shiftNumber % 3) + 1) as 1 | 2 | 3) : 2
  );
  const [handoverNote, setHandoverNote] = useState("");
  const [nextCashierPin, setNextCashierPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [isPinVerifying, setIsPinVerifying] = useState(false);

  // Step 4: Completion & Slip
  const [completedHandover, setCompletedHandover] = useState<{
    previousShift: CashierShift;
    nextShift: CashierShift;
    handoverLog: ShiftHandoverLog;
  } | null>(null);

  if (!isOpen || !currentShift) return null;

  // Expected drawer cash (Zero digital contamination)
  const expectedCash =
    currentShift.openingCash +
    currentShift.cashSalesTotal +
    currentShift.cashInTotal -
    currentShift.cashOutTotal -
    currentShift.refundTotal;

  const difference = actualCashInput - expectedCash;
  const isKlop = difference === 0;

  // Setoran ke brankas
  const cashDroppedToVault = Math.max(0, actualCashInput - openingCashForNextShift);

  // Step 1 -> Step 2
  const handleProceedToAllocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (actualCashInput < 0) {
      showAppleToast({
        type: "error",
        title: "Input Tidak Valid",
        message: "Nominal uang fisik laci tidak boleh bernilai negatif!",
      });
      return;
    }
    soundEngine.playKeyTap();
    // Default modal berikutnya: Rp 200.000 or full cash if less than 200k
    setOpeningCashForNextShift(Math.min(200000, actualCashInput));
    setStep(2);
  };

  // Step 2 -> Step 3
  const handleProceedToCashierHandshake = () => {
    if (openingCashForNextShift > actualCashInput) {
      showAppleToast({
        type: "error",
        title: "Alokasi Modal Melebihi Kas",
        message: "Modal kasir berikutnya tidak boleh melebihi total uang fisik di laci!",
      });
      return;
    }
    soundEngine.playKeyTap();
    setStep(3);
  };

  // Step 3: Validate PIN & Atomic Commit
  const handleConfirmHandover = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError("");

    const targetCashier = users.find((u) => u.id === nextCashierId);
    if (!targetCashier) {
      setPinError("Kasir penerima belum dipilih.");
      return;
    }

    if (!nextCashierPin || nextCashierPin.length < 4) {
      setPinError("Masukkan minimal 4-6 digit PIN kasir penerima.");
      return;
    }

    setIsPinVerifying(true);

    // Verify PIN against supervisor list or general PIN map
    // Standard PINs for testing & demonstration:
    const VALID_PINS: Record<string, string> = {
      "alwinizam0405@gmail.com": "123456",
      "owner.bambang@kersowaras.com": "888999",
      "apoteker.farhan@kersowaras.com": "456789",
      "usr-kasir": "112233",
      "kasir1@kersowaras.com": "112233",
      "kasir2@kersowaras.com": "112233",
      "usr-kasir-2": "112233",
      "usr-alwi": "123456",
      "usr-owner": "888999",
      "usr-apj": "456789",
    };

    const expectedPin =
      (targetCashier.email && VALID_PINS[targetCashier.email]) ||
      VALID_PINS[targetCashier.id] ||
      "123456";

    // Allow supervisor PIN as master override (123456 or 888999 or 456789)
    const isMasterOverride =
      nextCashierPin === "123456" ||
      nextCashierPin === "888999" ||
      nextCashierPin === "456789" ||
      nextCashierPin === "112233";

    if (nextCashierPin === expectedPin || isMasterOverride) {
      soundEngine.playCheckoutChime();

      const result = handoverShift({
        physicalCashCounted: actualCashInput,
        cashDroppedToVault,
        openingCashForNextShift,
        nextCashierId: targetCashier.id,
        nextCashierName: targetCashier.name,
        nextShiftNumber,
        handoverNote,
        confirmedWithNextCashierPin: true,
        denominationCount: denominationResult,
      });

      if (result) {
        setCompletedHandover(result);
        if (onSuccess) onSuccess(result.handoverLog);
        setStep(4);
      }
    } else {
      soundEngine.playError();
      setPinError("PIN kasir penerima salah. Masukkan 6-digit PIN yang benar.");
    }

    setIsPinVerifying(false);
  };

  const handlePrintSlip = () => {
    soundEngine.playKeyTap();
    window.print();
  };

  const handleFinishAll = () => {
    soundEngine.playScanSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white dark:bg-[#1C1C1E] rounded-[24px] shadow-[0_25px_70px_rgba(0,0,0,0.3)] border border-black/[0.08] dark:border-white/[0.12] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-[10px] bg-teal-100 dark:bg-teal-950 text-[#008B94] dark:text-teal-300">
              <ArrowRightLeft className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-[16px] sm:text-[17px] font-bold text-[#1C1C1E] dark:text-white tracking-tight flex items-center gap-2">
                <span>Serah Terima & Ganti Shift Kasir</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/10 text-[#008B94] dark:text-teal-300">
                  Langkah {step} dari 4
                </span>
              </h2>
              <p className="text-[11px] text-[#8E8E93]">
                Shift {currentShift.shiftNumber} &bull; {currentShift.cashierName} &bull; {currentShift.terminalId}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* STEP 1: BLIND CASH COUNT */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-4 rounded-[16px] bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900/50 flex items-start gap-3">
                <Banknote className="w-5 h-5 text-[#008B94] shrink-0 mt-0.5" />
                <div className="text-[12px] text-teal-900 dark:text-teal-200">
                  <p className="font-bold">Standar Prosedur Hitung Kas Buta (Blind Cash Count)</p>
                  <p className="text-[11px] opacity-80 mt-0.5">
                    Hitung seluruh uang fisik (kertas & koin) yang ada di laci kasir saat ini sebelum sistem menampilkan ekspektasi saldo omzet.
                  </p>
                </div>
              </div>

              {/* Method Switcher: Direct vs Denomination */}
              <div className="flex rounded-[12px] bg-neutral-100 dark:bg-neutral-800 p-1">
                <button
                  type="button"
                  onClick={() => setCountMethod("DIRECT")}
                  className={`flex-1 py-1.5 rounded-[9px] text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    countMethod === "DIRECT"
                      ? "bg-white dark:bg-[#2C2C2E] text-[#1C1C1E] dark:text-white shadow-sm"
                      : "text-[#8E8E93] hover:text-[#1C1C1E]"
                  }`}
                >
                  <Banknote className="w-3.5 h-3.5" />
                  <span>Input Nominal Langsung</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCountMethod("DENOMINATION")}
                  className={`flex-1 py-1.5 rounded-[9px] text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    countMethod === "DENOMINATION"
                      ? "bg-white dark:bg-[#2C2C2E] text-[#1C1C1E] dark:text-white shadow-sm"
                      : "text-[#8E8E93] hover:text-[#1C1C1E]"
                  }`}
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>Kalkulator Pecahan Rupiah</span>
                </button>
              </div>

              {countMethod === "DIRECT" ? (
                <form onSubmit={handleProceedToAllocation} className="space-y-4 pt-2">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8E8E93] mb-1.5">
                      Total Uang Fisik di Laci Kasir (Rp) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-[15px] font-medium text-[#8E8E93]">Rp</span>
                      <input
                        type="number"
                        required
                        min="0"
                        step="500"
                        autoFocus
                        value={actualCashInput || ""}
                        onChange={(e) => setActualCashInput(Number(e.target.value))}
                        placeholder="Contoh: 1450000"
                        className="w-full pl-11 pr-4 py-2.5 rounded-[12px] bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-[#1C1C1E] dark:text-white font-mono text-[16px] font-bold focus:outline-none focus:ring-2 focus:ring-[#008B94]"
                      />
                    </div>
                  </div>

                  {actualCashInput > 0 && (
                    <div className="p-3.5 rounded-[12px] bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex justify-between items-center text-[12px]">
                      <span className="text-[#8E8E93]">Uang Fisik Terhitung:</span>
                      <span className="text-[15px] font-bold font-mono text-emerald-600 dark:text-emerald-400">
                        {formatRupiah(actualCashInput)}
                      </span>
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={actualCashInput <= 0}
                      className="w-full py-2.5 rounded-[12px] bg-[#008B94] hover:bg-[#00767E] disabled:opacity-50 text-white text-[13px] font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
                    >
                      <span>Lanjut: Alokasi Setoran & Modal</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <DenominationCounter
                    onChange={(count) => {
                      setActualCashInput(count.grandTotal);
                      setDenominationResult(count);
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleProceedToAllocation}
                    disabled={actualCashInput <= 0}
                    className="w-full py-2.5 rounded-[12px] bg-[#008B94] hover:bg-[#00767E] disabled:opacity-50 text-white text-[13px] font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    <span>Lanjut: Alokasi Setoran ({formatRupiah(actualCashInput)})</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: ALLOCATION (Setor Brankas vs Modal Kasir Berikutnya) */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Reconciliation Status Card */}
              <div
                className={`p-4 rounded-[16px] border ${
                  isKlop
                    ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50"
                    : difference > 0
                    ? "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/50"
                    : "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50"
                }`}
              >
                <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
                  <div className="flex items-center gap-2">
                    {isKlop ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <AlertTriangle
                        className={`w-5 h-5 ${difference > 0 ? "text-blue-600" : "text-rose-600"}`}
                      />
                    )}
                    <div>
                      <h4 className="text-[13px] font-bold text-[#1C1C1E] dark:text-white">
                        {isKlop
                          ? "Status Kas: Klop Sempurna (100% Cocok)"
                          : difference > 0
                          ? `Status Kas: Surplus / Lebih (+${formatRupiah(difference)})`
                          : `Status Kas: Defisit / Kurang (${formatRupiah(difference)})`}
                      </h4>
                      <p className="text-[11px] text-[#8E8E93]">
                        Perbandingan uang fisik laci vs ekspektasi sistem shift berjalan
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isKlop
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
                        : difference > 0
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        : "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200"
                    }`}
                  >
                    {isKlop ? "KLOP (Rp 0)" : difference > 0 ? "LEBIH" : "KURANG"}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-3 text-[11px]">
                  <div>
                    <span className="text-[#8E8E93] block">Uang Fisik Dihitung</span>
                    <span className="text-[13px] font-bold font-mono text-[#1C1C1E] dark:text-white">
                      {formatRupiah(actualCashInput)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#8E8E93] block">Ekspektasi Sistem</span>
                    <span className="text-[13px] font-bold font-mono text-[#1C1C1E] dark:text-white">
                      {formatRupiah(expectedCash)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#8E8E93] block">Selisih Kas</span>
                    <span
                      className={`text-[13px] font-bold font-mono ${
                        isKlop
                          ? "text-emerald-600"
                          : difference > 0
                          ? "text-blue-600"
                          : "text-rose-600"
                      }`}
                    >
                      {difference > 0 ? `+${formatRupiah(difference)}` : formatRupiah(difference)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Distribution Inputs */}
              <div className="space-y-4">
                <h4 className="text-[13px] font-bold text-[#1C1C1E] dark:text-white">
                  Alokasi Fisik Kas Laci untuk Shift Berikutnya:
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Modal Kembalian Diserahkan */}
                  <div className="p-4 rounded-[16px] bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-2">
                    <div className="flex items-center gap-2 text-[#008B94]">
                      <Wallet className="w-4 h-4" />
                      <label className="text-[11px] font-bold uppercase tracking-wider">
                        Modal Diserahkan ke Kasir Berikutnya *
                      </label>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-[14px] font-medium text-[#8E8E93]">Rp</span>
                      <input
                        type="number"
                        min="0"
                        max={actualCashInput}
                        step="5000"
                        value={openingCashForNextShift}
                        onChange={(e) => setOpeningCashForNextShift(Number(e.target.value))}
                        className="w-full pl-11 pr-4 py-2 rounded-[10px] bg-white dark:bg-[#1C1C1E] border border-neutral-200 dark:border-neutral-700 text-[#1C1C1E] dark:text-white font-mono text-[14px] font-bold focus:outline-none focus:ring-2 focus:ring-[#008B94]"
                      />
                    </div>
                    <p className="text-[10px] text-[#8E8E93]">
                      Uang receh/pecahan yang tetap ditinggalkan di laci kasir sebagai modal kembalian.
                    </p>
                  </div>

                  {/* Setoran ke Brankas (Auto-computed) */}
                  <div className="p-4 rounded-[16px] bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-2">
                    <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                      <Vault className="w-4 h-4" />
                      <span className="text-[11px] font-bold uppercase tracking-wider">
                        Setoran Masuk ke Brankas Apotek (Safe Drop)
                      </span>
                    </div>
                    <div className="py-2 px-3 rounded-[10px] bg-white dark:bg-[#1C1C1E] border border-neutral-200 dark:border-neutral-700 text-[16px] font-bold font-mono text-purple-600 dark:text-purple-400">
                      {formatRupiah(cashDroppedToVault)}
                    </div>
                    <p className="text-[10px] text-[#8E8E93]">
                      Omzet tunai yang diambil dan disimpan ke brankas/disetor ke pemilik apotek.
                    </p>
                  </div>
                </div>

                {/* Mathematical Check */}
                <div className="p-3 rounded-[12px] bg-neutral-100 dark:bg-neutral-800/60 text-[11px] font-mono text-center text-[#8E8E93]">
                  Total Fisik: {formatRupiah(actualCashInput)} = Modal Diserahkan ({formatRupiah(openingCashForNextShift)}) + Setor Brankas ({formatRupiah(cashDroppedToVault)})
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="py-2.5 px-4 rounded-[12px] bg-neutral-100 dark:bg-neutral-800 text-[#1C1C1E] dark:text-white text-[12px] font-semibold"
                >
                  Kembali Hitung
                </button>
                <button
                  type="button"
                  onClick={handleProceedToCashierHandshake}
                  className="flex-1 py-2.5 rounded-[12px] bg-[#008B94] hover:bg-[#00767E] text-white text-[13px] font-bold flex items-center justify-center gap-2 shadow-sm"
                >
                  <span>Lanjut: Pilih Kasir Penerima & PIN</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: NEXT CASHIER SELECTION & PIN CONFIRMATION */}
          {step === 3 && (
            <form onSubmit={handleConfirmHandover} className="space-y-4 animate-in fade-in duration-150">
              <div className="p-4 rounded-[16px] bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/50 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                <div className="text-[12px] text-purple-900 dark:text-purple-200">
                  <p className="font-bold">Otorisasi Serah Terima Ganda (Dual-Control Handshake)</p>
                  <p className="text-[11px] opacity-80 mt-0.5">
                    Kasir penerima wajib memilih akunnya dan memasukkan PIN otorisasi untuk mengonfirmasi penerimaan fisik uang laci sebesar <strong>{formatRupiah(openingCashForNextShift)}</strong>.
                  </p>
                </div>
              </div>

              {/* Next Cashier Picker */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8E8E93] mb-1.5">
                  Pilih Kasir Penerima Tugas (Petugas Shift Berikutnya) *
                </label>
                <select
                  value={nextCashierId}
                  onChange={(e) => setNextCashierId(e.target.value)}
                  className="w-full py-2.5 px-3.5 rounded-[12px] bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-[#1C1C1E] dark:text-white text-[13px] font-semibold focus:outline-none focus:ring-2 focus:ring-[#008B94]"
                >
                  {availableNextCashiers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role.replace("KARYAWAN_", "")}) {u.id === currentShift.cashierId ? "(Kasir Saat Ini)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Next Shift Selector */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8E8E93] mb-1.5">
                  Shift yang Akan Berjalan Berikutnya *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { num: 1 as const, label: "Shift 1 Pagi", time: "07:30 - 15:00" },
                    { num: 2 as const, label: "Shift 2 Siang", time: "15:00 - 22:00" },
                    { num: 3 as const, label: "Shift 3 Malam", time: "22:00 - 07:30" },
                  ].map((s) => (
                    <button
                      key={s.num}
                      type="button"
                      onClick={() => setNextShiftNumber(s.num)}
                      className={`p-2.5 rounded-[12px] border text-left transition-all ${
                        nextShiftNumber === s.num
                          ? "border-[#008B94] bg-teal-50/70 dark:bg-teal-950/50 text-[#008B94] dark:text-teal-300"
                          : "border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                      }`}
                    >
                      <span className="text-[12px] font-bold block">{s.label}</span>
                      <span className="text-[10px] text-[#8E8E93] block">{s.time}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Handover Note */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8E8E93] mb-1.5">
                  Catatan Khusus Serah Terima (Opsional)
                </label>
                <input
                  type="text"
                  value={handoverNote}
                  onChange={(e) => setHandoverNote(e.target.value)}
                  placeholder="Contoh: Titipan resep cito pasien Tn. Joko belum diambil, stok amlodipin menipis"
                  className="w-full py-2 px-3 rounded-[10px] bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-[#1C1C1E] dark:text-white text-[12px]"
                />
              </div>

              {/* PIN Verification */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8E8E93] mb-1.5 flex items-center justify-between">
                  <span>PIN Otorisasi Kasir Penerima (6 Digit) *</span>
                  <span className="text-[10px] text-[#8E8E93] font-normal">
                    (PIN Demo Kasir: 112233 / Supervisor: 123456)
                  </span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-[#8E8E93]">
                    <KeyRound className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    required
                    maxLength={6}
                    value={nextCashierPin}
                    onChange={(e) => {
                      setNextCashierPin(e.target.value);
                      setPinError("");
                    }}
                    placeholder="••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-[12px] bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-[#1C1C1E] dark:text-white font-mono text-[16px] tracking-widest focus:outline-none focus:ring-2 focus:ring-[#008B94]"
                  />
                </div>
                {pinError && (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
                    <BadgeAlert className="w-3.5 h-3.5" />
                    <span>{pinError}</span>
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="py-2.5 px-4 rounded-[12px] bg-neutral-100 dark:bg-neutral-800 text-[#1C1C1E] dark:text-white text-[12px] font-semibold"
                >
                  Kembali
                </button>
                <button
                  type="submit"
                  disabled={isPinVerifying}
                  className="flex-1 py-2.5 rounded-[12px] bg-[#008B94] hover:bg-[#00767E] text-white text-[13px] font-bold flex items-center justify-center gap-2 shadow-sm"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Sahkan & Serahkan Shift Kasir</span>
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: BERITA ACARA SERAH TERIMA SHIFT & PRINTABLE RECEIPT */}
          {step === 4 && completedHandover && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-4 rounded-[16px] bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                  <h4 className="text-[14px] font-bold text-emerald-900 dark:text-emerald-200">
                    Serah Terima Shift Berhasil Disahkan!
                  </h4>
                  <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80">
                    Shift {completedHandover.previousShift.shiftNumber} telah ditutup permanen. Shift {completedHandover.nextShift.shiftNumber} atas nama {completedHandover.nextShift.cashierName} kini telah aktif di terminal.
                  </p>
                </div>
              </div>

              {/* Printable Slip Container */}
              <div
                id="handover-slip-print"
                className="p-5 rounded-[16px] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-[#1C1C1E] dark:text-white font-mono text-[11px] space-y-3 shadow-inner"
              >
                <div className="text-center pb-3 border-b border-dashed border-neutral-300 dark:border-neutral-700">
                  <h3 className="font-bold text-[13px]">{APOTEK_KERSO_WARAS_INFO.name}</h3>
                  <p className="text-[9px] text-[#8E8E93]">{APOTEK_KERSO_WARAS_INFO.address}</p>
                  <p className="text-[9px] text-[#8E8E93]">Telp/WA: {APOTEK_KERSO_WARAS_INFO.phone}</p>
                  <div className="mt-1 font-bold text-[12px] tracking-wider uppercase border-t border-b border-black dark:border-white py-0.5 inline-block px-2">
                    BERITA ACARA SERAH TERIMA SHIFT
                  </div>
                </div>

                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span>No. Dokumen:</span>
                    <span>{completedHandover.handoverLog.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Waktu Serah Terima:</span>
                    <span>{new Date(completedHandover.handoverLog.handoverTime).toLocaleString("id-ID")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Terminal Kasir:</span>
                    <span>{completedHandover.previousShift.terminalId}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-dashed border-neutral-300 dark:border-neutral-700 space-y-1">
                  <div className="flex justify-between">
                    <span>Kasir Menyerahkan:</span>
                    <span className="font-bold">{completedHandover.handoverLog.previousCashierName} (Shift {completedHandover.previousShift.shiftNumber})</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Kasir Menerima:</span>
                    <span className="font-bold">{completedHandover.handoverLog.nextCashierName} (Shift {completedHandover.nextShift.shiftNumber})</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-dashed border-neutral-300 dark:border-neutral-700 space-y-1">
                  <div className="flex justify-between">
                    <span>Total Uang Fisik Laci:</span>
                    <span className="font-bold">{formatRupiah(completedHandover.handoverLog.physicalCashCounted)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Modal Diserahkan (Float):</span>
                    <span className="font-bold text-[#008B94]">{formatRupiah(completedHandover.handoverLog.openingCashForNextShift)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Setoran ke Brankas:</span>
                    <span className="font-bold text-purple-600">{formatRupiah(completedHandover.handoverLog.cashDroppedToVault)}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-neutral-200 dark:border-neutral-800">
                    <span>Status Rekonsiliasi:</span>
                    <span className="font-bold">
                      {(completedHandover.previousShift.cashDifference || 0) === 0
                        ? "KLOP (Rp 0)"
                        : (completedHandover.previousShift.cashDifference || 0) > 0
                        ? `LEBIH +${formatRupiah(completedHandover.previousShift.cashDifference || 0)}`
                        : `KURANG ${formatRupiah(completedHandover.previousShift.cashDifference || 0)}`}
                    </span>
                  </div>
                </div>

                {completedHandover.handoverLog.handoverNote && (
                  <div className="pt-2 border-t border-dashed border-neutral-300 dark:border-neutral-700 text-[10px] italic">
                    Catatan: &ldquo;{completedHandover.handoverLog.handoverNote}&rdquo;
                  </div>
                )}

                {/* Dual Signatures */}
                <div className="pt-4 grid grid-cols-2 text-center text-[10px] gap-4">
                  <div>
                    <p className="text-[#8E8E93]">Kasir Menyerahkan,</p>
                    <div className="h-10 border-b border-neutral-400 mt-2 mx-4" />
                    <p className="font-bold mt-1">{completedHandover.handoverLog.previousCashierName}</p>
                  </div>
                  <div>
                    <p className="text-[#8E8E93]">Kasir Menerima,</p>
                    <div className="h-10 border-b border-neutral-400 mt-2 mx-4" />
                    <p className="font-bold mt-1">{completedHandover.handoverLog.nextCashierName}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handlePrintSlip}
                  className="flex-1 py-2.5 rounded-[12px] bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-[#1C1C1E] dark:text-white text-[12px] font-bold flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4 text-[#008B94]" />
                  <span>Cetak Berita Acara (Slip 80mm)</span>
                </button>
                <button
                  type="button"
                  onClick={handleFinishAll}
                  className="flex-1 py-2.5 rounded-[12px] bg-[#008B94] hover:bg-[#00767E] text-white text-[13px] font-bold flex items-center justify-center gap-2 shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Selesai & Masuk Kasir</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
