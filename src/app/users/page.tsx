"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import {
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  Edit2,
  KeyRound,
  FileBadge,
  Terminal,
  Activity,
  Calendar,
  Layers,
  Sparkles,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  Building2,
  TrendingUp,
  FileText,
  Copy,
  Check,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { AccessDenied } from "@/components/AccessDenied";
import { useApotekStore } from "@/lib/store";
import { soundEngine } from "@/lib/audio";
import {
  StaffUser,
  UserStatus,
  UserAuditLog,
  fetchStaffUsers,
  saveStaffUser,
  toggleStaffStatus,
  fetchAuditLogs,
} from "@/lib/firebase/users";
import { isLiveFirebaseConfigured, PRIMARY_OWNER_EMAIL } from "@/lib/firebase/config";
import { UserRole } from "@/lib/types";
import { UserModal } from "@/components/users/UserModal";
import { OFFICIAL_SEED_CREDENTIALS } from "@/lib/auth/auth-service";

export default function UserManagementPage() {
  const { currentUser } = useApotekStore();

  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<UserAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "STAFF_LIST" | "PERMISSIONS_MATRIX" | "AUDIT_LOGS" | "CREDENTIALS_CARD"
  >("STAFF_LIST");
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  const router = useRouter();
  const USER_TABS = ["STAFF_LIST", "CREDENTIALS_CARD", "PERMISSIONS_MATRIX", "AUDIT_LOGS"] as const;

  const handleSwipeLeft = () => {
    const idx = USER_TABS.indexOf(activeTab as any);
    if (idx < USER_TABS.length - 1) {
      soundEngine.playKeyTap();
      setActiveTab(USER_TABS[idx + 1] as any);
    }
  };

  const handleSwipeRight = () => {
    const idx = USER_TABS.indexOf(activeTab as any);
    if (idx > 0) {
      soundEngine.playKeyTap();
      setActiveTab(USER_TABS[idx - 1] as any);
    }
  };

  const handleEdgeSwipeRight = () => {
    soundEngine.playKeyTap();
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  const swipeHandlers = useSwipeGesture({
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight,
    onEdgeSwipeRight: handleEdgeSwipeRight,
  });

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<StaffUser | null>(null);

  // Load staff and audit logs
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [users, logs] = await Promise.all([fetchStaffUsers(), fetchAuditLogs()]);
      setStaffUsers(users);
      setAuditLogs(logs);
    } catch (e) {
      console.error("Error loading staff data:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return staffUsers.filter((user) => {
      if (roleFilter !== "ALL" && user.role !== roleFilter) return false;
      if (statusFilter !== "ALL" && user.status !== statusFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = user.displayName.toLowerCase().includes(q);
        const matchEmail = user.email.toLowerCase().includes(q);
        const matchPhone = (user.phone || "").toLowerCase().includes(q);
        const matchSipa = (user.pharmacistDetails?.sipaNumber || "").toLowerCase().includes(q);
        const matchTerminal = (user.cashierDetails?.terminalId || "").toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchPhone && !matchSipa && !matchTerminal) return false;
      }

      return true;
    });
  }, [staffUsers, roleFilter, statusFilter, searchQuery]);

  // Restrict Page Access: Only SUPER_ADMIN and OWNER can view this page
  const isAuthorized = currentUser.role === "SUPER_ADMIN" || currentUser.role === "OWNER";

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#000000]">
        <Navbar />
        <AccessDenied
          requiredRole="Super Admin / Owner (PSA)"
          reason="Manajemen hak akses pengguna dan lisensi SIPA staf memuat data privasi internal serta konfigurasi otorisasi PIN supervisor."
        />
      </div>
    );
  }

  const handleCreateNewUser = () => {
    soundEngine.playKeyTap();
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleEditUser = (user: StaffUser) => {
    soundEngine.playKeyTap();
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleSaveUser = async (user: StaffUser) => {
    await saveStaffUser(user, {
      email: currentUser.id === "usr-alwi-nizam" ? PRIMARY_OWNER_EMAIL : `${currentUser.id}@kersowaras.com`,
      name: currentUser.name,
      role: currentUser.role,
    });
    await loadData();
  };

  const handleToggleStatus = async (user: StaffUser, newStatus: UserStatus) => {
    soundEngine.playKeyTap();
    await toggleStaffStatus(user.uid, newStatus, {
      email: currentUser.id === "usr-alwi-nizam" ? PRIMARY_OWNER_EMAIL : `${currentUser.id}@kersowaras.com`,
      name: currentUser.name,
      role: currentUser.role,
    });
    await loadData();
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case "SUPER_ADMIN":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            <Shield className="w-3 h-3 text-purple-600" />
            Super Admin
          </span>
        );
      case "OWNER":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <TrendingUp className="w-3 h-3 text-amber-600" />
            Owner (PSA)
          </span>
        );
      case "KARYAWAN_APOTEKER":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
            <FileBadge className="w-3 h-3 text-teal-600" />
            Apoteker (APJ)
          </span>
        );
      case "KARYAWAN_KASIR":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <Terminal className="w-3 h-3 text-emerald-600" />
            Kasir Shift
          </span>
        );
      default:
        return <span>{role}</span>;
    }
  };

  const getStatusBadge = (status: UserStatus) => {
    switch (status) {
      case "ACTIVE":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Aktif
          </span>
        );
      case "INACTIVE":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
            Nonaktif
          </span>
        );
      case "SUSPENDED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Terkunci
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#F5F5F7] dark:bg-[#000000] text-[#1C1C1E] dark:text-[#F5F5F7] flex flex-col">
      <Navbar />

      {/* Page Header */}
      <div className="w-full max-w-full bg-white dark:bg-[#1C1C1E] border-b border-black/[0.06] dark:border-white/[0.08] px-4 sm:px-6 lg:px-8 py-5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
              <span className="p-1.5 sm:p-2 rounded-[12px] bg-[#008B94]/10 text-[#008B94] shrink-0">
                <Users className="w-5 h-5 sm:w-6 sm:h-6" />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-[17px] sm:text-[22px] font-bold tracking-tight text-[#1C1C1E] dark:text-white truncate">
                    <span className="sm:hidden">Kelola Staf</span>
                    <span className="hidden sm:inline">Manajemen Akun & Otoritas Pengguna</span>
                  </h1>
                  <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#008B94]/15 text-[#008B94] shrink-0">
                    RBAC Enterprise
                  </span>
                </div>
                <p className="hidden sm:block text-[12px] text-[#8E8E93] mt-0.5">
                  Autentikasi Firebase, pembagian peran staf apotek, verifikasi lisensi SIPA, dan otorisasi supervisor.
                </p>
              </div>
            </div>
          </div>

          {/* Top Actions: Live Indicator & Add User Button */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="px-2.5 py-1.5 rounded-[10px] bg-neutral-100 dark:bg-neutral-800 text-[11px] font-semibold text-[#8E8E93] flex items-center gap-1.5 shrink-0 whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span>{isLiveFirebaseConfigured ? "Cloud Live" : "Offline Cache"}</span>
            </div>

            <button
              type="button"
              onClick={handleCreateNewUser}
              className="px-3.5 py-2 min-h-[40px] rounded-[12px] bg-[#008B94] hover:bg-[#00767E] active:scale-[0.98] text-white text-[12px] font-semibold flex items-center gap-1.5 shadow-sm transition-all shrink-0 whitespace-nowrap"
            >
              <UserPlus className="w-4 h-4 shrink-0" />
              <span>Tambah Staf</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation Segmented Bar */}
        <div className="max-w-7xl mx-auto mt-4 flex items-center gap-1.5 border-t border-neutral-100 dark:border-neutral-800 pt-3 overflow-x-auto no-scrollbar touch-pan-x">
          {[
            { id: "STAFF_LIST", label: "Daftar Staf", count: staffUsers.length, icon: Users },
            { id: "CREDENTIALS_CARD", label: "Kredensial", icon: KeyRound },
            { id: "PERMISSIONS_MATRIX", label: "Matriks Izin", icon: ShieldCheck },
            { id: "AUDIT_LOGS", label: "Log Audit", count: auditLogs.length, icon: Activity },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  soundEngine.playKeyTap();
                  setActiveTab(tab.id as any);
                }}
                className={`px-3 sm:px-3.5 py-1.5 sm:py-2 min-h-[36px] sm:min-h-[38px] rounded-[10px] text-[11px] sm:text-[12px] font-semibold flex items-center gap-1.5 sm:gap-2 transition-all whitespace-nowrap shrink-0 ${
                  isActive
                    ? "bg-[#1C1C1E] text-white dark:bg-white dark:text-[#1C1C1E] shadow-sm"
                    : "text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive
                        ? "bg-white/20 text-white dark:bg-black/20 dark:text-black"
                        : "bg-neutral-200 dark:bg-neutral-700 text-[#636366] dark:text-[#AEAEB2]"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Mobile Swipe Hint Indicator */}
        <div className="sm:hidden text-center text-[10px] text-neutral-400 dark:text-neutral-500 pt-1.5 flex items-center justify-center gap-1 select-none">
          <span>&larr;</span>
          <span>Geser layar ke kiri / kanan untuk ganti tab</span>
          <span>&rarr;</span>
        </div>
      </div>

      {/* Main Content Viewport with Swipe Gesture Support */}
      <main
        {...swipeHandlers}
        className="flex-1 w-full max-w-full min-w-0 p-3 sm:p-6 lg:p-8 touch-pan-y"
      >
        <div className="max-w-7xl mx-auto space-y-6">
          {/* TAB 1: STAFF LIST */}
          {activeTab === "STAFF_LIST" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* 4 Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <div className="p-4 rounded-[18px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] shadow-sm">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8E8E93] block mb-1">
                    Total Staff
                  </span>
                  <div className="text-[22px] font-bold text-[#1C1C1E] dark:text-white tabular-nums">
                    {staffUsers.length}
                  </div>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 block">
                    {staffUsers.filter((u) => u.status === "ACTIVE").length} Akun Aktif
                  </span>
                </div>

                <div className="p-4 rounded-[18px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] shadow-sm">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400 block mb-1">
                    Super Admin & Owner
                  </span>
                  <div className="text-[22px] font-bold text-purple-600 dark:text-purple-400 tabular-nums">
                    {staffUsers.filter((u) => u.role === "SUPER_ADMIN" || u.role === "OWNER").length}
                  </div>
                  <span className="text-[10px] text-[#8E8E93] mt-1 block">
                    Akses Eksekutif & Finansial
                  </span>
                </div>

                <div className="p-4 rounded-[18px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] shadow-sm">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400 block mb-1">
                    Apoteker (APJ)
                  </span>
                  <div className="text-[22px] font-bold text-teal-600 dark:text-teal-400 tabular-nums">
                    {staffUsers.filter((u) => u.role === "KARYAWAN_APOTEKER").length}
                  </div>
                  <span className="text-[10px] text-[#8E8E93] mt-1 block">
                    Ber-SIPA & Penanggung Jawab
                  </span>
                </div>

                <div className="p-4 rounded-[18px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] shadow-sm">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-1">
                    Kasir Shift POS
                  </span>
                  <div className="text-[22px] font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {staffUsers.filter((u) => u.role === "KARYAWAN_KASIR").length}
                  </div>
                  <span className="text-[10px] text-[#8E8E93] mt-1 block">
                    HPP & Margin Terproteksi
                  </span>
                </div>
              </div>

              {/* Filters & Search Toolbar */}
              <div className="p-4 rounded-[18px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-[#8E8E93] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari nama, email, SIPA, atau terminal..."
                    className="w-full pl-9 pr-3 py-2 text-[12px] rounded-[10px] bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-black/[0.04] dark:border-white/[0.04] outline-none focus:border-[#008B94]"
                  />
                </div>

                <div className="flex items-center flex-wrap gap-2">
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="text-[12px] px-3 py-2 rounded-[10px] bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-black/[0.04] dark:border-white/[0.04] font-medium outline-none text-[#1C1C1E] dark:text-white"
                  >
                    <option value="ALL">Semua Peran</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                    <option value="OWNER">Owner (PSA)</option>
                    <option value="KARYAWAN_APOTEKER">Apoteker (APJ)</option>
                    <option value="KARYAWAN_KASIR">Kasir POS</option>
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="text-[12px] px-3 py-2 rounded-[10px] bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-black/[0.04] dark:border-white/[0.04] font-medium outline-none text-[#1C1C1E] dark:text-white"
                  >
                    <option value="ALL">Semua Status</option>
                    <option value="ACTIVE">Aktif</option>
                    <option value="INACTIVE">Nonaktif</option>
                    <option value="SUSPENDED">Terkunci</option>
                  </select>
                </div>
              </div>

              {/* Staff Data Table */}
              <div className="w-full max-w-full min-w-0 bg-white dark:bg-[#1C1C1E] rounded-[20px] border border-black/[0.06] dark:border-white/[0.08] shadow-sm overflow-hidden">
                <div className="w-full max-w-full min-w-0 overflow-x-auto">
                  <table className="w-full min-w-[850px] text-left text-[12px]">
                    <thead>
                      <tr className="border-b border-neutral-100 dark:border-neutral-800 text-[#8E8E93] text-[11px] uppercase tracking-wider font-semibold bg-[#F5F5F7]/60 dark:bg-[#2C2C2E]/40">
                        <th className="py-3 px-4">Nama & Email Staff</th>
                        <th className="py-3 px-4">Peran (Role)</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Legalitas / Terminal</th>
                        <th className="py-3 px-4 text-center">PIN Supervisor</th>
                        <th className="py-3 px-4">Login Terakhir</th>
                        <th className="py-3 px-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-[#8E8E93]">
                            Tidak ada data staff yang cocok dengan pencarian.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((user) => {
                          const isPrimaryAdmin = user.email === PRIMARY_OWNER_EMAIL;
                          return (
                            <tr
                              key={user.uid}
                              className="hover:bg-neutral-50 dark:hover:bg-neutral-900/40 transition-colors"
                            >
                              {/* Name & Avatar */}
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-950 text-[#008B94] font-bold text-[11px] flex items-center justify-center shrink-0">
                                    {user.avatar}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-bold text-[#1C1C1E] dark:text-white truncate">
                                        {user.displayName}
                                      </span>
                                      {isPrimaryAdmin && (
                                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#008B94]/15 text-[#008B94]">
                                          ROOT
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      <span className="font-mono text-[10px] font-bold text-[#008B94] bg-teal-50 dark:bg-teal-950/60 px-1.5 py-0.5 rounded border border-teal-200 dark:border-teal-900">
                                        @{user.username || user.email.split("@")[0]}
                                      </span>
                                      <span className="text-[11px] text-[#8E8E93] truncate">
                                        {user.email}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Role */}
                              <td className="py-3 px-4">{getRoleBadge(user.role)}</td>

                              {/* Status */}
                              <td className="py-3 px-4">
                                <select
                                  value={user.status}
                                  disabled={isPrimaryAdmin}
                                  onChange={(e) => handleToggleStatus(user, e.target.value as UserStatus)}
                                  className="text-[11px] font-semibold px-2 py-1 rounded-[8px] bg-neutral-100 dark:bg-neutral-800 border-none outline-none cursor-pointer"
                                >
                                  <option value="ACTIVE">✅ Aktif</option>
                                  <option value="INACTIVE">⏸️ Nonaktif</option>
                                  <option value="SUSPENDED">🔒 Terkunci</option>
                                </select>
                              </td>

                              {/* Licensure / Hardware */}
                              <td className="py-3 px-4 text-[11px]">
                                {user.role === "KARYAWAN_APOTEKER" && user.pharmacistDetails ? (
                                  <div>
                                    <span className="font-mono text-[#1C1C1E] dark:text-white block font-semibold">
                                      SIPA: {user.pharmacistDetails.sipaNumber}
                                    </span>
                                    <span className="text-[#8E8E93] text-[10px]">
                                      Exp: {user.pharmacistDetails.sipaExpiryDate}
                                    </span>
                                  </div>
                                ) : user.role === "KARYAWAN_KASIR" && user.cashierDetails ? (
                                  <span className="font-mono font-semibold px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-[#1C1C1E] dark:text-white">
                                    {user.cashierDetails.terminalId}
                                  </span>
                                ) : (
                                  <span className="text-[#8E8E93] italic">Semua Modul</span>
                                )}
                              </td>

                              {/* Supervisor PIN */}
                              <td className="py-3 px-4 text-center">
                                {user.supervisorPin ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-600 font-bold">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Aktif (6-digit)</span>
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-[#8E8E93]">-</span>
                                )}
                              </td>

                              {/* Last Login */}
                              <td className="py-3 px-4 text-[11px] text-[#8E8E93]">
                                {user.lastLoginAt ? (
                                  new Date(user.lastLoginAt).toLocaleDateString("id-ID", {
                                    day: "numeric",
                                    month: "short",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                ) : (
                                  <span className="italic">Belum pernah</span>
                                )}
                              </td>

                              {/* Actions */}
                              <td className="py-3 px-4 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleEditUser(user)}
                                  className="px-2.5 py-1 rounded-[8px] bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-[#1C1C1E] dark:text-white text-[11px] font-semibold inline-flex items-center gap-1 transition-colors"
                                >
                                  <Edit2 className="w-3 h-3" />
                                  <span>Edit</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PERMISSIONS MATRIX (RBAC) */}
          {activeTab === "PERMISSIONS_MATRIX" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="bg-white dark:bg-[#1C1C1E] p-6 rounded-[22px] border border-black/[0.06] dark:border-white/[0.08] shadow-sm">
                <div className="flex items-center gap-2.5 mb-2">
                  <span className="p-2 rounded-[10px] bg-teal-50 dark:bg-teal-950 text-[#008B94]">
                    <ShieldCheck className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-[16px] font-bold text-[#1C1C1E] dark:text-white">
                      Matriks Hak Akses & Pembagian Otoritas (RBAC Matrix)
                    </h3>
                    <p className="text-[12px] text-[#8E8E93]">
                      Standar keamanan Farmasi Rumah Sakit & Apotek Modern (Separation of Duties).
                    </p>
                  </div>
                </div>

                <div className="w-full max-w-full min-w-0 overflow-x-auto mt-4">
                  <table className="w-full min-w-[700px] text-left text-[12px] border-collapse">
                    <thead>
                      <tr className="border-b border-neutral-200 dark:border-neutral-800 text-[#8E8E93] text-[11px] uppercase tracking-wider font-semibold">
                        <th className="py-3 px-4">Modul & Tindakan Sistem</th>
                        <th className="py-3 px-4 text-center">Super Admin</th>
                        <th className="py-3 px-4 text-center">Owner (PSA)</th>
                        <th className="py-3 px-4 text-center">Apoteker (APJ)</th>
                        <th className="py-3 px-4 text-center">Kasir POS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60 text-[12px]">
                      {[
                        {
                          module: "Layanan Kasir & Checkout Penjualan POS",
                          superAdmin: "✅ Penuh",
                          owner: "✅ Penuh / Monitor",
                          apoteker: "✅ Penuh",
                          kasir: "✅ Operator Utama",
                        },
                        {
                          module: "Buka / Tutup Shift Kasir (Blind Cash Count)",
                          superAdmin: "✅ Penuh",
                          owner: "✅ Penuh / Audit",
                          apoteker: "⚠️ Lihat Shift",
                          kasir: "✅ Shift Sendiri",
                        },
                        {
                          module: "Otorisasi PIN Selisih Kasir & Void Struk",
                          superAdmin: "✅ Otoritas Root",
                          owner: "✅ Master PIN",
                          apoteker: "✅ PIN Supervisor",
                          kasir: "❌ Dilarang (Wajib Minta)",
                        },
                        {
                          module: "Visibilitas HPP (Harga Pokok) & Margin Keuntungan",
                          superAdmin: "✅ Terbuka",
                          owner: "✅ Terbuka / Privacy",
                          apoteker: "❌ Terproteksi Rahasia",
                          kasir: "❌ Terproteksi Rahasia",
                        },
                        {
                          module: "Executive Suite (Laba Kotor, EBITDA, Valuasi Stok)",
                          superAdmin: "✅ Terbuka",
                          owner: "✅ Hak Eksklusif",
                          apoteker: "❌ Diblokir",
                          kasir: "❌ Diblokir",
                        },
                        {
                          module: "Peracikan Resep Dokter (Puyer / Kapsul / Dosis Anak)",
                          superAdmin: "✅ Konfigurasi",
                          owner: "⚠️ Monitor",
                          apoteker: "✅ Wewenang Penuh",
                          kasir: "❌ Dilarang (Non-Kefarmasian)",
                        },
                        {
                          module: "Pelaporan Narkotika / Psikotropika (SIPNAP & BPOM)",
                          superAdmin: "✅ Audit Teknis",
                          owner: "⚠️ Audit Legal",
                          apoteker: "✅ Penanggung Jawab SIPA",
                          kasir: "❌ Dilarang",
                        },
                        {
                          module: "Katalog Master Obat & Penyesuaian Harga Jual",
                          superAdmin: "✅ Penuh",
                          owner: "✅ Penuh (HPP & HJA)",
                          apoteker: "⚠️ Katalog Saja",
                          kasir: "❌ Baca Saja POS",
                        },
                        {
                          module: "Manajemen Akun Staff & Lisensi SIPA (Halaman Ini)",
                          superAdmin: "✅ Hak Penuh",
                          owner: "✅ Hak Penuh",
                          apoteker: "❌ Diblokir",
                          kasir: "❌ Diblokir",
                        },
                        {
                          module: "Inspeksi Audit Trail Sistem & Log Transaksi",
                          superAdmin: "✅ Root Log",
                          owner: "✅ Executive Log",
                          apoteker: "⚠️ Log Departemen",
                          kasir: "❌ Diblokir",
                        },
                      ].map((row, idx) => (
                        <tr key={idx} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/40">
                          <td className="py-3 px-4 font-semibold text-[#1C1C1E] dark:text-white">
                            {row.module}
                          </td>
                          <td className="py-3 px-4 text-center font-medium">{row.superAdmin}</td>
                          <td className="py-3 px-4 text-center font-medium">{row.owner}</td>
                          <td className="py-3 px-4 text-center font-medium">{row.apoteker}</td>
                          <td className="py-3 px-4 text-center font-medium">{row.kasir}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: KREDENSIAL & SANDI STAF */}
          {activeTab === "CREDENTIALS_CARD" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="bg-white dark:bg-[#1C1C1E] p-6 rounded-[22px] border border-black/[0.06] dark:border-white/[0.08] shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-black/[0.06] dark:border-white/[0.08]">
                  <div className="flex items-center gap-3">
                    <span className="p-2.5 rounded-[12px] bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                      <KeyRound className="w-6 h-6" />
                    </span>
                    <div>
                      <h3 className="text-[17px] font-bold text-[#1C1C1E] dark:text-white">
                        Dokumentasi Kredensial & Sandi Resmi Staf
                      </h3>
                      <p className="text-[12px] text-[#8E8E93]">
                        Daftar akun operasional, password awal sistem, PIN supervisor, dan status enkripsi SHA-256.
                      </p>
                    </div>
                  </div>

                  <div className="px-3 py-1.5 rounded-[10px] bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[11px] font-semibold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Enkripsi SHA-256 Aktif</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {OFFICIAL_SEED_CREDENTIALS.map((cred) => {
                    const matchedUser = staffUsers.find((u) => u.email.toLowerCase() === cred.email.toLowerCase());
                    const isCopied = copiedEmail === cred.email;

                    return (
                      <div
                        key={cred.email}
                        className="p-4 rounded-[18px] bg-neutral-50 dark:bg-[#2C2C2E] border border-black/[0.06] dark:border-white/[0.08] space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#008B94] block">
                              {cred.roleName}
                            </span>
                            <h4 className="text-[15px] font-bold text-[#1C1C1E] dark:text-white">
                              {cred.fullName}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="px-2 py-0.5 rounded-md bg-teal-100 dark:bg-teal-950/80 text-[#008B94] border border-teal-200 dark:border-teal-900 font-mono font-bold text-[11px]">
                                Username: {cred.username || matchedUser?.username || "user"}
                              </span>
                              <span className="text-[11px] font-mono text-[#8E8E93]">
                                ({cred.email})
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              if (matchedUser) {
                                handleEditUser(matchedUser);
                              }
                            }}
                            className="px-2.5 py-1 rounded-[8px] bg-white dark:bg-[#1C1C1E] border border-black/[0.08] dark:border-white/[0.12] hover:bg-neutral-100 text-[11px] font-semibold text-[#1C1C1E] dark:text-white flex items-center gap-1 transition-all"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Edit / Ganti Sandi</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[12px] bg-white dark:bg-[#1C1C1E] p-3 rounded-[12px] border border-black/[0.04] dark:border-white/[0.06]">
                          <div>
                            <span className="text-[10px] text-[#8E8E93] block font-medium">Password Awal:</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 select-all text-[13px]">
                                {cred.initialPassword}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(cred.initialPassword);
                                  setCopiedEmail(cred.email);
                                  setTimeout(() => setCopiedEmail(null), 2000);
                                }}
                                className="p-1 rounded text-[#8E8E93] hover:text-[#008B94]"
                                title="Salin password"
                              >
                                {isCopied ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </div>

                          <div>
                            <span className="text-[10px] text-[#8E8E93] block font-medium">PIN Supervisor / POS:</span>
                            <span className="font-mono font-bold text-purple-600 dark:text-purple-400 select-all text-[13px] block mt-0.5">
                              {cred.supervisorPin}
                            </span>
                          </div>
                        </div>

                        <p className="text-[11px] text-[#8E8E93] leading-relaxed">
                          {cred.accessSummary}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: AUDIT LOGS */}
          {activeTab === "AUDIT_LOGS" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="bg-white dark:bg-[#1C1C1E] p-6 rounded-[22px] border border-black/[0.06] dark:border-white/[0.08] shadow-sm">
                <div className="flex items-center gap-2.5 mb-4">
                  <span className="p-2 rounded-[10px] bg-blue-100 dark:bg-blue-950 text-blue-600">
                    <Activity className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-[16px] font-bold text-[#1C1C1E] dark:text-white">
                      Log Audit Aktivitas Akun & Keamanan (Audit Trail)
                    </h3>
                    <p className="text-[12px] text-[#8E8E93]">
                      Catatan kronologis immutable perubahan hak akses, pembuatan akun, dan reset PIN supervisor.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3.5 rounded-[14px] bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-black/[0.04] dark:border-white/[0.04] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[12px]"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-[6px] text-[10px] font-bold bg-neutral-200 dark:bg-neutral-700 text-[#1C1C1E] dark:text-white">
                            {log.eventType}
                          </span>
                          <span className="font-semibold text-[#1C1C1E] dark:text-white">
                            {log.description}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#8E8E93]">
                          Oleh: <strong className="text-[#1C1C1E] dark:text-white">{log.actorName}</strong> ({log.actorEmail}) &bull; Target: {log.targetName}
                        </p>
                      </div>

                      <div className="text-[11px] text-[#8E8E93] shrink-0 font-mono">
                        {new Date(log.timestamp).toLocaleString("id-ID", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* User Creation / Edit Modal */}
      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userToEdit={editingUser}
        onSave={handleSaveUser}
      />
    </div>
  );
}
