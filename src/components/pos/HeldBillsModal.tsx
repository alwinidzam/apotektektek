"use client";

import { X, Play, Trash2, Clock, ShoppingBag } from "lucide-react";
import { useApotekStore } from "@/lib/store";
import { formatRupiah } from "@/lib/utils";

interface HeldBillsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HeldBillsModal({ isOpen, onClose }: HeldBillsModalProps) {
  const { heldBills, recallBill, deleteHeldBill } = useApotekStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Daftar Transaksi Tertahan (Parked Bills)
              </h2>
              <p className="text-xs text-slate-500">
                Lanjutkan transaksi antrean yang sempat diparkir
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
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3">
          {heldBills.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Tidak ada transaksi yang sedang ditahan.
            </div>
          ) : (
            heldBills.map((bill) => {
              const totalItems = bill.items.reduce((acc, it) => acc + it.quantity, 0);
              const totalAmount = bill.items.reduce((acc, it) => acc + it.subtotal, 0);

              return (
                <div
                  key={bill.id}
                  className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:border-emerald-500 transition-all group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="h-10 w-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300">
                      <ShoppingBag className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {bill.customerName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Diparkir pukul {bill.heldAt}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {totalItems} item obat • Total:{" "}
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                          {formatRupiah(totalAmount)}
                        </span>
                      </p>
                      {bill.note && (
                        <p className="text-[11px] text-amber-600 italic mt-0.5">Catatan: {bill.note}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => deleteHeldBill(bill.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                      title="Batalkan & Hapus"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        recallBill(bill.id);
                        onClose();
                      }}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <Play className="h-3.5 w-3.5 fill-current" />
                      <span>Lanjutkan</span>
                    </button>
                  </div>
                </div>
              );
            })
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
