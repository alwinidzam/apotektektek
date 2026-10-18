"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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

function UserManagementPageContent() {
  const { currentUser } = useApotekStore();

  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<UserAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "STAFF_LIST" | "PERMISSIONS_MATRIX" | "AUDIT_LOGS" | "CREDENTIALS_CARD"
  >("STAFF_LIST");
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<StaffUser | null>(null);

  const searchParams = useSearchParams();

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "staf") setActiveTab("STAFF_LIST");
    else if (tab === "matriks") setActiveTab("PERMISSIONS_MATRIX");
    else if (tab === "pin") setActiveTab("CREDENTIALS_CARD");
    else if (tab === "audit") setActiveTab("AUDIT_LOGS");

    const action = searchParams.get("action");
    if (action === "new") {
      setEditingUser(null);
      setIsModalOpen(true);
    }
  }, [searchParams]);

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
      case "OWNER":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 whitespace-nowrap shrink-0">
            <TrendingUp className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>Lv.1 — Pemilik Apotek</span>
          </span>
        );
      case "KARYAWAN_APOTEKER":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 whitespace-nowrap shrink-0">
            <FileBadge className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <span>Lv.2 — Petugas Gudang</span>
          </span>
        );
      case "KARYAWAN_KASIR":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 whitespace-nowrap shrink-0">
            <Terminal className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Lv.3 — Kasir POS</span>
          </span>
        );
      default:
        return <span className="whitespace-nowrap">{role}</span>;
    }
  };

  const getStatusBadge = (status: UserStatus) => {
    switch (status) {
      case "ACTIVE":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 whitespace-nowrap shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span>Aktif</span>
          </span>
        );
      case "INACTIVE":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 whitespace-nowrap shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 shrink-0" />
            <span>Nonaktif</span>
          </span>
        );
      case "SUSPENDED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 whitespace-nowrap shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
            <span>Terkunci</span>
          </span>
        );
    }
  };

  const formatAuditEventType = (eventType: string) => {
    switch (eventType) {
      case "USER_CREATED":
        return "Akun Dibuat";
      case "USER_UPDATED":
        return "Akun Diperbarui";
      case "USER_STATUS_CHANGED":
        return "Status Diubah";
      case "SUPERVISOR_PIN_RESET":
        return "Reset PIN Otorisasi";
      default:
        return eventType;
    }
  };

  return (
    <div className="min-h-[calc(100vh-50px)] w-full max-w-full overflow-x-hidden bg-[#F5F6F8] dark:bg-[#0E0F12] text-[#1C1C1E] dark:text-[#F5F5F7] flex flex-col lg:rounded-br-[10px] border-x border-b border-neutral-300/80 dark:border-white/[0.08]">
      <Navbar />

      {/* Page Header */}
      <div className="w-full max-w-full bg-white dark:bg-[#141416] border-b border-neutral-200/80 dark:border-white/[0.08] px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-[18px] sm:text-[20px] font-bold tracking-tight text-neutral-900 dark:text-white">
              Pengguna & Hak Akses (RBAC)
            </h1>
            <p className="text-[12px] text-neutral-500 mt-0.5">
              Kelola akun staf dan pembagian hak akses Level 1 (Pemilik), Level 2 (Gudang), serta Level 3 (Kasir)
            </p>
          </div>

          {/* Top Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCreateNewUser}
              className="px-3.5 py-2 rounded-lg bg-[#00767E] hover:bg-[#006067] text-white text-[12px] font-semibold flex items-center gap-1.5 transition-colors shrink-0"
            >
              <UserPlus className="w-4 h-4 shrink-0" />
              <span>Tambah Staf</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation Segmented Bar */}
        <div className="max-w-7xl mx-auto mt-3.5 flex items-center gap-1.5 border-t border-neutral-100 dark:border-white/[0.06] pt-3 overflow-x-auto no-scrollbar">
          {[
            { id: "STAFF_LIST", label: "Daftar Staf", count: staffUsers.length, icon: Users },
            { id: "PERMISSIONS_MATRIX", label: "Matriks Hak Akses (RBAC)", icon: ShieldCheck },
            { id: "CREDENTIALS_CARD", label: "Kredensial Login", icon: KeyRound },
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
                className={`px-3 py-1.5 rounded-lg text-[12px] font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                  isActive
                    ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold"
                    : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/[0.06]"
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold ${
                      isActive
                        ? "bg-white/20 text-white dark:bg-black/20 dark:text-black"
                        : "bg-neutral-200/70 dark:bg-white/10 text-neutral-600 dark:text-neutral-400"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Viewport */}
      <main
        {...swipeHandlers}
        className="flex-1 w-full max-w-full min-w-0 p-4 sm:p-6 lg:p-8 touch-pan-y"
      >
        <div className="max-w-7xl mx-auto space-y-5">
          {/* TAB 1: STAFF LIST */}
          {activeTab === "STAFF_LIST" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* 4 Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl bg-white dark:bg-[#141416] border border-neutral-200/80 dark:border-white/[0.08]">
                  <span className="text-[11px] font-medium text-neutral-500 block">
                    Total Staf
                  </span>
                  <div className="text-[22px] font-bold font-mono text-neutral-900 dark:text-white tabular-nums mt-1">
                    {staffUsers.length}
                  </div>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                    {staffUsers.filter((u) => u.status === "ACTIVE").length} akun aktif
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-[#141416] border border-neutral-200/80 dark:border-white/[0.08]">
                  <span className="text-[11px] font-medium text-neutral-500 block">
                    Level 1 — Pemilik Apotek
                  </span>
                  <div className="text-[22px] font-bold font-mono text-neutral-900 dark:text-white tabular-nums mt-1">
                    {staffUsers.filter((u) => u.role === "SUPER_ADMIN" || u.role === "OWNER").length}
                  </div>
                  <span className="text-[11px] text-neutral-400 mt-0.5 block">
                    Akses penuh, omzet & PO
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-[#141416] border border-neutral-200/80 dark:border-white/[0.08]">
                  <span className="text-[11px] font-medium text-neutral-500 block">
                    Level 2 — Petugas Gudang
                  </span>
                  <div className="text-[22px] font-bold font-mono text-neutral-900 dark:text-white tabular-nums mt-1">
                    {staffUsers.filter((u) => u.role === "KARYAWAN_APOTEKER").length}
                  </div>
                  <span className="text-[11px] text-neutral-400 mt-0.5 block">
                    Stok, barang masuk & opname
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-[#141416] border border-neutral-200/80 dark:border-white/[0.08]">
                  <span className="text-[11px] font-medium text-neutral-500 block">
                    Level 3 — Kasir
                  </span>
                  <div className="text-[22px] font-bold font-mono text-neutral-900 dark:text-white tabular-nums mt-1">
                    {staffUsers.filter((u) => u.role === "KARYAWAN_KASIR").length}
                  </div>
                  <span className="text-[11px] text-neutral-400 mt-0.5 block">
                    Transaksi kasir & cek stok
                  </span>
                </div>
              </div>

              {/* Filters & Search Toolbar */}
              <div className="p-3.5 rounded-xl bg-white dark:bg-[#141416] border border-neutral-200/80 dark:border-white/[0.08] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari nama, email, SIPA, atau terminal..."
                    className="w-full pl-9 pr-3 py-1.5 text-[12.5px] rounded-lg bg-neutral-50 dark:bg-[#1C1C1E] border border-neutral-200 dark:border-white/10 outline-none focus:border-[#00767E]"
                  />
                </div>

                <div className="flex items-center flex-wrap gap-2">
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="text-[12px] px-3 py-1.5 rounded-lg bg-neutral-50 dark:bg-[#1C1C1E] border border-neutral-200 dark:border-white/10 font-medium outline-none text-neutral-800 dark:text-white"
                  >
                    <option value="ALL">Semua Level</option>
                    <option value="OWNER">Level 1 — Pemilik Apotek</option>
                    <option value="KARYAWAN_APOTEKER">Level 2 — Petugas Gudang</option>
                    <option value="KARYAWAN_KASIR">Level 3 — Kasir</option>
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="text-[12px] px-3 py-1.5 rounded-lg bg-neutral-50 dark:bg-[#1C1C1E] border border-neutral-200 dark:border-white/10 font-medium outline-none text-neutral-800 dark:text-white"
                  >
                    <option value="ALL">Semua Status</option>
                    <option value="ACTIVE">Aktif</option>
                    <option value="INACTIVE">Nonaktif</option>
                    <option value="SUSPENDED">Terkunci</option>
                  </select>
                </div>
              </div>

              {/* Staff Data Table */}
              <div className="w-full max-w-full min-w-0 bg-white dark:bg-[#141416] rounded-xl border border-neutral-200/80 dark:border-white/[0.08] overflow-hidden">
                <div className="w-full max-w-full min-w-0 overflow-x-auto">
                  <table className="w-full min-w-[820px] text-left text-[12px]">
                    <thead>
                      <tr className="border-b border-neutral-200/80 dark:border-white/[0.08] text-neutral-500 text-[11px] uppercase tracking-wider font-semibold bg-neutral-50/80 dark:bg-white/[0.03]">
                        <th className="py-3 px-4 whitespace-nowrap">Nama & Username</th>
                        <th className="py-3 px-4 whitespace-nowrap">Level Hak Akses</th>
                        <th className="py-3 px-4 whitespace-nowrap">Status</th>
                        <th className="py-3 px-4 whitespace-nowrap">Legalitas / Terminal</th>
                        <th className="py-3 px-4 text-center whitespace-nowrap">PIN Otorisasi</th>
                        <th className="py-3 px-4 whitespace-nowrap">Login Terakhir</th>
                        <th className="py-3 px-4 text-right whitespace-nowrap">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 dark:divide-white/[0.06]">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-10 text-center text-neutral-500">
                            Tidak ada data staf yang cocok dengan pencarian.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((user) => {
                          const isPrimaryAdmin = user.email === PRIMARY_OWNER_EMAIL;
                          return (
                            <tr
                              key={user.uid}
                              className="hover:bg-neutral-50/60 dark:hover:bg-white/[0.02] transition-colors"
                            >
                              <td className="py-3 px-4 min-w-[220px]">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-[#00767E]/10 text-[#00767E] dark:text-teal-300 font-bold text-[11px] flex items-center justify-center shrink-0">
                                    {user.avatar}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-semibold text-neutral-900 dark:text-white truncate">
                                        {user.displayName}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-0.5 whitespace-nowrap">
                                      <span className="font-mono text-[10.5px] font-semibold text-[#00767E] dark:text-teal-400 shrink-0">
                                        @{user.username || user.email.split("@")[0]}
                                      </span>
                                      <span className="text-[11px] text-neutral-400 truncate">
                                        &middot; {user.email}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </td>

                              <td className="py-3 px-4 whitespace-nowrap">{getRoleBadge(user.role)}</td>

                              <td className="py-3 px-4 whitespace-nowrap">
                                <select
                                  value={user.status}
                                  disabled={isPrimaryAdmin}
                                  onChange={(e) => handleToggleStatus(user, e.target.value as UserStatus)}
                                  className="text-[11.5px] font-medium px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-white/[0.06] border border-neutral-200/80 dark:border-white/10 outline-none cursor-pointer"
                                >
                                  <option value="ACTIVE">Aktif</option>
                                  <option value="INACTIVE">Nonaktif</option>
                                  <option value="SUSPENDED">Terkunci</option>
                                </select>
                              </td>

                              <td className="py-3 px-4 text-[11px] whitespace-nowrap">
                                {user.role === "KARYAWAN_APOTEKER" && user.pharmacistDetails ? (
                                  <div>
                                    <span className="font-mono text-neutral-900 dark:text-white block font-medium">
                                      SIPA: {user.pharmacistDetails.sipaNumber}
                                    </span>
                                    <span className="text-neutral-400 text-[10px]">
                                      Berlaku s/d {user.pharmacistDetails.sipaExpiryDate}
                                    </span>
                                  </div>
                                ) : user.role === "KARYAWAN_KASIR" && user.cashierDetails ? (
                                  <span className="font-mono font-medium px-2 py-0.5 rounded bg-neutral-100 dark:bg-white/[0.06] text-neutral-800 dark:text-white">
                                    {user.cashierDetails.terminalId}
                                  </span>
                                ) : (
                                  <span className="text-neutral-400">Semua Modul</span>
                                )}
                              </td>

                              <td className="py-3 px-4 text-center whitespace-nowrap">
                                {user.supervisorPin ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-600 font-semibold">
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Aktif</span>
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-neutral-400">-</span>
                                )}
                              </td>

                              <td className="py-3 px-4 text-[11px] text-neutral-500 whitespace-nowrap">
                                {user.lastLoginAt ? (
                                  new Date(user.lastLoginAt).toLocaleDateString("id-ID", {
                                    day: "numeric",
                                    month: "short",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                ) : (
                                  <span>Belum pernah</span>
                                )}
                              </td>

                              <td className="py-3 px-4 text-right whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => handleEditUser(user)}
                                  className="px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-white/[0.06] hover:bg-neutral-200 text-neutral-800 dark:text-white text-[11px] font-medium inline-flex items-center gap-1 transition-colors whitespace-nowrap"
                                >
                                  <Edit2 className="w-3 h-3" />
                                  <span>Ubah</span>
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
            <div className="bg-white dark:bg-[#141416] p-5 rounded-xl border border-neutral-200/80 dark:border-white/[0.08] animate-in fade-in duration-150">
              <div className="mb-4 pb-3 border-b border-neutral-100 dark:border-white/[0.06]">
                <h3 className="text-[15px] font-bold text-neutral-900 dark:text-white">
                  Matriks Pembagian Hak Akses (Role-Based Access Control 3-Level)
                </h3>
                <p className="text-[12px] text-neutral-500 mt-0.5">
                  Rincian wewenang operasional setiap peran pengguna
                </p>
              </div>

              <div className="w-full max-w-full min-w-0 overflow-x-auto">
                <table className="w-full min-w-[680px] text-left text-[12px] border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-200/80 dark:border-white/[0.08] text-neutral-500 text-[11px] uppercase tracking-wider font-semibold">
                      <th className="py-3 px-4 whitespace-nowrap">Modul & Wewenang Operasional</th>
                      <th className="py-3 px-4 text-center text-neutral-900 dark:text-white whitespace-nowrap">
                        Level 1 — Akses Penuh<br />
                        <span className="text-[10px] font-normal text-neutral-500">(Pemilik Apotek)</span>
                      </th>
                      <th className="py-3 px-4 text-center text-neutral-900 dark:text-white whitespace-nowrap">
                        Level 2 — Akses Menengah<br />
                        <span className="text-[10px] font-normal text-neutral-500">(Petugas Gudang)</span>
                      </th>
                      <th className="py-3 px-4 text-center text-neutral-900 dark:text-white whitespace-nowrap">
                        Level 3 — Akses Terbatas<br />
                        <span className="text-[10px] font-normal text-neutral-500">(Kasir)</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-white/[0.06] text-[12px]">
                    {[
                      {
                        module: "Pelayanan Transaksi Penjualan Kasir POS (Swamedikasi & Resep)",
                        lv1: "Akses Penuh",
                        lv2: "Akses Operasional",
                        lv3: "Fokus Utama Kasir",
                        lv3Allowed: true,
                      },
                      {
                        module: "Pencarian Sisa Stok Obat, Lokasi Rak & Rekomendasi Pengganti",
                        lv1: "Akses Penuh",
                        lv2: "Akses Penuh",
                        lv3: "Baca Saja",
                        lv3Allowed: true,
                      },
                      {
                        module: "Mengelola Data Stok Obat & Katalog Gudang",
                        lv1: "Akses Penuh",
                        lv2: "Hak Khusus Gudang",
                        lv3: "Terkunci",
                        lv3Allowed: false,
                      },
                      {
                        module: "Mencatat Barang Masuk dari Supplier (Kamera Barcode / Manual)",
                        lv1: "Akses Penuh",
                        lv2: "Hak Khusus Gudang",
                        lv3: "Terkunci",
                        lv3Allowed: false,
                      },
                      {
                        module: "Mengeksekusi Stock Opname (Penyesuaian Fisik vs Sistem)",
                        lv1: "Akses Penuh",
                        lv2: "Hak Khusus Gudang",
                        lv3: "Terkunci",
                        lv3Allowed: false,
                      },
                      {
                        module: "Membuat Draf Purchase Order (PO) ke Supplier (PBF)",
                        lv1: "Buat & Setujui PO",
                        lv2: "Buat Draf PO",
                        lv3: "Terkunci",
                        lv3Allowed: false,
                      },
                      {
                        module: "Menyetujui Purchase Order (Approve PO) ke Supplier",
                        lv1: "Wewenang Pemilik",
                        lv2: "Menunggu Persetujuan Lv.1",
                        lv3: "Terkunci",
                        lv3Allowed: false,
                      },
                      {
                        module: "Memantau Grafik Omzet Harian/Bulanan & Laba Kotor",
                        lv1: "Wewenang Pemilik",
                        lv2: "Terkunci",
                        lv3: "Terkunci",
                        lv3Allowed: false,
                      },
                    ].map((row, idx) => (
                      <tr key={idx} className="hover:bg-neutral-50/60 dark:hover:bg-white/[0.02]">
                        <td className="py-3 px-4 font-medium text-neutral-900 dark:text-white">
                          {row.module}
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold">
                            <Check className="w-3.5 h-3.5" />
                            <span>{row.lv1}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 font-medium ${
                              row.lv2 === "Terkunci"
                                ? "text-neutral-400"
                                : "text-neutral-800 dark:text-neutral-200"
                            }`}
                          >
                            {row.lv2 === "Terkunci" ? (
                              <Lock className="w-3 h-3" />
                            ) : (
                              <Check className="w-3.5 h-3.5 text-[#00767E]" />
                            )}
                            <span>{row.lv2}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 font-medium ${
                              row.lv3Allowed
                                ? "text-emerald-700 dark:text-emerald-400 font-semibold"
                                : "text-neutral-400"
                            }`}
                          >
                            {row.lv3Allowed ? (
                              <Check className="w-3.5 h-3.5" />
                            ) : (
                              <Lock className="w-3 h-3" />
                            )}
                            <span>{row.lv3}</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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

                  <div className="px-3 py-1.5 rounded-[10px] bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[11px] font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
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
                            <div className="flex items-center gap-2 mt-1 whitespace-nowrap">
                              <span className="px-2 py-0.5 rounded-md bg-teal-100 dark:bg-teal-950/80 text-[#008B94] border border-teal-200 dark:border-teal-900 font-mono font-bold text-[11px] shrink-0">
                                Username: {cred.username || matchedUser?.username || "user"}
                              </span>
                              <span className="text-[11px] font-mono text-[#8E8E93] truncate">
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
                            className="px-2.5 py-1 rounded-[8px] bg-white dark:bg-[#1C1C1E] border border-black/[0.08] dark:border-white/[0.12] hover:bg-neutral-100 text-[11px] font-semibold text-[#1C1C1E] dark:text-white flex items-center gap-1 transition-all whitespace-nowrap shrink-0"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Ubah Sandi</span>
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
                      Catatan kronologis riwayat perubahan hak akses, pembuatan akun staf, dan reset PIN otorisasi.
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
                          <span className="px-2 py-0.5 rounded-[6px] text-[10px] font-bold bg-neutral-200 dark:bg-neutral-700 text-[#1C1C1E] dark:text-white whitespace-nowrap shrink-0">
                            {formatAuditEventType(log.eventType)}
                          </span>
                          <span className="font-semibold text-[#1C1C1E] dark:text-white">
                            {log.description}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#8E8E93]">
                          Oleh: <strong className="text-[#1C1C1E] dark:text-white">{log.actorName}</strong> ({log.actorEmail}) &bull; Target: {log.targetName}
                        </p>
                      </div>

                      <div className="text-[11px] text-[#8E8E93] shrink-0 font-mono whitespace-nowrap">
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

export default function UserManagementPage() {
  return (
    <Suspense fallback={null}>
      <UserManagementPageContent />
    </Suspense>
  );
}
