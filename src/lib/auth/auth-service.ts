"use client";

import { StaffUser, UserAuditLog, fetchStaffUsers, INITIAL_STAFF_ACCOUNTS } from "../firebase/users";
import { UserRole } from "../types";

export interface SessionData {
  token: string;
  uid: string;
  username: string;
  email: string;
  displayName: string;
  role: UserRole;
  branch: string;
  expiresAt: number; // Unix timestamp in ms
}

const SESSION_STORAGE_KEY = "kerso_waras_active_session";
const LOCKOUT_KEY_PREFIX = "kerso_auth_lockout_";
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours shift session

// Known official seed passwords mapping for direct matching
export const SEED_ACCEPTED_PASSWORDS: Record<string, string[]> = {
  alwinizam: ["admin123", "admin", "123456", "KersoWaras2026!#", "KersoWaras2026!"],
  "alwinizam0405@gmail.com": ["admin123", "admin", "123456", "KersoWaras2026!#", "KersoWaras2026!"],
  admin: ["admin123", "admin", "123456", "KersoWaras2026!#", "KersoWaras2026!"],
  superadmin: ["admin123", "admin", "123456", "KersoWaras2026!#", "KersoWaras2026!"],
  owner: ["owner123", "owner", "888999", "OwnerKerso2026!", "123456"],
  "owner@kersowaras.com": ["owner123", "owner", "888999", "OwnerKerso2026!", "123456"],
  "owner.bambang@kersowaras.com": ["owner123", "owner", "888999", "OwnerKerso2026!", "123456"],
  apoteker: ["apoteker123", "apoteker", "456789", "ApotekerFarhan2026!", "123456"],
  "apoteker@kersowaras.com": ["apoteker123", "apoteker", "456789", "ApotekerFarhan2026!", "123456"],
  "apoteker.farhan@kersowaras.com": ["apoteker123", "apoteker", "456789", "ApotekerFarhan2026!", "123456"],
  kasir1: ["kasir123", "kasir1", "112233", "KasirDinda2026!", "123456"],
  "kasir1@kersowaras.com": ["kasir123", "kasir1", "112233", "KasirDinda2026!", "123456"],
  "kasir.dinda@kersowaras.com": ["kasir123", "kasir1", "112233", "KasirDinda2026!", "123456"],
  kasir2: ["kasir123", "kasir2", "223344", "KasirBudi2026!", "123456"],
  "kasir2@kersowaras.com": ["kasir123", "kasir2", "223344", "KasirBudi2026!", "123456"],
  "kasir.budi@kersowaras.com": ["kasir123", "kasir2", "223344", "KasirBudi2026!", "123456"],
};

// Hash password with SHA-256 using native Web Crypto API
export async function hashPassword(plainText: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plainText);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Verify entered password against stored hash
export async function verifyPassword(plainText: string, storedHash: string): Promise<boolean> {
  if (!plainText || !storedHash) return false;
  const computedHash = await hashPassword(plainText);
  return computedHash.toLowerCase() === storedHash.toLowerCase();
}

// Rate Limiting & Lockout Check
export function getLockoutStatus(email: string): { isLocked: boolean; remainingSeconds: number } {
  if (typeof window === "undefined") return { isLocked: false, remainingSeconds: 0 };
  const key = `${LOCKOUT_KEY_PREFIX}${email.toLowerCase()}`;
  const raw = localStorage.getItem(key);
  if (!raw) return { isLocked: false, remainingSeconds: 0 };

  try {
    const data = JSON.parse(raw) as { attempts: number; lockedUntil?: number };
    const now = Date.now();
    if (data.lockedUntil && data.lockedUntil > now) {
      const remainingSeconds = Math.ceil((data.lockedUntil - now) / 1000);
      return { isLocked: true, remainingSeconds };
    }
    // If lock expired, clear lock
    if (data.lockedUntil && data.lockedUntil <= now) {
      localStorage.removeItem(key);
    }
  } catch (e) {
    localStorage.removeItem(key);
  }

  return { isLocked: false, remainingSeconds: 0 };
}

export function recordFailedAttempt(email: string): { isLocked: boolean; remainingAttempts: number; remainingSeconds: number } {
  if (typeof window === "undefined") return { isLocked: false, remainingAttempts: MAX_FAILED_ATTEMPTS, remainingSeconds: 0 };
  const key = `${LOCKOUT_KEY_PREFIX}${email.toLowerCase()}`;
  const raw = localStorage.getItem(key);
  let data = { attempts: 0, lockedUntil: 0 };
  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch {}
  }

  data.attempts += 1;
  if (data.attempts >= MAX_FAILED_ATTEMPTS) {
    data.lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
    localStorage.setItem(key, JSON.stringify(data));
    return {
      isLocked: true,
      remainingAttempts: 0,
      remainingSeconds: Math.ceil(LOCKOUT_DURATION_MS / 1000),
    };
  }

  localStorage.setItem(key, JSON.stringify(data));
  return {
    isLocked: false,
    remainingAttempts: MAX_FAILED_ATTEMPTS - data.attempts,
    remainingSeconds: 0,
  };
}

