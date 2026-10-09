"use client";

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import { firestore, isLiveFirebaseConfigured, PRIMARY_OWNER_EMAIL } from "./config";
import { UserRole } from "../types";

export type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

export interface PharmacistLicensure {
  straNumber: string; // Surat Tanda Registrasi Apoteker
  straExpiryDate: string; // ISO Date YYYY-MM-DD
  sipaNumber: string; // Surat Izin Praktik Apoteker
  sipaExpiryDate: string; // ISO Date YYYY-MM-DD
  issuedByDinkes: string; // e.g. "Dinas Kesehatan Kabupaten Jepara"
}

export interface CashierTerminalBinding {
  terminalId: string; // e.g. "POS-01", "POS-02"
  shiftAssignment?: 1 | 2 | 3;
}

export interface StaffUser {
  uid: string;
  username: string; // Clean alphanumeric username for login (e.g. alwinizam, owner, apoteker, kasir1, kasir2)
  email: string;
  displayName: string;
  role: UserRole;
  status: UserStatus;
  phone: string;
  branch: string;
  avatar: string;
  title: string;
  pharmacistDetails?: PharmacistLicensure;
  cashierDetails?: CashierTerminalBinding;
  supervisorPin?: string; // 6-digit PIN for supervisor spot check & overrides
  passwordHash?: string; // SHA-256 secure hash
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
}

export interface UserAuditLog {
  id: string;
  eventType:
    | "USER_CREATED"
    | "USER_ROLE_CHANGED"
    | "USER_STATUS_TOGGLED"
    | "SUPERVISOR_PIN_RESET"
    | "PASSWORD_RESET"
    | "PROFILE_UPDATED";
  actorEmail: string;
  actorName: string;
  actorRole: UserRole;
  targetEmail: string;
  targetName: string;
  description: string;
  timestamp: string;
}

