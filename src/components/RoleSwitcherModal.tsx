"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useApotekStore } from "@/lib/store";
import { UserRole } from "@/lib/types";
import { destroySession } from "@/lib/auth/auth-service";
import { soundEngine } from "@/lib/audio";
import {
  ShieldCheck,
  TrendingUp,
  Stethoscope,
  ShoppingBag,
  X,
  LogOut,
  User,
  Mail,
  Building2,
  KeyRound,
  FileBadge,
  ExternalLink,
  Shield,
} from "lucide-react";
import Link from "next/link";

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RoleSwitcherModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
}) => {
  const router = useRouter();
  const { currentUser, currentShift, logout } = useApotekStore();

  if (!isOpen) return null;

  const handleLogoutAndSwitch = () => {
    soundEngine.playKeyTap();
    destroySession();
    logout();
    onClose();
    router.push("/login");
  };

  const getRoleDetails = (role: UserRole) => {
    switch (role) {
      case "SUPER_ADMIN":
        return {
          icon: <ShieldCheck className="w-5 h-5 text-purple-600" />,
          color: "border-purple-200 bg-purple-50/50",
          badge: "bg-purple-100 text-purple-800 border border-purple-200",
          label: "Super Admin & Chief Executive",
          desc: "Otoritas penuh konfigurasi sistem, audit log, manajemen database, dan pembagian hak akses seluruh personil.",
        };
      case "OWNER":
        return {
          icon: <TrendingUp className="w-5 h-5 text-amber-600" />,
          color: "border-amber-200 bg-amber-50/50",
          badge: "bg-amber-100 text-amber-800 border border-amber-200",
          label: "Pemilik Sarana Apotek (PSA)",
          desc: "Akses eksekutif pemantauan margin keuntungan, valuasi persediaan HPP, EBITDA, dan persetujuan pengadaan obat.",
        };
      case "KARYAWAN_APOTEKER":
        return {
          icon: <Stethoscope className="w-5 h-5 text-emerald-600" />,
          color: "border-emerald-200 bg-emerald-50/50",
          badge: "bg-emerald-100 text-emerald-800 border border-emerald-200",
          label: "Apoteker Pengelola Apotek (APJ)",
          desc: "Penanggung jawab teknis kefarmasian, validasi skrining klinis, peracikan resep dokter, dan pelaporan resmi SIPNAP/BPOM.",
        };
      case "KARYAWAN_KASIR":
        return {
          icon: <ShoppingBag className="w-5 h-5 text-blue-600" />,
          color: "border-blue-200 bg-blue-50/50",
          badge: "bg-blue-100 text-blue-800 border border-blue-200",
          label: "Kasir Operasional POS",
          desc: "Akses terminal penjualan POS, setoran kasir, dan pencatatan petty cash. Seluruh HPP dan marjin keuntungan dirahasiakan demi keamanan bisnis.",
        };
    }
  };

  const roleInfo = getRoleDetails(currentUser.role);
  const isOwnerOrSuperAdmin = currentUser.role === "OWNER" || currentUser.role === "SUPER_ADMIN";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white dark:bg-[#1C1C1E] rounded-[24px] shadow-[0_20px_60px_rgba(0,0,0,0.25)] border border-black/[0.08] dark:border-white/[0.12] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#008B94]" />
            <h2 className="text-[17px] font-bold text-[#1C1C1E] dark:text-white tracking-tight">
              Profil Staf & Keamanan Sesi
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-[#8E8E93] hover:text-[#1C1C1E] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Profile Card */}
        <div className="p-6 space-y-5">
          {/* Identity Header */}
          <div className="flex items-start gap-4 p-4 rounded-[18px] bg-neutral-50 dark:bg-[#2C2C2E] border border-black/[0.06] dark:border-white/[0.08]">
            <div className="w-14 h-14 rounded-full bg-[#008B94] text-white flex items-center justify-center text-[18px] font-bold shadow-md shadow-[#008B94]/20 shrink-0">
              {currentUser.avatar}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${roleInfo.badge}`}>
                  {roleInfo.label}
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Sesi Aktif" />
              </div>

              <h3 className="text-[16px] font-bold text-[#1C1C1E] dark:text-white truncate">
                {currentUser.name}
              </h3>
              <p className="text-[12px] text-[#8E8E93] truncate">
                {currentUser.title || roleInfo.label}
              </p>
              <div className="flex items-center gap-2 text-[11px] text-[#8E8E93] mt-1.5 flex-wrap font-mono">
                <span className="px-2 py-0.5 rounded bg-teal-100 dark:bg-teal-950 text-[#008B94] font-bold border border-teal-200 dark:border-teal-900">
                  @{currentUser.username || currentUser.email?.split("@")[0] || "user"}
                </span>
                <span className="truncate">{currentUser.email || "staf@kersowaras.com"}</span>
              </div>
            </div>
          </div>

          {/* Active Shift Indicator */}
          {currentShift && currentShift.status === "OPEN" && (
            <div className="p-3.5 rounded-[16px] bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900/50 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-2 text-teal-900 dark:text-teal-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>
                  Shift Aktif: <strong>Shift {currentShift.shiftNumber}</strong> &bull; Kasir: {currentShift.cashierName}
                </span>
              </div>
              <Link
                href="/shifts"
                onClick={onClose}
                className="font-bold text-[#008B94] dark:text-teal-300 hover:underline flex items-center gap-1"
              >
                <span>Kelola</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          )}

          {/* Role Access Scope Info */}
          <div className="p-4 rounded-[16px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E8E93] block">
              Cakupan Wewenang Operasional
            </span>
            <p className="text-[12px] text-[#636366] dark:text-[#AEAEB2] leading-relaxed">
              {roleInfo.desc}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            {isOwnerOrSuperAdmin && (
              <Link
                href="/users"
                onClick={onClose}
                className="w-full sm:flex-1 py-2.5 px-4 rounded-[12px] bg-[#008B94]/10 hover:bg-[#008B94]/20 text-[#00767E] dark:text-teal-300 font-semibold text-[12px] flex items-center justify-center gap-2 transition-colors border border-[#008B94]/20"
              >
                <User className="w-4 h-4" />
                <span>Kelola Staf (/users)</span>
              </Link>
            )}

            <button
              type="button"
              onClick={handleLogoutAndSwitch}
              className="w-full sm:flex-1 py-2.5 px-4 rounded-[12px] bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 font-semibold text-[12px] flex items-center justify-center gap-2 transition-colors border border-rose-200 dark:border-rose-900/50"
            >
              <LogOut className="w-4 h-4" />
              <span>Ganti Akun / Logout</span>
            </button>
          </div>
        </div>

        {/* Footer Notice */}
        <div className="px-6 py-3 bg-neutral-50 dark:bg-[#2C2C2E] border-t border-neutral-100 dark:border-neutral-800 text-[11px] text-[#8E8E93] flex items-center justify-between">
          <span>Mode Produksi Aktif</span>
          <span>Apotek Kerso Waras &bull; Jepara</span>
        </div>
      </div>
    </div>
  );
};
