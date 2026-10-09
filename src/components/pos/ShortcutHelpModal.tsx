"use client";

import { X, Keyboard } from "lucide-react";

interface ShortcutHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShortcutHelpModal({ isOpen, onClose }: ShortcutHelpModalProps) {
  if (!isOpen) return null;

  const shortcutGroups = [
    {
      group: "Navigasi & Pencarian Kasir",
      items: [
        { key: "F1", desc: "Buka Panduan Shortcut Keyboard ini" },
        { key: "F2", desc: "Fokus ke Barcode Scanner / Pencarian Cepat Obat" },
        { key: "F3", desc: "Buka Mesin Peracikan Resep (Compounding / Racikan)" },
        { key: "F4", desc: "Pilih / Ganti Pasien Terdaftar (Cek Alergi & PMR)" },
        { key: "F5", desc: "Pilih Dokter Penulis Resep" },
      ],
    },
    {
      group: "Manajemen Transaksi & Keranjang",
      items: [
        { key: "F6", desc: "Tahan Transaksi Aktif (Park / Hold Bill)" },
        { key: "F7", desc: "Buka Antrean Transaksi Tertahan (Recall Parked Bill)" },
        { key: "F9", desc: "Buka Dialog Split Payment (Multi-Metode Bayar)" },
        { key: "F10", desc: "Pembayaran Cepat Uang Pas (Exact Cash Checkout)" },
        { key: "F12 / Ctrl+Enter", desc: "Finalisasi Transaksi & Cetak Struk ESC/POS" },
      ],
    },
    {
      group: "Operasi Keyboard Cepat di Keranjang",
      items: [
        { key: "+ / -", desc: "Tambah atau Kurangi Kuantitas Obat Terpilih" },
        { key: "Del / Backspace", desc: "Hapus Item dari Keranjang Belanja" },
        { key: "Cmd + K / Ctrl + K", desc: "Buka Command Palette Universal" },
        { key: "Esc", desc: "Tutup Modal / Bersihkan Pilihan" },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Keyboard className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Panduan Keyboard Kasir (100% Mouse-Free)
              </h2>
              <p className="text-xs text-slate-500">
                Sistem didesain untuk melayani antrean cepat tanpa menyentuh mouse
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

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
          {shortcutGroups.map((grp, idx) => (
            <div key={idx}>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                {grp.group}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {grp.items.map((item, itemIdx) => (
                  <div
                    key={itemIdx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800"
                  >
                    <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                      {item.desc}
                    </span>
                    <span className="kbd-badge">{item.key}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs text-slate-500">
          <span>Tekan ESC untuk kembali ke kasir</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs shadow-sm transition-colors"
          >
            Mengerti & Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