// Default High-End Seed Accounts (including user's requested email: alwinizam0405@gmail.com)
export const INITIAL_STAFF_ACCOUNTS: StaffUser[] = [
  {
    uid: "usr-alwi-nizam",
    username: "alwinizam",
    email: PRIMARY_OWNER_EMAIL, // alwinizam0405@gmail.com
    displayName: "Alwi Nizam",
    role: "SUPER_ADMIN",
    status: "ACTIVE",
    phone: "0812-3456-7890",
    branch: "Apotek Kerso Waras (Pusat - Kedung)",
    avatar: "AN",
    title: "Chief Executive Owner & Super Admin",
    supervisorPin: "123456",
    passwordHash: "f5bb4f1ac68640121cb5dd0edf14969e6580568f445e959ed988f234c332d312", // KersoWaras2026!#
    createdAt: "2026-01-01T08:00:00.000Z",
    updatedAt: "2026-10-07T08:00:00.000Z",
    lastLoginAt: "2026-10-07T14:15:00.000Z",
  },
  {
    uid: "usr-dr-bambang",
    username: "owner",
    email: "owner.bambang@kersowaras.com",
    displayName: "dr. H. Bambang Soedibyo, Sp.Rad",
    role: "OWNER",
    status: "ACTIVE",
    phone: "0813-9876-5432",
    branch: "Apotek Kerso Waras (Pusat - Kedung)",
    avatar: "BS",
    title: "Pemilik Sarana Apotek (PSA)",
    supervisorPin: "888999",
    passwordHash: "c2f36cee4849872f97b387341b43f679c7d101b862121b344716407981ec8d1b", // OwnerKerso2026!
    createdAt: "2026-01-10T09:00:00.000Z",
    updatedAt: "2026-10-07T09:00:00.000Z",
    lastLoginAt: "2026-10-07T10:00:00.000Z",
  },
  {
    uid: "usr-apt-farhan",
    username: "apoteker",
    email: "apoteker.farhan@kersowaras.com",
    displayName: "apt. Farhan Pratama, S.Farm",
    role: "KARYAWAN_APOTEKER",
    status: "ACTIVE",
    phone: "0812-8877-6655",
    branch: "Apotek Kerso Waras (Pusat - Kedung)",
    avatar: "FP",
    title: "Apoteker Penanggung Jawab (APJ)",
    pharmacistDetails: {
      sipaNumber: "19930812/SIPA_33.20/2022/2001",
      sipaExpiryDate: "2028-08-12",
      straNumber: "19930812/STRA-IAI/2021/8821",
      straExpiryDate: "2028-08-12",
      issuedByDinkes: "Dinas Kesehatan Kabupaten Jepara",
    },
    supervisorPin: "456789",
    passwordHash: "d09fcc81e143976e2098e0026b10fbf1dc894fa445ba526f7eaad252a2ab0a23", // ApotekerFarhan2026!
    createdAt: "2026-02-01T08:30:00.000Z",
    updatedAt: "2026-10-06T17:00:00.000Z",
    lastLoginAt: "2026-10-07T13:30:00.000Z",
  },
  {
    uid: "usr-kasir-dinda",
    username: "kasir1",
    email: "kasir.dinda@kersowaras.com",
    displayName: "Dinda Kirana",
    role: "KARYAWAN_KASIR",
    status: "ACTIVE",
    phone: "0856-1122-3344",
    branch: "Apotek Kerso Waras (Pusat - Kedung)",
    avatar: "DK",
    title: "Kasir Shift Pagi (POS-01)",
    cashierDetails: {
      terminalId: "POS-01",
      shiftAssignment: 1,
    },
    supervisorPin: "112233",
    passwordHash: "71c2a4ea55300a57d87b6b97168c1249c825fd75928b80342f65e485f58f1d5e", // KasirDinda2026!
    createdAt: "2026-03-01T07:00:00.000Z",
    updatedAt: "2026-10-07T07:00:00.000Z",
    lastLoginAt: "2026-10-07T07:00:00.000Z",
  },
  {
    uid: "usr-kasir-budi",
    username: "kasir2",
    email: "kasir.budi@kersowaras.com",
    displayName: "Budi Santoso",
    role: "KARYAWAN_KASIR",
    status: "ACTIVE",
    phone: "0877-2233-4455",
    branch: "Apotek Kerso Waras (Pusat - Kedung)",
    avatar: "BS",
    title: "Kasir Shift Siang (POS-02)",
    cashierDetails: {
      terminalId: "POS-02",
      shiftAssignment: 2,
    },
    supervisorPin: "223344",
    passwordHash: "b1fb179f20c906f8ed56ef7cf0863b2ed600d93b7b875c194a349dada70e82fb", // KasirBudi2026!
    createdAt: "2026-03-15T13:00:00.000Z",
    updatedAt: "2026-10-06T21:00:00.000Z",
    lastLoginAt: "2026-10-06T21:30:00.000Z",
  },
];

// Initial Audit Logs
export const INITIAL_AUDIT_LOGS: UserAuditLog[] = [
  {
    id: "log-001",
    eventType: "USER_CREATED",
    actorEmail: PRIMARY_OWNER_EMAIL,
    actorName: "Alwi Nizam",
    actorRole: "SUPER_ADMIN",
    targetEmail: PRIMARY_OWNER_EMAIL,
    targetName: "Alwi Nizam",
    description: "Inisialisasi akun Super Admin & Owner Utama Apotek Kerso Waras.",
    timestamp: "2026-01-01T08:00:00.000Z",
  },
  {
    id: "log-002",
    eventType: "USER_CREATED",
    actorEmail: PRIMARY_OWNER_EMAIL,
    actorName: "Alwi Nizam",
    actorRole: "SUPER_ADMIN",
    targetEmail: "apoteker.farhan@kersowaras.com",
    targetName: "apt. Farhan Pratama, S.Farm",
    description: "Pembuatan akun Apoteker Penanggung Jawab (APJ) dengan SIPA aktif Dinkes Jepara.",
    timestamp: "2026-02-01T08:30:00.000Z",
  },
  {
    id: "log-003",
    eventType: "SUPERVISOR_PIN_RESET",
    actorEmail: PRIMARY_OWNER_EMAIL,
    actorName: "Alwi Nizam",
    actorRole: "SUPER_ADMIN",
    targetEmail: "apoteker.farhan@kersowaras.com",
    targetName: "apt. Farhan Pratama, S.Farm",
    description: "Pengaturan PIN otorisasi supervisor shift & berita acara kas laci.",
    timestamp: "2026-02-01T08:45:00.000Z",
  },
  {
    id: "log-004",
    eventType: "USER_CREATED",
    actorEmail: PRIMARY_OWNER_EMAIL,
    actorName: "Alwi Nizam",
    actorRole: "SUPER_ADMIN",
    targetEmail: "kasir.dinda@kersowaras.com",
    targetName: "Dinda Kirana",
    description: "Pembuatan akun Kasir Front-Desk Terminal POS-01 (Margin & HPP Terproteksi).",
    timestamp: "2026-03-01T07:00:00.000Z",
  },
];

