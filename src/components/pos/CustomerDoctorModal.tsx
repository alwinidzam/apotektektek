"use client";

import { useState } from "react";
import { X, User, Stethoscope, Check, AlertCircle } from "lucide-react";
import { useApotekStore } from "@/lib/store";
import { SAMPLE_DOCTORS, SAMPLE_PATIENTS } from "@/lib/mock-data";

interface CustomerDoctorModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "PATIENT" | "DOCTOR";
}

export function CustomerDoctorModal({
  isOpen,
  onClose,
  defaultTab = "PATIENT",
}: CustomerDoctorModalProps) {
  const [activeTab, setActiveTab] = useState<"PATIENT" | "DOCTOR">(defaultTab);
  const { selectedPatient, selectedDoctor, setSelectedPatient, setSelectedDoctor } =
    useApotekStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        {/* Header Tabs */}
        <div className="flex items-center justify-between px-6 pt-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab("PATIENT")}
              className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === "PATIENT"
                  ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <User className="h-4 w-4" />
              <span>Data Pasien / Rekam Medis (F4)</span>
            </button>
            <button
              onClick={() => setActiveTab("DOCTOR")}
              className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === "DOCTOR"
                  ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Stethoscope className="h-4 w-4" />
              <span>Dokter Penulis Resep (F5)</span>
            </button>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 -mt-2"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-2">
          {activeTab === "PATIENT" ? (
            <>
              {/* Option to clear patient / general customer */}
              <div
                onClick={() => {
                  setSelectedPatient(null);
                  onClose();
                }}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                  selectedPatient === null
                    ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40"
                    : "border-slate-200 dark:border-slate-800 hover:bg-slate-50"
                }`}
              >
                <div>
                  <span className="font-bold text-sm text-slate-800 dark:text-slate-200 block">
                    Pelanggan Umum / Anonim
                  </span>
                  <span className="text-xs text-slate-500">
                    Tanpa rekam alergi & tanpa pengiriman rekam medis ke SatuSehat IHS
                  </span>
                </div>
                {selectedPatient === null && <Check className="h-5 w-5 text-emerald-600" />}
              </div>

              {SAMPLE_PATIENTS.map((pat) => {
                const isSelected = selectedPatient?.id === pat.id;
                return (
                  <div
                    key={pat.id}
                    onClick={() => {
                      setSelectedPatient(pat);
                      onClose();
                    }}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40"
                        : "border-slate-200 dark:border-slate-800 hover:bg-slate-50"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {pat.fullName}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600">
                          NIK: {pat.nik}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                          IHS: {pat.ihsNumber}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Tgl Lahir: {pat.dateOfBirth} • {pat.gender} • Telp: {pat.phone}
                      </p>

                      {/* Allergies indicator */}
                      {pat.allergies.length > 0 && (
                        <div className="flex items-center gap-1 text-[11px] text-red-600 font-semibold mt-1">
                          <AlertCircle className="h-3 w-3" />
                          <span>Riwayat Alergi: {pat.allergies.join(", ")}</span>
                        </div>
                      )}
                    </div>
                    {isSelected && <Check className="h-5 w-5 text-emerald-600" />}
                  </div>
                );
              })}
            </>
          ) : (
            <>
              {/* Option to clear doctor */}
              <div
                onClick={() => {
                  setSelectedDoctor(null);
                  onClose();
                }}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                  selectedDoctor === null
                    ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40"
                    : "border-slate-200 dark:border-slate-800 hover:bg-slate-50"
                }`}
              >
                <div>
                  <span className="font-bold text-sm text-slate-800 dark:text-slate-200 block">
                    Tanpa Resep Dokter (Obat Bebas / OTC)
                  </span>
                  <span className="text-xs text-slate-500">Penjualan langsung swamedikasi</span>
                </div>
                {selectedDoctor === null && <Check className="h-5 w-5 text-emerald-600" />}
              </div>

              {SAMPLE_DOCTORS.map((doc) => {
                const isSelected = selectedDoctor?.id === doc.id;
                return (
                  <div
                    key={doc.id}
                    onClick={() => {
                      setSelectedDoctor(doc);
                      onClose();
                    }}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40"
                        : "border-slate-200 dark:border-slate-800 hover:bg-slate-50"
                    }`}
                  >
                    <div>
                      <span className="font-bold text-sm text-slate-900 dark:text-white block">
                        {doc.name}
                      </span>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {doc.specialization} • SIP: {doc.sipNumber}
                      </p>
                    </div>
                    {isSelected && <Check className="h-5 w-5 text-emerald-600" />}
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 hover:bg-slate-100"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
