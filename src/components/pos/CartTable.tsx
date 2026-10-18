"use client";

import { useState } from "react";
import {
  Trash2,
  AlertTriangle,
  ShoppingCart,
  Tag,
  LayoutList,
  Table as TableIcon,
  MapPin,
  Calendar,
} from "lucide-react";
import { useApotekStore } from "@/lib/store";
import { formatRupiah, getDaysUntilExpiry, getExpiryStatus } from "@/lib/utils";
import { showAppleToast } from "@/components/ui/AppleToast";
import { soundEngine } from "@/lib/audio";

const SIGNA_PRESETS = [
  "3 x sehari 1 Sesudah Makan",
  "3 x sehari 1 Sebelum Makan",
  "2 x sehari 1 Sesudah Makan",
  "1 x sehari 1 Pagi Hari",
  "1 x sehari 1 Malam Hari",
  "3 x sehari 1 (Habiskan - Antibiotik)",
  "Bila perlu (Demam / Nyeri)",
  "Pemakaian Luar (Oleskan tipis)",
];

function formatShortDate(isoStr: string): string {
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return isoStr.split("T")[0];
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatUnitName(unit: string): string {
  if (!unit) return "Unit";
  return unit.charAt(0).toUpperCase() + unit.slice(1).toLowerCase();
}

export function CartTable() {
  const { cart, products, updateQuantity, updateItemSigna, removeFromCart } =
    useApotekStore();

  const [viewMode, setViewMode] = useState<"card" | "table">("card");

  if (cart.length === 0) {
    return (
      <div className="h-full min-h-[260px] flex flex-col items-center justify-center p-8 text-center border border-dashed border-neutral-200 dark:border-white/[0.1] rounded-xl bg-white dark:bg-[#141416]">
        <div className="h-11 w-11 rounded-xl bg-neutral-100 dark:bg-white/[0.06] text-neutral-400 flex items-center justify-center mb-3">
          <ShoppingCart className="h-5 w-5" />
        </div>
        <h3 className="text-[13.5px] font-semibold text-neutral-900 dark:text-white">
          Belum ada obat di keranjang
        </h3>
        <p className="text-[12px] text-neutral-500 max-w-sm mt-0.5">
          Cari nama obat pada kolom di atas atau klik produk pada katalog di sebelah kanan.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 w-full max-w-full min-w-0">
      {/* Apple HIG Cart View Mode Bar */}
      <div className="shrink-0 flex items-center justify-between px-1 text-[11.5px]">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-neutral-700 dark:text-neutral-300">
            Daftar Obat
          </span>
          <span className="px-2 py-0.5 rounded-full font-mono text-[10px] font-bold bg-[#00767E]/10 text-[#00767E] dark:text-teal-300">
            {cart.length} Item
          </span>
        </div>

        {/* View Mode Switcher: Card Row vs Compact Table */}
        <div className="inline-flex p-0.5 rounded-lg bg-neutral-100 dark:bg-white/[0.06] border border-neutral-200/80 dark:border-white/10">
          <button
            type="button"
            onClick={() => {
              soundEngine.playKeyTap();
              setViewMode("card");
            }}
            className={`px-2 py-1 rounded-md text-[11px] font-medium flex items-center gap-1.5 transition-all ${
              viewMode === "card"
                ? "bg-white dark:bg-[#1C1C1E] text-neutral-900 dark:text-white font-semibold shadow-2xs"
                : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
            }`}
            title="Tampilan Kartu Rinci (Rekomendasi Apple HIG - Bebas Terpotong)"
          >
            <LayoutList className="w-3 h-3" />
            <span>Kartu</span>
          </button>
          <button
            type="button"
            onClick={() => {
              soundEngine.playKeyTap();
              setViewMode("table");
            }}
            className={`px-2 py-1 rounded-md text-[11px] font-medium flex items-center gap-1.5 transition-all ${
              viewMode === "table"
                ? "bg-white dark:bg-[#1C1C1E] text-neutral-900 dark:text-white font-semibold shadow-2xs"
                : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
            }`}
            title="Tampilan Tabel Kompak"
          >
            <TableIcon className="w-3 h-3" />
            <span>Tabel</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          VIEW 1: APPLE HIG CARD ROW LAYOUT (Default: Zero Clipping, High Ergonomics)
      ========================================================================= */}
      {viewMode === "card" ? (
        <div className="space-y-2 w-full min-w-0">
          {cart.map((item, idx) => {
            const liveProd =
              products.find((p) => p.id === item.product.id) || item.product;
            const liveBatch =
              liveProd.batches.find((b) => b.id === item.selectedBatch.id) ||
              item.selectedBatch;
            const availableStock = liveBatch.currentStock;
            const daysLeft = getDaysUntilExpiry(liveBatch.expiryDate);
            const expiryStatus = getExpiryStatus(daysLeft);

            const handleIncrement = () => {
              const nextQty = item.quantity + 1;
              if (nextQty * item.unitMultiplier > availableStock) {
                showAppleToast({
                  type: "warning",
                  title: "Batas Stok Fisik",
                  message: `Sisa stok ${item.product.name} (${liveBatch.locationRack}) tersedia ${availableStock} ${formatUnitName(item.product.baseUnit)}.`,
                });
                return;
              }
              soundEngine.playKeyTap();
              updateQuantity(item.cartItemId, nextQty);
            };

            const handleDecrement = () => {
              soundEngine.playKeyTap();
              updateQuantity(item.cartItemId, item.quantity - 1);
            };

            return (
              <div
                key={item.cartItemId}
                className="w-full bg-white dark:bg-[#141416] p-3 rounded-xl border border-neutral-200/80 dark:border-white/[0.08] shadow-2xs hover:border-[#00767E]/40 transition-colors flex flex-col gap-2.5 min-w-0"
              >
                {/* Line 1: Identity & Delete */}
                <div className="flex items-start justify-between gap-2 min-w-0">
                  <div className="flex items-start gap-2 min-w-0">
                    <span className="w-5 h-5 rounded-md bg-neutral-100 dark:bg-white/[0.06] text-neutral-500 font-mono text-[10.5px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <h4 className="font-bold text-[13.5px] text-neutral-900 dark:text-white leading-snug truncate">
                        {item.product.name}
                      </h4>
                      <p className="text-[11px] text-neutral-500 truncate">
                        {item.product.genericName}
                      </p>
                    </div>
                  </div>

                  {/* Price & Delete Action */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono font-semibold text-[12px] text-neutral-700 dark:text-neutral-300 tabular-nums">
                      {formatRupiah(item.unitPrice)} / {formatUnitName(item.selectedUnit)}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playKeyTap();
                        removeFromCart(item.cartItemId);
                      }}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Hapus obat dari keranjang"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Line 2: Shelf Rack Location, Stock, and Expiry Warnings */}
                <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-white/[0.06] text-neutral-700 dark:text-neutral-300 font-mono font-medium">
                    <MapPin className="w-3 h-3 text-neutral-400 shrink-0" />
                    <span>{liveBatch.locationRack}</span>
                  </span>

                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-mono font-semibold border border-emerald-200/60 dark:border-emerald-800/60">
                    <span>Stok: {availableStock} {formatUnitName(item.product.baseUnit)}</span>
                  </span>

                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-50 dark:bg-white/[0.04] text-neutral-500 font-mono border border-neutral-200/60 dark:border-white/10">
                    <Calendar className="w-3 h-3 text-neutral-400 shrink-0" />
                    <span>ED {formatShortDate(liveBatch.expiryDate)}</span>
                  </span>

                  {daysLeft <= 60 && (
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-semibold border ${expiryStatus.badgeBg}`}
                    >
                      <AlertTriangle className="h-3 w-3 shrink-0" />
                      <span>{daysLeft} hari lagi</span>
                    </span>
                  )}
                </div>

                {/* Line 3: Clinical Etiket / Aturan Pakai (Full-Width Responsive Input) */}
                <div className="flex items-center gap-2 pt-0.5">
                  <Tag className="w-3.5 h-3.5 text-[#00767E] dark:text-teal-400 shrink-0" />
                  <input
                    type="text"
                    list={`signa-list-${item.cartItemId}`}
                    value={item.signaUsage || ""}
                    onChange={(e) =>
                      updateItemSigna(item.cartItemId, e.target.value)
                    }
                    placeholder="Aturan pakai etiket (mis. 3 x sehari 1 Tablet Sesudah Makan)"
                    className="flex-1 px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#1C1C1E] text-[11.5px] text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 focus:outline-none focus:border-[#00767E] transition-colors"
                  />
                  <datalist id={`signa-list-${item.cartItemId}`}>
                    {SIGNA_PRESETS.map((preset) => (
                      <option key={preset} value={preset} />
                    ))}
                  </datalist>
                </div>

                {/* Line 4: Tactile Stepper & Subtotal */}
                <div className="pt-2 border-t border-neutral-100 dark:border-white/[0.06] flex items-center justify-between gap-3">
                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-neutral-400 font-medium hidden sm:inline">
                      Jumlah:
                    </span>
                    <div className="inline-flex items-center gap-1 bg-neutral-100 dark:bg-white/[0.06] p-0.5 rounded-lg border border-neutral-200/80 dark:border-white/10">
                      <button
                        type="button"
                        onClick={handleDecrement}
                        className="h-7 w-7 rounded-md bg-white dark:bg-[#1C1C1E] flex items-center justify-center font-bold text-neutral-800 dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors shadow-2xs active:scale-95"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={Math.floor(availableStock / item.unitMultiplier)}
                        value={item.quantity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (Number.isNaN(val) || val <= 0) return;
                          if (val * item.unitMultiplier > availableStock) {
                            showAppleToast({
                              type: "warning",
                              title: "Batas Stok Fisik",
                              message: `Maksimal stok: ${availableStock} ${formatUnitName(item.product.baseUnit)}.`,
                            });
                            updateQuantity(
                              item.cartItemId,
                              Math.max(
                                1,
                                Math.floor(availableStock / item.unitMultiplier)
                              )
                            );
                            return;
                          }
                          updateQuantity(item.cartItemId, val);
                        }}
                        className="w-10 text-center bg-transparent font-bold text-neutral-900 dark:text-white font-mono text-[13px] tabular-nums focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleIncrement}
                        className="h-7 w-7 rounded-md bg-white dark:bg-[#1C1C1E] flex items-center justify-center font-bold text-neutral-800 dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors shadow-2xs active:scale-95"
                      >
                        +
                      </button>
                      <span className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 px-1.5 whitespace-nowrap">
                        {formatUnitName(item.selectedUnit)}
                      </span>
                    </div>
                  </div>

                  {/* Line Item Subtotal */}
                  <div className="text-right">
                    <span className="text-[10.5px] text-neutral-400 font-medium block">
                      Subtotal
                    </span>
                    <span className="font-bold text-[14.5px] text-neutral-900 dark:text-white font-mono tabular-nums leading-tight block">
                      {formatRupiah(item.subtotal)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* =========================================================================
            VIEW 2: COMPACT ADAPTIVE TABLE (Carefully Proportioned, Zero Blowout)
        ========================================================================= */
        <div className="w-full max-w-full min-w-0 overflow-x-auto rounded-xl border border-neutral-200/80 dark:border-white/[0.08] bg-white dark:bg-[#141416]">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-neutral-200/80 dark:border-white/[0.08] bg-neutral-50/80 dark:bg-white/[0.03] text-neutral-500 font-semibold text-[10.5px] uppercase tracking-wider whitespace-nowrap">
                <th className="px-2 py-2 w-7 text-center">No</th>
                <th className="px-2.5 py-2">Obat & Aturan Pakai</th>
                <th className="px-2 py-2">Lokasi & Stok</th>
                <th className="px-2 py-2 text-right">Harga</th>
                <th className="px-2 py-2 text-center">Jumlah</th>
                <th className="px-2.5 py-2 text-right">Subtotal</th>
                <th className="px-1.5 py-2 text-center w-7"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-white/[0.06]">
              {cart.map((item, idx) => {
                const liveProd =
                  products.find((p) => p.id === item.product.id) || item.product;
                const liveBatch =
                  liveProd.batches.find((b) => b.id === item.selectedBatch.id) ||
                  item.selectedBatch;
                const availableStock = liveBatch.currentStock;
                const daysLeft = getDaysUntilExpiry(liveBatch.expiryDate);
                const expiryStatus = getExpiryStatus(daysLeft);

                const handleIncrement = () => {
                  const nextQty = item.quantity + 1;
                  if (nextQty * item.unitMultiplier > availableStock) {
                    showAppleToast({
                      type: "warning",
                      title: "Batas Stok Fisik",
                      message: `Sisa stok ${item.product.name} (${liveBatch.locationRack}) tersedia ${availableStock} ${formatUnitName(item.product.baseUnit)}.`,
                    });
                    return;
                  }
                  updateQuantity(item.cartItemId, nextQty);
                };

                return (
                  <tr
                    key={item.cartItemId}
                    className="hover:bg-neutral-50/60 dark:hover:bg-white/[0.02] transition-colors align-middle"
                  >
                    <td className="px-2 py-2 text-center font-mono text-neutral-400 font-medium">
                      {idx + 1}
                    </td>

                    <td className="px-2.5 py-2 min-w-[130px]">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-[12.5px] text-neutral-900 dark:text-white leading-tight">
                          {item.product.name}
                        </span>
                        <input
                          type="text"
                          list={`signa-list-${item.cartItemId}`}
                          value={item.signaUsage || ""}
                          onChange={(e) =>
                            updateItemSigna(item.cartItemId, e.target.value)
                          }
                          placeholder="Aturan pakai..."
                          className="w-full px-1.5 py-0.5 rounded border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-white/[0.04] text-[10.5px] text-neutral-700 dark:text-neutral-200 focus:outline-none focus:border-[#00767E]"
                        />
                      </div>
                    </td>

                    <td className="px-2 py-2 text-[10.5px] font-mono whitespace-nowrap">
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200 block">
                        {liveBatch.locationRack}
                      </span>
                      <span className="text-emerald-700 dark:text-emerald-400 block font-medium">
                        Stok: {availableStock}
                      </span>
                    </td>

                    <td className="px-2 py-2 text-right font-mono text-[11.5px] text-neutral-700 dark:text-neutral-300 tabular-nums whitespace-nowrap">
                      {formatRupiah(item.unitPrice)}
                    </td>

                    <td className="px-2 py-2 text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-0.5 bg-neutral-100 dark:bg-white/[0.06] p-0.5 rounded border border-neutral-200/80 dark:border-white/10">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.cartItemId, item.quantity - 1)
                          }
                          className="h-5 w-5 rounded bg-white dark:bg-[#1C1C1E] flex items-center justify-center font-semibold text-neutral-800 dark:text-white text-[11px]"
                        >
                          -
                        </button>
                        <span className="w-6 text-center font-bold text-neutral-900 dark:text-white font-mono text-[11.5px] tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={handleIncrement}
                          className="h-5 w-5 rounded bg-white dark:bg-[#1C1C1E] flex items-center justify-center font-semibold text-neutral-800 dark:text-white text-[11px]"
                        >
                          +
                        </button>
                      </div>
                    </td>

                    <td className="px-2.5 py-2 text-right font-semibold text-[12px] text-neutral-900 dark:text-white font-mono tabular-nums whitespace-nowrap">
                      {formatRupiah(item.subtotal)}
                    </td>

                    <td className="px-1.5 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.cartItemId)}
                        className="p-1 rounded text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