const LOCAL_STORAGE_USERS_KEY = "kerso_waras_staff_users_v2";
const LOCAL_STORAGE_AUDIT_KEY = "kerso_waras_user_audit_logs_v2";

/**
 * Fetch staff users from Firestore if connected, fallback to persistent local store.
 */
export async function fetchStaffUsers(): Promise<StaffUser[]> {
  if (typeof window === "undefined") return INITIAL_STAFF_ACCOUNTS;

  if (isLiveFirebaseConfigured) {
    try {
      const snap = await getDocs(collection(firestore, "users"));
      if (!snap.empty) {
        return snap.docs.map((d) => d.data() as StaffUser);
      }
    } catch (e) {
      console.warn("[Firestore] Unable to fetch remote users, using local cache:", e);
    }
  }

  // Local Storage Fallback
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
    if (raw) {
      let parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        let changed = false;

        // Ensure primary owner is always present
        const hasOwner = parsed.some((u: StaffUser) => u.email.toLowerCase() === PRIMARY_OWNER_EMAIL.toLowerCase());
        if (!hasOwner) {
          parsed.unshift(INITIAL_STAFF_ACCOUNTS[0]);
          changed = true;
        }

        // Hydrate/repair any staff accounts missing passwordHash or supervisorPin
        parsed = parsed.map((user: StaffUser) => {
          const seed = INITIAL_STAFF_ACCOUNTS.find(
            (s) => s.email.toLowerCase() === user.email.toLowerCase()
          );
          if (seed) {
            let updated = { ...user };
            if (!updated.passwordHash || updated.passwordHash.length < 10) {
              updated.passwordHash = seed.passwordHash;
              changed = true;
            }
            if (!updated.supervisorPin) {
              updated.supervisorPin = seed.supervisorPin;
              changed = true;
            }
            if (!updated.username) {
              updated.username = seed.username;
              changed = true;
            }
            return updated;
          }
          return user;
        });

        if (changed) {
          localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(parsed));
        }
        return parsed;
      }
    }
  } catch (e) {
    console.error("Local storage error:", e);
  }

  // Seed default
  localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(INITIAL_STAFF_ACCOUNTS));
  return INITIAL_STAFF_ACCOUNTS;
}

/**
 * Save user to Firestore and Local Storage
 */
export async function saveStaffUser(
  user: StaffUser,
  actor: { email: string; name: string; role: UserRole }
): Promise<void> {
  // Update local storage
  const current = await fetchStaffUsers();
  const index = current.findIndex((u) => u.uid === user.uid || u.email === user.email);

  const isNew = index === -1;
  let nextList: StaffUser[];

  if (isNew) {
    nextList = [user, ...current];
  } else {
    nextList = current.map((u, i) => (i === index ? { ...u, ...user, updatedAt: new Date().toISOString() } : u));
  }

  if (typeof window !== "undefined") {
    localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(nextList));
  }

  // Sync to Firestore if live
  if (isLiveFirebaseConfigured) {
    try {
      await setDoc(doc(firestore, "users", user.uid), user, { merge: true });
    } catch (e) {
      console.warn("[Firestore] Error syncing user:", e);
    }
  }

  // Record Audit Log
  await addAuditLog({
    eventType: isNew ? "USER_CREATED" : "PROFILE_UPDATED",
    actorEmail: actor.email,
    actorName: actor.name,
    actorRole: actor.role,
    targetEmail: user.email,
    targetName: user.displayName,
    description: isNew
      ? `Pembuatan akun baru (${user.role}) oleh ${actor.name}`
      : `Pembaruan data profil karyawan oleh ${actor.name}`,
  });
}

