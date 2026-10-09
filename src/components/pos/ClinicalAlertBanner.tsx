"use client";

import { useState } from "react";
import { AlertOctagon, AlertTriangle, ShieldCheck, Lock } from "lucide-react";
import { useApotekStore } from "@/lib/store";
import { showAppleToast } from "@/components/ui/AppleToast";

export function ClinicalAlertBanner() {
  const { activeInteractionAlerts, activeAllergyAlerts } = useApotekStore();
  const [isApjUnlocked, setIsApjUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [showPinModal, setShowPinModal] = useState(false);

  if (activeInteractionAlerts.length === 0 && activeAllergyAlerts.length === 0) {
    return null;
  }

  const handleVerifyApjPin = () => {
    // PIN APJ simulasi: 1234
    if (pinInput === "1234") {
      setIsApjUnlocked(true);
      setShowPinModal(false);
      setPinInput("");
      showAppleToast({
        type: "success",
        title: "Otorisasi APJ Diterima",
        message: "Interaksi klinis telah disetujui oleh Apoteker Penanggung Jawab.",
      });
    } else {
      showAppleToast({
        type: "error",
        title: "PIN APJ Tidak Valid",
        message: "PIN Otorisasi APJ salah! Hubungi Apoteker Penanggung Jawab.",
      });
    }
  };

  const hasCritical = activeInteractionAlerts.some(
    (i) => i.severity === "CRITICAL_CONTRAINDICATION"
  );

  return (
    <div className="space-y-2 mb-4 animate-in fade-in slide-in-from-top-2 duration-200">
      {/* Allergy Alerts */}
      {activeAllergyAlerts.map((warning, idx) => (
        <div
          key={`allergy-${idx}`}
          className="flex items-start gap-3 p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/60 border border-red-300 dark:border-red-800 text-red-900 dark:text-red-200 shadow-sm"
        >
          <div className="h-8 w-8 rounded-xl bg-red-100 dark:bg-red-900 flex items-center justify-center text-red-600 shrink-0">
            <AlertOctagon className="h-5 w-5" />
          </div>
          <div className="flex-1 text-xs">
            <span className="font-bold text-sm block mb-0.5">PERINGATAN ALERGI PASIEN!</span>
            <p className="leading-relaxed">{warning}</p>
          </div>
        </div>
      ))}

      {/* Drug-Drug Interaction Alerts */}
      {activeInteractionAlerts.map((alert, idx) => {
        const isCritical = alert.severity === "CRITICAL_CONTRAINDICATION";
        return (
          <div
            key={`ddi-${idx}`}
            className={`flex items-start gap-3 p-3.5 rounded-2xl border shadow-sm ${
              isCritical
                ? "bg-red-50 dark:bg-red-950/60 border-red-300 dark:border-red-800 text-red-900 dark:text-red-200"
                : "bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200"
            }`}
          >
            <div
              className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${
                isCritical
                  ? "bg-red-100 dark:bg-red-900 text-red-600"
                  : "bg-amber-100 dark:bg-amber-900 text-amber-600"
              }`}
            >
              {isCritical ? <AlertOctagon className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
            </div>
            <div className="flex-1 text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-sm">
                  {isCritical ? "KONTRAINDIKASI FATAL (DDI)" : "INTERAKSI OBAT MODERAT (DDI)"}:{" "}
                  {alert.drugA} ↔ {alert.drugB}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/60 dark:bg-slate-900/60 border">
                  {alert.severity}
                </span>
              </div>
              <p className="leading-relaxed mb-1.5 font-medium">{alert.mechanism}</p>
              <div className="p-2 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/50 dark:border-slate-800 text-[11px]">
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                  Rekomendasi Klinis:
                </span>{" "}
                {alert.clinicalAction}
              </div>
            </div>

            {/* APJ Override button if critical */}
            {isCritical && !isApjUnlocked && (
              <button
                onClick={() => setShowPinModal(true)}
                className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs flex items-center gap-1.5 shrink-0 shadow-sm transition-all"
              >
                <Lock className="h-3.5 w-3.5" />
                <span>Otorisasi APJ</span>
              </button>
            )}

            {isCritical && isApjUnlocked && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-semibold text-xs shrink-0">
                <ShieldCheck className="h-3.5 w-3.5" /> Disetujui APJ
              </span>
            )}
          </div>
        );
      })}

      {/* APJ PIN Dialog */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl text-center">
            <div className="h-12 w-12 rounded-2xl bg-red-100 dark:bg-red-950 flex items-center justify-center text-red-600 mx-auto mb-3">
              <Lock className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Otorisasi PIN Apoteker (APJ)
            </h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Resep ini mengandung interaksi obat berkategori berbahaya. Masukkan PIN APJ untuk
              mengonfirmasi pertimbangan klinis. (PIN default: 1234)
            </p>
            <input
              type="password"
              maxLength={6}
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="••••"
              className="w-32 py-2.5 px-3 text-center text-xl font-mono tracking-widest rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowPinModal(false)}
                className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                onClick={handleVerifyApjPin}
                className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-sm"
              >
                Verifikasi APJ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
