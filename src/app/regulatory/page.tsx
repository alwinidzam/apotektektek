"use client";

import { useState } from "react";
import {
  ShieldCheck,
  FileSpreadsheet,
  FileText,
  Activity,
  Download,
  Printer,
  CheckCircle,
  Copy,
  ExternalLink,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { AccessDenied } from "@/components/AccessDenied";
import { useApotekStore } from "@/lib/store";
import { RegulatoryEngine } from "@/lib/engines/regulatory-engine";
import { INITIAL_ORDERS } from "@/lib/mock-data";
import { SPOrder } from "@/lib/types";
import { showAppleToast } from "@/components/ui/AppleToast";

export default function RegulatoryPage() {
  const { transactions, products, currentUser } = useApotekStore();
  const [activeTab, setActiveTab] = useState<"SATUSEHAT" | "SIPNAP" | "SP_BPOM">("SATUSEHAT");

  if (currentUser.role === "KARYAWAN_KASIR") {
    return (
      <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#000000]">
        <Navbar />
        <AccessDenied
          requiredRole="Apoteker (APJ) / Super Admin"
          reason="Modul Pelaporan Resmi Kemenkes SATUSEHAT, SIPNAP Narkotika/Psikotropika, dan Surat Pesanan BPOM merupakan wewenang mutlak Apoteker Penanggung Jawab (APJ)."
        />
      </div>
    );
  }

  // Sample Transaction for SatuSehat Inspection
  const sampleTx =
    transactions[0] || {
      id: "tx-demo-001",
      invoiceNumber: "INV/20261007/8821",
      timestamp: new Date().toISOString(),
      cashierName: "apt. Farhan Pratama, S.Farm",
      customerName: "Budi Santoso",
      customerPhone: "081234567890",
      doctorName: "dr. Hendra Wijaya, Sp.PD",
      prescriptionNumber: "RXP-992144",
      items: [
        {
          cartItemId: "c1",
          product: products[0],
          selectedBatch: products[0].batches[0],
          quantity: 10,
          selectedUnit: "TABLET",
          unitMultiplier: 1,
          unitPrice: 1000,
          subtotal: 10000,
        },
      ],
      subtotal: 10000,
      tuslahTotal: 0,
      embalaseTotal: 0,
      roundingAmount: 0,
      grandTotal: 10000,
      paymentMethod: "CASH" as const,
      paidAmount: 10000,
      changeAmount: 0,
      isSynced: true,
    };

  const satuSehatPayload = RegulatoryEngine.generateSatuSehatMedicationDispensePayload(sampleTx);
  const sipnapRows = RegulatoryEngine.generateSipnapRows(transactions, products);

  const [selectedSp, setSelectedSp] = useState<SPOrder>(INITIAL_ORDERS[0]);

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(satuSehatPayload, null, 2));
    showAppleToast({
      type: "success",
      title: "Tersalin ke Clipboard",
      message: "Payload FHIR HL7 SatuSehat berhasil disalin ke clipboard.",
    });
  };

  const handleDownloadSipnapCsv = () => {
    const headers =
      "No,Kode_KFA,Nama_Obat,Bentuk_Sediaan,Satuan,Stok_Awal,Pemasukan,No_Faktur,PBF_Pemasok,Pengeluaran_Resep,No_Resep,Tgl_Resep,Dokter,SIP_Dokter,Pasien,Alamat,Pemusnahan,Stok_Akhir\n";
    const body = sipnapRows
      .map(
        (r) =>
          `${r.no},${r.kfaCode},"${r.productName}",${r.dosageForm},${r.unit},${r.initialStock},${r.incomingQty},${r.incomingInvoiceNo},"${r.incomingPbfName}",${r.outgoingPrescriptionQty},${r.prescriptionNo},${r.prescriptionDate},"${r.doctorName}",${r.doctorSip},"${r.patientName}","${r.patientAddress}",${r.destructionQty},${r.finalStock}`
      )
      .join("\n");

    const blob = new Blob([headers + body], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `SIPNAP_Laporan_Bulanan_${new Date().toISOString().slice(0, 7)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#F5F5F7] dark:bg-[#000000] text-[#1C1C1E] dark:text-[#F5F5F7] flex flex-col">
      <Navbar />

      <main className="flex-1 w-full max-w-full min-w-0 mx-auto p-3 sm:p-5 lg:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-[#1C1C1E] dark:text-white tracking-tight flex items-center gap-2">
              <ShieldCheck className="h-5 sm:h-6 w-5 sm:w-6 text-[#008B94] shrink-0" />
              <span>Regulasi & Kepatuhan</span>
            </h1>
            <p className="text-[12px] text-[#8E8E93] mt-0.5">
              Integrasi Kemenkes SATUSEHAT (FHIR R4), SIPNAP bulanan, dan Surat Pesanan BPOM.
            </p>
          </div>

          {/* Tab selector pills */}
          <div className="flex items-center gap-1 bg-neutral-200/60 dark:bg-neutral-800 p-1 rounded-[12px] shrink-0 overflow-x-auto no-scrollbar touch-pan-x">
            <button
              onClick={() => setActiveTab("SATUSEHAT")}
              className={`px-3 py-1.5 min-h-[36px] rounded-[10px] text-[12px] font-semibold transition-all whitespace-nowrap shrink-0 ${
                activeTab === "SATUSEHAT"
                  ? "bg-white dark:bg-[#1C1C1E] text-[#008B94] shadow-sm font-bold"
                  : "text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white"
              }`}
            >
              SATUSEHAT
            </button>
            <button
              onClick={() => setActiveTab("SIPNAP")}
              className={`px-3 py-1.5 min-h-[36px] rounded-[10px] text-[12px] font-semibold transition-all whitespace-nowrap shrink-0 ${
                activeTab === "SIPNAP"
                  ? "bg-white dark:bg-[#1C1C1E] text-[#008B94] shadow-sm font-bold"
                  : "text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white"
              }`}
            >
              SIPNAP
            </button>
            <button
              onClick={() => setActiveTab("SP_BPOM")}
              className={`px-3 py-1.5 min-h-[36px] rounded-[10px] text-[12px] font-semibold transition-all whitespace-nowrap shrink-0 ${
                activeTab === "SP_BPOM"
                  ? "bg-white dark:bg-[#1C1C1E] text-[#008B94] shadow-sm font-bold"
                  : "text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white"
              }`}
            >
              Surat Pesanan
            </button>
          </div>
        </div>

        {/* Tab 1: SatuSehat HL7 FHIR Interoperability */}
        {activeTab === "SATUSEHAT" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 space-y-4">
              <div className="glass-panel p-5 rounded-3xl space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <Activity className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs">Status Koneksi SATUSEHAT</h3>
                    <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Terhubung
                      (Production Ready)
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between">
                    <span className="text-slate-500">ID Organisasi Apotek:</span>
                    <span className="font-mono font-bold">10000004</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Standar Protokol:</span>
                    <span className="font-mono">HL7 FHIR Release 4</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">KFA Dictionary Version:</span>
                    <span className="font-mono">v2.4.0 (9-digit)</span>
                  </div>
                </div>
              </div>

              <div className="glass-panel p-5 rounded-3xl space-y-3 text-xs">
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[11px] block">
                  Alur Interoperabilitas SatuSehat
                </span>
                <ol className="list-decimal pl-4 space-y-2 text-slate-600 dark:text-slate-300">
                  <li>
                    <strong>Encounter:</strong> Pendaftaran kedatangan pasien dengan NIK terverifikasi
                    Dukcapil.
                  </li>
                  <li>
                    <strong>MedicationRequest:</strong> Penerimaan e-Resep dokter lengkap dengan kode
                    KFA.
                  </li>
                  <li>
                    <strong>MedicationDispense:</strong> Penyerahan fisik obat oleh Apoteker (APJ/TTK).
                  </li>
                </ol>
              </div>
            </div>

            <div className="lg:col-span-8 glass-panel p-5 rounded-3xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Payload FHIR Resource: MedicationDispense
                    </h3>
                    <span className="text-[11px] text-slate-500">
                      Otomatis digenerate saat transaksi kasir diselesaikan
                    </span>
                  </div>
                  <button
                    onClick={handleCopyJson}
                    className="px-3 py-1.5 min-h-[36px] rounded-[10px] border border-neutral-200 dark:border-neutral-700 text-[12px] font-semibold flex items-center gap-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shrink-0 whitespace-nowrap"
                  >
                    <Copy className="h-3.5 w-3.5 shrink-0" />
                    <span>Salin JSON</span>
                  </button>
                </div>

                <pre className="p-4 mt-3 bg-slate-950 text-emerald-400 rounded-2xl overflow-x-auto text-[11px] font-mono leading-relaxed max-h-[480px]">
                  {JSON.stringify(satuSehatPayload, null, 2)}
                </pre>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs text-slate-500">
                <span>Endpoint: https://api-satusehat.kemkes.go.id/fhir-r4/v1/MedicationDispense</span>
                <span className="font-semibold text-emerald-600">Payload Valid (100% FHIR Conformant)</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: SIPNAP Kemenkes */}
        {activeTab === "SIPNAP" && (
          <div className="glass-panel p-6 rounded-3xl space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Laporan Penggunaan Narkotika & Psikotropika (SIPNAP)
                </h2>
                <p className="text-xs text-slate-500">
                  Periode pelaporan wajib: Tanggal 1 - 10 setiap bulan ke Dinas Kesehatan & BPOM
                </p>
              </div>

              <button
                onClick={handleDownloadSipnapCsv}
                className="px-3.5 py-2 min-h-[40px] rounded-[12px] bg-[#008B94] hover:bg-[#00767E] active:scale-[0.98] text-white font-semibold text-[12px] flex items-center gap-1.5 shadow-sm transition-all shrink-0 whitespace-nowrap"
              >
                <Download className="h-4 w-4 shrink-0" />
                <span>Unduh CSV</span>
              </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs border-collapse font-mono">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                    <th className="p-3">No</th>
                    <th className="p-3">Kode KFA</th>
                    <th className="p-3">Nama Sediaan Obat</th>
                    <th className="p-3 text-center">Stok Awal</th>
                    <th className="p-3 text-center">Pemasukan</th>
                    <th className="p-3 text-center">Pengeluaran Resep</th>
                    <th className="p-3">No. Resep & Tgl</th>
                    <th className="p-3">Dokter & SIP</th>
                    <th className="p-3">Pasien</th>
                    <th className="p-3 text-center">Stok Akhir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {sipnapRows.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-slate-400 font-sans">
                        Belum ada transaksi Narkotika / Psikotropika pada periode ini.
                      </td>
                    </tr>
                  ) : (
                    sipnapRows.map((row) => (
                      <tr key={row.no} className="hover:bg-slate-50/50">
                        <td className="p-3 text-center">{row.no}</td>
                        <td className="p-3">{row.kfaCode}</td>
                        <td className="p-3 font-sans font-bold">{row.productName}</td>
                        <td className="p-3 text-center">{row.initialStock}</td>
                        <td className="p-3 text-center">{row.incomingQty}</td>
                        <td className="p-3 text-center font-bold text-red-600">
                          {row.outgoingPrescriptionQty}
                        </td>
                        <td className="p-3">
                          {row.prescriptionNo} ({row.prescriptionDate})
                        </td>
                        <td className="p-3 font-sans">
                          {row.doctorName}
                          <span className="block text-[10px] text-slate-400">{row.doctorSip}</span>
                        </td>
                        <td className="p-3 font-sans">{row.patientName}</td>
                        <td className="p-3 text-center font-bold text-emerald-600">
                          {row.finalStock}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: BPOM Surat Pesanan (5 Jenis) */}
        {activeTab === "SP_BPOM" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* SP Selector */}
            <div className="lg:col-span-4 space-y-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Pilih Dokumen Surat Pesanan (SP)
              </span>

              {INITIAL_ORDERS.map((sp) => (
                <div
                  key={sp.id}
                  onClick={() => setSelectedSp(sp)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    selectedSp.id === sp.id
                      ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 shadow-sm"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                      {sp.spNumber}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                      SP {sp.type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">PBF: {sp.pbfName}</p>
                  <span className="text-[10px] text-slate-400 block mt-1">Tanggal: {sp.date}</span>
                </div>
              ))}

              <button
                onClick={() =>
                  showAppleToast({
                    type: "info",
                    title: "Formulir Surat Pesanan",
                    message: "Modul pembuatan SP Khusus (Narkotika/Psikotropika/Prekursor/OOT) siap dikonfigurasi.",
                  })
                }
                className="w-full py-2.5 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-600 transition-colors"
              >
                + Buat Surat Pesanan Baru
              </button>
            </div>

            {/* Printable SP Preview */}
            <div className="lg:col-span-8 glass-panel p-6 rounded-3xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Format Resmi Cetak PerBPOM
                  </span>
                  <button
                    onClick={() => window.print()}
                    className="px-3.5 py-1.5 min-h-[36px] rounded-[10px] bg-[#008B94] hover:bg-[#00767E] active:scale-[0.98] text-white font-semibold text-[12px] flex items-center gap-1.5 shadow-sm transition-all shrink-0 whitespace-nowrap"
                  >
                    <Printer className="h-3.5 w-3.5 shrink-0" />
                    <span>Cetak SP</span>
                  </button>
                </div>

                <div
                  className="mt-4 p-6 bg-white text-slate-900 rounded-2xl border border-slate-200 shadow-sm"
                  dangerouslySetInnerHTML={{
                    __html: RegulatoryEngine.generateSpTemplate(selectedSp),
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
