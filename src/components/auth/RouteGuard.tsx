"use client";

import React, { useEffect, useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useApotekStore } from "@/lib/store";
import { getActiveSession, destroySession, SessionData } from "@/lib/auth/auth-service";
import { AccessDenied } from "@/components/AccessDenied";
import { UserRole } from "@/lib/types";

interface RouteGuardProps {
  children: React.ReactNode;
}

const PUBLIC_ROUTES = ["/login"];
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes auto-lock for POS security

const CASHIER_RESTRICTED_ROUTES = [
  "/owner",
  "/users",
  "/regulatory",
  "/compounding",
  "/procurement",
  "/analytics",
  "/products",
  "/crm",
];

const GUDANG_RESTRICTED_ROUTES = ["/owner", "/analytics", "/users"];

export function RouteGuard({ children }: RouteGuardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, setCurrentUser, logout } = useApotekStore();

  const [isVerifying, setIsVerifying] = useState(true);
  const [activeSession, setActiveSession] = useState<SessionData | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  // Inactivity monitor
  useEffect(() => {
    const handleActivity = () => {
      lastActivityRef.current = Date.now();
    };

    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("click", handleActivity);
    window.addEventListener("touchstart", handleActivity);

    const interval = setInterval(() => {
      const isPublic = PUBLIC_ROUTES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
      if (isPublic) return;

      const idleDuration = Date.now() - lastActivityRef.current;
      if (idleDuration >= INACTIVITY_TIMEOUT_MS) {
        destroySession();
        logout();
        router.push("/login?reason=inactivity_lock");
      }
    }, 30000);

    return () => {
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("click", handleActivity);
      window.removeEventListener("touchstart", handleActivity);
      clearInterval(interval);
    };
  }, [pathname, logout, router]);

  // Session verification on navigation
  useEffect(() => {
    const isPublic = PUBLIC_ROUTES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

    if (isPublic) {
      setIsVerifying(false);
      return;
    }

    const session = getActiveSession();

    if (!session) {
      // No active session -> redirect to login
      setIsVerifying(false);
      router.push(`/login?returnUrl=${encodeURIComponent(pathname)}`);
      return;
    }

    setActiveSession(session);

    // Sync store with active session if mismatch
    if (!currentUser || currentUser.email !== session.email) {
      const titleMap: Record<UserRole, string> = {
        SUPER_ADMIN: "Level 1 — Pemilik Apotek & Super Admin",
        OWNER: "Level 1 — Pemilik Apotek (Akses Penuh)",
        KARYAWAN_APOTEKER: "Level 2 — Petugas Gudang (Akses Menengah)",
        KARYAWAN_KASIR: "Level 3 — Kasir (Akses Terbatas)",
      };
      setCurrentUser({
        id: session.uid,
        name: session.displayName,
        username: session.username,
        email: session.email,
        role: session.role,
        title: titleMap[session.role] || session.displayName,
        avatar: session.displayName.substring(0, 2).toUpperCase(),
      });
    }

    setIsVerifying(false);
  }, [pathname, currentUser, setCurrentUser, router]);

  // While verifying initial session
  if (isVerifying) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#F5F5F7] dark:bg-[#000000]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#008B94] border-t-transparent rounded-full animate-spin" />
          <span className="text-[12px] font-semibold text-[#8E8E93]">
            Memverifikasi Wewenang RBAC...
          </span>
        </div>
      </div>
    );
  }

  // Public route -> allow directly
  const isPublic = PUBLIC_ROUTES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (isPublic) {
    return <>{children}</>;
  }

  const role: UserRole = activeSession?.role || currentUser?.role || "KARYAWAN_KASIR";

  // Check Level 3 — Kasir (Akses Terbatas) restrictions
  if (role === "KARYAWAN_KASIR") {
    const isBlocked = CASHIER_RESTRICTED_ROUTES.some(
      (r) => pathname === r || pathname.startsWith(`${r}/`)
    );
    if (isBlocked) {
      return (
        <AccessDenied
          requiredRole="Level 1 (Pemilik Apotek) / Level 2 (Petugas Gudang)"
          reason="Sesuai Standar Keamanan RBAC Level 3 (Akses Terbatas), akun Kasir hanya difokuskan pada pelayanan transaksi penjualan kasir POS dan pencarian sisa stok obat untuk mencegah salah input antar-divisi."
        />
      );
    }
  }

  // Check Level 2 — Petugas Gudang (Akses Menengah) restrictions
  if (role === "KARYAWAN_APOTEKER") {
    const isBlocked = GUDANG_RESTRICTED_ROUTES.some(
      (r) => pathname === r || pathname.startsWith(`${r}/`)
    );
    if (isBlocked) {
      return (
        <AccessDenied
          requiredRole="Level 1 — Pemilik Apotek (Akses Penuh)"
          reason="Sesuai Standar Keamanan RBAC Level 2 (Akses Menengah), Petugas Gudang dikhususkan untuk mengelola data stok obat, mencatat barang masuk supplier, dan mengeksekusi Stock Opname. Pemantauan Laporan Keuangan Omzet dan Persetujuan PO adalah wewenang eksklusif Level 1 (Pemilik Apotek)."
        />
      );
    }
  }

  return <>{children}</>;
}
