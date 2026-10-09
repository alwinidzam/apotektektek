"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  User,
  Shield,
  FileBadge,
  Terminal,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Phone,
  Mail,
  Building,
  Save,
} from "lucide-react";
import { StaffUser, UserStatus } from "@/lib/firebase/users";
import { UserRole } from "@/lib/types";
import { soundEngine } from "@/lib/audio";
import { hashPassword } from "@/lib/auth/auth-service";

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  userToEdit?: StaffUser | null;
  onSave: (user: StaffUser) => void;
}

export function UserModal({ isOpen, onClose, userToEdit, onSave }: UserModalProps) {
  const [activeTab, setActiveTab] = useState<"PROFILE" | "ROLE" | "PHARMACIST" | "SECURITY">("PROFILE");

  // Form State
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [title, setTitle] = useState("");
  const [branch, setBranch] = useState("Apotek Kerso Waras (Pusat - Kedung)");
  const [role, setRole] = useState<UserRole>("KARYAWAN_KASIR");
  const [status, setStatus] = useState<UserStatus>("ACTIVE");
  const [newPassword, setNewPassword] = useState("");

  // Pharmacist Specific
  const [sipaNumber, setSipaNumber] = useState("");
  const [sipaExpiry, setSipaExpiry] = useState("2028-12-31");
  const [straNumber, setStraNumber] = useState("");
  const [straExpiry, setStraExpiry] = useState("2028-12-31");
  const [issuedByDinkes, setIssuedByDinkes] = useState("Dinas Kesehatan Kabupaten Jepara");

  // Cashier / Security Specific
  const [terminalId, setTerminalId] = useState("POS-01");
  const [supervisorPin, setSupervisorPin] = useState("");

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (userToEdit) {
      setDisplayName(userToEdit.displayName);
      setUsername(userToEdit.username || userToEdit.email.split("@")[0] || "");
      setEmail(userToEdit.email);
      setPhone(userToEdit.phone || "");
      setTitle(userToEdit.title || "");
      setBranch(userToEdit.branch || "Apotek Kerso Waras (Pusat - Kedung)");
      setRole(userToEdit.role);
      setStatus(userToEdit.status);

      if (userToEdit.pharmacistDetails) {
        setSipaNumber(userToEdit.pharmacistDetails.sipaNumber || "");
        setSipaExpiry(userToEdit.pharmacistDetails.sipaExpiryDate || "2028-12-31");
        setStraNumber(userToEdit.pharmacistDetails.straNumber || "");
        setStraExpiry(userToEdit.pharmacistDetails.straExpiryDate || "2028-12-31");
        setIssuedByDinkes(userToEdit.pharmacistDetails.issuedByDinkes || "Dinas Kesehatan Kabupaten Jepara");
      } else {
        setSipaNumber("");
        setStraNumber("");
      }

      setTerminalId(userToEdit.cashierDetails?.terminalId || "POS-01");
      setSupervisorPin(userToEdit.supervisorPin || "");
    } else {
      // Default new user form
      setDisplayName("");
      setUsername("");
      setEmail("");
      setPhone("");
      setTitle("");
      setBranch("Apotek Kerso Waras (Pusat - Kedung)");
      setRole("KARYAWAN_KASIR");
      setStatus("ACTIVE");
      setSipaNumber("");
      setStraNumber("");
      setTerminalId("POS-01");
      setSupervisorPin("");
    }
    setNewPassword("");
    setActiveTab("PROFILE");
    setErrorMsg(null);
  }, [userToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playKeyTap();

    if (!displayName.trim()) {
      setErrorMsg("Nama lengkap staff wajib diisi.");
      setActiveTab("PROFILE");
      return;
    }

    if (!email.trim() || !email.includes("@")) {
      setErrorMsg("Email valid wajib diisi.");
      setActiveTab("PROFILE");
      return;
    }

    if (role === "KARYAWAN_APOTEKER" && !sipaNumber.trim()) {
      setErrorMsg("Nomor SIPA resmi Dinkes wajib diisi untuk peran Apoteker.");
      setActiveTab("PHARMACIST");
      return;
    }

    if ((role === "OWNER" || role === "SUPER_ADMIN" || role === "KARYAWAN_APOTEKER") && supervisorPin && supervisorPin.length !== 6) {
      setErrorMsg("PIN Supervisor harus tepat 6 digit angka.");
      setActiveTab("SECURITY");
      return;
    }

    let finalPasswordHash = userToEdit?.passwordHash;
    if (newPassword.trim()) {
      if (newPassword.trim().length < 8) {
        setErrorMsg("Password baru harus minimal 8 karakter.");
        setActiveTab("SECURITY");
        return;
      }
      finalPasswordHash = await hashPassword(newPassword.trim());
    } else if (!finalPasswordHash) {
      finalPasswordHash = await hashPassword("KersoWaras2026!");
    }

    const initials = displayName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();

    const updatedUser: StaffUser = {
      uid: userToEdit ? userToEdit.uid : `usr-${Date.now()}`,
      username: (username.trim().toLowerCase() || email.split("@")[0]).replace(/[^a-z0-9._-]/g, ""),
      email: email.trim().toLowerCase(),
      displayName: displayName.trim(),
      role,
      status,
      phone: phone.trim(),
      branch,
      avatar: initials || "KW",
      title: title.trim() || (role === "SUPER_ADMIN" ? "Super Admin" : role === "OWNER" ? "Owner PSA" : role === "KARYAWAN_APOTEKER" ? "Apoteker" : "Kasir"),
      createdAt: userToEdit ? userToEdit.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: userToEdit ? userToEdit.lastLoginAt : null,
      supervisorPin: supervisorPin.trim() || undefined,
      passwordHash: finalPasswordHash,
      pharmacistDetails:
        role === "KARYAWAN_APOTEKER"
          ? {
              sipaNumber: sipaNumber.trim(),
              sipaExpiryDate: sipaExpiry,
              straNumber: straNumber.trim(),
              straExpiryDate: straExpiry,
              issuedByDinkes: issuedByDinkes.trim(),
            }
          : undefined,
      cashierDetails:
        role === "KARYAWAN_KASIR"
          ? {
              terminalId,
              shiftAssignment: terminalId === "POS-01" ? 1 : 2,
            }
          : undefined,
    };

    onSave(updatedUser);
    soundEngine.playScanSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white dark:bg-[#1C1C1E] rounded-[24px] shadow-2xl border border-black/[0.08] dark:border-white/[0.12] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4.5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[12px] bg-teal-50 dark:bg-teal-950/60 text-[#008B94] flex items-center justify-center shadow-sm">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-[17px] font-bold text-[#1C1C1E] dark:text-white">
                {userToEdit ? "Edit Data Staff & Peran" : "Tambah Staff Apotek Baru"}
              </h2>
              <p className="text-[12px] text-[#8E8E93]">
                Autentikasi Firebase & Konfigurasi Role-Based Access Control (RBAC)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-700 dark:hover:text-white rounded-[10px] hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Segment Controls */}
        <div className="px-6 pt-3 pb-2 border-b border-neutral-100 dark:border-neutral-800 flex items-center gap-1 overflow-x-auto no-scrollbar bg-white dark:bg-[#1C1C1E]">
          {[
            { id: "PROFILE", label: "Profil Dasar", icon: User },
            { id: "ROLE", label: "Peran & Status", icon: Shield },
            ...(role === "KARYAWAN_APOTEKER"
              ? [{ id: "PHARMACIST", label: "Legalitas SIPA / STRA", icon: FileBadge }]
              : []),
            { id: "SECURITY", label: "Terminal & PIN Supervisor", icon: KeyRound },
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
                className={`px-3.5 py-1.5 rounded-[10px] text-[12px] font-semibold flex items-center gap-2 transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-[#008B94] text-white shadow-sm"
                    : "text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-[12px] bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center gap-2.5 text-[12px] text-rose-700 dark:text-rose-300">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4 text-[13px]">
          {/* TAB 1: BASIC PROFILE */}
          {activeTab === "PROFILE" && (
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8E8E93] mb-1.5">
                  Nama Lengkap Staff & Gelar *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#8E8E93] absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Contoh: apt. Farhan Pratama, S.Farm atau Dinda Kirana"
                    className="w-full pl-9 pr-3 py-2.5 rounded-[12px] bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-black/[0.06] dark:border-white/[0.08] text-[#1C1C1E] dark:text-white outline-none focus:border-[#008B94]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8E8E93] mb-1.5">
                  Username Login Kasir / Operator (Bukan Email) *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#8E8E93] absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ""))}
                    placeholder="Contoh: alwinizam, owner, kasir1, kasir2"
                    className="w-full pl-9 pr-3 py-2.5 rounded-[12px] bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-black/[0.06] dark:border-white/[0.08] text-[#1C1C1E] dark:text-white font-mono text-[13px] outline-none focus:border-[#008B94]"
                  />
                </div>
                <p className="text-[10px] text-[#8E8E93] mt-1">
                  Digunakan untuk login cepat di meja kasir/farmasi tanpa perlu mengetikkan format email.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8E8E93] mb-1.5">
                    Email Akun Login Firebase *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#8E8E93] absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="alwinizam0405@gmail.com"
                      className="w-full pl-9 pr-3 py-2.5 rounded-[12px] bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-black/[0.06] dark:border-white/[0.08] text-[#1C1C1E] dark:text-white outline-none focus:border-[#008B94]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8E8E93] mb-1.5">
                    No. Handphone / WhatsApp
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-[#8E8E93] absolute left-3 top-3" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0812-3456-7890"
                      className="w-full pl-9 pr-3 py-2.5 rounded-[12px] bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-black/[0.06] dark:border-white/[0.08] text-[#1C1C1E] dark:text-white outline-none focus:border-[#008B94]"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8E8E93] mb-1.5">
                    Jabatan Operasional
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Contoh: Apoteker Penanggung Jawab (APJ)"
                    className="w-full px-3 py-2.5 rounded-[12px] bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-black/[0.06] dark:border-white/[0.08] text-[#1C1C1E] dark:text-white outline-none focus:border-[#008B94]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8E8E93] mb-1.5">
                    Cabang Apotek
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-[#8E8E93] absolute left-3 top-3" />
                    <select
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-[12px] bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-black/[0.06] dark:border-white/[0.08] text-[#1C1C1E] dark:text-white outline-none focus:border-[#008B94]"
                    >
                      <option value="Apotek Kerso Waras (Pusat - Kedung)">Apotek Kerso Waras (Pusat - Kedung)</option>
                      <option value="Apotek Kerso Waras (Cabang Tahunan)">Apotek Kerso Waras (Cabang Tahunan)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ROLE & STATUS */}
          {activeTab === "ROLE" && (
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8E8E93] mb-2">
                  Tingkat Peran & Otoritas Akses (Role RBAC) *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    {
                      role: "SUPER_ADMIN" as UserRole,
                      title: "Super Admin",
                      desc: "Akses root sistem penuh, audit trail, konfigurasi Firebase, dan manajemen seluruh akun staff.",
                      color: "border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300 bg-purple-50/50 dark:bg-purple-950/20",
                    },
                    {
                      role: "OWNER" as UserRole,
                      title: "Owner (PSA)",
                      desc: "Pemilik Sarana Apotek. Akses Laba Kotor, Valuasi HPP, Analitik Finansial, dan Otorisasi Kas.",
                      color: "border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300 bg-amber-50/50 dark:bg-amber-950/20",
                    },
                    {
                      role: "KARYAWAN_APOTEKER" as UserRole,
                      title: "Apoteker (APJ / TTK)",
                      desc: "Skrining klinis, peracikan resep puyer/kapsul, pelaporan SIPNAP & BPOM, dan penerimaan faktur PBF.",
                      color: "border-teal-300 dark:border-teal-800 text-teal-700 dark:text-teal-300 bg-teal-50/50 dark:bg-teal-950/20",
                    },
                    {
                      role: "KARYAWAN_KASIR" as UserRole,
                      title: "Kasir Shift (Front-Desk)",
                      desc: "Layanan penjualan POS, kas kecil, buka/tutup shift laci. HPP dan margin terproteksi 100% rahasia.",
                      color: "border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20",
                    },
                  ].map((item) => (
                    <div
                      key={item.role}
                      onClick={() => {
                        soundEngine.playKeyTap();
                        setRole(item.role);
                      }}
                      className={`p-3.5 rounded-[16px] border-2 cursor-pointer transition-all ${
                        role === item.role
                          ? `${item.color} shadow-sm ring-2 ring-[#008B94]`
                          : "border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 opacity-75"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-[13px]">{item.title}</span>
                        {role === item.role && <CheckCircle2 className="w-4 h-4 text-[#008B94]" />}
                      </div>
                      <p className="text-[11px] text-[#8E8E93] leading-snug">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8E8E93] mb-2">
                  Status Keanggotaan Akun
                </label>
                <div className="flex items-center gap-2">
                  {[
                    { id: "ACTIVE", label: "Aktif (Active)", color: "bg-emerald-500" },
                    { id: "INACTIVE", label: "Nonaktif (Cuti / Istirahat)", color: "bg-neutral-400" },
                    { id: "SUSPENDED", label: "Kunci / Suspended", color: "bg-rose-500" },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        soundEngine.playKeyTap();
                        setStatus(s.id as UserStatus);
                      }}
                      className={`px-3.5 py-2 rounded-[12px] text-[12px] font-semibold border flex items-center gap-2 transition-all ${
                        status === s.id
                          ? "bg-white dark:bg-[#2C2C2E] border-[#008B94] text-[#1C1C1E] dark:text-white shadow-sm"
                          : "border-transparent text-[#8E8E93] hover:bg-neutral-100 dark:hover:bg-neutral-800"
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${s.color}`} />
                      <span>{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PHARMACIST LICENSURE */}
          {activeTab === "PHARMACIST" && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-[14px] bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900/50 text-[12px] text-teal-800 dark:text-teal-300">
                Sesuai Permenkes No. 73/2016 & BPOM CDOB, peracikan resep dokter dan pengawasan obat keras wajib memiliki SIPA dan STRA aktif yang terdaftar di Dinas Kesehatan.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8E8E93] mb-1.5">
                    Nomor SIPA Resmi *
                  </label>
                  <input
                    type="text"
                    value={sipaNumber}
                    onChange={(e) => setSipaNumber(e.target.value)}
                    placeholder="19930812/SIPA_33.20/2022/2001"
                    className="w-full px-3 py-2.5 rounded-[12px] bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-black/[0.06] dark:border-white/[0.08] text-[#1C1C1E] dark:text-white font-mono text-[12px] outline-none focus:border-[#008B94]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8E8E93] mb-1.5">
                    Masa Berlaku SIPA
                  </label>
                  <input
                    type="date"
                    value={sipaExpiry}
                    onChange={(e) => setSipaExpiry(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-[12px] bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-black/[0.06] dark:border-white/[0.08] text-[#1C1C1E] dark:text-white outline-none focus:border-[#008B94]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8E8E93] mb-1.5">
                    Nomor STRA (KFN / KTKI)
                  </label>
                  <input
                    type="text"
                    value={straNumber}
                    onChange={(e) => setStraNumber(e.target.value)}
                    placeholder="19930812/STRA-IAI/2021/8821"
                    className="w-full px-3 py-2.5 rounded-[12px] bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-black/[0.06] dark:border-white/[0.08] text-[#1C1C1E] dark:text-white font-mono text-[12px] outline-none focus:border-[#008B94]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8E8E93] mb-1.5">
                    Instansi Penerbit
                  </label>
                  <input
                    type="text"
                    value={issuedByDinkes}
                    onChange={(e) => setIssuedByDinkes(e.target.value)}
                    placeholder="Dinas Kesehatan Kabupaten Jepara"
                    className="w-full px-3 py-2.5 rounded-[12px] bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-black/[0.06] dark:border-white/[0.08] text-[#1C1C1E] dark:text-white outline-none focus:border-[#008B94]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SECURITY & TERMINAL HARDWARE */}
          {activeTab === "SECURITY" && (
            <div className="space-y-4">
              {role === "KARYAWAN_KASIR" && (
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8E8E93] mb-1.5">
                    Binding Terminal Kasir POS
                  </label>
                  <div className="relative">
                    <Terminal className="w-4 h-4 text-[#8E8E93] absolute left-3 top-3" />
                    <select
                      value={terminalId}
                      onChange={(e) => setTerminalId(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-[12px] bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-black/[0.06] dark:border-white/[0.08] text-[#1C1C1E] dark:text-white outline-none focus:border-[#008B94]"
                    >
                      <option value="POS-01">Terminal POS-01 (Register Depan / Shift 1)</option>
                      <option value="POS-02">Terminal POS-02 (Register Samping / Shift 2)</option>
                      <option value="POS-03">Terminal POS-03 (Register Cadangan)</option>
                    </select>
                  </div>
                </div>
              )}

              {(role === "SUPER_ADMIN" || role === "OWNER" || role === "KARYAWAN_APOTEKER") && (
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8E8E93] mb-1.5">
                    PIN Supervisor 6-Digit (Otorisasi Selisih Kasir & Void Struk)
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-[#8E8E93] absolute left-3 top-3" />
                    <input
                      type="password"
                      maxLength={6}
                      value={supervisorPin}
                      onChange={(e) => setSupervisorPin(e.target.value.replace(/\D/g, ""))}
                      placeholder="Contoh: 123456"
                      className="w-full pl-9 pr-3 py-2.5 rounded-[12px] bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-black/[0.06] dark:border-white/[0.08] text-[#1C1C1E] dark:text-white font-mono tracking-widest text-[15px] outline-none focus:border-[#008B94]"
                    />
                  </div>
                  <p className="text-[11px] text-[#8E8E93] mt-1">
                    Digunakan saat kasir membutuhkan persetujuan supervisor untuk rekonsiliasi kas tidak klop atau pembatalan transaksi.
                  </p>
                </div>
              )}

              {/* Password Management */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8E8E93] mb-1.5">
                  {userToEdit ? "Ubah Password Login (Kosongkan bila tidak diubah)" : "Password Login Awal"}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#8E8E93] absolute left-3 top-3" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={userToEdit ? "Ketik password baru jika ingin mengubah..." : "Minimal 8 karakter (cth: KersoWaras2026!)"}
                    className="w-full pl-9 pr-3 py-2.5 rounded-[12px] bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-black/[0.06] dark:border-white/[0.08] text-[#1C1C1E] dark:text-white text-[13px] outline-none focus:border-[#008B94]"
                  />
                </div>
                <p className="text-[11px] text-[#8E8E93] mt-1">
                  Password akan disimpan dalam format hash SHA-256 terenkripsi dan diverifikasi saat login.
                </p>
              </div>
            </div>
          )}

          {/* Modal Footer Controls */}
          <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-[12px] border border-neutral-200 dark:border-neutral-700 text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white text-[12px] font-semibold transition-colors"
            >
              Batal
            </button>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-[12px] bg-[#008B94] hover:bg-[#00767E] text-white text-[12px] font-semibold flex items-center gap-2 shadow-md transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{userToEdit ? "Simpan Perubahan" : "Buat Akun Staff"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
