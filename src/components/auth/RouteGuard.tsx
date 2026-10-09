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
];

const APOTEKER_RESTRICTED_ROUTES = ["/owner", "/users"];

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
      setCurrentUser({
        id: session.uid,
        name: session.displayName,
        username: session.username,
        email: session.email,
        role: session.role,
        title: session.role === "SUPER_ADMIN" ? "Chief Executive Owner & Super Admin" : session.displayName,
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
            Memverifikasi Sesi Autentikasi...
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

  // Check cashier restrictions
  if (role === "KARYAWAN_KASIR") {
    const isBlocked = CASHIER_RESTRICTED_ROUTES.some(
      (r) => pathname === r || pathname.startsWith(`${r}/`)
    );
    if (isBlocked) {
      return (
        <AccessDenied
          requiredRole="Apoteker / Owner / Super Admin"
          reason="Sesuai kebijakan keamanan dan pemisahan tugas (Separation of Duties), akun Kasir tidak memiliki hak akses ke modul manajemen, pengaturan HPP distributor, atau formulasi klinis ini."
        />
      );
    }
  }

  // Check apoteker restrictions
  if (role === "KARYAWAN_APOTEKER") {
    const isBlocked = APOTEKER_RESTRICTED_ROUTES.some(
      (r) => pathname === r || pathname.startsWith(`${r}/`)
    );
    if (isBlocked) {
      return (
        <AccessDenied
          requiredRole="Owner (PSA) / Super Admin"
          reason="Modul Laba Bersih Finansial, Valuasi HPP Komprehensif, dan Manajemen Pengguna merupakan wewenang eksklusif Pemilik Sarana Apotek (Owner) dan Super Admin."
        />
      );
    }
  }

  return <>{children}</>;
}
