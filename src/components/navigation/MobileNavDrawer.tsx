"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  X,
  Store,
  Clock,
  FlaskConical,
  Package,
  Layers,
  Building2,
  TrendingUp,
  ShieldCheck,
  Users,
  FileText,
  Sliders,
  ChevronRight,
  Sun,
  Moon,
  HelpCircle,
  LogOut,
  Sparkles,
  Shield,
  Search,
} from "lucide-react";
import { useApotekStore } from "@/lib/store";
import { soundEngine } from "@/lib/audio";
import { destroySession } from "@/lib/auth/auth-service";

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenRoleModal?: () => void;
  onOpenHelp?: () => void;
  onOpenCmdK?: () => void;
}

export const MobileNavDrawer: React.FC<MobileNavDrawerProps> = ({
  isOpen,
  onClose,
  onOpenRoleModal,
  onOpenHelp,
  onOpenCmdK,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, currentShift, logout } = useApotekStore();

  if (!isOpen) return null;

  const isOwnerOrSuperAdmin =
    currentUser.role === "SUPER_ADMIN" || currentUser.role === "OWNER";
  const isApoteker =
    currentUser.role === "KARYAWAN_APOTEKER" || isOwnerOrSuperAdmin;

  const handleLogout = () => {
    soundEngine.playKeyTap();
    destroySession();
    logout();
    onClose();
    router.push("/login");
  };

  const navSections = [
    {
      title: "Operasional Kasir & Pelayanan",
      items: [
        {
          href: "/",
          label: "Kasir POS",
          badge: "F12 Bayar",
          desc: "Penjualan obat resep, OTC & checkout",
          icon: Store,
        },
        {
          href: "/shifts",
          label: "Shift & Rekonsiliasi Kas",
          badge: currentShift?.status === "OPEN" ? "Shift Aktif" : undefined,
          desc: "Buka/tutup kasir, blind count, X-Report",
          icon: Clock,
        },
        {
          href: "/compounding",
          label: "Peracikan Resep (Racikan)",
          badge: "F3 Racikan",
          desc: "Kalkulator DTD, tuslah, embalase & dosis anak",
          icon: FlaskConical,
        },
      ],
    },
    {
      title: "Manajemen Produk & Stok Gudang",
      items: [
        {
          href: "/products",
          label: "Katalog Obat & Master HPP",
          desc: "Daftar obat, barcode, penetapan HNA & harga jual",
          icon: Package,
        },
        {
          href: "/inventory",
          label: "Inventori & Batch FEFO",
          badge: "Radar ED",
          desc: "Pantau stok fisik, nomor batch, kartu stok",
          icon: Layers,
        },
        {
          href: "/procurement",
          label: "Pengadaan Obat (PBF)",
          desc: "Faktur masuk distributor & Surat Pesanan (SP)",
          icon: Building2,
        },
      ],
    },
    {
      title: "Laporan Finansial & Pasien",
      items: [
        {
          href: "/analytics",
          label: "Analitik Pendapatan & P&L",
          badge: "Laporan Formal",
          desc: "Grafik omzet per shift, harian, mingguan, P&L",
          icon: TrendingUp,
        },
        ...(isOwnerOrSuperAdmin
          ? [
              {
                href: "/owner",
                label: "Dashboard Eksekutif Owner",
                badge: "Owner PSA",
                desc: "Laba kotor real-time, valuasi aset apotek",
                icon: ShieldCheck,
              },
            ]
          : []),
        {
          href: "/crm",
          label: "Rekam Medis Pasien (PMR)",
          desc: "Riwayat alergi & pengingat WA obat rutin PRB",
          icon: Users,
        },
      ],
    },
    {
      title: "Kepatuhan Regulasi & Keamanan",
      items: [
        {
          href: "/regulatory",
          label: "Kepatuhan SATUSEHAT & SIPNAP",
          badge: "Kemenkes",
          desc: "Interoperabilitas HL7 FHIR & ekspor CSV SIPNAP",
          icon: FileText,
        },
        ...(isOwnerOrSuperAdmin
          ? [
              {
                href: "/users",
                label: "Kelola Staf & Hak Akses RBAC",
                badge: "Admin",
                desc: "Manajemen akun, PIN supervisor & audit log",
                icon: Sliders,
              },
            ]
          : []),
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 lg:hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => {
          soundEngine.playKeyTap();
          onClose();
        }}
      />

      {/* Drawer Panel */}
      <div className="fixed inset-y-0 right-0 w-full max-w-[340px] bg-white dark:bg-[#1C1C1E] shadow-2xl flex flex-col z-50 animate-in slide-in-from-right duration-250">
        {/* Header */}
        <div className="p-4 border-b border-black/[0.08] dark:border-white/[0.12] bg-gradient-to-r from-[#00575D] to-[#008B94] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 flex items-center justify-center">
              <Image
                src="/logo-white.png"
                alt="Logo Apotek"
                width={32}
                height={32}
                className="w-full h-full object-contain filter drop-shadow-sm"
              />
            </div>
            <div>
              <h3 className="text-[14px] font-bold tracking-tight leading-tight">
                Apotek Kerso Waras
              </h3>
              <p className="text-[11px] text-teal-100">Sistem Farmasi Terpadu</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              soundEngine.playKeyTap();
              onClose();
            }}
            className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
            title="Tutup Menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Card */}
        <div className="p-3.5 bg-neutral-50 dark:bg-neutral-900 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#008B94] text-white flex items-center justify-center font-bold text-[12px] shadow-sm">
              {currentUser.avatar}
            </div>
            <div className="leading-tight">
              <span className="text-[13px] font-bold text-[#1C1C1E] dark:text-white block truncate max-w-[170px]">
                {currentUser.name}
              </span>
              <span className="text-[10px] text-[#8E8E93] capitalize">
                {currentUser.role.replace(/_/g, " ").toLowerCase()}
              </span>
            </div>
          </div>

          {onOpenRoleModal && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenRoleModal();
              }}
              className="px-2.5 py-1 text-[11px] font-semibold rounded-[8px] bg-neutral-200 dark:bg-neutral-800 text-[#1C1C1E] dark:text-white hover:bg-neutral-300 transition-colors"
            >
              Ganti
            </button>
          )}
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 no-scrollbar">
          {navSections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E8E93] px-2 block">
                {section.title}
              </span>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => {
                        soundEngine.playKeyTap();
                        onClose();
                      }}
                      className={`w-full p-2.5 rounded-[12px] flex items-center justify-between text-left transition-all ${
                        isActive
                          ? "bg-[#008B94] text-white shadow-sm font-semibold"
                          : "text-[#1C1C1E] dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`p-1.5 rounded-[8px] shrink-0 ${
                            isActive
                              ? "bg-white/20 text-white"
                              : "bg-neutral-100 dark:bg-neutral-800 text-[#008B94]"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </span>
                        <div className="leading-tight truncate">
                          <span className="text-[12px] font-medium block truncate">
                            {item.label}
                          </span>
                          <span
                            className={`text-[10px] block truncate ${
                              isActive
                                ? "text-white/80"
                                : "text-[#8E8E93] dark:text-neutral-400"
                            }`}
                          >
                            {item.desc}
                          </span>
                        </div>
                      </div>

                      {item.badge && (
                        <span
                          className={`px-1.5 py-0.5 rounded-[6px] text-[9px] font-bold shrink-0 ml-2 ${
                            isActive
                              ? "bg-white/25 text-white"
                              : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="p-3 border-t border-black/[0.08] dark:border-white/[0.12] bg-neutral-50 dark:bg-neutral-900 space-y-2">
          {onOpenCmdK && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenCmdK();
              }}
              className="w-full py-2 px-3 rounded-[10px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] text-[12px] font-medium flex items-center justify-between text-[#1C1C1E] dark:text-white shadow-sm"
            >
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-[#008B94]" />
                <span>Cari Obat / ⌘K</span>
              </div>
              <span className="text-[10px] text-[#8E8E93] font-mono">⌘K</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            {onOpenHelp && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenHelp();
                }}
                className="flex-1 py-2 rounded-[10px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] text-[12px] font-semibold flex items-center justify-center gap-1.5 text-[#1C1C1E] dark:text-white shadow-sm"
              >
                <HelpCircle className="w-4 h-4 text-[#8E8E93]" />
                <span>Bantuan F1</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleLogout}
              className="flex-1 py-2 rounded-[10px] bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-[12px] font-semibold flex items-center justify-center gap-1.5 shadow-sm"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
