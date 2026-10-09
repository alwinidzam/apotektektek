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
  Lock,
  Calculator,
  ArrowRight,
  Coins,
  Banknote,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  UserCheck,
  FileText,
  BadgeAlert,
} from "lucide-react";
import {
  CashierShift,
  RupiahDenominationCount,
  DiscrepancyReasonCategory,
  DiscrepancySettlementAction,
  ReconciliationSupervisorAuth,
} from "@/lib/types";
import { DenominationCounter } from "../shifts/DenominationCounter";
import { ShiftReportModal } from "../shifts/ShiftReportModal";

interface ShiftCloseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShiftCloseModal: React.FC<ShiftCloseModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { currentShift, closeShift, users, verifySupervisorPin } = useApotekStore();
  const [actualCashInput, setActualCashInput] = useState<number>(0);
  const [closingNote, setClosingNote] = useState("");
  const [isReconciled, setIsReconciled] = useState(false);
  const [closedResult, setClosedResult] = useState<CashierShift | null>(null);
  const [countMethod, setCountMethod] = useState<"DIRECT" | "DENOMINATION">("DIRECT");
  const [denominationResult, setDenominationResult] = useState<RupiahDenominationCount | undefined>(undefined);
  const [isZReportOpen, setIsZReportOpen] = useState(false);

  // Supervisor Login / Authorization State for Discrepancy Reconciliation
  const supervisors = useMemo(() => {
    return users.filter(
      (u) =>
        u.role === "OWNER" ||
        u.role === "SUPER_ADMIN" ||
        u.role === "KARYAWAN_APOTEKER"
    );
  }, [users]);

  const [selectedSupervisorId, setSelectedSupervisorId] = useState<string>(
    supervisors[0]?.id || "usr-apj"
  );
  const [supervisorPin, setSupervisorPin] = useState("");
  const [isSupervisorAuthorized, setIsSupervisorAuthorized] = useState(false);
  const [authorizedSupervisorData, setAuthorizedSupervisorData] =
    useState<ReconciliationSupervisorAuth | null>(null);
  const [supervisorError, setSupervisorError] = useState("");

  const [discrepancyCategory, setDiscrepancyCategory] =
    useState<DiscrepancyReasonCategory>("COIN_ROUNDING");
  const [discrepancyReasonText, setDiscrepancyReasonText] = useState("");
  const [settlementAction, setSettlementAction] =
    useState<DiscrepancySettlementAction>("PHARMACY_ABSORBED");

  if (!isOpen || !currentShift) return null;

  const expectedCash =
    currentShift.openingCash +
    currentShift.cashSalesTotal +
    currentShift.cashInTotal -
    currentShift.cashOutTotal -
    currentShift.refundTotal;

  const difference = actualCashInput - expectedCash;
  const hasDiscrepancy = difference !== 0;

  const handleVerify = (e: React.FormEvent) => {
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
    setIsReconciled(true);

    // Reset supervisor auth state
    setIsSupervisorAuthorized(false);
    setAuthorizedSupervisorData(null);
    setSupervisorPin("");
    setSupervisorError("");

    if (hasDiscrepancy) {
      // Suggest default discrepancy category
      if (Math.abs(difference) <= 2000) {
        setDiscrepancyCategory("COIN_ROUNDING");
        setDiscrepancyReasonText("Selisih pembulatan uang receh/koin struk kasir");
        setSettlementAction("PHARMACY_ABSORBED");
      } else {
        setDiscrepancyCategory("WRONG_CHANGE");
        setDiscrepancyReasonText("Investigasi salah hitung kembalian pasien tunai");
        setSettlementAction("CASHIER_LIABILITY");
      }
    }
  };

  const handleSupervisorLoginAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setSupervisorError("");

    if (!supervisorPin.trim()) {
      setSupervisorError("Masukkan PIN otorisasi supervisor (default: 1234)");
      soundEngine.playError();
      return;
    }

    const verification = verifySupervisorPin(selectedSupervisorId, supervisorPin);
    if (!verification.success || !verification.user) {
      setSupervisorError(verification.message || "PIN otorisasi supervisor salah!");
      return;
    }

    const authData: ReconciliationSupervisorAuth = {
      isAuthorized: true,
      supervisorId: verification.user.id,
      supervisorName: verification.user.name,
      supervisorRole: verification.user.role,
      authMethod: "SUPERVISOR_PIN",
      authorizedAt: new Date().toISOString(),
      approvalNote: `Disahkan oleh ${verification.user.name} (${verification.user.role}). Kategori: ${discrepancyCategory}. Tindakan: ${settlementAction}. Catatan: ${discrepancyReasonText}`,
    };

    setIsSupervisorAuthorized(true);
    setAuthorizedSupervisorData(authData);
    soundEngine.playCheckoutChime();
  };

  const handleFinalize = () => {
    soundEngine.playKeyTap();
    const result = closeShift(
      actualCashInput,
      closingNote,
      denominationResult,
      hasDiscrepancy
        ? {
            category: discrepancyCategory,
            reasonText: discrepancyReasonText,
            supervisorAuth: authorizedSupervisorData || undefined,
            settlementAction: settlementAction,
          }
        : {
            category: "NONE_EXACT_MATCH",
            reasonText: "Uang fisik tepat 100% klop dengan sistem",
            settlementAction: "APPROVED_BY_OWNER",
          }
    );
    setClosedResult(result);
  };

  const handleDenominationChange = (result: RupiahDenominationCount) => {
    setDenominationResult(result);
    setActualCashInput(result.grandTotal);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-in fade-in duration-150">
        <div className="w-full max-w-xl bg-white dark:bg-[#1C1C1E] rounded-[24px] shadow-[0_25px_60px_rgba(0,0,0,0.3)] border border-black/[0.08] dark:border-white/[0.12] overflow-hidden max-h-[92vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 shrink-0 bg-neutral-50/50 dark:bg-neutral-900/50">
            <div>
              <h2 className="text-[17px] font-bold text-[#1C1C1E] dark:text-white tracking-tight flex items-center gap-2">
                <Lock className="w-4 h-4 text-rose-600" />
                <span>Tutup Shift & Rekonsiliasi Kas Laci</span>
              </h2>
              <p className="text-[12px] text-[#8E8E93]">
                Shift {currentShift.shiftNumber} &bull; {currentShift.cashierName} ({currentShift.terminalId})
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-[#8E8E93] hover:text-[#1C1C1E] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 space-y-4 overflow-y-auto flex-1">
            {!isReconciled ? (
              /* STEP 1: BLIND COUNT INPUT */
              <form onSubmit={handleVerify} className="space-y-4">
                <div className="p-3.5 bg-amber-50 dark:bg-amber-950/25 border border-amber-300/70 dark:border-amber-800/50 rounded-[14px] text-[12px] text-amber-900 dark:text-amber-200">
                  <div className="flex items-center gap-2 font-bold mb-1">
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    <span>SOP Anti-Fraud Kasir (Blind Cash Count):</span>
                  </div>
                  Sistem menyembunyikan ekspektasi saldo laci. Kasir wajib menghitung seluruh uang fisik nyata di laci (uang kertas dan koin receh) tanpa mengetahui target sistem.
                </div>

                {/* Count Method Switcher */}
                <div className="grid grid-cols-2 gap-1 p-1 bg-[#F5F5F7] dark:bg-[#2C2C2E] rounded-[12px]">
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playKeyTap();
                      setCountMethod("DIRECT");
                    }}
                    className={`py-2 rounded-[9px] text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      countMethod === "DIRECT"
                        ? "bg-white dark:bg-[#3A3A3C] text-[#1C1C1E] dark:text-white shadow-sm"
                        : "text-[#636366]"
                    }`}
                  >
                    <Calculator className="w-3.5 h-3.5" />
                    <span>Ketik Total Nominal</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playKeyTap();
                      setCountMethod("DENOMINATION");
                    }}
                    className={`py-2 rounded-[9px] text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      countMethod === "DENOMINATION"
                        ? "bg-white dark:bg-[#3A3A3C] text-[#1C1C1E] dark:text-white shadow-sm"
                        : "text-[#636366]"
                    }`}
                  >
                    <Coins className="w-3.5 h-3.5 text-amber-600" />
                    <span>Hitung Per Pecahan Rupiah</span>
                  </button>
                </div>

                {countMethod === "DIRECT" ? (
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#8E8E93] mb-1">
                      Total Uang Kas Fisik di Laci *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-[15px] font-semibold text-[#8E8E93]">Rp</span>
                      <input
                        type="number"
                        required
                        min="0"
                        autoFocus
                        value={actualCashInput || ""}
                        onChange={(e) => setActualCashInput(Number(e.target.value))}
                        placeholder="0"
                        className="w-full text-[20px] font-black text-[#1C1C1E] dark:text-white pl-11 pr-3 py-2.5 rounded-[14px] bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-black/[0.06] dark:border-white/[0.08] focus:border-[#008B94] outline-none tabular-nums shadow-inner"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-[16px] bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-black/[0.04]">
                    <DenominationCounter onChange={handleDenominationChange} />
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#8E8E93] mb-1">
                    Catatan Serah Terima Kasir (Opsional)
                  </label>
                  <input
                    type="text"
                    value={closingNote}
                    onChange={(e) => setClosingNote(e.target.value)}
                    placeholder="cth: Kas diserahkan ke Shift Siang / disimpan di brankas"
                    className="w-full text-[13px] px-3.5 py-2.5 rounded-[12px] bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-black/[0.06] dark:border-white/[0.08] focus:border-[#008B94] outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-[13px] font-medium text-[#636366] hover:text-[#1C1C1E]"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 text-[13px] font-bold rounded-[12px] bg-[#008B94] text-white hover:bg-[#00767E] transition-all shadow-md shadow-[#008B94]/20 flex items-center gap-1.5"
                  >
                    <Calculator className="w-4 h-4" />
                    <span>Bandingkan & Buka Rekonsiliasi &rarr;</span>
                  </button>
                </div>
              </form>
            ) : !closedResult ? (
              /* STEP 2: RECONCILIATION RESULT & SUPERVISOR LOGIN GATE */
              <div className="space-y-4 animate-in fade-in duration-100">
                {/* System vs Physical Cash Breakdown */}
                <div className="bg-[#F5F5F7] dark:bg-[#2C2C2E] p-4 rounded-[16px] space-y-2 text-[13px] border border-black/[0.04]">
                  <div className="flex justify-between text-[#8E8E93]">
                    <span>Modal Awal Kasir:</span>
                    <span className="font-semibold text-[#1C1C1E] dark:text-white tabular-nums">
                      {formatRupiah(currentShift.openingCash)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#8E8E93]">
                    <span>Penjualan Tunai ({currentShift.totalTransactionsCount} struk):</span>
                    <span className="font-semibold text-emerald-600 tabular-nums">
                      +{formatRupiah(currentShift.cashSalesTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#8E8E93]">
                    <span>Kas Masuk / Topup:</span>
                    <span className="font-semibold text-teal-600 tabular-nums">
                      +{formatRupiah(currentShift.cashInTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#8E8E93]">
                    <span>Kas Keluar Operasional (Petty Cash):</span>
                    <span className="font-semibold text-rose-600 tabular-nums">
                      -{formatRupiah(currentShift.cashOutTotal)}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-black/[0.08] dark:border-white/[0.08] flex justify-between font-bold text-[14px]">
                    <span>Ekspektasi Saldo Sistem:</span>
                    <span className="tabular-nums font-mono">{formatRupiah(expectedCash)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-[14px] text-blue-600 dark:text-blue-400">
                    <span>Fisik Uang Anda Hitung:</span>
                    <span className="tabular-nums font-mono">{formatRupiah(actualCashInput)}</span>
                  </div>
                </div>

                {/* Variance Diagnosis Pill */}
                <div
                  className={`p-4 rounded-[16px] border flex items-center justify-between ${
                    difference === 0
                      ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                      : difference > 0
                      ? "bg-blue-50 dark:bg-blue-950/20 border-blue-300 dark:border-blue-800 text-blue-800 dark:text-blue-300"
                      : "bg-rose-50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {difference === 0 ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-rose-600" />
                    )}
                    <div>
                      <p className="text-[13px] font-black">
                        {difference === 0
                          ? "KAS KLOP (Rp 0)"
                          : difference > 0
                          ? "SURPLUS / KAS LEBIH"
                          : "MINUS / KAS KURANG"}
                      </p>
                      <p className="text-[11px] opacity-80">
                        {difference === 0
                          ? "Pencatatan kas fisik dan sistem presisi 100%"
                          : difference > 0
                          ? `Uang fisik lebih Rp ${formatRupiah(difference)} dari ekspektasi sistem`
                          : `Uang fisik kurang Rp ${formatRupiah(Math.abs(difference))} dari ekspektasi`}
                      </p>
                    </div>
                  </div>
                  <div className="text-[17px] font-black tabular-nums font-mono">
                    {difference > 0 ? `+${formatRupiah(difference)}` : formatRupiah(difference)}
                  </div>
                </div>

                {/* SUPERVISOR LOGIN & APPROVAL GATE WHEN DISCREPANCY DETECTED */}
                {hasDiscrepancy && (
                  <div className="p-4 rounded-[18px] bg-rose-50/60 dark:bg-rose-950/20 border-2 border-rose-300 dark:border-rose-900/60 space-y-3">
                    <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300">
                      <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
                      <div>
                        <h4 className="text-[13px] font-bold">
                          Otorisasi Login Supervisor / APJ Wajib
                        </h4>
                        <p className="text-[11px] text-rose-700/80 dark:text-rose-300/80">
                          SOP Apotek Kerso Waras: Setiap selisih kas fisik dan sistem wajib diautentikasi dan disahkan oleh Supervisor / APJ / Pemilik sebelum shift ditutup.
                        </p>
                      </div>
                    </div>

                    {!isSupervisorAuthorized ? (
                      <form onSubmit={handleSupervisorLoginAuth} className="space-y-3 pt-1">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {/* Supervisor Account Select */}
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">
                              Akun Supervisor / APJ
                            </label>
                            <select
                              value={selectedSupervisorId}
                              onChange={(e) => setSelectedSupervisorId(e.target.value)}
                              className="w-full text-[12px] px-3 py-2 rounded-[10px] bg-white dark:bg-[#2C2C2E] border border-neutral-300 dark:border-neutral-700 font-semibold outline-none focus:border-rose-500"
                            >
                              {supervisors.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.name} ({s.role === "OWNER" ? "Owner / PSA" : s.role === "KARYAWAN_APOTEKER" ? "Apoteker (APJ)" : "Super Admin"})
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Supervisor PIN Input */}
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1 flex items-center justify-between">
                              <span>PIN Otorisasi *</span>
                              <span className="text-[9px] text-[#008B94] font-mono lowercase">(default: 1234)</span>
                            </label>
                            <div className="relative">
                              <span className="absolute left-2.5 top-2 text-neutral-400">
                                <KeyRound className="w-3.5 h-3.5" />
                              </span>
                              <input
                                type="password"
                                required
                                value={supervisorPin}
                                onChange={(e) => setSupervisorPin(e.target.value)}
                                placeholder="PIN 4 digit"
                                className="w-full text-[13px] font-mono tracking-widest pl-8 pr-3 py-1.5 rounded-[10px] bg-white dark:bg-[#2C2C2E] border border-neutral-300 dark:border-neutral-700 outline-none focus:border-rose-500"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Discrepancy Reason Category & Settlement Action */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">
                              Kategori Penyebab Selisih
                            </label>
                            <select
                              value={discrepancyCategory}
                              onChange={(e) => setDiscrepancyCategory(e.target.value as DiscrepancyReasonCategory)}
                              className="w-full text-[11px] px-3 py-2 rounded-[10px] bg-white dark:bg-[#2C2C2E] border border-neutral-300 dark:border-neutral-700 outline-none focus:border-rose-500 font-medium"
                            >
                              <option value="COIN_ROUNDING">🪙 Pembulatan Koin Receh (&le; Rp 2.000)</option>
                              <option value="WRONG_CHANGE">⚠️ Salah Hitung Kembalian Pasien</option>
                              <option value="OFFLINE_RECEIPT">🧾 Struk Penjualan Tertinggal / Manual</option>
                              <option value="PETTY_CASH_MISMATCH">📦 Selisih Bon / Nota Kas Kecil</option>
                              <option value="DAMAGED_OR_COUNTERFEIT">❌ Uang Rusak Sobek / Ditolak</option>
                              <option value="CASHIER_OVERPAY">✍️ Kesalahan Input Nominal Bayar</option>
                              <option value="OTHER">🔍 Lainnya / Investigasi Khusus</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">
                              Tindakan Penyelesaian
                            </label>
                            <select
                              value={settlementAction}
                              onChange={(e) => setSettlementAction(e.target.value as DiscrepancySettlementAction)}
                              className="w-full text-[11px] px-3 py-2 rounded-[10px] bg-white dark:bg-[#2C2C2E] border border-neutral-300 dark:border-neutral-700 outline-none focus:border-rose-500 font-medium"
                            >
                              <option value="PHARMACY_ABSORBED">🏥 Dibebankan ke Biaya Apotek (Toleransi)</option>
                              <option value="CASHIER_LIABILITY">👤 Tanggung Jawab Kasir (Ganti / Potong Gaji)</option>
                              <option value="PENDING_INVESTIGATION">⏳ Tahan untuk Investigasi CCTV & Struk</option>
                            </select>
                          </div>
                        </div>

                        {/* Discrepancy Statement Note */}
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">
                            Keterangan Berita Acara Selisih
                          </label>
                          <input
                            type="text"
                            required
                            value={discrepancyReasonText}
                            onChange={(e) => setDiscrepancyReasonText(e.target.value)}
                            placeholder="cth: Selisih Rp 500 pembulatan 2 transaksi tanpa koin receh. Disetujui APJ."
                            className="w-full text-[12px] px-3 py-2 rounded-[10px] bg-white dark:bg-[#2C2C2E] border border-neutral-300 dark:border-neutral-700 outline-none focus:border-rose-500"
                          />
                        </div>

                        {supervisorError && (
                          <div className="p-2 rounded-[8px] bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-200 text-[11px] font-semibold flex items-center gap-1.5 animate-shake">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>{supervisorError}</span>
                          </div>
                        )}

                        <button
                          type="submit"
                          className="w-full py-2.5 rounded-[10px] bg-rose-600 hover:bg-rose-700 text-white font-bold text-[12px] flex items-center justify-center gap-1.5 shadow-sm transition-all"
                        >
                          <UserCheck className="w-4 h-4" />
                          <span>Verifikasi PIN & Otorisasi Selisih Kasir</span>
                        </button>
                      </form>
                    ) : (
                      /* Authorized State Badge */
                      <div className="p-3 rounded-[12px] bg-emerald-100 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 space-y-1 animate-in zoom-in-95">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 font-bold text-[12px]">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Otorisasi Supervisor Berhasil (PIN Terverifikasi)</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setIsSupervisorAuthorized(false)}
                            className="text-[10px] text-emerald-700 underline font-semibold"
                          >
                            Ubah Otorisasi
                          </button>
                        </div>
                        <p className="text-[11px] opacity-90">
                          Disahkan oleh: <strong>{authorizedSupervisorData?.supervisorName}</strong> ({authorizedSupervisorData?.supervisorRole})
                        </p>
                        <p className="text-[10px] opacity-80 italic">
                          Tindakan: {settlementAction} &bull; Catatan: {discrepancyReasonText}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Modal Action Buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800">
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playKeyTap();
                      setIsReconciled(false);
                    }}
                    className="px-4 py-2 text-[13px] font-medium text-[#636366] hover:text-[#1C1C1E]"
                  >
                    Hitung Ulang
                  </button>

                  <button
                    type="button"
                    onClick={handleFinalize}
                    disabled={hasDiscrepancy && !isSupervisorAuthorized}
                    className={`px-5 py-2.5 text-[13px] font-bold rounded-[12px] flex items-center gap-1.5 transition-all shadow-sm ${
                      hasDiscrepancy && !isSupervisorAuthorized
                        ? "bg-neutral-300 dark:bg-neutral-800 text-neutral-500 cursor-not-allowed"
                        : "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/25"
                    }`}
                    title={
                      hasDiscrepancy && !isSupervisorAuthorized
                        ? "Wajib otorisasi login supervisor sebelum shift dapat ditutup"
                        : "Kunci dan simpan rekonsiliasi shift"
                    }
                  >
                    <Lock className="w-4 h-4" />
                    <span>Kunci & Tutup Shift Sekarang</span>
                  </button>
                </div>
              </div>
            ) : (
              /* STEP 3: Z-REPORT PRINTABLE SUCCESS */
              <div className="space-y-4 text-center py-2 animate-in fade-in">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-[17px] font-bold text-[#1C1C1E] dark:text-white">
                    Shift Berhasil Ditutup & Terkunci
                  </h3>
                  <p className="text-[12px] text-[#8E8E93] mt-0.5">
                    Laporan rekapitulasi shift (Z-Report) telah dibukukan ke log audit resmi Apotek Kerso Waras.
                  </p>
                </div>

                {/* Discrepancy Status Confirmation */}
                {closedResult.cashDifference !== 0 && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-300/60 rounded-[12px] text-[11px] text-amber-900 dark:text-amber-200 text-left">
                    <span className="font-bold block">Status Berita Acara Selisih:</span>
                    Selisih: {closedResult.cashDifference! > 0 ? `+${formatRupiah(closedResult.cashDifference!)} (Surplus)` : `${formatRupiah(closedResult.cashDifference!)} (Kurang)`}.
                    <br />
                    Telah diotorisasi oleh <strong>{closedResult.supervisorAuth?.supervisorName}</strong> (PIN Terverifikasi Digital).
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playKeyTap();
                    setIsZReportOpen(true);
                  }}
                  className="w-full py-3 rounded-[14px] bg-[#008B94] hover:bg-[#00767E] text-white text-[13px] font-bold flex items-center justify-center gap-2 shadow-md shadow-[#008B94]/20 transition-all"
                >
                  <Printer className="w-4 h-4" />
                  <span>Buka & Cetak Rekap Shift (Z-Report 80mm)</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2 text-[13px] font-semibold text-[#008B94] hover:underline"
                >
                  Selesai & Keluar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {isZReportOpen && closedResult && (
        <ShiftReportModal
          isOpen={isZReportOpen}
          onClose={() => setIsZReportOpen(false)}
          shift={closedResult}
          reportType="Z_REPORT"
        />
      )}
    </>
  );
};
