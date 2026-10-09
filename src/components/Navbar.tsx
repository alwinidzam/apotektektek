"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  Store,
  Layers,
  FlaskConical,
  ShieldCheck,
  ClipboardList,
  Users,
  Search,
  Sliders,
  HelpCircle,
  Moon,
  Sun,
  Activity,
  ChevronDown,
  ChevronLeft,
  LogOut,
  Maximize2,
  Minimize2,
  Lock,
  Sparkles,
  Package,
  TrendingUp,
  FileText,
  Building2,
  CheckCircle2,
} from "lucide-react";
import { useApotekStore } from "@/lib/store";
import { soundEngine } from "@/lib/audio";
import { RoleSwitcherModal } from "./RoleSwitcherModal";
import { ShiftOpenModal } from "./pos/ShiftOpenModal";
import { ShiftCloseModal } from "./pos/ShiftCloseModal";
import { ShiftHandoverModal } from "./shifts/ShiftHandoverModal";
import { ShiftReportModal } from "./shifts/ShiftReportModal";
import { PettyCashModal } from "./shifts/PettyCashModal";
import { ShortcutHelpModal } from "./pos/ShortcutHelpModal";
import { CommandPalette } from "./CommandPalette";
import { DrawerShiftFlyout } from "./header/DrawerShiftFlyout";
import { SatuSehatSyncFlyout } from "./header/SatuSehatSyncFlyout";
import { FefoExpiryFlyout } from "./header/FefoExpiryFlyout";
import { MobileNavDrawer } from "./navigation/MobileNavDrawer";
import { MobileTabBar } from "./navigation/MobileTabBar";
import { Menu } from "lucide-react";

import { destroySession } from "@/lib/auth/auth-service";

interface NavbarProps {
  onOpenHelp?: () => void;
  onOpenCmdK?: () => void;
}

interface NavItem {
  href: string;
  label: string;
  icon?: React.ReactNode;
}

