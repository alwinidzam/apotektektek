"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Store, Package, Building2, TrendingUp, Menu } from "lucide-react";
import { useApotekStore } from "@/lib/store";
import { soundEngine } from "@/lib/audio";

interface MobileTabBarProps {
  onOpenMobileMenu: () => void;
}

export const MobileTabBar: React.FC<MobileTabBarProps> = ({ onOpenMobileMenu }) => {
  const pathname = usePathname();
  const { currentUser, purchaseOrders } = useApotekStore();

  const isLevel1 =
    currentUser.role === "SUPER_ADMIN" || currentUser.role === "OWNER";
  const isLevel2 = currentUser.role === "KARYAWAN_APOTEKER" || isLevel1;
  const pendingPoCount = (purchaseOrders || []).filter(
    (po) => po.status === "MENUNGGU_PERSETUJUAN"
  ).length;

  const tabs = [
    {
      href: "/",
      label: "Kasir POS",
      icon: Store,
      isActive: pathname === "/",
    },
    {
      href: "/inventory",
      label: isLevel2 ? "Stok & Opname" : "Cek Stok",
      icon: Package,
      isActive: pathname === "/inventory" || pathname === "/products",
    },
    ...(isLevel2
      ? [
          {
            href: "/procurement",
            label: isLevel1 ? "Approve PO" : "Pesanan PO",
            icon: Building2,
            isActive: pathname === "/procurement",
            hasBadge: pendingPoCount > 0,
          },
        ]
      : []),
    ...(isLevel1
      ? [
          {
            href: "/owner",
            label: "Omzet",
            icon: TrendingUp,
            isActive: pathname === "/owner" || pathname === "/analytics",
          },
        ]
      : []),
  ];

  return (
    <nav
      aria-label="Mobile Bottom Navigation Bar"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-[#141416]/95 backdrop-blur-xl border-t border-neutral-200/80 dark:border-white/[0.08] px-2 py-1.5 flex items-center justify-around select-none"
      style={{ paddingBottom: "max(0.375rem, env(safe-area-inset-bottom))" }}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            onClick={() => soundEngine.playKeyTap()}
            className={`flex-1 py-1 px-1 rounded-[12px] flex flex-col items-center justify-center relative transition-all active:scale-95 ${
              tab.isActive
                ? "text-[#008B94] font-bold"
                : "text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white"
            }`}
          >
            <div className="relative">
              <Icon className="w-5 h-5 transition-transform" />
              {tab.hasBadge && (
                <span className="w-2 h-2 rounded-full bg-amber-500 absolute -top-0.5 -right-0.5 ring-2 ring-white dark:ring-[#1C1C1E]" />
              )}
            </div>
            <span className="text-[10px] tracking-tight mt-0.5 leading-none">
              {tab.label}
            </span>
            {tab.isActive && (
              <span className="w-4 h-0.5 bg-[#008B94] rounded-full mt-1" />
            )}
          </Link>
        );
      })}

      <button
        type="button"
        onClick={() => {
          soundEngine.playKeyTap();
          onOpenMobileMenu();
        }}
        className="flex-1 py-1 px-1 rounded-[12px] flex flex-col items-center justify-center relative transition-all active:scale-95 text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white"
      >
        <div className="w-5 h-5 flex items-center justify-center">
          <Menu className="w-5 h-5" />
        </div>
        <span className="text-[10px] tracking-tight mt-0.5 leading-none">
          Menu & RBAC
        </span>
      </button>
    </nav>
  );
};
