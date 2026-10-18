"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  X,
  Store,
  Clock,
  Package,
  Layers,
  Building2,
  TrendingUp,
  ShieldCheck,
  LogOut,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useApotekStore } from "@/lib/store";
import { soundEngine } from "@/lib/audio";
import { destroySession, getRbacLevelInfo } from "@/lib/auth/auth-service";

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
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const {
    currentUser,
    purchaseOrders,
    isOfflineSimulated,
    offlineQueueIds,
    toggleOfflineSimulation,
    logout,
  } = useApotekStore();

  if (!isOpen) return null;

  const isLevel1 =
    currentUser.role === "SUPER_ADMIN" || currentUser.role === "OWNER";
  const isLevel2 = currentUser.role === "KARYAWAN_APOTEKER" || isLevel1;
  const rbacInfo = getRbacLevelInfo(currentUser.role);

  const pendingPoCount = (purchaseOrders || []).filter(
    (po) => po.status === "MENUNGGU_PERSETUJUAN"
  ).length;

  const handleLogout = () => {
    soundEngine.playKeyTap();
    destroySession();
    logout();
    onClose();
    router.push("/login");
  };

  const navSections = [
    {
      title: "Pelayanan",
      items: [
        {
          href: "/",
          label: "Kasir POS",
          icon: Store,
        },
        {
          href: "/shifts",
          label: "Shift & Kas",
          icon: Clock,
        },
      ],
    },
    {
      title: "Gudang & Inventaris",
      items: [
        {
          href: "/inventory",
          label: isLevel2 ? "Stok & Opname" : "Cek Sisa Stok",
          icon: Package,
        },
        ...(isLevel2
          ? [
              {
                href: "/procurement",
                label: "Pesanan PO",
                badgeCount: pendingPoCount > 0 ? pendingPoCount : undefined,
                icon: Building2,
              },
              {
                href: "/products",
                label: "Katalog Obat",
                icon: Layers,
              },
            ]
          : []),
      ],
    },
    ...(isLevel1
      ? [
          {
            title: "Manajemen",
            items: [
              {
                href: "/owner",
                label: "Laporan & Omzet",
                icon: TrendingUp,
              },
              {
                href: "/users",
                label: "Hak Akses (RBAC)",
                icon: ShieldCheck,
              },
            ],
          },
        ]
      : []),
  ];

  return (
    <div className="fixed inset-0 z-50 lg:hidden animate-in fade-in duration-150">
      <div
        className="fixed inset-0 bg-black/45 backdrop-blur-xs"
        onClick={() => {
          soundEngine.playKeyTap();
          onClose();
        }}
      />

      <aside className="fixed inset-y-0 left-0 w-[264px] bg-[#FAFAFA] dark:bg-[#141416] border-r border-neutral-200 dark:border-neutral-800 shadow-xl flex flex-col z-50 animate-in slide-in-from-left duration-200">
        {/* Header */}
        <div className="h-14 px-4 border-b border-neutral-200/80 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#00767E] flex items-center justify-center p-1 shrink-0">
              <Image
                src="/logo-kerso-waras-white.svg"
                alt="Apotek Kerso Waras"
                width={22}
                height={22}
                unoptimized
                className="w-full h-full object-contain"
              />
            </div>
            <div className="leading-tight">
              <h3 className="text-[13.5px] font-bold text-neutral-900 dark:text-white tracking-tight">
                Kerso Waras
              </h3>
              <p className="text-[10.5px] text-neutral-500">Kedung, Jepara</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              soundEngine.playKeyTap();
              onClose();
            }}
            className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4">
          {navSections.map((section, idx) => (
            <div key={idx}>
              <h4 className="px-2.5 mb-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                {section.title}
              </h4>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    pathname === item.href ||
                    (item.href === "/owner" && pathname === "/analytics");
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => {
                        soundEngine.playKeyTap();
                        onClose();
                      }}
                      className={`flex items-center justify-between h-9 px-2.5 rounded-lg text-[13px] transition-colors ${
                        isActive
                          ? "bg-[#00767E]/10 dark:bg-[#008B94]/20 text-[#006067] dark:text-teal-300 font-semibold"
                          : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-white/[0.06] hover:text-neutral-900 dark:hover:text-white font-medium"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badgeCount !== undefined && item.badgeCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold font-mono bg-amber-500/15 text-amber-700 dark:text-amber-300">
                          {item.badgeCount}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-neutral-200/80 dark:border-neutral-800 space-y-2">
          <button
            type="button"
            onClick={() => toggleOfflineSimulation()}
            className="w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-[11.5px] font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-white/[0.06] transition-colors"
          >
            <span className="flex items-center gap-2">
              {isOfflineSimulated ? (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-amber-600 dark:text-amber-400 font-semibold">
                    Cache Lokal ({offlineQueueIds?.length || 0})
                  </span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Online &middot; Cache Aktif</span>
                </>
              )}
            </span>
            <Wifi className="w-3.5 h-3.5 text-neutral-400" />
          </button>

          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onOpenRoleModal) onOpenRoleModal();
              }}
              className="flex-1 flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-neutral-200/60 dark:hover:bg-white/[0.06] text-left min-w-0 transition-colors"
            >
              <div className="w-7 h-7 rounded-md bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-[11px] shrink-0">
                L{rbacInfo.level}
              </div>
              <div className="min-w-0 leading-tight">
                <p className="text-[12px] font-semibold text-neutral-900 dark:text-white truncate">
                  {currentUser.name}
                </p>
                <p className="text-[10.5px] text-neutral-500 truncate">
                  {rbacInfo.roleTitle}
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="p-2 rounded-lg text-neutral-500 hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
              title="Keluar"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
};
