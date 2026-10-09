"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Store, Clock, Package, TrendingUp, Menu } from "lucide-react";
import { useApotekStore } from "@/lib/store";
import { soundEngine } from "@/lib/audio";

interface MobileTabBarProps {
  onOpenMobileMenu: () => void;
}

export const MobileTabBar: React.FC<MobileTabBarProps> = ({ onOpenMobileMenu }) => {
  const pathname = usePathname();
  const { currentShift } = useApotekStore();

  const isShiftOpen = currentShift && currentShift.status === "OPEN";

  const tabs = [
    {
      href: "/",
      label: "Kasir",
      icon: Store,
      isActive: pathname === "/",
    },
    {
      href: "/shifts",
      label: "Shift",
      icon: Clock,
      isActive: pathname === "/shifts",
      hasBadge: isShiftOpen,
    },
    {
      href: "/products",
      label: "Produk",
      icon: Package,
      isActive: pathname === "/products" || pathname === "/inventory",
    },
    {
      href: "/analytics",
      label: "Analitik",
      icon: TrendingUp,
      isActive: pathname === "/analytics" || pathname === "/owner",
    },
  ];

  return (
    <nav
      aria-label="Mobile Bottom Navigation Bar"
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-2xl border-t border-black/[0.08] dark:border-white/[0.12] px-2 py-1.5 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] flex items-center justify-around select-none"
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
                <span className="w-2 h-2 rounded-full bg-emerald-500 absolute -top-0.5 -right-0.5 ring-2 ring-white dark:ring-[#1C1C1E]" />
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

      {/* 5th Tab: Menu Lengkap (Opens Mobile Nav Drawer) */}
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
          Semua Menu
        </span>
      </button>
    </nav>
  );
};
