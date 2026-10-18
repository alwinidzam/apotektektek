"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  Store,
  Layers,
  ShieldCheck,
  Clock,
  Search,
  Moon,
  Sun,
  ChevronDown,
  ChevronRight,
  LogOut,
  Package,
  TrendingUp,
  Building2,
  Wifi,
  WifiOff,
  RefreshCw,
  Database,
  PanelLeft,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  AlertTriangle,
  ArrowRightLeft,
  HelpCircle,
  ShoppingBag,
  FileText,
  Truck,
  ClipboardCheck,
  Coins,
  Calculator,
  Archive,
  FileSpreadsheet,
  Users,
  KeyRound,
  Activity,
  CheckCircle2,
  PackageCheck,
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
import { MobileNavDrawer } from "./navigation/MobileNavDrawer";
import { MobileTabBar } from "./navigation/MobileTabBar";
import { destroySession, getRbacLevelInfo, saveSession } from "@/lib/auth/auth-service";
import { INITIAL_STAFF_ACCOUNTS } from "@/lib/firebase/users";
import { showAppleToast } from "./ui/AppleToast";

interface NavbarProps {
  onOpenHelp?: () => void;
  onOpenCmdK?: () => void;
}

export function Navbar({ onOpenHelp, onOpenCmdK }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    products,
    currentUser,
    setCurrentUser,
    currentShift,
    purchaseOrders,
    heldBills,
    isOfflineSimulated,
    offlineQueueIds,
    lastCacheSyncAt,
    lastSearchLatencyMs,
    toggleOfflineSimulation,
    syncOfflineCacheNow,
    logout,
  } = useApotekStore();

  const [isDark, setIsDark] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isAlertsExpanded, setIsAlertsExpanded] = useState(true);
  const [isRbacTreeExpanded, setIsRbacTreeExpanded] = useState(true);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isShiftOpenModalOpen, setIsShiftOpenModalOpen] = useState(false);
  const [isShiftCloseModalOpen, setIsShiftCloseModalOpen] = useState(false);
  const [isHandoverModalOpen, setIsHandoverModalOpen] = useState(false);
  const [isXReportModalOpen, setIsXReportModalOpen] = useState(false);
  const [isPettyCashOpen, setIsPettyCashOpen] = useState(false);
  const [pettyCashType, setPettyCashType] = useState<"PAID_IN" | "PAID_OUT">("PAID_OUT");
  const [isHelpModalOpenInternal, setIsHelpModalOpenInternal] = useState(false);
  const [isCmdKOpenInternal, setIsCmdKOpenInternal] = useState(false);
  const [isCachePopoverOpen, setIsCachePopoverOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const cachePopoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof document !== "undefined") {
      setIsDark(document.documentElement.classList.contains("dark"));
      const savedCollapse = localStorage.getItem("kw_sidebar_collapsed");
      if (savedCollapse === "true") {
        setIsSidebarCollapsed(true);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.dataset.sidebar = isSidebarCollapsed
        ? "collapsed"
        : "expanded";
    }
    return () => {
      if (typeof document !== "undefined") {
        delete document.documentElement.dataset.sidebar;
      }
    };
  }, [isSidebarCollapsed]);

  const toggleSidebarCollapse = () => {
    soundEngine.playKeyTap();
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("kw_sidebar_collapsed", String(next));
      }
      return next;
    });
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (cachePopoverRef.current && !cachePopoverRef.current.contains(e.target as Node)) {
        setIsCachePopoverOpen(false);
      }
    };
    if (isCachePopoverOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isCachePopoverOpen]);

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

  // Real-time operational metrics for the Secondary Sidebar
  const operationalCounts = useMemo(() => {
    const realProducts = (products || []).filter((p) => !p.id.startsWith("pkg-"));
    let lowStock = 0;
    let outOfStock = 0;
    let expiring30to60 = 0;
    const now = Date.now();

    for (const p of realProducts) {
      const totalStock = p.batches.reduce((acc, b) => acc + b.currentStock, 0);
      const minThreshold = p.minStockAlert ?? 25;
      if (totalStock === 0) {
        outOfStock++;
      }
      if (totalStock <= minThreshold) {
        lowStock++;
      }
      for (const b of p.batches) {
        if (b.currentStock <= 0) continue;
        const daysLeft = Math.ceil(
          (new Date(b.expiryDate).getTime() - now) / (1000 * 60 * 60 * 24)
        );
        if (daysLeft <= 60) {
          expiring30to60++;
        }
      }
    }

    return { lowStock, outOfStock, expiring30to60 };
  }, [products]);

  const pendingPoCount = (purchaseOrders || []).filter(
    (po) => po.status === "MENUNGGU_PERSETUJUAN"
  ).length;
  const approvedPoCount = (purchaseOrders || []).filter(
    (po) => po.status === "DISETUJUI_PEMILIK"
  ).length;

  const isLevel1 =
    currentUser.role === "SUPER_ADMIN" || currentUser.role === "OWNER";
  const isLevel2 = currentUser.role === "KARYAWAN_APOTEKER" || isLevel1;
  const rbacInfo = getRbacLevelInfo(currentUser.role);

  const handleQuickSwitchRbac = (level: 1 | 2 | 3) => {
    soundEngine.playCheckoutChime();
    const targetRole =
      level === 1 ? "OWNER" : level === 2 ? "KARYAWAN_APOTEKER" : "KARYAWAN_KASIR";
    const staff =
      INITIAL_STAFF_ACCOUNTS.find((a) => a.role === targetRole) ||
      INITIAL_STAFF_ACCOUNTS[level];
    const titleLabel =
      level === 1
        ? "Level 1 — Akses Penuh (Pemilik Apotek)"
        : level === 2
        ? "Level 2 — Akses Menengah (Petugas Gudang)"
        : "Level 3 — Akses Terbatas (Kasir)";
    const targetRoute =
      level === 1 ? "/owner" : level === 2 ? "/inventory" : "/";

    saveSession(staff);
    setCurrentUser({
      id: staff.uid,
      name: staff.displayName,
      username: staff.username,
      email: staff.email,
      role: staff.role,
      title: titleLabel,
      avatar: staff.avatar,
      sipaNumber: staff.pharmacistDetails?.sipaNumber,
    });

    showAppleToast({
      type: "success",
      title: `Aktif: Level ${level}`,
      message: `${staff.displayName} (${titleLabel})`,
    });

    router.push(targetRoute);
  };

  type DomainKey = "kasir" | "gudang" | "pesanan" | "katalog" | "shift" | "omzet" | "akses";

  const getDomainFromPath = (path: string): DomainKey => {
    if (path === "/") return "kasir";
    if (path.startsWith("/inventory")) return "gudang";
    if (path.startsWith("/procurement")) return "pesanan";
    if (path.startsWith("/products")) return "katalog";
    if (path.startsWith("/shifts")) return "shift";
    if (path.startsWith("/owner") || path.startsWith("/analytics")) return "omzet";
    if (path.startsWith("/users")) return "akses";
    return "kasir";
  };

  const currentDomain = getDomainFromPath(pathname);

  // Far-Left Primary App Rail items (ClickUp 4.0 vertical dock style - Image 1: Simple Sidebar)
  const primaryRailItems: Array<{
    key: DomainKey;
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badgeCount?: number;
    badgeDot?: boolean;
  }> = [
    { key: "kasir", href: "/", label: "Kasir", icon: Store },
    {
      key: "gudang",
      href: "/inventory",
      label: "Gudang",
      icon: Package,
      badgeDot: operationalCounts.expiring30to60 > 0,
    },
    ...(isLevel2
      ? [
          {
            key: "pesanan" as DomainKey,
            href: "/procurement",
            label: "Pesanan",
            icon: Building2,
            badgeCount: isLevel1 ? pendingPoCount : approvedPoCount,
          },
          {
            key: "katalog" as DomainKey,
            href: "/products",
            label: "Katalog",
            icon: Layers,
          },
        ]
      : []),
    { key: "shift", href: "/shifts", label: "Shift", icon: Clock },
    ...(isLevel1
      ? [
          {
            key: "omzet" as DomainKey,
            href: "/owner",
            label: "Omzet",
            icon: TrendingUp,
          },
          {
            key: "akses" as DomainKey,
            href: "/users",
            label: "Akses",
            icon: ShieldCheck,
          },
        ]
      : []),
  ];

  const getPageBreadcrumb = () => {
    if (pathname === "/") return { section: "Pelayanan", page: "Kasir Penjualan" };
    if (pathname === "/inventory")
      return {
        section: "Gudang",
        page: isLevel2 ? "Stok & Opname" : "Cek Sisa Stok Obat",
      };
    if (pathname === "/procurement")
      return { section: "Pengadaan", page: "Pesanan Barang (PO)" };
    if (pathname === "/products")
      return { section: "Katalog", page: "Daftar & Harga Obat" };
    if (pathname === "/shifts")
      return { section: "Kasir", page: "Shift & Rekapitulasi Kas" };
    if (pathname === "/owner" || pathname === "/analytics")
      return { section: "Manajemen", page: "Laporan & Omzet" };
    if (pathname === "/users")
      return { section: "Pengaturan", page: "Pengguna & Hak Akses" };
    return { section: "Apotek Kerso Waras", page: "Ruang Kerja" };
  };

  const breadcrumb = getPageBreadcrumb();

  const getSubMenuHeaderInfo = () => {
    switch (currentDomain) {
      case "kasir":
        return {
          title: "Kasir POS",
          ctaText: "Laci Kas",
          ctaHref: "#",
          onCtaClick: () => setIsPettyCashOpen(true),
        };
      case "gudang":
        return {
          title: "Gudang & Stok",
          ctaText: "Masuk",
          ctaHref: "/inventory?tab=masuk",
          onCtaClick: undefined,
        };
      case "pesanan":
        return {
          title: "Pengadaan (PO)",
          ctaText: "Buat PO",
          ctaHref: "/procurement?action=new",
          onCtaClick: undefined,
        };
      case "katalog":
        return {
          title: "Katalog Obat",
          ctaText: "Obat Baru",
          ctaHref: "/products?action=new",
          onCtaClick: undefined,
        };
      case "shift":
        return {
          title: "Shift & Kas",
          ctaText: "Tutup Shift",
          ctaHref: "#",
          onCtaClick: () => setIsShiftCloseModalOpen(true),
        };
      case "omzet":
        return {
          title: "Laporan Pemilik",
          ctaText: "Cetak Rekap",
          ctaHref: "#",
          onCtaClick: () => {
            if (typeof window !== "undefined") window.print();
          },
        };
      case "akses":
        return {
          title: "Akses & Staf",
          ctaText: "Staf Baru",
          ctaHref: "/users?action=new",
          onCtaClick: undefined,
        };
      default:
        return {
          title: "Navigasi Apotek",
          ctaText: "Buka Kasir",
          ctaHref: "/",
          onCtaClick: undefined,
        };
    }
  };

  const subMenuHeader = getSubMenuHeaderInfo();

  const renderSubMenuContent = () => {
    switch (currentDomain) {
      case "kasir":
        return (
          <>
            <div>
              <div className="px-2 mb-1.5 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                  Mode Layanan
                </span>
              </div>
              <div className="space-y-0.5">
                <Link
                  href="/?mode=swamedikasi"
                  onClick={() => soundEngine.playKeyTap()}
                  className={`flex items-center justify-between h-[30px] px-2 rounded-[7px] text-[12px] transition-colors ${
                    pathname === "/"
                      ? "bg-[#00767E]/12 dark:bg-[#008B94]/20 text-[#006067] dark:text-teal-300 font-semibold"
                      : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-white/[0.05] hover:text-neutral-900 dark:hover:text-white font-medium"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Store className="w-3.5 h-3.5 text-[#00767E] shrink-0" />
                    <span className="truncate">Swamedikasi (Bebas)</span>
                  </div>
                  <span className="px-1.5 py-0.2 rounded text-[9.5px] font-mono font-bold bg-[#00767E]/10 text-[#006067] dark:text-teal-300">
                    F2
                  </span>
                </Link>

                <Link
                  href="/?mode=resep"
                  onClick={() => soundEngine.playKeyTap()}
                  className="flex items-center justify-between h-[30px] px-2 rounded-[7px] text-[12px] text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-white/[0.05] hover:text-neutral-900 dark:hover:text-white font-medium transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span className="truncate">Resep Dokter (Klinis)</span>
                  </div>
                </Link>
              </div>
            </div>

            <div>
              <div className="px-2 mb-1.5 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                  Antrean & Struk
                </span>
              </div>
              <div className="space-y-0.5">
                <Link
                  href="/?view=held"
                  onClick={() => soundEngine.playKeyTap()}
                  className="flex items-center justify-between h-[30px] px-2 rounded-[7px] text-[12px] text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-white/[0.05] hover:text-neutral-900 dark:hover:text-white font-medium transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="truncate">Antrean Tertunda</span>
                  </div>
                  {heldBills.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300">
                      {heldBills.length}
                    </span>
                  )}
                </Link>

                <Link
                  href="/shifts?tab=riwayat"
                  onClick={() => soundEngine.playKeyTap()}
                  className="flex items-center justify-between h-[30px] px-2 rounded-[7px] text-[12px] text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-white/[0.05] hover:text-neutral-900 dark:hover:text-white font-medium transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <ClipboardCheck className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    <span className="truncate">Riwayat Struk & Etiket</span>
                  </div>
                </Link>
              </div>
            </div>

            <div>
              <div className="px-2 mb-1.5 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                  Pintasan Laci Kas
                </span>
              </div>
              <div className="space-y-0.5">
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playKeyTap();
                    setIsPettyCashOpen(true);
                  }}
                  className="w-full flex items-center justify-between h-[30px] px-2 rounded-[7px] text-[12px] text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-white/[0.05] hover:text-neutral-900 dark:hover:text-white font-medium transition-colors text-left"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Coins className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span className="truncate">Kas Kecil (Petty Cash)</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleOpenHelp}
                  className="w-full flex items-center justify-between h-[30px] px-2 rounded-[7px] text-[12px] text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-white/[0.05] hover:text-neutral-900 dark:hover:text-white font-medium transition-colors text-left"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <HelpCircle className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    <span className="truncate">Bantuan Pintasan</span>
                  </div>
                  <kbd className="font-mono text-[9.5px] px-1 rounded bg-neutral-200/80 dark:bg-white/10 text-neutral-600 dark:text-neutral-300">
                    F1
                  </kbd>
                </button>
              </div>
            </div>
          </>
        );

      case "gudang":
        return (
          <>
            <div>
              <div className="px-2 mb-1.5 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                  Modul Gudang
                </span>
              </div>
              <div className="space-y-0.5">
                <Link
                  href="/inventory?tab=rak"
                  onClick={() => soundEngine.playKeyTap()}
                  className={`flex items-center justify-between h-[30px] px-2 rounded-[7px] text-[12px] transition-colors ${
                    pathname === "/inventory"
                      ? "bg-[#00767E]/12 dark:bg-[#008B94]/20 text-[#006067] dark:text-teal-300 font-semibold"
                      : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-white/[0.05] hover:text-neutral-900 dark:hover:text-white font-medium"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Package className="w-3.5 h-3.5 text-[#00767E] shrink-0" />
                    <span className="truncate">Stok Rak Fisik</span>
                  </div>
                </Link>

                <Link
                  href="/inventory?tab=pengganti"
                  onClick={() => soundEngine.playKeyTap()}
                  className="flex items-center justify-between h-[30px] px-2 rounded-[7px] text-[12px] text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-white/[0.05] hover:text-neutral-900 dark:hover:text-white font-medium transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <ArrowRightLeft className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span className="truncate">Obat Pengganti (Generik)</span>
                  </div>
                  {operationalCounts.outOfStock > 0 && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-blue-500/15 text-blue-700 dark:text-blue-300">
                      {operationalCounts.outOfStock}
                    </span>
                  )}
                </Link>

                <Link
                  href="/inventory?tab=masuk"
                  onClick={() => soundEngine.playKeyTap()}
                  className="flex items-center justify-between h-[30px] px-2 rounded-[7px] text-[12px] text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-white/[0.05] hover:text-neutral-900 dark:hover:text-white font-medium transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Truck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span className="truncate">Barang Masuk Supplier</span>
                  </div>
                </Link>

                <Link
                  href="/inventory?tab=opname"
                  onClick={() => soundEngine.playKeyTap()}
                  className="flex items-center justify-between h-[30px] px-2 rounded-[7px] text-[12px] text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-white/[0.05] hover:text-neutral-900 dark:hover:text-white font-medium transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <ClipboardCheck className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                    <span className="truncate">Stock Opname (Kamera)</span>
                  </div>
                </Link>
              </div>
            </div>

            <div>
              <div className="px-2 mb-1.5 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                  Filter Kondisi
                </span>
              </div>
              <div className="space-y-0.5">
                <Link
                  href="/inventory?filter=semua"
                  onClick={() => soundEngine.playKeyTap()}
                  className="flex items-center justify-between h-[28px] px-2 rounded-[7px] text-[11.5px] text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-white/[0.05] hover:text-neutral-900 dark:hover:text-white font-medium transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                    <span className="truncate">Semua Stok Normal</span>
                  </div>
                </Link>

                <Link
                  href="/inventory?filter=menipis"
                  onClick={() => soundEngine.playKeyTap()}
                  className="flex items-center justify-between h-[28px] px-2 rounded-[7px] text-[11.5px] text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-white/[0.05] hover:text-neutral-900 dark:hover:text-white font-medium transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                    <span className="truncate">Stok Menipis</span>
                  </div>
                  {operationalCounts.lowStock > 0 && (
                    <span className="font-mono text-[10.5px] font-semibold text-amber-700 dark:text-amber-400">
                      {operationalCounts.lowStock}
                    </span>
                  )}
                </Link>

                <Link
                  href="/inventory?filter=kadaluarsa"
                  onClick={() => soundEngine.playKeyTap()}
                  className="flex items-center justify-between h-[28px] px-2 rounded-[7px] text-[11.5px] text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-white/[0.05] hover:text-neutral-900 dark:hover:text-white font-medium transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Clock className="w-3 h-3 text-rose-500 shrink-0" />
                    <span className="truncate">Kadaluarsa 30–60 Hari</span>
                  </div>
                  {operationalCounts.expiring30to60 > 0 && (
                    <span className="font-mono text-[10.5px] font-semibold text-rose-600 dark:text-rose-400">
                      {operationalCounts.expiring30to60}
                    </span>
                  )}
                </Link>
              </div>
            </div>

            <div>
              <div className="px-2 mb-1.5 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                  Lokasi Rak Fisik
                </span>
              </div>
              <div className="space-y-0.5">
                <Link
                  href="/inventory?tab=rak&rack=RAK-A"
                  onClick={() => soundEngine.playKeyTap()}
                  className="flex items-center justify-between h-[28px] px-2 rounded-[7px] text-[11.5px] text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-white/[0.05] hover:text-neutral-900 dark:hover:text-white transition-colors"
                >
                  <span className="truncate">Rak A (Obat Bebas)</span>
                  <span className="font-mono text-[9.5px] text-neutral-400">Depan</span>
                </Link>
                <Link
                  href="/inventory?tab=rak&rack=RAK-B"
                  onClick={() => soundEngine.playKeyTap()}
                  className="flex items-center justify-between h-[28px] px-2 rounded-[7px] text-[11.5px] text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-white/[0.05] hover:text-neutral-900 dark:hover:text-white transition-colors"
                >
                  <span className="truncate">Rak B (Resep & Etikal)</span>
                  <span className="font-mono text-[9.5px] text-neutral-400">Dalam</span>
                </Link>
                <Link
                  href="/inventory?tab=rak&rack=KULKAS"
                  onClick={() => soundEngine.playKeyTap()}
                  className="flex items-center justify-between h-[28px] px-2 rounded-[7px] text-[11.5px] text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-white/[0.05] hover:text-neutral-900 dark:hover:text-white transition-colors"
                >
                  <span className="truncate">Kulkas Obat (2–8°C)</span>
                  <span className="font-mono text-[9.5px] text-teal-600 dark:text-teal-400">Dingin</span>
                </Link>
              </div>
            </div>
          </>
        );

      case "pesanan":
        return (
          <>
            <div>
              <div className="px-2 mb-1.5 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                  Status Pesanan (PO)
                </span>
              </div>
              <div className="space-y-0.5">
                <Link
                  href="/procurement?status=semua"
                  onClick={() => soundEngine.playKeyTap()}
                  className={`flex items-center justify-between h-[30px] px-2 rounded-[7px] text-[12px] transition-colors ${
                    pathname === "/procurement"
                      ? "bg-[#00767E]/12 dark:bg-[#008B94]/20 text-[#006067] dark:text-teal-300 font-semibold"
                      : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-white/[0.05] hover:text-neutral-900 dark:hover:text-white font-medium"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Building2 className="w-3.5 h-3.5 text-[#00767E] shrink-0" />
                    <span className="truncate">Semua Pesanan</span>
                  </div>
                </Link>

                <Link
                  href="/procurement?status=DRAFT"
                  onClick={() => soundEngine.playKeyTap()}
                  className="flex items-center justify-between h-[30px] px-2 rounded-[7px] text-[12px] text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-white/[0.05] hover:text-neutral-900 dark:hover:text-white font-medium transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <RefreshCw className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span className="truncate">Draf Otomatis Reorder</span>
                  </div>
                  {operationalCounts.lowStock > 0 && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-blue-500/15 text-blue-700 dark:text-blue-300">
                      {operationalCounts.lowStock}
                    </span>
                  )}
                </Link>

                <Link
                  href="/procurement?status=MENUNGGU_PERSETUJUAN"
                  onClick={() => soundEngine.playKeyTap()}
                  className="flex items-center justify-between h-[30px] px-2 rounded-[7px] text-[12px] text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-white/[0.05] hover:text-neutral-900 dark:hover:text-white font-medium transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="truncate">Menunggu Pemilik</span>
                  </div>
                  {pendingPoCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300">
                      {pendingPoCount}
                    </span>
                  )}
                </Link>

                <Link
                  href="/procurement?status=DISETUJUI_PEMILIK"
                  onClick={() => soundEngine.playKeyTap()}
                  className="flex items-center justify-between h-[30px] px-2 rounded-[7px] text-[12px] text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-white/[0.05] hover:text-neutral-900 dark:hover:text-white font-medium transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <PackageCheck className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                    <span className="truncate">Disetujui &bull; Siap Terima</span>
                  </div>
                  {approvedPoCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-teal-500/15 text-teal-700 dark:text-teal-300">
                      {approvedPoCount}
                    </span>
                  )}
                </Link>

                <Link
                  href="/procurement?status=SELESAI"
                  onClick={() => soundEngine.playKeyTap()}
                  className="flex items-center justify-between h-[30px] px-2 rounded-[7px] text-[12px] text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-white/[0.05] hover:text-neutral-900 dark:hover:text-white font-medium transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span className="truncate">Selesai Diterima</span>
                  </div>
                </Link>
              </div>
            </div>

            <div>
              <div className="px-2 mb-1.5 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                  Supplier Rekanan (PBF)
                </span>
              </div>
              <div className="space-y-0.5">
                <Link
                  href="/procurement?supplier=Kimia+Farma"
                  onClick={() => soundEngine.playKeyTap()}
                  className="flex items-center justify-between h-[28px] px-2 rounded-[7px] text-[11.5px] text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-white/[0.05] hover:text-neutral-900 dark:hover:text-white transition-colors"
                >
                  <span className="truncate">Kimia Farma Trading</span>
                </Link>
                <Link
                  href="/procurement?supplier=Enseval"
                  onClick={() => soundEngine.playKeyTap()}
                  className="flex items-center justify-between h-[28px] px-2 rounded-[7px] text-[11.5px] text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-white/[0.05] hover:text-neutral-900 dark:hover:text-white transition-colors"
                >
                  <span className="truncate">Enseval Putera Mega</span>
                </Link>
                <Link
                  href="/procurement?supplier=Mensa"
                  onClick={() => soundEngine.playKeyTap()}
                  className="flex items-center justify-between h-[28px] px-2 rounded-[7px] text-[11.5px] text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-white/[0.05] hover:text-neutral-900 dark:hover:text-white transition-colors"
                >
                  <span className="truncate">Mensa Bina Sukses</span>
                </Link>
                <Link
                  href="/procurement?supplier=Anugrah"
                  onClick={() => soundEngine.playKeyTap()}
                  className="flex items-center justify-between h-[28px] px-2 rounded-[7px] text-[11.5px] text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-white/[0.05] hover:text-neutral-900 dark:hover:text-white transition-colors"
                >
                  <span className="truncate">Anugrah Argon Medica</span>
                </Link>
              </div>
            </div>
          </>
        );

      case "katalog":
        return (
          <>
            <div>
              <div className="px-2 mb-1.5 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                  Golongan Obat
                </span>
              </div>
              <div className="space-y-0.5">
                <Link
                  href="/products?category=ALL"
                  onClick={() => soundEngine.playKeyTap()}
                  className={`flex items-center justify-between h-[30px] px-2 rounded-[7px] text-[12px] transition-colors ${
                    pathname === "/products"
                      ? "bg-[#00767E]/12 dark:bg-[#008B94]/20 text-[#006067] dark:text-teal-300 font-semibold"
                      : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-white/[0.05] hover:text-neutral-900 dark:hover:text-white font-medium"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Layers className="w-3.5 h-3.5 text-[#00767E] shrink-0" />
                    <span className="truncate">Semua Golongan</span>
                  </div>
                  <span className="font-mono text-[10.5px] text-neutral-500 font-semibold">
                    {products.length}
                  </span>
                </Link>

                <Link
                  href="/products?category=BEBAS"
                  onClick={() => soundEngine.playKeyTap()}
                  className="flex items-center justify-between h-[28px] px-2 rounded-[7px] text-[11.5px] text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-white/[0.05] hover:text-neutral-900 dark:hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                    <span className="truncate">Obat Bebas (Hijau)</span>
                  </div>
                </Link>

                <Link
                  href="/products?category=BEBAS_TERBATAS"
                  onClick={() => soundEngine.playKeyTap()}
                  className="flex items-center justify-between h-[28px] px-2 rounded-[7px] text-[11.5px] text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-white/[0.05] hover:text-neutral-900 dark:hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                    <span className="truncate">Bebas Terbatas (Biru)</span>
                  </div>
                </Link>

                <Link
                  href="/products?category=KERAS"
                  onClick={() => soundEngine.playKeyTap()}
                  className="flex items-center justify-between h-[28px] px-2 rounded-[7px] text-[11.5px] text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-white/[0.05] hover:text-neutral-900 dark:hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-600 shrink-0 font-bold text-[8px] text-white flex items-center justify-center">
                      K
                    </span>
                    <span className="truncate">Obat Keras & Resep</span>
                  </div>
                </Link>

                <Link
                  href="/products?category=SUPLEMEN"
                  onClick={() => soundEngine.playKeyTap()}
                  className="flex items-center justify-between h-[28px] px-2 rounded-[7px] text-[11.5px] text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-white/[0.05] hover:text-neutral-900 dark:hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <ShoppingBag className="w-3 h-3 text-amber-500 shrink-0" />
                    <span className="truncate">Suplemen & Vitamin</span>
                  </div>
                </Link>

                <Link
                  href="/products?category=ALKES"
                  onClick={() => soundEngine.playKeyTap()}
                  className="flex items-center justify-between h-[28px] px-2 rounded-[7px] text-[11.5px] text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-white/[0.05] hover:text-neutral-900 dark:hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Package className="w-3 h-3 text-neutral-400 shrink-0" />
                    <span className="truncate">Alat Kesehatan (Alkes)</span>
                  </div>
                </Link>
              </div>
            </div>

            <div>
              <div className="px-2 mb-1.5 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                  Status Katalog
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-neutral-100/70 dark:bg-white/[0.03] border border-neutral-200/60 dark:border-white/[0.06] space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">Total Produk:</span>
                  <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">
                    {products.length} SKU
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">Stok Kosong:</span>
                  <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                    {operationalCounts.outOfStock} SKU
                  </span>
                </div>
              </div>
            </div>
          </>
        );

      case "shift":
        return (
          <>
            <div>
              <div className="px-2 mb-1.5 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                  Modul Shift Kasir
                </span>
              </div>
              <div className="space-y-0.5">
                <Link
                  href="/shifts?tab=aktif"
                  onClick={() => soundEngine.playKeyTap()}
                  className={`flex items-center justify-between h-[30px] px-2 rounded-[7px] text-[12px] transition-colors ${
                    pathname === "/shifts"
                      ? "bg-[#00767E]/12 dark:bg-[#008B94]/20 text-[#006067] dark:text-teal-300 font-semibold"
                      : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-white/[0.05] hover:text-neutral-900 dark:hover:text-white font-medium"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Clock className="w-3.5 h-3.5 text-[#00767E] shrink-0" />
                    <span className="truncate">Shift Kasir Aktif</span>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playKeyTap();
                    setIsHandoverModalOpen(true);
                  }}
                  className="w-full flex items-center justify-between h-[30px] px-2 rounded-[7px] text-[12px] text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-white/[0.05] hover:text-neutral-900 dark:hover:text-white font-medium transition-colors text-left"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <ArrowRightLeft className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span className="truncate">Serah Terima (Handover)</span>
                  </div>
                </button>

                <Link
                  href="/shifts?tab=riwayat"
                  onClick={() => soundEngine.playKeyTap()}
                  className="flex items-center justify-between h-[30px] px-2 rounded-[7px] text-[12px] text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-white/[0.05] hover:text-neutral-900 dark:hover:text-white font-medium transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    <span className="truncate">Riwayat & Z-Report</span>
                  </div>
                </Link>

                <Link
                  href="/shifts?tab=pettycash"
                  onClick={() => soundEngine.playKeyTap()}
                  className="flex items-center justify-between h-[30px] px-2 rounded-[7px] text-[12px] text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-white/[0.05] hover:text-neutral-900 dark:hover:text-white font-medium transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Coins className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span className="truncate">Kas Masuk & Keluar</span>
                  </div>
                </Link>

                <Link
                  href="/shifts?tab=kalkulator"
                  onClick={() => soundEngine.playKeyTap()}
                  className="flex items-center justify-between h-[30px] px-2 rounded-[7px] text-[12px] text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-white/[0.05] hover:text-neutral-900 dark:hover:text-white font-medium transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Calculator className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                    <span className="truncate">Kalkulator Denominasi</span>
                  </div>
                </Link>
              </div>
            </div>

            <div>
              <div className="px-2 mb-1.5 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                  Laporan Berjalan
                </span>
              </div>
              <div className="space-y-0.5">
                <button
                  type="button"
                  onClick={handleOpenXReport}
                  className="w-full flex items-center justify-between h-[28px] px-2 rounded-[7px] text-[11.5px] text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-white/[0.05] hover:text-neutral-900 dark:hover:text-white transition-colors text-left"
                >
                  <span className="truncate">Cetak Laporan X (Mid-Shift)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenPettyCash("PAID_IN")}
                  className="w-full flex items-center justify-between h-[28px] px-2 rounded-[7px] text-[11.5px] text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-white/[0.05] hover:text-neutral-900 dark:hover:text-white transition-colors text-left"
                >
                  <span className="truncate">Tambah Modal (Paid In)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenPettyCash("PAID_OUT")}
                  className="w-full flex items-center justify-between h-[28px] px-2 rounded-[7px] text-[11.5px] text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-white/[0.05] hover:text-neutral-900 dark:hover:text-white transition-colors text-left"
                >
                  <span className="truncate">Biaya Operasional (Paid Out)</span>
                </button>
              </div>
            </div>
          </>
        );

      case "omzet":
        return (
          <>
            <div>
              <div className="px-2 mb-1.5 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                  Laporan Pemilik
                </span>
              </div>
              <div className="space-y-0.5">
                <Link
                  href="/owner"
                  onClick={() => soundEngine.playKeyTap()}
                  className={`flex items-center justify-between h-[30px] px-2 rounded-[7px] text-[12px] transition-colors ${
                    pathname === "/owner"
                      ? "bg-[#00767E]/12 dark:bg-[#008B94]/20 text-[#006067] dark:text-teal-300 font-semibold"
                      : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-white/[0.05] hover:text-neutral-900 dark:hover:text-white font-medium"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <TrendingUp className="w-3.5 h-3.5 text-[#00767E] shrink-0" />
                    <span className="truncate">Dasbor Omzet Real-Time</span>
                  </div>
                </Link>

                <Link
                  href="/analytics"
                  onClick={() => soundEngine.playKeyTap()}
                  className={`flex items-center justify-between h-[30px] px-2 rounded-[7px] text-[12px] transition-colors ${
                    pathname === "/analytics"
                      ? "bg-[#00767E]/12 dark:bg-[#008B94]/20 text-[#006067] dark:text-teal-300 font-semibold"
                      : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-white/[0.05] hover:text-neutral-900 dark:hover:text-white font-medium"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span className="truncate">Laba Rugi Bulanan (P&L)</span>
                  </div>
                </Link>

                <Link
                  href="/procurement?status=MENUNGGU_PERSETUJUAN"
                  onClick={() => soundEngine.playKeyTap()}
                  className="flex items-center justify-between h-[30px] px-2 rounded-[7px] text-[12px] text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-white/[0.05] hover:text-neutral-900 dark:hover:text-white font-medium transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Building2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="truncate">Persetujuan PO Mendesak</span>
                  </div>
                  {pendingPoCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300">
                      {pendingPoCount}
                    </span>
                  )}
                </Link>

                <Link
                  href="/inventory?filter=kadaluarsa"
                  onClick={() => soundEngine.playKeyTap()}
                  className="flex items-center justify-between h-[30px] px-2 rounded-[7px] text-[12px] text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-white/[0.05] hover:text-neutral-900 dark:hover:text-white font-medium transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span className="truncate">Audit Obat Kadaluarsa</span>
                  </div>
                  {operationalCounts.expiring30to60 > 0 && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300">
                      {operationalCounts.expiring30to60}
                    </span>
                  )}
                </Link>
              </div>
            </div>

            <div>
              <div className="px-2 mb-1.5 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                  Wewenang Level 1
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-teal-500/[0.06] border border-teal-500/20 space-y-1 text-[11px] text-[#006067] dark:text-teal-300">
                <div className="font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#00767E]" />
                  <span>Akses Penuh Pemilik</span>
                </div>
                <p className="text-[10px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  Laporan keuangan, persetujuan PO PBF, margin laba & mutasi staf
                </p>
              </div>
            </div>
          </>
        );

      case "akses":
        return (
          <>
            <div>
              <div className="px-2 mb-1.5 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                  Manajemen Staf
                </span>
              </div>
              <div className="space-y-0.5">
                <Link
                  href="/users?tab=staf"
                  onClick={() => soundEngine.playKeyTap()}
                  className={`flex items-center justify-between h-[30px] px-2 rounded-[7px] text-[12px] transition-colors ${
                    pathname === "/users"
                      ? "bg-[#00767E]/12 dark:bg-[#008B94]/20 text-[#006067] dark:text-teal-300 font-semibold"
                      : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-white/[0.05] hover:text-neutral-900 dark:hover:text-white font-medium"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Users className="w-3.5 h-3.5 text-[#00767E] shrink-0" />
                    <span className="truncate">Daftar Akun Karyawan</span>
                  </div>
                </Link>

                <Link
                  href="/users?tab=matriks"
                  onClick={() => soundEngine.playKeyTap()}
                  className="flex items-center justify-between h-[30px] px-2 rounded-[7px] text-[12px] text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-white/[0.05] hover:text-neutral-900 dark:hover:text-white font-medium transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span className="truncate">Matriks Wewenang RBAC</span>
                  </div>
                </Link>

                <Link
                  href="/users?tab=pin"
                  onClick={() => soundEngine.playKeyTap()}
                  className="flex items-center justify-between h-[30px] px-2 rounded-[7px] text-[12px] text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-white/[0.05] hover:text-neutral-900 dark:hover:text-white font-medium transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <KeyRound className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="truncate">Kredensial & PIN SPV</span>
                  </div>
                </Link>

                <Link
                  href="/users?tab=audit"
                  onClick={() => soundEngine.playKeyTap()}
                  className="flex items-center justify-between h-[30px] px-2 rounded-[7px] text-[12px] text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-white/[0.05] hover:text-neutral-900 dark:hover:text-white font-medium transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Activity className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                    <span className="truncate">Log Aktivitas & Audit</span>
                  </div>
                </Link>
              </div>
            </div>

            <div>
              <div className="px-2 mb-1.5 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                  Tingkat Wewenang (RBAC)
                </span>
              </div>
              <div className="space-y-1">
                <div className="p-2 rounded-lg bg-neutral-100/70 dark:bg-white/[0.03] border border-neutral-200/60 dark:border-white/[0.06] text-[11px]">
                  <div className="font-semibold text-neutral-900 dark:text-white flex items-center justify-between">
                    <span>Level 1 — Pemilik</span>
                    <span className="px-1.5 rounded bg-teal-500/15 text-[#00767E] dark:text-teal-300 font-mono text-[9.5px]">
                      Penuh
                    </span>
                  </div>
                  <span className="text-[10px] text-neutral-500">Semua menu, PO, dan omzet</span>
                </div>
                <div className="p-2 rounded-lg bg-neutral-100/70 dark:bg-white/[0.03] border border-neutral-200/60 dark:border-white/[0.06] text-[11px]">
                  <div className="font-semibold text-neutral-900 dark:text-white flex items-center justify-between">
                    <span>Level 2 — Gudang</span>
                    <span className="px-1.5 rounded bg-blue-500/15 text-blue-700 dark:text-blue-300 font-mono text-[9.5px]">
                      Menengah
                    </span>
                  </div>
                  <span className="text-[10px] text-neutral-500">Stok obat, barang masuk & opname</span>
                </div>
                <div className="p-2 rounded-lg bg-neutral-100/70 dark:bg-white/[0.03] border border-neutral-200/60 dark:border-white/[0.06] text-[11px]">
                  <div className="font-semibold text-neutral-900 dark:text-white flex items-center justify-between">
                    <span>Level 3 — Kasir</span>
                    <span className="px-1.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 font-mono text-[9.5px]">
                      Terbatas
                    </span>
                  </div>
                  <span className="text-[10px] text-neutral-500">Transaksi kasir & cek stok</span>
                </div>
              </div>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {/* =====================================================================
          1. GLOBAL TOPBAR (ClickUp 4.0 Spatial Placement: Full-Width 44px)
      ===================================================================== */}
      <header
        aria-label="Global Topbar"
        className="fixed top-0 inset-x-0 h-[44px] z-40 bg-[#EDEFF2] dark:bg-[#090A0C] border-b border-neutral-300/70 dark:border-white/[0.08] px-2.5 flex items-center justify-between gap-2 select-none"
      >
        {/* Left Zone: Mobile Toggle + Workspace Pill + Secondary Sidebar Collapse Toggle */}
        <div className="flex items-center gap-1.5 min-w-0">
          {/* Mobile / Tablet Drawer Button */}
          <button
            type="button"
            onClick={() => {
              soundEngine.playKeyTap();
              setIsMobileMenuOpen(true);
            }}
            className="lg:hidden h-7 w-7 rounded-[7px] flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:bg-black/[0.06] dark:hover:bg-white/[0.08] transition-colors shrink-0"
            title="Buka Menu Navigasi"
          >
            <PanelLeft className="w-4 h-4" />
          </button>

          {/* Workspace Switcher Pill (ClickUp Top-Left Placement) */}
          <Link
            href="/"
            onClick={() => soundEngine.playKeyTap()}
            className="h-7 px-2 rounded-[7px] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] flex items-center gap-2 transition-colors min-w-0 group"
            title="Apotek Kerso Waras — Kedung, Jepara"
          >
            <div className="w-5 h-5 rounded-[5px] bg-[#00767E] flex items-center justify-center p-0.5 shrink-0 shadow-2xs">
              <Image
                src="/logo-kerso-waras-white.svg"
                alt="Apotek Kerso Waras"
                width={16}
                height={16}
                priority
                unoptimized
                className="w-full h-full object-contain"
              />
            </div>
            <span className="font-bold text-[12.5px] tracking-tight text-neutral-900 dark:text-white truncate">
              Apotek Kerso Waras
            </span>
            <span className="hidden sm:inline-flex px-1.5 py-0.2 rounded text-[9.5px] font-semibold bg-[#00767E]/12 text-[#006067] dark:text-teal-300">
              Jepara
            </span>
          </Link>

          {/* Desktop Secondary Sidebar Collapse/Expand Toggle */}
          <button
            type="button"
            onClick={toggleSidebarCollapse}
            className="hidden lg:flex h-7 w-7 rounded-[7px] items-center justify-center text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-black/[0.06] dark:hover:bg-white/[0.08] transition-colors shrink-0"
            title={
              isSidebarCollapsed
                ? "Tampilkan Panel Samping"
                : "Sembunyikan Panel Samping"
            }
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen className="w-3.5 h-3.5" />
            ) : (
              <PanelLeftClose className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Center Zone: Global Omnisearch Bar (ClickUp Center Placement) */}
        <div className="flex-1 max-w-[440px] mx-2 hidden sm:flex items-center justify-center">
          <button
            type="button"
            onClick={handleOpenCmdK}
            className="w-full h-[28px] px-2.5 rounded-[7px] bg-white dark:bg-[#15171B] hover:bg-neutral-50 dark:hover:bg-[#1C1F24] border border-neutral-300/80 dark:border-white/[0.1] flex items-center justify-between text-[11.5px] text-neutral-500 dark:text-neutral-400 shadow-2xs transition-colors"
            title="Cari obat, zat aktif, nomor batch, atau menu (Ctrl+K)"
          >
            <div className="flex items-center gap-2 truncate">
              <Search className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              <span className="truncate">
                Cari obat, zat aktif, batch, atau menu...
              </span>
            </div>
            <kbd className="px-1.5 py-0.2 text-[9.5px] font-mono font-semibold bg-neutral-100 dark:bg-white/[0.06] text-neutral-500 dark:text-neutral-400 rounded border border-neutral-200 dark:border-white/10 shrink-0">
              Ctrl K
            </kbd>
          </button>
        </div>

        {/* Right Zone: Local Cache Status + Shift Drawer + RBAC Profile + Theme + Logout */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Mobile Search Icon */}
          <button
            type="button"
            onClick={handleOpenCmdK}
            className="sm:hidden h-7 w-7 rounded-[7px] flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:bg-black/[0.06]"
            title="Pencarian cepat"
          >
            <Search className="w-3.5 h-3.5" />
          </button>

          {/* Penyimpanan Lokal Status Pill */}
          <div className="relative" ref={cachePopoverRef}>
            <button
              type="button"
              onClick={() => {
                soundEngine.playKeyTap();
                setIsCachePopoverOpen((prev) => !prev);
              }}
              className={`h-[28px] px-2.5 rounded-[7px] inline-flex items-center gap-1.5 text-[11px] font-medium border transition-colors whitespace-nowrap ${
                isOfflineSimulated
                  ? "bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/70 dark:text-amber-200 dark:border-amber-800"
                  : "bg-white dark:bg-[#15171B] hover:bg-neutral-50 text-neutral-700 dark:text-neutral-200 border-neutral-300/80 dark:border-white/10"
              }`}
              title="Status penyimpanan data lokal"
            >
              {isOfflineSimulated ? (
                <>
                  <WifiOff className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>Offline ({offlineQueueIds?.length || 0})</span>
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span className="hidden md:inline">Tersimpan Lokal</span>
                </>
              )}
            </button>

            {isCachePopoverOpen && (
              <div className="absolute right-0 mt-1.5 w-72 bg-white dark:bg-[#18191C] text-neutral-900 dark:text-white rounded-xl shadow-lg border border-neutral-200 dark:border-white/10 p-3.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center gap-2.5 pb-2.5 border-b border-neutral-100 dark:border-white/[0.08]">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      isOfflineSimulated
                        ? "bg-amber-500/10 text-amber-600"
                        : "bg-emerald-500/10 text-emerald-600"
                    }`}
                  >
                    <Database className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-[12px] font-semibold leading-tight">
                      Penyimpanan Lokal Kasir
                    </h4>
                    <p className="text-[10.5px] text-neutral-500">
                      Transaksi tetap berjalan saat internet terputus
                    </p>
                  </div>
                </div>

                <div className="py-2.5 space-y-1 text-[11px]">
                  <div className="flex justify-between text-neutral-500 dark:text-neutral-400">
                    <span>Data Obat & Stok</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      Siap ({products.filter((p) => !p.id.startsWith("pkg-")).length} obat)
                    </span>
                  </div>
                  <div className="flex justify-between text-neutral-500 dark:text-neutral-400">
                    <span>Antrean Struk Offline</span>
                    <span className="font-mono font-semibold text-neutral-900 dark:text-white">
                      {offlineQueueIds?.length || 0} transaksi
                    </span>
                  </div>
                  <div className="flex justify-between text-neutral-500 dark:text-neutral-400">
                    <span>Sinkronisasi Terakhir</span>
                    <span className="font-mono text-neutral-700 dark:text-neutral-300">
                      {lastCacheSyncAt
                        ? new Date(lastCacheSyncAt).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Baru saja"}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-neutral-100 dark:border-white/[0.08] space-y-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      toggleOfflineSimulation();
                      showAppleToast({
                        type: !isOfflineSimulated ? "warning" : "success",
                        title: !isOfflineSimulated
                          ? "Mode Offline Aktif"
                          : "Kembali Online",
                        message: !isOfflineSimulated
                          ? "Transaksi kasir disimpan ke penyimpanan lokal."
                          : "Terhubung kembali ke server pusat.",
                      });
                    }}
                    className={`w-full py-1.5 px-3 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                      isOfflineSimulated
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : "bg-neutral-100 dark:bg-white/10 hover:bg-neutral-200 text-neutral-900 dark:text-white"
                    }`}
                  >
                    {isOfflineSimulated ? (
                      <>
                        <Wifi className="w-3.5 h-3.5" />
                        <span>Hubungkan Kembali</span>
                      </>
                    ) : (
                      <>
                        <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                        <span>Uji Mode Offline</span>
                      </>
                    )}
                  </button>

                  {(offlineQueueIds?.length || 0) > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const count = syncOfflineCacheNow();
                        showAppleToast({
                          type: "success",
                          title: "Sinkronisasi Selesai",
                          message: `${count} transaksi lokal berhasil disinkronkan.`,
                        });
                        setIsCachePopoverOpen(false);
                      }}
                      className="w-full py-1.5 px-3 rounded-lg bg-[#00767E] hover:bg-[#006067] text-white text-[11px] font-semibold flex items-center justify-center gap-1.5"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Sinkronkan {offlineQueueIds.length} Transaksi</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Shift & Cash Drawer Status Flyout */}
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

          {/* RBAC User Level Pill (ClickUp Top-Right Avatar Placement) */}
          <button
            type="button"
            onClick={() => {
              soundEngine.playKeyTap();
              setIsRoleModalOpen(true);
            }}
            className="h-[28px] pl-1.5 pr-2 rounded-[7px] bg-white dark:bg-[#15171B] hover:bg-neutral-50 dark:hover:bg-[#1C1F24] border border-neutral-300/80 dark:border-white/10 flex items-center gap-1.5 text-neutral-800 dark:text-neutral-200 transition-colors shrink-0"
            title="Ganti Peran Pengguna"
          >
            <span className="w-4.5 h-4.5 px-1 rounded-[4px] bg-[#00767E] text-white flex items-center justify-center text-[9.5px] font-bold shrink-0">
              L{rbacInfo.level}
            </span>
            <span className="hidden md:inline text-[11px] font-semibold truncate max-w-[105px]">
              {rbacInfo.roleTitle}
            </span>
            <ChevronDown className="w-3 h-3 text-neutral-400" />
          </button>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="h-7 w-7 rounded-[7px] flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-black/[0.06] dark:hover:bg-white/[0.08] transition-colors"
            title="Ganti Tema Terang / Gelap"
          >
            {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </button>
        </div>
      </header>

      {/* =====================================================================
          2. FAR-LEFT PRIMARY APP RAIL (ClickUp 4.0 Vertical Dock: 54px wide - Image 1)
      ===================================================================== */}
      <aside
        aria-label="Primary App Rail"
        className="hidden md:flex fixed top-[44px] bottom-[6px] left-[6px] w-[54px] z-40 flex-col justify-between py-1.5 px-1 rounded-[10px] bg-[#122428] dark:bg-[#111317] text-white border border-black/15 dark:border-white/[0.08] select-none shadow-2xs overflow-hidden"
      >
        {/* Top Module Icons Stack */}
        <div className="flex-1 overflow-y-auto scrollbar-none flex flex-col items-center gap-1 w-full pb-1">
          {primaryRailItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentDomain === item.key;

            return (
              <Link
                key={item.key}
                href={item.href}
                onClick={() => soundEngine.playKeyTap()}
                title={item.label}
                className={`relative w-full py-1.5 rounded-[8px] flex flex-col items-center justify-center gap-0.5 transition-colors ${
                  isActive
                    ? "bg-[#00767E] text-white font-semibold shadow-2xs"
                    : "text-white/65 hover:text-white hover:bg-white/[0.08] font-medium"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="text-[9.5px] leading-tight tracking-tight truncate max-w-[46px]">
                  {item.label}
                </span>

                {item.badgeCount !== undefined && item.badgeCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[13px] h-[13px] px-0.5 rounded-full bg-amber-400 text-neutral-950 text-[8.5px] font-bold font-mono flex items-center justify-center">
                    {item.badgeCount}
                  </span>
                )}
                {item.badgeDot && !item.badgeCount && (
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-amber-400" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Bottom Rail Utilities (Level Switcher & Logout - Anti-Clipping) */}
        <div className="shrink-0 flex flex-col items-center gap-0.5 w-full pt-1 pb-1 border-t border-white/[0.1]">
          <button
            type="button"
            onClick={() => {
              soundEngine.playKeyTap();
              setIsRoleModalOpen(true);
            }}
            className="w-full py-1 rounded-[7px] flex flex-col items-center justify-center gap-0.5 text-white/70 hover:text-white hover:bg-white/[0.08] transition-colors"
            title={`Peran Aktif: Level ${rbacInfo.level} (${rbacInfo.roleTitle})`}
          >
            <span className="w-4 h-4 px-1 rounded bg-white/15 text-teal-300 text-[9px] font-bold font-mono flex items-center justify-center">
              L{rbacInfo.level}
            </span>
            <span className="text-[9px] leading-tight font-medium">Peran</span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full py-1 rounded-[7px] flex flex-col items-center justify-center gap-0.5 text-white/60 hover:text-rose-300 hover:bg-rose-500/15 transition-colors"
            title="Keluar Sesi"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="text-[9px] leading-tight font-medium">Keluar</span>
          </button>
        </div>
      </aside>

      {/* =====================================================================
          3. SECONDARY CONTEXTUAL SIDEBAR (ClickUp 4.0 Sub-Menu Pane: 214px - Image 2)
      ===================================================================== */}
      {!isSidebarCollapsed && (
        <aside
          aria-label="Secondary Contextual Sidebar"
          className="hidden lg:flex fixed top-[44px] bottom-[6px] left-[66px] w-[214px] z-30 flex-col bg-[#F8F9FA] dark:bg-[#131417] border-y border-l border-neutral-300/80 dark:border-white/[0.08] rounded-l-[10px] select-none overflow-hidden"
        >
          {/* Secondary Sidebar Top Header (Dynamic Section Title + Quick Action CTA) */}
          <div className="h-[42px] px-3 border-b border-neutral-200/80 dark:border-white/[0.08] flex items-center justify-between shrink-0 bg-white/60 dark:bg-white/[0.02]">
            <span className="font-bold text-[12.5px] text-neutral-900 dark:text-white tracking-tight truncate">
              {subMenuHeader.title}
            </span>
            {subMenuHeader.onCtaClick ? (
              <button
                type="button"
                onClick={() => {
                  soundEngine.playKeyTap();
                  subMenuHeader.onCtaClick?.();
                }}
                className="h-6 px-2 rounded-[6px] bg-[#00767E] hover:bg-[#006067] text-white text-[10.5px] font-semibold inline-flex items-center gap-1 transition-colors shrink-0 shadow-2xs whitespace-nowrap"
              >
                <Plus className="w-3 h-3" />
                <span>{subMenuHeader.ctaText}</span>
              </button>
            ) : (
              <Link
                href={subMenuHeader.ctaHref}
                onClick={() => soundEngine.playKeyTap()}
                className="h-6 px-2 rounded-[6px] bg-[#00767E] hover:bg-[#006067] text-white text-[10.5px] font-semibold inline-flex items-center gap-1 transition-colors shrink-0 shadow-2xs whitespace-nowrap"
              >
                <Plus className="w-3 h-3" />
                <span>{subMenuHeader.ctaText}</span>
              </Link>
            )}
          </div>

          {/* Dynamic Scrollable Contextual Tree (Tailored to selected domain) */}
          <div className="flex-1 overflow-y-auto px-2 py-2.5 space-y-3.5">
            {renderSubMenuContent()}
          </div>

          {/* Secondary Sidebar Footer */}
          <div className="h-[36px] px-3 border-t border-neutral-200/80 dark:border-white/[0.08] flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400 bg-white/40 dark:bg-white/[0.01]">
            <div className="flex items-center gap-1.5 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="truncate font-medium">
                {currentDomain === "kasir"
                  ? "Sistem Kasir Siap"
                  : currentDomain === "gudang"
                  ? "Local Cache Aktif"
                  : currentDomain === "pesanan"
                  ? "Auto-Reorder Aktif"
                  : currentDomain === "shift"
                  ? "Laci Kasir Sinkron"
                  : currentDomain === "omzet"
                  ? "Data Omzet Real-Time"
                  : currentDomain === "akses"
                  ? "RBAC 3-Level Terkunci"
                  : "Katalog Farmasi Valid"}
              </span>
            </div>
          </div>
        </aside>
      )}

      {/* =====================================================================
          4. WORKSPACE TOP CONTEXT HEADER (Inside Main Right Workspace Frame)
      ===================================================================== */}
      <div
        className={`w-full h-[38px] bg-white dark:bg-[#16171A] border-t border-x border-b border-neutral-300/80 dark:border-white/[0.08] px-3.5 flex items-center justify-between gap-2 shrink-0 lg:rounded-tr-[10px] ${
          isSidebarCollapsed ? "lg:rounded-tl-[10px]" : ""
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 text-[12px]">
          <span className="text-neutral-400 dark:text-neutral-500 hidden sm:inline truncate">
            {breadcrumb.section}
          </span>
          <span className="text-neutral-300 dark:text-neutral-600 hidden sm:inline">/</span>
          <span className="font-semibold text-neutral-900 dark:text-white truncate">
            {breadcrumb.page}
          </span>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-neutral-500 dark:text-neutral-400 shrink-0">
          <span className="hidden md:inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-neutral-100 dark:bg-white/[0.05] text-neutral-600 dark:text-neutral-300 font-medium">
            <span>Aktif:</span>
            <strong className="text-neutral-900 dark:text-white">
              {currentUser.name}
            </strong>
          </span>
          <button
            type="button"
            onClick={handleOpenHelp}
            className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded hover:bg-neutral-100 dark:hover:bg-white/[0.06] text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            <span>Pintasan</span>
            <kbd className="font-mono text-[10px] px-1 rounded bg-neutral-100 dark:bg-white/10">
              F1
            </kbd>
          </button>
        </div>
      </div>

      {/* Modals */}
      <RoleSwitcherModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
      />

      <ShiftOpenModal
        isOpen={isShiftOpenModalOpen}
        onClose={() => setIsShiftOpenModalOpen(false)}
      />

      <ShiftCloseModal
        isOpen={isShiftCloseModalOpen}
        onClose={() => setIsShiftCloseModalOpen(false)}
      />

      <ShiftHandoverModal
        isOpen={isHandoverModalOpen}
        onClose={() => setIsHandoverModalOpen(false)}
      />

      {currentShift && (
        <ShiftReportModal
          isOpen={isXReportModalOpen}
          onClose={() => setIsXReportModalOpen(false)}
          shift={currentShift}
          reportType="X_REPORT"
        />
      )}

      <PettyCashModal
        isOpen={isPettyCashOpen}
        onClose={() => setIsPettyCashOpen(false)}
        defaultType={pettyCashType}
      />

      <ShortcutHelpModal
        isOpen={isHelpModalOpenInternal}
        onClose={() => setIsHelpModalOpenInternal(false)}
      />

      <CommandPalette
        isOpen={isCmdKOpenInternal}
        onClose={() => setIsCmdKOpenInternal(false)}
      />

      <MobileNavDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        onOpenRoleModal={() => setIsRoleModalOpen(true)}
        onOpenHelp={handleOpenHelp}
        onOpenCmdK={handleOpenCmdK}
      />

      <MobileTabBar onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />
    </>
  );
}
