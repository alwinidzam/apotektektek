"use client";

import { useState } from "react";
import {
  Users,
  Calendar,
  AlertCircle,
  MessageSquare,
  Clock,
  Send,
  CheckCircle2,
  Phone,
  FileHeart,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { SAMPLE_PATIENTS } from "@/lib/mock-data";
import { showAppleToast } from "@/components/ui/AppleToast";

export default function CRMPage() {
  const [patients, setPatients] = useState(SAMPLE_PATIENTS);
  const [selectedPatientId, setSelectedPatientId] = useState(SAMPLE_PATIENTS[0].id);

  const activePatient = patients.find((p) => p.id === selectedPatientId) || patients[0];

  const handleSendWaReminder = (patientName: string, medicineName: string) => {
    showAppleToast({
      type: "success",
      title: "Pengingat WhatsApp Terkirim",
      message: `Pesan pengingat refill ${medicineName} berhasil disimulasikan terkirim ke WhatsApp ${patientName}.`,
    });
  };

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#F5F5F7] dark:bg-[#000000] text-[#1C1C1E] dark:text-[#F5F5F7] flex flex-col">
      <Navbar />

      <main className="flex-1 w-full max-w-full min-w-0 mx-auto p-3 sm:p-5 lg:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-[#1C1C1E] dark:text-white tracking-tight flex items-center gap-2">
              <Users className="h-5 sm:h-6 w-5 sm:w-6 text-[#008B94] shrink-0" />
              <span>Rekam Medis Pasien (PMR)</span>
            </h1>
            <p className="text-[12px] text-[#8E8E93] mt-0.5">
              Riwayat alergi, pemantauan medikasi, dan pengingat jadwal refill obat kronis (PRB).
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Patient Directory (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Daftar Pasien Terdaftar
            </span>

            {patients.map((pat) => {
              const isSelected = pat.id === activePatient.id;
              return (
                <div
                  key={pat.id}
                  onClick={() => setSelectedPatientId(pat.id)}
                  className={`p-4 rounded-3xl border cursor-pointer transition-all ${
                    isSelected
                      ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 shadow-sm"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {pat.fullName}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600">
                      IHS: {pat.ihsNumber || "Non-IHS"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {pat.gender} • NIK: {pat.nik}
                  </p>
                  {pat.chronicDisease && (
                    <span className="inline-block mt-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      Pasien Kronis: {pat.chronicDisease}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* PMR Detail & PRB Refill Timeline (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Patient Header Card */}
            <div className="glass-panel p-6 rounded-3xl space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">
                    {activePatient.fullName}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Tanggal Lahir: {activePatient.dateOfBirth} • Kontak: {activePatient.phone}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2.5 py-1 min-h-[30px] rounded-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 dark:border-emerald-800 dark:bg-emerald-950/40 text-[11px] font-semibold shrink-0 whitespace-nowrap">
                    SATUSEHAT Aktif
                  </span>
                </div>
              </div>

              {/* Allergy Banner */}
              {activePatient.allergies.length > 0 ? (
                <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-900 dark:text-red-200 flex items-center gap-2.5 text-xs font-medium">
                  <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                  <span>
                    Riwayat Alergi Terdaftar:{" "}
                    <strong className="underline">{activePatient.allergies.join(", ")}</strong>.
                    Sistem kasir otomatis memblokir peresepan obat berkontraindikasi.
                  </span>
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-slate-500 text-xs">
                  Tidak ada catatan riwayat alergi obat.
                </div>
              )}
            </div>

            {/* Chronic Disease PRB Refill Schedule */}
            {activePatient.chronicDisease && (
              <div className="glass-panel p-6 rounded-3xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-emerald-600" />
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white">
                      Jadwal Refill Obat Rutin (Program Rujuk Balik / PRB)
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">Periode 30 Hari</span>
                </div>

                <div className="p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <span className="font-bold text-sm text-slate-900 dark:text-white block">
                      Amlodipine 10 mg (1x1 tablet malam)
                    </span>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Penebusan Terakhir: 10 September 2026 (30 tablet) • Estimasi Habis:{" "}
                      <strong className="text-red-600 font-mono">10 Oktober 2026 (3 Hari Lagi)</strong>
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      handleSendWaReminder(activePatient.fullName, "Amlodipine 10 mg")
                    }
                    className="px-3.5 py-2 min-h-[40px] rounded-[12px] bg-[#008B94] hover:bg-[#00767E] active:scale-[0.98] text-white font-semibold text-[12px] flex items-center gap-1.5 shadow-sm transition-all shrink-0 whitespace-nowrap"
                  >
                    <MessageSquare className="h-4 w-4 shrink-0" />
                    <span>Kirim WA</span>
                  </button>
                </div>
              </div>
            )}

            {/* Lifetime Medication Timeline */}
            <div className="glass-panel p-6 rounded-3xl space-y-3">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                Riwayat Medikasi Pasien (PMR Timeline)
              </h3>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">
                      Amlodipine 10 mg (30 tablet)
                    </span>
                    <span className="text-[11px] text-slate-400">
                      RXP-881290 • dr. Hendra Wijaya, Sp.PD • 10 Sep 2026
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Selesai Ditebus
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">
                      Paracetamol 500 mg (10 tablet)
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Swamedikasi Langsung • 15 Agustus 2026
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                    OTC Bebas
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