export function Navbar({ onOpenHelp, onOpenCmdK }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    densityMode,
    setDensityMode,
    currentUser,
    currentShift,
    logout,
  } = useApotekStore();

  const [isDark, setIsDark] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isShiftOpenModalOpen, setIsShiftOpenModalOpen] = useState(false);
  const [isShiftCloseModalOpen, setIsShiftCloseModalOpen] = useState(false);
  const [isHandoverModalOpen, setIsHandoverModalOpen] = useState(false);
  const [isXReportModalOpen, setIsXReportModalOpen] = useState(false);
  const [isPettyCashOpen, setIsPettyCashOpen] = useState(false);
  const [pettyCashType, setPettyCashType] = useState<"PAID_IN" | "PAID_OUT">("PAID_OUT");
  const [isHelpModalOpenInternal, setIsHelpModalOpenInternal] = useState(false);
  const [isCmdKOpenInternal, setIsCmdKOpenInternal] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Sync dark mode state with document
  useEffect(() => {
    if (typeof document !== "undefined") {
      setIsDark(document.documentElement.classList.contains("dark"));
    }
  }, []);

  // Close "Lainnya" dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    };
    if (isMoreMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMoreMenuOpen]);

  const toggleTheme = () => {
    soundEngine.playKeyTap();
    const root = document.documentElement;
    if (root.classList.contains("dark")) {
      root.classList.remove("dark");
      setIsDark(false);
    } else {
      root.classList.add("dark");
      setIsDark(true);
    }
  };

  const toggleDensity = () => {
    soundEngine.playKeyTap();
    setDensityMode(densityMode === "DENSE" ? "TOUCH" : "DENSE");
  };

  const handleLogout = () => {
    soundEngine.playKeyTap();
    destroySession();
    logout();
    router.push("/login");
  };

  const handleOpenHelp = () => {
    soundEngine.playKeyTap();
    if (onOpenHelp) {
      onOpenHelp();
    } else {
      setIsHelpModalOpenInternal(true);
    }
  };

  const handleOpenCmdK = () => {
    soundEngine.playKeyTap();
    if (onOpenCmdK) {
      onOpenCmdK();
    } else {
      setIsCmdKOpenInternal(true);
    }
  };

  const handleOpenPettyCash = (type: "PAID_IN" | "PAID_OUT") => {
    soundEngine.playKeyTap();
    setPettyCashType(type);
    setIsPettyCashOpen(true);
  };

  const handleOpenXReport = () => {
    soundEngine.playKeyTap();
    setIsXReportModalOpen(true);
  };

  // Role-Aware Navigation Tabs with Priority+ Pattern (Zero Horizontal Cutoff)
  const getNavItems = (): {
    primary: NavItem[];
    extended: NavItem[];
    dropdown: (NavItem & { isExtended?: boolean })[];
  } => {
    const role = currentUser.role;

    if (role === "KARYAWAN_KASIR") {
      return {
        primary: [
          { href: "/", label: "Kasir POS", icon: <Store className="w-3.5 h-3.5" /> },
          { href: "/shifts", label: "Shift & Kas", icon: <ClipboardList className="w-3.5 h-3.5" /> },
        ],
        extended: [
          { href: "/inventory", label: "Cek Stok FEFO", icon: <Package className="w-3.5 h-3.5" /> },
        ],
        dropdown: [
          { href: "/inventory", label: "Cek Stok FEFO", icon: <Package className="w-3.5 h-3.5" />, isExtended: true },
        ],
      };
    }

    if (role === "OWNER") {
      return {
        primary: [
          { href: "/owner", label: "Owner Suite", icon: <TrendingUp className="w-3.5 h-3.5" /> },
          { href: "/analytics", label: "Analitik & P&L", icon: <TrendingUp className="w-3.5 h-3.5" /> },
        ],
        extended: [
          { href: "/shifts", label: "Audit Shift", icon: <ClipboardList className="w-3.5 h-3.5" /> },
          { href: "/products", label: "Produk & HPP", icon: <Layers className="w-3.5 h-3.5" /> },
        ],
        dropdown: [
          { href: "/shifts", label: "Audit Shift", icon: <ClipboardList className="w-3.5 h-3.5" />, isExtended: true },
          { href: "/products", label: "Produk & HPP", icon: <Layers className="w-3.5 h-3.5" />, isExtended: true },
          { href: "/", label: "Kasir POS", icon: <Store className="w-3.5 h-3.5" /> },
          { href: "/inventory", label: "Valuasi Stok FEFO", icon: <Package className="w-3.5 h-3.5" /> },
          { href: "/procurement", label: "Pengadaan PBF", icon: <Building2 className="w-3.5 h-3.5" /> },
          { href: "/crm", label: "PMR & CRM Pasien", icon: <Users className="w-3.5 h-3.5" /> },
          { href: "/users", label: "Kelola User & Staff", icon: <Users className="w-3.5 h-3.5" /> },
        ],
      };
    }

    if (role === "KARYAWAN_APOTEKER") {
      return {
        primary: [
          { href: "/", label: "Kasir POS", icon: <Store className="w-3.5 h-3.5" /> },
          { href: "/compounding", label: "Resep Racikan", icon: <FlaskConical className="w-3.5 h-3.5" /> },
        ],
        extended: [
          { href: "/products", label: "Master Produk", icon: <Layers className="w-3.5 h-3.5" /> },
          { href: "/shifts", label: "Shift Kasir", icon: <ClipboardList className="w-3.5 h-3.5" /> },
        ],
        dropdown: [
          { href: "/products", label: "Master Produk", icon: <Layers className="w-3.5 h-3.5" />, isExtended: true },
          { href: "/shifts", label: "Shift Kasir", icon: <ClipboardList className="w-3.5 h-3.5" />, isExtended: true },
          { href: "/analytics", label: "Laporan Omzet", icon: <TrendingUp className="w-3.5 h-3.5" /> },
          { href: "/inventory", label: "Batch & FEFO", icon: <Package className="w-3.5 h-3.5" /> },
          { href: "/regulatory", label: "SIPNAP & Kemenkes", icon: <ShieldCheck className="w-3.5 h-3.5" /> },
          { href: "/procurement", label: "Pengadaan PBF", icon: <Building2 className="w-3.5 h-3.5" /> },
          { href: "/crm", label: "PMR Pasien", icon: <Users className="w-3.5 h-3.5" /> },
        ],
      };
    }

    // SUPER_ADMIN
    return {
      primary: [
        { href: "/", label: "Kasir POS", icon: <Store className="w-3.5 h-3.5" /> },
        { href: "/shifts", label: "Shift & Kas", icon: <ClipboardList className="w-3.5 h-3.5" /> },
      ],
      extended: [
        { href: "/analytics", label: "Analitik & P&L", icon: <TrendingUp className="w-3.5 h-3.5" /> },
        { href: "/owner", label: "Owner Suite", icon: <TrendingUp className="w-3.5 h-3.5" /> },
      ],
      dropdown: [
        { href: "/analytics", label: "Analitik & P&L", icon: <TrendingUp className="w-3.5 h-3.5" />, isExtended: true },
        { href: "/owner", label: "Owner Suite", icon: <TrendingUp className="w-3.5 h-3.5" />, isExtended: true },
        { href: "/products", label: "Produk & HPP", icon: <Layers className="w-3.5 h-3.5" /> },
        { href: "/users", label: "Kelola User & Staff", icon: <Users className="w-3.5 h-3.5" /> },
        { href: "/inventory", label: "FEFO Stok", icon: <Package className="w-3.5 h-3.5" /> },
        { href: "/compounding", label: "Resep Racikan", icon: <FlaskConical className="w-3.5 h-3.5" /> },
        { href: "/regulatory", label: "Regulasi Kemenkes", icon: <ShieldCheck className="w-3.5 h-3.5" /> },
        { href: "/procurement", label: "Pengadaan PBF", icon: <Building2 className="w-3.5 h-3.5" /> },
        { href: "/crm", label: "PMR & CRM", icon: <Users className="w-3.5 h-3.5" /> },
      ],
    };
  };

  const { primary: primaryNav, extended: extendedNav, dropdown: dropdownNav } = getNavItems();
  const isDropdownActive = dropdownNav.some((item) => item.href === pathname);

  const getRoleShortLabel = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "Super Admin";
      case "OWNER":
        return "Owner / PSA";
      case "KARYAWAN_APOTEKER":
        return "Apoteker (APJ)";
      case "KARYAWAN_KASIR":
        return "Kasir Shift";
      default:
        return role;
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full max-w-full bg-gradient-to-r from-[#00575D] via-[#00767E] to-[#008B94] dark:from-[#00272B] dark:via-[#003439] dark:to-[#00474E] text-white border-b border-teal-400/25 shadow-md shadow-[#00575D]/15 backdrop-blur-2xl transition-colors">
        <div className="w-full max-w-full px-2 sm:px-4 h-16 flex items-center justify-between gap-1.5 sm:gap-2 min-w-0">
          {/* Brand Logo & Mobile Menu Toggle */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 min-w-0">
            {/* Mobile Apple HIG Back Button (when inside subpages) */}
            {pathname !== "/" && (
              <button
                type="button"
                onClick={() => {
                  soundEngine.playKeyTap();
                  if (typeof window !== "undefined" && window.history.length > 1) {
                    router.back();
                  } else {
                    router.push("/");
                  }
                }}
                className="lg:hidden flex items-center gap-1 px-2.5 py-1.5 rounded-[10px] bg-white/20 hover:bg-white/25 active:bg-white/30 text-white border border-white/25 font-semibold text-[12px] active:scale-95 transition-all shrink-0 shadow-sm"
                title="Kembali ke halaman sebelumnya"
              >
                <ChevronLeft className="w-4 h-4 -ml-1 text-white stroke-[2.5]" />
                <span>Kembali</span>
              </button>
            )}

            {/* Mobile Hamburger Menu Button (Apple HIG Quick Sheet Trigger) */}
            <button
              type="button"
              onClick={() => {
                soundEngine.playKeyTap();
                setIsMobileMenuOpen(true);
              }}
              className="lg:hidden p-2 rounded-[10px] bg-black/25 hover:bg-black/35 text-white border border-white/20 transition-all flex items-center justify-center shrink-0 active:scale-95"
              title="Buka Menu Lengkap Apotek (10 Modul)"
            >
              <Menu className="w-4 h-4 text-white" />
            </button>

            <Link
              href="/"
              onClick={() => soundEngine.playKeyTap()}
              className="flex items-center gap-2 sm:gap-2.5 shrink-0 group focus:outline-none min-w-0"
            >
              {/* Pure White Brand Logo without background container */}
              <div className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
                <Image
                  src="/logo-kerso-waras-white.svg"
                  alt="Logo Apotek Kerso Waras"
                  width={36}
                  height={50}
                  priority
                  unoptimized
                  className="w-full h-full object-contain filter drop-shadow-sm"
                />
              </div>
              <div className="leading-tight shrink-0">
                <span
                  className={`font-bold text-[14px] sm:text-[15px] tracking-tight text-white drop-shadow-sm whitespace-nowrap block ${
                    pathname !== "/" ? "hidden md:block" : ""
                  }`}
                >
                  Apotek Kerso Waras
                </span>
                <p className="hidden 2xl:block text-[11px] text-teal-100/90 font-medium truncate max-w-[210px]">
                  Kedung, Jepara
                </p>
              </div>
            </Link>
          </div>

          {/* Center Navigation Tabs (Apple HIG Liquid Glass Segmented Control with Priority+) */}
          <nav className="hidden lg:flex items-center gap-1 bg-black/20 backdrop-blur-md p-1 rounded-[14px] border border-white/15 shadow-inner shrink-0">
            {/* Primary Nav Items (Always in Bar on lg+) */}
            {primaryNav.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => soundEngine.playKeyTap()}
                  className={`
                    whitespace-nowrap px-3 py-1.5 rounded-[10px] text-[12px] transition-all duration-150 flex items-center gap-1.5
                    ${
                      isActive
                        ? "bg-white text-[#00575D] shadow-[0_2px_8px_rgba(0,0,0,0.15)] font-bold scale-[1.02]"
                        : "text-teal-100/90 hover:text-white hover:bg-white/10 font-medium"
                    }
                  `}
                >
                  <span className={isActive ? "text-[#00575D]" : "text-teal-200"}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {/* Extended Nav Items (Visible in Bar on 2xl+, tucked in Lainnya on < 2xl) */}
            {extendedNav.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => soundEngine.playKeyTap()}
                  className={`
                    hidden 2xl:flex whitespace-nowrap px-3 py-1.5 rounded-[10px] text-[12px] transition-all duration-150 items-center gap-1.5
                    ${
                      isActive
                        ? "bg-white text-[#00575D] shadow-[0_2px_8px_rgba(0,0,0,0.15)] font-bold scale-[1.02]"
                        : "text-teal-100/90 hover:text-white hover:bg-white/10 font-medium"
                    }
                  `}
                >
                  <span className={isActive ? "text-[#00575D]" : "text-teal-200"}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {/* "Lainnya" Priority+ Dropdown Menu */}
            {dropdownNav.length > 0 && (
              <div className="relative" ref={moreMenuRef}>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playKeyTap();
                    setIsMoreMenuOpen((prev) => !prev);
                  }}
                  className={`
                    whitespace-nowrap px-2.5 sm:px-3 py-1.5 rounded-[10px] text-[12px] transition-all duration-150 flex items-center gap-1
                    ${
                      isDropdownActive
                        ? "bg-white text-[#00575D] shadow-[0_2px_8px_rgba(0,0,0,0.15)] font-bold"
                        : "text-teal-100/90 hover:text-white hover:bg-white/10 font-medium"
                    }
                  `}
                >
                  <span>Lainnya</span>
                  {isDropdownActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00575D]" />
                  )}
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      isMoreMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isMoreMenuOpen && (
                  <div className="absolute left-0 mt-2 w-52 bg-white dark:bg-[#1C1C1E] rounded-[16px] shadow-[0_12px_40px_rgba(0,0,0,0.25)] border border-black/[0.08] dark:border-white/[0.12] p-1.5 z-50 text-[#1C1C1E] dark:text-white animate-in fade-in zoom-in-95 duration-150">
                    {dropdownNav.map((subItem) => {
                      const isSubActive = pathname === subItem.href;
                      return (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          onClick={() => {
                            soundEngine.playKeyTap();
                            setIsMoreMenuOpen(false);
                          }}
                          className={`
                            ${subItem.isExtended ? "flex 2xl:hidden" : "flex"} items-center gap-2.5 px-3 py-2 rounded-[10px] text-[12px] font-medium transition-colors
                            ${
                              isSubActive
                                ? "bg-[#008B94]/10 dark:bg-[#008B94]/25 text-[#00767E] dark:text-teal-300 font-bold"
                                : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-black dark:hover:text-white"
                            }
                          `}
                        >
                          <span className={isSubActive ? "text-[#008B94]" : "text-neutral-400"}>
                            {subItem.icon}
                          </span>
                          <span>{subItem.label}</span>
                          {isSubActive && (
                            <CheckCircle2 className="w-3.5 h-3.5 ml-auto text-[#008B94]" />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </nav>

          {/* Right Section: High-End Pharmacy Engines & Quick Action Tools */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 min-w-0">
            {/* Omnisearch Pill (⌘K) - Icon-only on < 2xl, Full Pill on 2xl+ */}
            <button
              type="button"
              onClick={handleOpenCmdK}
              className="hidden lg:inline-flex items-center gap-1.5 px-2 2xl:px-3 py-1.5 text-[11px] font-medium rounded-[12px] bg-black/20 hover:bg-black/30 text-teal-100 hover:text-white border border-white/20 transition-all shadow-sm backdrop-blur-md"
              title="Cari Cepat Obat, Batch, Resep & Pasien (⌘K)"
            >
              <Search className="w-3.5 h-3.5 text-teal-200" />
              <span className="hidden 2xl:inline">Cari (⌘K)</span>
            </button>

            {/* FEFO Expiry Radar Widget */}
            <FefoExpiryFlyout />

            {/* SATUSEHAT Kemenkes & BPJS Heartbeat Widget */}
            <SatuSehatSyncFlyout />

            {/* Live Shift & Cash Drawer Engine Widget */}
            <DrawerShiftFlyout
              onOpenPettyCash={handleOpenPettyCash}
              onOpenShiftOpen={() => {
                soundEngine.playKeyTap();
                setIsShiftOpenModalOpen(true);
              }}
              onOpenShiftClose={() => {
                soundEngine.playKeyTap();
                setIsShiftCloseModalOpen(true);
              }}
              onOpenHandover={() => {
                soundEngine.playKeyTap();
                setIsHandoverModalOpen(true);
              }}
              onOpenXReport={handleOpenXReport}
            />

            {/* Staff Profile & Role Switcher Pill - Avatar-only on < 2xl, Full Info on 2xl+ */}
            <button
              type="button"
              onClick={() => {
                soundEngine.playKeyTap();
                setIsRoleModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-2 2xl:px-2.5 py-1.5 rounded-[12px] bg-black/25 hover:bg-black/35 border border-white/20 text-white transition-all shadow-sm backdrop-blur-md shrink-0"
              title="Ganti Peran Pengguna / Role Switcher"
            >
              <div className="w-6 h-6 rounded-full bg-white text-[#00575D] flex items-center justify-center text-[10px] font-bold shadow-sm shrink-0">
                {currentUser.avatar}
              </div>
              <div className="hidden 2xl:flex flex-col text-left">
                <span className="text-[12px] font-semibold leading-tight text-white max-w-[90px] truncate">
                  {currentUser.name}
                </span>
                <span className="text-[10px] text-teal-200 leading-none">
                  {getRoleShortLabel(currentUser.role)}
                </span>
              </div>
              <ChevronDown className="w-3 h-3 text-teal-200" />
            </button>

            {/* Quick Action Utilities Divider */}
            <div className="hidden xl:block w-px h-5 bg-white/20 mx-0.5" />

            {/* Shortcut Help (F1) */}
            <button
              type="button"
              onClick={handleOpenHelp}
              className="p-1.5 text-teal-100 hover:text-white rounded-[8px] hover:bg-white/10 transition-colors"
              title="Panduan Pintasan Tombol Keyboard (F1)"
            >
              <HelpCircle className="h-4 w-4" />
            </button>

            {/* Dark / Light Mode Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-1.5 text-teal-100 hover:text-white rounded-[8px] hover:bg-white/10 transition-colors"
              title="Ganti Tema Gelap / Terang"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* Screen Density Switcher (Dense vs Comfortable) */}
            <button
              type="button"
              onClick={toggleDensity}
              className="hidden 2xl:flex p-1.5 text-teal-100 hover:text-white rounded-[8px] hover:bg-white/10 transition-colors"
              title={
                densityMode === "DENSE"
                  ? "Mode Layar: DENSE (Padat). Klik untuk beralih ke Mode Sentuh (TOUCH)"
                  : "Mode Layar: SENTUH (TOUCH). Klik untuk beralih ke Mode Padat POS"
              }
            >
              {densityMode === "DENSE" ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </button>

            {/* Safe Logout Button */}
            <button
              type="button"
              onClick={handleLogout}
              className="p-1.5 text-teal-200 hover:text-rose-200 rounded-[8px] hover:bg-rose-500/20 transition-colors"
              title="Keluar / Logout Akun"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Role Switcher Modal */}
      <RoleSwitcherModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
      />

      {/* Shift Open Modal */}
      <ShiftOpenModal
        isOpen={isShiftOpenModalOpen}
        onClose={() => setIsShiftOpenModalOpen(false)}
      />

      {/* Shift Close Modal */}
      <ShiftCloseModal
        isOpen={isShiftCloseModalOpen}
        onClose={() => setIsShiftCloseModalOpen(false)}
      />

      {/* Shift Handover (Ganti Shift) Modal */}
      <ShiftHandoverModal
        isOpen={isHandoverModalOpen}
        onClose={() => setIsHandoverModalOpen(false)}
      />

      {/* X-Report Modal */}
      {currentShift && (
        <ShiftReportModal
          isOpen={isXReportModalOpen}
          onClose={() => setIsXReportModalOpen(false)}
          shift={currentShift}
          reportType="X_REPORT"
        />
      )}

      {/* Petty Cash (Kas Masuk / Kas Keluar) Modal */}
      <PettyCashModal
        isOpen={isPettyCashOpen}
        onClose={() => setIsPettyCashOpen(false)}
        defaultType={pettyCashType}
      />

      {/* Internal Fallback Shortcut Help Modal */}
      <ShortcutHelpModal
        isOpen={isHelpModalOpenInternal}
        onClose={() => setIsHelpModalOpenInternal(false)}
      />

      {/* Internal Fallback Command Palette */}
      <CommandPalette
        isOpen={isCmdKOpenInternal}
        onClose={() => setIsCmdKOpenInternal(false)}
      />

      {/* Apple HIG Mobile Full-Module Navigation Drawer */}
      <MobileNavDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        onOpenRoleModal={() => setIsRoleModalOpen(true)}
        onOpenHelp={handleOpenHelp}
        onOpenCmdK={handleOpenCmdK}
      />

      {/* Apple iOS Persistent Bottom Tab Bar */}
      <MobileTabBar onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />
    </>
  );
}