/**
 * Toggle user status (ACTIVE, INACTIVE, SUSPENDED)
 */
export async function toggleStaffStatus(
  uid: string,
  newStatus: UserStatus,
  actor: { email: string; name: string; role: UserRole }
): Promise<void> {
  const current = await fetchStaffUsers();
  const target = current.find((u) => u.uid === uid);
  if (!target) return;

  const updatedList = current.map((u) =>
    u.uid === uid ? { ...u, status: newStatus, updatedAt: new Date().toISOString() } : u
  );

  if (typeof window !== "undefined") {
    localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(updatedList));
  }

  if (isLiveFirebaseConfigured) {
    try {
      await updateDoc(doc(firestore, "users", uid), {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn("[Firestore] Error updating status:", e);
    }
  }

  // Record Audit Log
  await addAuditLog({
    eventType: "USER_STATUS_TOGGLED",
    actorEmail: actor.email,
    actorName: actor.name,
    actorRole: actor.role,
    targetEmail: target.email,
    targetName: target.displayName,
    description: `Status akun diubah menjadi ${newStatus} oleh ${actor.name}`,
  });
}

/**
 * Fetch Activity Audit Logs
 */
export async function fetchAuditLogs(): Promise<UserAuditLog[]> {
  if (typeof window === "undefined") return INITIAL_AUDIT_LOGS;

  if (isLiveFirebaseConfigured) {
    try {
      const q = query(collection(firestore, "activity_audit_logs"), orderBy("timestamp", "desc"), limit(50));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...d.data() } as UserAuditLog));
      }
    } catch (e) {
      console.warn("[Firestore] Error fetching audit logs:", e);
    }
  }

  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_AUDIT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error("Local storage error:", e);
  }

  localStorage.setItem(LOCAL_STORAGE_AUDIT_KEY, JSON.stringify(INITIAL_AUDIT_LOGS));
  return INITIAL_AUDIT_LOGS;
}

/**
 * Record an audit log entry
 */
export async function addAuditLog(
  entry: Omit<UserAuditLog, "id" | "timestamp">
): Promise<void> {
  const newLog: UserAuditLog = {
    ...entry,
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
  };

  const logs = await fetchAuditLogs();
  const nextLogs = [newLog, ...logs].slice(0, 100);

  if (typeof window !== "undefined") {
    localStorage.setItem(LOCAL_STORAGE_AUDIT_KEY, JSON.stringify(nextLogs));
  }

  if (isLiveFirebaseConfigured) {
    try {
      await addDoc(collection(firestore, "activity_audit_logs"), newLog);
    } catch (e) {
      console.warn("[Firestore] Error recording audit log:", e);
    }
  }
}

/**
 * Update staff password (hashed) and record audit log
 */
export async function updateStaffPassword(
  targetEmail: string,
  newPasswordHash: string,
  actor: { email: string; name: string; role: UserRole }
): Promise<boolean> {
  const users = await fetchStaffUsers();
  const idx = users.findIndex((u) => u.email.toLowerCase() === targetEmail.toLowerCase());
  if (idx === -1) return false;

  const target = users[idx];
  target.passwordHash = newPasswordHash;
  target.updatedAt = new Date().toISOString();

  await saveStaffUser(target, actor);
  await addAuditLog({
    eventType: "PASSWORD_RESET",
    actorEmail: actor.email,
    actorName: actor.name,
    actorRole: actor.role,
    targetEmail: target.email,
    targetName: target.displayName,
    description: `Password untuk akun staf ${target.displayName} (${target.email}) berhasil diperbarui/direset oleh ${actor.name}.`,
  });

  return true;
}

/**
 * Update last login timestamp for staff user
 */
export async function updateLastLogin(email: string): Promise<void> {
  const users = await fetchStaffUsers();
  const target = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!target) return;

  target.lastLoginAt = new Date().toISOString();
  if (typeof window !== "undefined") {
    localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(users));
  }

  if (isLiveFirebaseConfigured) {
    try {
      await updateDoc(doc(firestore, "users", target.uid), {
        lastLoginAt: target.lastLoginAt,
      });
    } catch (e) {
      console.warn("[Firestore] Error updating lastLoginAt:", e);
    }
  }
}

