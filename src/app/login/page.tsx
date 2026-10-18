"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useApotekStore } from "@/lib/store";
import {
  authenticateCredentials,
  saveSession,
  getLockoutStatus,
  clearFailedAttempts,
} from "@/lib/auth/auth-service";
import { updateLastLogin } from "@/lib/firebase/users";
import { soundEngine } from "@/lib/audio";
import { showAppleToast } from "@/components/ui/AppleToast";
import {
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  X,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl");
  const accessDeniedParam = searchParams.get("access_denied");

  const { setCurrentUser } = useApotekStore();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [lockoutRemaining, setLockoutRemaining] = useState<number>(0);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Check lockout on username change or mount
  useEffect(() => {
    if (!username) {
      setLockoutRemaining(0);
      return;
    }
    const status = getLockoutStatus(username);
    if (status.isLocked) {
      setLockoutRemaining(status.remainingSeconds);
    } else {
      setLockoutRemaining(0);
    }
  }, [username]);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutRemaining <= 0) return;
    const interval = setInterval(() => {
      setLockoutRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setErrorMessage("");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutRemaining]);

  const handleUnlockAccount = () => {
    if (username) {
      clearFailedAttempts(username);
      setLockoutRemaining(0);
      setErrorMessage("");
      soundEngine.playKeyTap();
      showAppleToast({
        type: "success",
        title: "Kunci Akun Dibuka",
        message: "Silakan masukkan kata sandi yang valid.",
      });
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMessage("Silakan masukkan ID Staf / Email dan Kata Sandi Anda.");
      showAppleToast({
        type: "warning",
        title: "Data Belum Lengkap",
        message: "ID Staf dan Kata Sandi wajib diisi.",
      });
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const result = await authenticateCredentials(username.trim(), password);

      if (!result.success || !result.user) {
        soundEngine.playKeyTap();
        const errText =
          result.error || "Gagal masuk. Periksa kembali ID Staf dan Kata Sandi Anda.";
        setErrorMessage(errText);
        showAppleToast({
          type: "error",
          title: "Gagal Masuk",
          message: errText,
        });

        const status = getLockoutStatus(username);
        if (status.isLocked) {
          setLockoutRemaining(status.remainingSeconds);
        }
        setIsLoading(false);
        return;
      }

      // Authentication Successful
      const authenticatedStaff = result.user;

      // 1. Save Session
      saveSession(authenticatedStaff);

      // 2. Set Active Store User
      setCurrentUser({
        id: authenticatedStaff.uid,
        name: authenticatedStaff.displayName,
        username: authenticatedStaff.username,
        email: authenticatedStaff.email,
        role: authenticatedStaff.role,
        title: authenticatedStaff.title,
        avatar: authenticatedStaff.avatar,
        sipaNumber: authenticatedStaff.pharmacistDetails?.sipaNumber,
      });

      // 3. Update database lastLogin timestamp
      await updateLastLogin(authenticatedStaff.email);

      soundEngine.playCheckoutChime();
      showAppleToast({
        type: "success",
        title: "Autentikasi Berhasil",
        message: `Selamat bertugas, ${authenticatedStaff.displayName}!`,
      });

      // 4. Role-aware redirection
      if (returnUrl) {
        router.push(returnUrl);
      } else if (authenticatedStaff.role === "OWNER") {
        router.push("/owner");
      } else if (authenticatedStaff.role === "SUPER_ADMIN") {
        router.push("/");
      } else {
        router.push("/");
      }
    } catch (err: any) {
      console.error("Login exception:", err);
      const errMsg = err.message || "Terjadi kendala koneksi sistem autentikasi.";
      setErrorMessage(errMsg);
      showAppleToast({
        type: "error",
        title: "Kesalahan Sistem",
        message: errMsg,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    /* 1. ROOT VIEWPORT LOCK: 100% Full-Screen, 100dvh, Zero-Scroll & Zero-Swipe */
    <div className="fixed inset-0 z-50 h-screen h-dvh max-h-dvh w-screen max-w-full overflow-hidden overscroll-none touch-none select-none bg-neutral-100 dark:bg-[#0A0A0C] flex items-stretch justify-stretch p-0 sm:p-2 lg:p-3 font-sans antialiased text-[#1C1C1E] dark:text-[#F5F5F7] transition-colors">
      
      {/* 2. FULL-SCREEN EXPANSIVE SPLIT-CARD CONTAINER: Fills the entire display seamlessly */}
      <div className="w-full h-full max-h-[100dvh] bg-white dark:bg-[#1C1C1E] rounded-none sm:rounded-[24px] lg:rounded-[32px] shadow-[0_20px_60px_rgba(0,0,0,0.06)] border-0 sm:border sm:border-black/[0.04] dark:border-white/[0.08] overflow-hidden flex flex-col lg:grid lg:grid-cols-12 p-2.5 sm:p-3.5 lg:p-4 gap-3">
        
        {/* ========================================================= */}
        {/* LEFT PANEL: Specular Glass Art with GIANT CENTERED LOGO   */}
        {/* ========================================================= */}
        <div className="hidden lg:flex relative overflow-hidden rounded-[22px] lg:rounded-[28px] bg-gradient-to-br from-[#EBF3FC] via-[#F4F8FD] to-[#FFFFFF] dark:from-[#151C24] dark:via-[#19222E] dark:to-[#12161D] p-6 lg:p-8 xl:p-10 flex-col justify-between h-full lg:col-span-7 xl:col-span-7 border border-white/60 dark:border-white/5 select-none">
          
          {/* Ambient Specular Glows */}
          <div className="absolute -top-16 -right-16 w-96 h-96 rounded-full bg-teal-300/25 dark:bg-teal-600/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-96 h-96 rounded-full bg-blue-300/30 dark:bg-blue-600/15 blur-3xl pointer-events-none" />

          {/* Layered Physical Glass Spheres (Exact Image 1 Geometry) */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="w-80 h-80 xl:w-96 xl:h-96 rounded-full bg-white/45 dark:bg-white/[0.04] backdrop-blur-2xl border border-white/80 dark:border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.05),inset_0_2px_4px_rgba(255,255,255,0.9)] absolute top-[14%] right-[-10%]" />
            <div className="w-40 h-40 xl:w-48 xl:h-48 rounded-full bg-gradient-to-br from-[#2563EB]/90 to-[#1D4ED8]/95 dark:from-[#2563EB]/80 dark:to-[#1E40AF]/90 backdrop-blur-md shadow-[0_24px_50px_rgba(37,99,235,0.45),inset_0_2px_4px_rgba(255,255,255,0.45)] absolute top-[34%] right-[10%]" />
            <div className="w-64 h-64 xl:w-72 xl:h-72 rounded-full bg-gradient-to-tr from-cyan-300/25 to-blue-400/25 dark:from-cyan-900/20 dark:to-blue-900/20 backdrop-blur-xl border border-white/60 dark:border-white/5 shadow-[0_15px_35px_rgba(0,0,0,0.03)] absolute bottom-[10%] right-[-6%]" />
            <div className="w-14 h-14 rounded-full bg-white/70 dark:bg-white/10 backdrop-blur-md border border-white/85 dark:border-white/15 shadow-md absolute top-[52%] left-[-16px]" />
          </div>

          {/* Top Header: Brand Name & License Badge */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Image
                src="/logo-kerso-waras.svg"
                alt="Logo"
                width={28}
                height={38}
                unoptimized
                className="w-7 h-auto object-contain"
              />
              <div>
                <span className="font-bold text-[18px] xl:text-[20px] text-[#1C1C1E] dark:text-white tracking-tight block leading-tight">
                  Apotek Kerso Waras
                </span>
                <span className="text-[12px] text-[#008B94] dark:text-teal-400 font-medium">
                  Kedung, Jepara
                </span>
              </div>
            </div>
            <div className="px-3 py-1 rounded-full text-[10.5px] font-mono bg-white/75 dark:bg-white/10 backdrop-blur-md border border-white/80 dark:border-white/15 text-[#008B94] dark:text-teal-300 shadow-2xs">
              SIA: 440/0912/DPMPTSP/2021
            </div>
          </div>

          {/* =============================================================== */}
          {/* CENTER: GIANT SIGNATURE BRAND LOGO (Matching User's Red Scribble) */}
          {/* =============================================================== */}
          <div className="relative z-20 my-auto flex flex-col items-center justify-center py-2 lg:py-4">
            <div className="relative flex items-center justify-center">
              {/* Ethereal Ambient Glow behind the logo */}
              <div className="w-80 h-80 lg:w-96 lg:h-96 xl:w-[420px] xl:h-[420px] rounded-full bg-teal-400/25 dark:bg-teal-500/15 blur-3xl absolute pointer-events-none" />
              
              <Image
                src="/logo-kerso-waras.svg"
                alt="Logo Apotek Kerso Waras"
                width={400}
                height={550}
                priority
                unoptimized
                className="w-64 sm:w-72 lg:w-80 xl:w-96 max-h-[300px] lg:max-h-[350px] xl:max-h-[400px] h-auto object-contain drop-shadow-[0_20px_50px_rgba(0,139,148,0.34)] dark:drop-shadow-[0_20px_50px_rgba(45,212,191,0.40)] select-none pointer-events-none transition-transform duration-500 hover:scale-[1.02]"
              />
            </div>
          </div>

        </div>

        {/* ========================================================= */}
        {/* RIGHT PANEL: Pure Form UX (100% Fit, Zero-Scroll)         */}
        {/* ========================================================= */}
        <div className="w-full rounded-[22px] lg:rounded-[28px] p-5 sm:p-7 lg:p-10 flex flex-col justify-between flex-1 lg:col-span-5 xl:col-span-5 bg-white dark:bg-[#1C1C1E] overflow-hidden">
          
          <div className="my-auto max-w-sm w-full mx-auto">
            {/* Brand Logo on Right (Visible on Mobile/Tablet when left panel is hidden) */}
            <div className="lg:hidden relative mx-auto mb-2 sm:mb-3 flex items-center justify-center">
              <Image
                src="/logo-kerso-waras.svg"
                alt="Apotek Kerso Waras"
                width={72}
                height={99}
                priority
                unoptimized
                className="w-14 h-auto sm:w-16 max-h-16 object-contain drop-shadow-[0_8px_24px_rgba(0,139,148,0.28)] dark:drop-shadow-[0_8px_24px_rgba(45,212,191,0.35)] select-none pointer-events-none"
              />
            </div>

            {/* Typography Header */}
            <div className="text-center mb-4 sm:mb-5">
              <h1 className="text-[20px] sm:text-[23px] font-bold text-[#1C1C1E] dark:text-white tracking-tight leading-tight">
                Selamat Datang
              </h1>
              <p className="text-[11.5px] sm:text-[12.5px] text-[#8E8E93] mt-0.5">
                Masukkan ID Staf atau Email dan kata sandi Anda
              </p>
            </div>

            {/* Access Denied Warning */}
            {accessDeniedParam && (
              <div className="mb-3 p-2.5 rounded-[12px] bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 text-[11px] flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                <span>Akses Ditolak: Anda tidak memiliki wewenang untuk halaman tersebut.</span>
              </div>
            )}

            {/* Error Message Alert */}
            {errorMessage && (
              <div className="mb-3 p-2.5 rounded-[12px] bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 text-[11px] flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                <span className="font-semibold flex-1 leading-snug">{errorMessage}</span>
              </div>
            )}

            {/* Lockout Warning */}
            {lockoutRemaining > 0 && (
              <div className="mb-3 p-2.5 rounded-[12px] bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 text-[11px] flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 shrink-0 text-amber-600 animate-pulse" />
                  <span className="text-[11px]">
                    Terkunci <strong>{lockoutRemaining}d</strong> demi keamanan.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleUnlockAccount}
                  className="px-2 py-0.5 rounded-[6px] bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[10px] shrink-0"
                >
                  Buka Kunci
                </button>
              </div>
            )}

            {/* Pure Form (No Demo Chips / No Exposed Credentials / Zero Scroll) */}
            <form onSubmit={handleLoginSubmit} className="space-y-2.5 sm:space-y-3.5">
              
              {/* Field 1: ID Staf / Username / Email */}
              <div>
                <label className="block text-[11px] sm:text-[12px] font-semibold text-[#1C1C1E] dark:text-neutral-300 mb-1">
                  ID Staf atau Email
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Contoh: alwinizam atau email staf"
                    disabled={isLoading || lockoutRemaining > 0}
                    autoComplete="username"
                    required
                    className="h-11 sm:h-12 w-full pl-10 pr-4 rounded-[14px] bg-[#F9F9FB] dark:bg-[#2C2C2E]/60 border border-[#E5E7EB] dark:border-white/10 text-[13px] sm:text-[14px] text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:bg-white dark:focus:bg-[#1C1C1E] focus:border-[#008B94] focus:ring-4 focus:ring-[#008B94]/12 focus:outline-none transition-all disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Field 2: Kata Sandi */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] sm:text-[12px] font-semibold text-[#1C1C1E] dark:text-neutral-300">
                    Kata Sandi
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowHelpModal(true)}
                    className="text-[11px] font-medium text-[#008B94] hover:underline"
                  >
                    Bantuan Masuk?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan kata sandi akun"
                    disabled={isLoading || lockoutRemaining > 0}
                    autoComplete="current-password"
                    required
                    className="h-11 sm:h-12 w-full pl-10 pr-12 rounded-[14px] bg-[#F9F9FB] dark:bg-[#2C2C2E]/60 border border-[#E5E7EB] dark:border-white/10 text-[13px] sm:text-[14px] text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:bg-white dark:focus:bg-[#1C1C1E] focus:border-[#008B94] focus:ring-4 focus:ring-[#008B94]/12 focus:outline-none transition-all disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 active:scale-95 transition-all"
                    aria-label="Tampilkan atau sembunyikan kata sandi"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me Option */}
              <div className="flex items-center pt-0.5 pb-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded-[5px] border-neutral-300 text-[#008B94] focus:ring-[#008B94]"
                  />
                  <span className="text-[11.5px] sm:text-[12px] text-neutral-600 dark:text-neutral-400">
                    Tetap masuk di perangkat ini
                  </span>
                </label>
              </div>

              {/* Submit CTA Button (Sleek Apple Deep Black Pill) */}
              <button
                type="submit"
                disabled={isLoading || lockoutRemaining > 0}
                className="w-full h-11 sm:h-12 rounded-[14px] bg-[#000000] hover:bg-[#1C1C1E] dark:bg-white dark:hover:bg-neutral-100 dark:text-black text-white font-medium text-[13.5px] sm:text-[14px] shadow-[0_4px_14px_rgba(0,0,0,0.12)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.18)] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Memverifikasi...</span>
                  </>
                ) : (
                  <>
                    <span>Masuk ke Sistem</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* 3-Level RBAC Quick Fill Selector */}
              <div className="pt-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E8E93] block text-center mb-1.5">
                  Akun Demo Operasional (RBAC 3-Level)
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playKeyTap();
                      setUsername("owner");
                      setPassword("owner123");
                    }}
                    className="py-1.5 px-2 rounded-[10px] border border-black/[0.08] dark:border-white/10 bg-[#F9F9FB] dark:bg-white/5 hover:border-[#008B94] text-[10.5px] font-bold text-[#1C1C1E] dark:text-white transition-all text-center"
                  >
                    Lv.1 Pemilik
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playKeyTap();
                      setUsername("gudang");
                      setPassword("gudang123");
                    }}
                    className="py-1.5 px-2 rounded-[10px] border border-black/[0.08] dark:border-white/10 bg-[#F9F9FB] dark:bg-white/5 hover:border-[#008B94] text-[10.5px] font-bold text-[#1C1C1E] dark:text-white transition-all text-center"
                  >
                    Lv.2 Gudang
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playKeyTap();
                      setUsername("kasir1");
                      setPassword("kasir123");
                    }}
                    className="py-1.5 px-2 rounded-[10px] border border-black/[0.08] dark:border-white/10 bg-[#F9F9FB] dark:bg-white/5 hover:border-[#008B94] text-[10.5px] font-bold text-[#1C1C1E] dark:text-white transition-all text-center"
                  >
                    Lv.3 Kasir
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Microtext Privacy & Security Footnote */}
          <div className="pt-3 sm:pt-4 text-center border-t border-neutral-100 dark:border-white/5 pb-[env(safe-area-inset-bottom,0px)]">
            <p className="text-[10px] sm:text-[11px] text-[#8E8E93] leading-relaxed max-w-xs mx-auto">
              Apotek Kerso Waras &bull; Sistem Manajemen Farmasi Terpadu
            </p>
          </div>
        </div>

      </div>

      {/* Helpful Guidance Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-[#1C1C1E] rounded-[24px] p-6 shadow-2xl border border-black/[0.08] dark:border-white/[0.12] animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#008B94]" />
                <h3 className="font-bold text-[14px]">Panduan Kredensial RBAC 3-Level</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="py-4 space-y-2.5 text-[12px] text-neutral-600 dark:text-neutral-300 leading-relaxed">
              <div className="p-3 rounded-[12px] bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 space-y-1.5">
                <div>
                  <strong className="text-[#1C1C1E] dark:text-white">Level 1 — Pemilik Apotek (Akses Penuh):</strong>
                  <div className="font-mono text-[11px] text-[#008B94]">ID: owner &bull; Sandi: owner123</div>
                </div>
                <div>
                  <strong className="text-[#1C1C1E] dark:text-white">Level 2 — Petugas Gudang (Akses Menengah):</strong>
                  <div className="font-mono text-[11px] text-[#008B94]">ID: gudang &bull; Sandi: gudang123</div>
                </div>
                <div>
                  <strong className="text-[#1C1C1E] dark:text-white">Level 3 — Kasir (Akses Terbatas):</strong>
                  <div className="font-mono text-[11px] text-[#008B94]">ID: kasir1 &bull; Sandi: kasir123</div>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowHelpModal(false)}
              className="w-full py-2.5 rounded-[12px] bg-neutral-900 hover:bg-black text-white text-[12px] font-semibold transition-colors"
            >
              Mengerti & Kembali
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