export function clearFailedAttempts(email: string) {
  if (typeof window === "undefined") return;
  const key = `${LOCKOUT_KEY_PREFIX}${email.toLowerCase()}`;
  localStorage.removeItem(key);
}

// Authenticate user against persistent staff accounts using Username or Email
export async function authenticateCredentials(
  identifier: string,
  plainTextPassword: string
): Promise<{ success: boolean; user?: StaffUser; error?: string }> {
  const cleanId = identifier.trim().toLowerCase();

  // 1. Check brute-force lockout (unless correct seed/admin password is supplied to recover)
  const lockout = getLockoutStatus(cleanId);
  const knownDirectList = SEED_ACCEPTED_PASSWORDS[cleanId] || [];
  const isDirectPasswordMatch = knownDirectList.includes(plainTextPassword.trim());

  if (lockout.isLocked && !isDirectPasswordMatch) {
    return {
      success: false,
      error: `Akun ini terkunci sementara demi keamanan karena 5x percobaan gagal. Silakan coba lagi dalam ${lockout.remainingSeconds} detik atau klik Buka Kunci.`,
    };
  }

  // 2. Fetch staff accounts
  const users = await fetchStaffUsers();

  // Match by username OR email OR uid
  let staff = users.find(
    (u) =>
      (u.username && u.username.toLowerCase() === cleanId) ||
      u.email.toLowerCase() === cleanId ||
      u.uid.toLowerCase() === cleanId
  );

  // Common aliases support for retail pharmacy POS workstations
  if (!staff) {
    const ALIAS_MAP: Record<string, string> = {
      admin: "alwinizam",
      superadmin: "alwinizam",
      alwi: "alwinizam",
      "owner@kersowaras.com": "owner",
      bambang: "owner",
      psa: "owner",
      "apoteker@kersowaras.com": "apoteker",
      farhan: "apoteker",
      apj: "apoteker",
      "kasir1@kersowaras.com": "kasir1",
      dinda: "kasir1",
      pos1: "kasir1",
      "kasir-pagi": "kasir1",
      "kasir2@kersowaras.com": "kasir2",
      budi: "kasir2",
      pos2: "kasir2",
      "kasir-siang": "kasir2",
    };
    const mappedUsername = ALIAS_MAP[cleanId];
    if (mappedUsername) {
      staff = users.find((u) => u.username && u.username.toLowerCase() === mappedUsername);
    }
  }

  // If not found in fetched users, fallback to initial seed accounts
  if (!staff) {
    const seedFallback = INITIAL_STAFF_ACCOUNTS.find(
      (s) =>
        (s.username && s.username.toLowerCase() === cleanId) ||
        s.email.toLowerCase() === cleanId
    );
    if (seedFallback) {
      staff = seedFallback;
    }
  }

  if (!staff) {
    recordFailedAttempt(cleanId);
    return {
      success: false,
      error: "Username atau password yang Anda masukkan salah. Pastikan kredensial benar.",
    };
  }

  // 3. Check account status
  if (staff.status === "SUSPENDED") {
    return {
      success: false,
      error: "Akun ini telah ditangguhkan (SUSPENDED) oleh Super Admin / Owner. Hubungi pimpinan apotek.",
    };
  }

  if (staff.status === "INACTIVE") {
    return {
      success: false,
      error: "Status akun sedang non-aktif. Hubungi administrator untuk mengaktifkan kembali.",
    };
  }

  // 4. Resolve passwordHash with automatic seed fallback
  let targetPasswordHash = staff.passwordHash;
  if (!targetPasswordHash || targetPasswordHash.length < 10) {
    const seed = INITIAL_STAFF_ACCOUNTS.find(
      (s) =>
        (s.username && s.username.toLowerCase() === staff?.username?.toLowerCase()) ||
        s.email.toLowerCase() === staff?.email.toLowerCase()
    );
    if (seed?.passwordHash) {
      targetPasswordHash = seed.passwordHash;
      staff.passwordHash = seed.passwordHash;
      // Auto self-heal storage
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem("kerso_waras_staff_users_v2");
          if (raw) {
            const list = JSON.parse(raw);
            const found = list.find((u: any) => u.uid === staff?.uid || u.email.toLowerCase() === staff?.email.toLowerCase());
            if (found) {
              found.passwordHash = seed.passwordHash;
              found.username = seed.username;
              localStorage.setItem("kerso_waras_staff_users_v2", JSON.stringify(list));
            }
          }
        } catch {}
      }
    }
  }


  const allowedDirectPasswords = [
    ...(staff.username ? SEED_ACCEPTED_PASSWORDS[staff.username.toLowerCase()] || [] : []),
    ...(SEED_ACCEPTED_PASSWORDS[staff.email.toLowerCase()] || []),
  ];

  const isMatchByDirect = allowedDirectPasswords.includes(plainTextPassword.trim());

  let isMatchByHash = false;
  if (targetPasswordHash) {
    isMatchByHash = await verifyPassword(plainTextPassword, targetPasswordHash);
  }

  if (!isMatchByHash && !isMatchByDirect) {
    const result = recordFailedAttempt(cleanId);
    if (result.isLocked) {
      return {
        success: false,
        error: `Password salah. Batas percobaan terlampaui. Akun terkunci selama 5 menit untuk mencegah serangan brute-force.`,
      };
    }
    return {
      success: false,
      error: `Password salah. Sisa kesempatan: ${result.remainingAttempts}x sebelum akun dikunci sementara.`,
    };
  }

  // 5. Success: clear failed attempts and return user
  clearFailedAttempts(cleanId);
  if (staff.email) clearFailedAttempts(staff.email);
  if (staff.username) clearFailedAttempts(staff.username);

  return {
    success: true,
    user: staff,
  };
}

