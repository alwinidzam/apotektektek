"use client";

import React from "react";
import Link from "next/link";
import { ShieldX, Lock, ArrowLeft, UserCheck } from "lucide-react";
import { useApotekStore } from "@/lib/store";

interface AccessDeniedProps {
  requiredRole: string;
  reason?: string;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({
  requiredRole,
  reason = "Halaman ini memuat informasi rahasia finansial dan harga pokok penjualan (HPP). Kasir dilarang mengakses modul ini demi menjaga kerahasiaan bisnis apotek.",
}) => {
  const { currentUser } = useApotekStore();

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white dark:bg-[#1C1C1E] rounded-[22px] border border-black/[0.08] dark:border-white/[0.12] p-8 text-center shadow-[0_20px_50px_rgba(0,0,0,0.1)]">
        <div className="w-16 h-16 rounded-[18px] bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-4 border border-rose-200 dark:border-rose-900/40">
          <ShieldX className="w-8 h-8 stroke-[2]" />
        </div>

        <h2 className="text-[20px] font-bold text-[#1C1C1E] dark:text-white tracking-tight">
          Akses Ditolak (Izin Terbatas)
        </h2>

        <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-neutral-100 dark:bg-neutral-800 text-[#8E8E93]">
          <Lock className="w-3 h-3" />
          <span>Peran Anda: {currentUser.role} &bull; Wajib: {requiredRole}</span>
        </div>

        <p className="text-[13px] text-[#636366] dark:text-[#AEAEB2] mt-4 leading-relaxed">
          {reason}
        </p>

        <div className="mt-6 flex flex-col gap-2">
          <Link
            href="/"
            className="w-full py-2.5 px-4 rounded-[12px] bg-[#007AFF] hover:bg-[#0062CC] text-white font-semibold text-[13px] flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Kasir POS</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
