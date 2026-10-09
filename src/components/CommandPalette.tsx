"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Store,
  FlaskConical,
  ShieldCheck,
  ClipboardList,
  Users,
  Package,
  ArrowRight,
  Layers,
  X,
} from "lucide-react";
import { useApotekStore } from "@/lib/store";
import { formatRupiah } from "@/lib/utils";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { products, addToCart } = useApotekStore();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredProducts = query.trim()
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.genericName.toLowerCase().includes(query.toLowerCase()) ||
          p.barcode.includes(query) ||
          p.kfaCode?.includes(query)
      )
    : [];

  const handleSelectProduct = (product: (typeof products)[0]) => {
    addToCart(product);
    onClose();
    router.push("/");
  };

  const navActions = [
    { label: "Buka Kasir POS", icon: Store, href: "/" },
    { label: "Kelola Shift & Rekonsiliasi Kas", icon: ClipboardList, href: "/shifts" },
    { label: "Kelola Staff & Akun Pengguna (RBAC)", icon: Users, href: "/users" },
    { label: "Katalog Master Produk & Setting HPP", icon: Package, href: "/products" },
    { label: "Owner Executive Suite & Laba Kotor", icon: ShieldCheck, href: "/owner" },
    { label: "Manajemen Stok FEFO & Batch", icon: Layers, href: "/inventory" },
    { label: "Buat Resep Racikan Baru (DTD/Non-DTD)", icon: FlaskConical, href: "/compounding" },
    { label: "Kepatuhan Kemenkes & SP BPOM", icon: ShieldCheck, href: "/regulatory" },
    { label: "Buku Defecta & Pembelian PBF", icon: ClipboardList, href: "/procurement" },
    { label: "Rekam Medis Pasien (PMR) & PRB", icon: Users, href: "/crm" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 border-b border-slate-100 dark:border-slate-800">
          <Search className="h-5 w-5 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Cari nama obat, bahan aktif, barcode, KFA, atau aksi..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full py-4 px-3 bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-1">
          {/* If there are matched products */}
          {filteredProducts.length > 0 && (
            <div className="mb-3">
              <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Produk Farmasi Ditemukan
              </div>
              {filteredProducts.slice(0, 6).map((prod) => (
                <button
                  key={prod.id}
                  onClick={() => handleSelectProduct(prod)}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-emerald-50 dark:hover:bg-slate-800/80 transition-colors text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                      <Package className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                          {prod.isLasa && prod.tallManName ? prod.tallManName : prod.name}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {prod.drugClass}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {prod.genericName} • Barcode: {prod.barcode} • KFA: {prod.kfaCode || "-"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm text-emerald-600 dark:text-emerald-400 font-mono">
                      {formatRupiah(prod.unitConversions[0]?.pricePerUnit || 0)}
                    </div>
                    <span className="text-[11px] text-slate-400">Klik untuk masuk keranjang</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Quick Actions & Navigation */}
          <div>
            <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Aksi Navigasi Pintas
            </div>
            {navActions.map((action, idx) => {
              const Icon = action.icon;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    router.push(action.href);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-slate-500" />
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      {action.label}
                    </span>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Hint */}
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
          <span>Gunakan panah untuk navigasi, Enter untuk memilih</span>
          <div className="flex items-center gap-2">
            <span>Tutup:</span>
            <span className="kbd-badge">ESC</span>
          </div>
        </div>
      </div>
    </div>
  );
}