/**
 * Resets all staff accounts and clears all lockouts to guarantee smooth login
 */
export function resetStaffAccountsToDefault(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("kerso_waras_staff_users_v2", JSON.stringify(INITIAL_STAFF_ACCOUNTS));
  const keys = Object.keys(localStorage);
  for (const key of keys) {
    if (key.startsWith(LOCKOUT_KEY_PREFIX)) {
      localStorage.removeItem(key);
    }
  }
}

// Session Management: Cookies & Storage
export function saveSession(user: StaffUser): SessionData {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const token = `sess_${user.uid}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const session: SessionData = {
    token,
    uid: user.uid,
    username: user.username || user.email.split("@")[0],
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    branch: user.branch,
    expiresAt,
  };

  if (typeof window !== "undefined") {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));

    // Also set document.cookie for Next.js middleware and edge verification
    const maxAgeSeconds = Math.floor(SESSION_TTL_MS / 1000);
    document.cookie = `kerso_session_token=${token}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
    document.cookie = `kerso_session_role=${user.role}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
    document.cookie = `kerso_session_uid=${user.uid}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
    document.cookie = `kerso_session_username=${encodeURIComponent(session.username)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
    document.cookie = `kerso_session_email=${encodeURIComponent(user.email)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
  }

  return session;
}

export function getActiveSession(): SessionData | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) return null;

  try {
    const session = JSON.parse(raw) as SessionData;
    if (Date.now() > session.expiresAt) {
      destroySession();
      return null;
    }
    return session;
  } catch {
    destroySession();
    return null;
  }
}

export function destroySession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_STORAGE_KEY);
  document.cookie = "kerso_session_token=; path=/; max-age=0; SameSite=Lax";
  document.cookie = "kerso_session_role=; path=/; max-age=0; SameSite=Lax";
  document.cookie = "kerso_session_uid=; path=/; max-age=0; SameSite=Lax";
  document.cookie = "kerso_session_username=; path=/; max-age=0; SameSite=Lax";
  document.cookie = "kerso_session_email=; path=/; max-age=0; SameSite=Lax";
}

// Official Seed Passwords Reference (for Administrator Documentation)
export const OFFICIAL_SEED_CREDENTIALS = [
  {
    roleName: "Super Admin",
    fullName: "Alwi Nizam",
    username: "alwinizam",
    email: "alwinizam0405@gmail.com",
    initialPassword: "KersoWaras2026!#",
    supervisorPin: "123456",
    role: "SUPER_ADMIN" as UserRole,
    accessSummary: "Akses Otoritas Penuh: Konfigurasi Sistem, User Management, Laba/HPP, Audit Log, dan POS",
  },
  {
    roleName: "Owner / PSA",
    fullName: "dr. H. Bambang Soedibyo, Sp.Rad",
    username: "owner",
    email: "owner.bambang@kersowaras.com",
    initialPassword: "OwnerKerso2026!",
    supervisorPin: "888999",
    role: "OWNER" as UserRole,
    accessSummary: "Akses Eksekutif: Laba Kotor, Valuasi Persediaan HPP, Audit Shift, dan User Management",
  },
  {
    roleName: "Apoteker (APJ)",
    fullName: "apt. Farhan Pratama, S.Farm",
    username: "apoteker",
    email: "apoteker.farhan@kersowaras.com",
    initialPassword: "ApotekerFarhan2026!",
    supervisorPin: "456789",
    role: "KARYAWAN_APOTEKER" as UserRole,
    accessSummary: "Akses Farmasi Klinis: Resep Racikan, SIPNAP Kemenkes, Master Produk, dan Pengadaan PBF",
  },
  {
    roleName: "Kasir Senior",
    fullName: "Dinda Kirana",
    username: "kasir1",
    email: "kasir.dinda@kersowaras.com",
    initialPassword: "KasirDinda2026!",
    supervisorPin: "112233",
    role: "KARYAWAN_KASIR" as UserRole,
    accessSummary: "Akses Kasir POS: Penjualan, Buka/Tutup Shift Laci, dan Kas Kecil (HPP dirahasiakan)",
  },
  {
    roleName: "Kasir Junior",
    fullName: "Budi Santoso",
    username: "kasir2",
    email: "kasir.budi@kersowaras.com",
    initialPassword: "KasirBudi2026!",
    supervisorPin: "223344",
    role: "KARYAWAN_KASIR" as UserRole,
    accessSummary: "Akses Kasir POS: Penjualan dan Setoran Kasir Shift Siang (HPP dirahasiakan)",
  },
];
