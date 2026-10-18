"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  X,
  Lock,
  CheckCircle2,
  Package,
  ShoppingCart,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { useApotekStore } from "@/lib/store";
import { INITIAL_STAFF_ACCOUNTS } from "@/lib/firebase/users";
import { saveSession } from "@/lib/auth/auth-service";
import { soundEngine } from "@/lib/audio";
import { showAppleToast } from "@/components/ui/AppleToast";

interface RoleSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RoleSwitcherModal: React.FC<RoleSwitcherModalProps> = ({
  isOpen,
  onClose,
}) => {
  const router = useRouter();
  const { currentUser, setCurrentUser } = useApotekStore();

  if (!isOpen) return null;

  const rbacLevels = [
    {
      level: 1,
      badge: "Level 1 — Akses Penuh",
      title: "Pemilik Apotek",
      subtitle: "dr. H. Bambang Soedibyo, Sp.Rad",
      username: "owner",
      role: "OWNER" as const,
      icon: TrendingUp,
      accentBg: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25",
      permissions: [
        "Membuka seluruh menu aplikasi",
        "Memantau laporan keuangan omzet & laba",
        "Menyetujui Purchase Order (PO) ke supplier",
      ],
      defaultRoute: "/owner",
      seedAccount: INITIAL_STAFF_ACCOUNTS.find((a) => a.role === "OWNER") || INITIAL_STAFF_ACCOUNTS[1],
    },
    {
      level: 2,
      badge: "Level 2 — Akses Menengah",
      title: "Petugas Gudang",
      subtitle: "apt. Farhan Pratama, S.Farm",
      username: "gudang",
      role: "KARYAWAN_APOTEKER" as const,
      icon: Package,
      accentBg: "bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/25",
      permissions: [
        "Mengelola data stok obat & master produk",
        "Mencatat barang masuk dari supplier",
        "Mengeksekusi Stock Opname gudang",
      ],
      defaultRoute: "/inventory",
      seedAccount:
        INITIAL_STAFF_ACCOUNTS.find((a) => a.role === "KARYAWAN_APOTEKER") ||
        INITIAL_STAFF_ACCOUNTS[2],
    },
    {
      level: 3,
      badge: "Level 3 — Akses Terbatas",
      title: "Kasir",
      subtitle: "Dinda Kirana (Shift Pagi)",
      username: "kasir1",
      role: "KARYAWAN_KASIR" as const,
      icon: ShoppingCart,
      accentBg: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25",
      permissions: [
        "Pelayanan transaksi penjualan kasir POS (< 0.2 dtk)",
        "Pencarian sisa stok & harga obat real-time",
        "Data finansial & HPP dikunci rapat",
      ],
      defaultRoute: "/",
      seedAccount:
        INITIAL_STAFF_ACCOUNTS.find((a) => a.role === "KARYAWAN_KASIR") ||
        INITIAL_STAFF_ACCOUNTS[3],
    },
  ];

  const handleSwitchLevel = (item: (typeof rbacLevels)[0]) => {
    soundEngine.playCheckoutChime();
    const staff = item.seedAccount;
    saveSession(staff);
    setCurrentUser({
      id: staff.uid,
      name: staff.displayName,
      username: staff.username,
      email: staff.email,
      role: staff.role,
      title: `${item.badge} (${item.title})`,
      avatar: staff.avatar,
      sipaNumber: staff.pharmacistDetails?.sipaNumber,
    });

    showAppleToast({
      type: "success",
      title: `Beralih ke ${item.badge}`,
      message: `Aktif sebagai ${item.title}: ${item.subtitle}`,
    });

    onClose();
    router.push(item.defaultRoute);
  };

  const currentLevel =
    currentUser.role === "OWNER" || currentUser.role === "SUPER_ADMIN"
      ? 1
      : currentUser.role === "KARYAWAN_APOTEKER"
      ? 2
      : 3;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white dark:bg-[#1C1C1E] rounded-[28px] shadow-[0_24px_60px_rgba(0,0,0,0.28)] border border-black/[0.08] dark:border-white/[0.12] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between bg-[#F9F9FB] dark:bg-[#252528]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#008B94] text-white flex items-center justify-center shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-[16px] font-bold text-[#1C1C1E] dark:text-white tracking-tight">
                Standar Keamanan & Pembagian Hak Akses (RBAC)
              </h2>
              <p className="text-[12px] text-[#8E8E93]">
                Pilih tingkatan wewenang pengguna untuk mencegah salah input antar-divisi
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3-Level RBAC Cards */}
        <div className="p-5 sm:p-6 space-y-3 max-h-[75vh] overflow-y-auto">
          {rbacLevels.map((lvl) => {
            const Icon = lvl.icon;
            const isActive = currentLevel === lvl.level;

            return (
              <div
                key={lvl.level}
                onClick={() => handleSwitchLevel(lvl)}
                className={`p-4 rounded-[20px] border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isActive
                    ? "bg-[#008B94]/[0.06] dark:bg-[#008B94]/[0.15] border-[#008B94] ring-2 ring-[#008B94]/20"
                    : "bg-white dark:bg-[#242426] border-black/[0.08] dark:border-white/[0.1] hover:border-[#008B94]/60 hover:bg-neutral-50/70 dark:hover:bg-white/[0.03]"
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div
                    className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 mt-0.5 ${lvl.accentBg}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[10.5px] font-bold px-2.5 py-0.5 rounded-full border ${lvl.accentBg}`}
                      >
                        {lvl.badge}
                      </span>
                      {isActive && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#008B94] dark:text-teal-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Sedang Aktif
                        </span>
                      )}
                    </div>

                    <h3 className="text-[15px] font-bold text-[#1C1C1E] dark:text-white mt-1">
                      {lvl.title}{" "}
                      <span className="text-[12px] font-normal text-[#8E8E93]">
                        — {lvl.subtitle}
                      </span>
                    </h3>

                    <ul className="mt-2 space-y-1">
                      {lvl.permissions.map((perm, i) => (
                        <li
                          key={i}
                          className="text-[12px] text-[#636366] dark:text-neutral-300 flex items-center gap-1.5"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-[#008B94] shrink-0" />
                          <span>{perm}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="shrink-0 flex sm:flex-col items-center sm:items-end justify-between gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-black/[0.05] dark:border-white/[0.06]">
                  <span className="text-[10.5px] font-mono text-[#8E8E93]">
                    ID: {lvl.username}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSwitchLevel(lvl);
                    }}
                    className={`px-3.5 py-2 rounded-[12px] text-[12px] font-bold flex items-center gap-1.5 transition-all ${
                      isActive
                        ? "bg-[#008B94] text-white shadow-sm"
                        : "bg-[#F2F2F7] dark:bg-white/10 text-[#1C1C1E] dark:text-white hover:bg-[#008B94] hover:text-white"
                    }`}
                  >
                    <span>{isActive ? "Buka Modul" : "Aktifkan Level Ini"}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#F9F9FB] dark:bg-[#252528] border-t border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between text-[11.5px] text-[#8E8E93]">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-[#008B94]" />
            <span>Role-Based Access Control (RBAC) mengunci menu & data finansial secara otomatis</span>
          </div>
          <button
            type="button"
            onClick={() => {
              onClose();
              router.push("/login");
            }}
            className="font-semibold text-[#008B94] hover:underline"
          >
            Halaman Login Penuh &rarr;
          </button>
        </div>
      </div>
    </div>
  );
};
