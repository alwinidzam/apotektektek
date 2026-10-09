"use client";

import { Trash2, AlertTriangle, ShieldAlert, FlaskConical, Layers } from "lucide-react";
import { useApotekStore } from "@/lib/store";
import { formatRupiah, getDaysUntilExpiry, getExpiryStatus } from "@/lib/utils";

export function CartTable() {
  const { cart, densityMode, updateQuantity, removeFromCart } = useApotekStore();

  if (cart.length === 0) {
    return (
      <div className="h-full min-h-[380px] flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white/40 dark:bg-slate-900/40">
        <div className="h-16 w-16 rounded-3xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4 shadow-inner">
          <Layers className="h-8 w-8 stroke-[1.8]" />
        </div>
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
          Keranjang Kasir Masih Kosong
        </h3>
        <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
          Pindai barcode obat, tekan <span className="kbd-badge">F2</span> untuk cari, atau tekan{" "}
          <span className="kbd-badge">F3</span> untuk membuat racikan baru.
        </p>
      </div>
    );
  }

  const isDense = densityMode === "DENSE";

  return (
    <div className="w-full max-w-full min-w-0 overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm">
      <table className="w-full min-w-[560px] text-left text-xs border-collapse">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 text-slate-500 font-semibold">
            <th className={`px-3 ${isDense ? "py-2" : "py-3"} w-10 text-center`}>No</th>
            <th className={`px-4 ${isDense ? "py-2" : "py-3"} min-w-[200px]`}>Nama Obat & Golongan</th>
            <th className={`px-3 ${isDense ? "py-2" : "py-3"} w-36`}>Batch & Expired (FEFO)</th>
            <th className={`px-3 ${isDense ? "py-2" : "py-3"} text-right w-28`}>Harga Satuan</th>
            <th className={`px-3 ${isDense ? "py-2" : "py-3"} text-center w-36 min-w-[136px]`}>Qty / Satuan</th>
            <th className={`px-4 ${isDense ? "py-2" : "py-3"} text-right w-28`}>Subtotal</th>
            <th className={`px-3 ${isDense ? "py-2" : "py-3"} text-center w-12`}>Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {cart.map((item, idx) => {
            const daysLeft = getDaysUntilExpiry(item.selectedBatch.expiryDate);
            const expiryStatus = getExpiryStatus(daysLeft);

            return (
              <tr
                key={item.cartItemId}
                className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
              >
                {/* Index */}
                <td className="px-3 py-2 text-center font-mono text-slate-400 font-medium">
                  {idx + 1}
                </td>

                {/* Product Name & Badges */}
                <td className="px-4 py-2 min-w-0">
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-semibold text-slate-900 dark:text-white truncate">
                        {item.isRacikan ? (
                          <span className="text-teal-700 dark:text-teal-300 flex items-center gap-1">
                            <FlaskConical className="h-3.5 w-3.5 shrink-0" />
                            {item.product.name}
                          </span>
                        ) : item.product.isLasa && item.product.tallManName ? (
                          <span className="text-amber-700 dark:text-amber-300 font-bold bg-amber-50 dark:bg-amber-950/40 px-1 rounded">
                            {item.product.tallManName}
                          </span>
                        ) : (
                          item.product.name
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Drug Class Badge */}
                      <span
                        className={`px-1.5 py-0.2 text-[9px] font-bold rounded ${
                          item.product.drugClass === "NARKOTIKA"
                            ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                            : item.product.drugClass === "PSIKOTROPIKA"
                            ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                            : item.product.drugClass === "KERAS"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                            : item.product.drugClass === "OOT"
                            ? "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300"
                            : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        {item.product.drugClass}
                      </span>

                      {/* High Alert Flag */}
                      {item.product.isHighAlert && (
                        <span className="flex items-center gap-0.5 text-[9px] font-bold text-red-600 bg-red-50 dark:bg-red-950/40 px-1 py-0.2 rounded border border-red-200">
                          <ShieldAlert className="h-2.5 w-2.5" /> High-Alert
                        </span>
                      )}

                      <span className="text-[11px] text-slate-400 truncate max-w-[220px]">
                        {item.product.genericName} &bull; {item.selectedBatch.locationRack}
                      </span>
                    </div>
                  </div>
                </td>

                {/* Batch & Expiry FEFO */}
                <td className="px-3 py-2">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-mono text-slate-700 dark:text-slate-300 font-medium">
                      {item.selectedBatch.batchNumber}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-medium border ${expiryStatus.badgeBg}`}
                    >
                      {daysLeft < 30 && <AlertTriangle className="h-2.5 w-2.5" />}
                      {item.selectedBatch.expiryDate.split("T")[0]} ({daysLeft} hr)
                    </span>
                  </div>
                </td>

                {/* Price */}
                <td className="px-3 py-2 text-right font-mono text-slate-700 dark:text-slate-300 font-medium tabular-nums">
                  {formatRupiah(item.unitPrice)}
                </td>

                {/* Quantity & Unit */}
                <td className="px-3 py-2 text-center">
                  <div className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                      className="h-6 w-6 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors shadow-sm"
                    >
                      -
                    </button>
                    <span className="font-bold text-slate-900 dark:text-white font-mono px-1.5 min-w-6 text-center text-[12px] tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                      className="h-6 w-6 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors shadow-sm"
                    >
                      +
                    </button>
                    <span className="text-[10px] font-bold text-slate-500 uppercase px-1.5 whitespace-nowrap">
                      {item.selectedUnit}
                    </span>
                  </div>
                </td>

                {/* Subtotal */}
                <td className="px-4 py-2 text-right font-bold text-slate-900 dark:text-white font-mono">
                  {formatRupiah(item.subtotal)}
                </td>

                {/* Remove */}
                <td className="px-3 py-2 text-center">
                  <button
                    onClick={() => removeFromCart(item.cartItemId)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                    title="Hapus dari keranjang"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
