import { create } from "zustand";
import { persist } from "zustand/middleware";
import { soundEngine } from "./audio";
import { CDSEngine, DrugInteractionAlert } from "./engines/cds-engine";
import { FEFOEngine } from "./engines/fefo-engine";
import { INITIAL_PRODUCTS, SAMPLE_DOCTORS, SAMPLE_PATIENTS, SAMPLE_USERS } from "./mock-data";
import {
  BatchItem,
  CartItem,
  CashierShift,
  CompoundingRecipe,
  DiscrepancyReasonCategory,
  DiscrepancySettlementAction,
  HeldBill,
  PaymentMethodType,
  PettyCashCategory,
  PettyCashMovement,
  Product,
  ReconciliationSupervisorAuth,
  RupiahDenominationCount,
  ShiftHandoverLog,
  Transaction,
  UserProfile,
} from "./types";

interface ApotekState {
  users: UserProfile[];
  currentUser: UserProfile;
  isAuthenticated: boolean;
  privacyMode: boolean; // For Owner: masks sensitive financial numbers with ••••••
  currentShift: CashierShift | null;
  shiftsHistory: CashierShift[];
  pettyCashMovements: PettyCashMovement[];
  products: Product[];
  cart: CartItem[];
  heldBills: HeldBill[];
  transactions: Transaction[];
  selectedPatient: (typeof SAMPLE_PATIENTS)[0] | null;
  selectedDoctor: (typeof SAMPLE_DOCTORS)[0] | null;
  densityMode: "DENSE" | "TOUCH";
  activeInteractionAlerts: DrugInteractionAlert[];
  activeAllergyAlerts: string[];
  lastCompletedTransaction: Transaction | null;

  // Auth & Shift Actions
  login: (userId: string) => boolean;
  logout: () => void;
  setCurrentUser: (user: UserProfile) => void;
  togglePrivacyMode: () => void;
  openShift: (openingCash: number, shiftNumber: 1 | 2 | 3) => void;
  closeShift: (
    actualCashCount: number,
    note?: string,
    denominationCount?: RupiahDenominationCount,
    discrepancyData?: {
      category?: DiscrepancyReasonCategory;
      reasonText?: string;
      supervisorAuth?: ReconciliationSupervisorAuth;
      settlementAction?: DiscrepancySettlementAction;
    }
  ) => CashierShift | null;
  handoverShift: (params: {
    physicalCashCounted: number;
    cashDroppedToVault: number;
    openingCashForNextShift: number;
    nextCashierId: string;
    nextCashierName: string;
    nextShiftNumber: 1 | 2 | 3;
    handoverNote?: string;
    confirmedWithNextCashierPin: boolean;
    supervisorName?: string;
    denominationCount?: RupiahDenominationCount;
  }) => {
    previousShift: CashierShift;
    nextShift: CashierShift;
    handoverLog: ShiftHandoverLog;
  } | null;
  syncCashierToShift: (cashierId: string, cashierName: string) => void;
  verifySupervisorPin: (
    supervisorId: string,
    pin: string
  ) => { success: boolean; user?: UserProfile; message?: string };
  addPettyCash: (amount: number, type: "IN" | "OUT", reason: string) => void;
  recordPettyCash: (data: {
    type: "PAID_IN" | "PAID_OUT";
    category: PettyCashCategory;
    categoryLabel: string;
    amount: number;
    reason: string;
    recipientOrSource: string;
  }) => PettyCashMovement | null;
  recordXReport: () => void;
  auditShift: (
    shiftId: string,
    status: "APPROVED" | "DISCREPANCY_FLAGGED",
    note: string
  ) => void;

  setDensityMode: (mode: "DENSE" | "TOUCH") => void;
  setSelectedPatient: (patient: (typeof SAMPLE_PATIENTS)[0] | null) => void;
  setSelectedDoctor: (doctor: (typeof SAMPLE_DOCTORS)[0] | null) => void;
  
  // Product & HPP Actions
  addProduct: (product: Product) => void;
  updateProduct: (productId: string, updated: Partial<Product>) => void;
  updateProductHPP: (productId: string, hpp: number, markupPercent: number) => void;
  addBatchToProduct: (productId: string, newBatch: BatchItem) => void;
  deleteProduct: (productId: string) => void;

  // POS & Cart Actions
  addToCart: (product: Product, quantity?: number, unitName?: string, specificBatchId?: string) => boolean;
  addRacikanToCart: (recipe: CompoundingRecipe) => void;
  updateQuantity: (cartItemId: string, newQty: number) => void;
  removeFromCart: (cartItemId: string) => void;
  clearCart: () => void;
  
  parkBill: (note?: string) => void;
  recallBill: (billId: string) => void;
  deleteHeldBill: (billId: string) => void;

  processCheckout: (params: {
    paymentMethod: PaymentMethodType;
    paidAmount: number;
    cashierName?: string;
  }) => Transaction | null;

  setLastCompletedTransaction: (tx: Transaction | null) => void;
  recalculateClinicalSafety: () => void;
}

const SAMPLE_PETTY_CASH: PettyCashMovement[] = [
  {
    id: "pc-01",
    shiftId: "shift-kw-01",
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    type: "PAID_OUT",
    category: "COLD_CHAIN_ICE",
    categoryLabel: "Es Batu Cold Chain (Vaksin/Insulin)",
    amount: 15000,
    reason: "Beli es batu balok pendingin cooler box insulin & vaksin",
    recipientOrSource: "Toko Es Mojo Berkah",
    recordedBy: "Dinda Kirana",
  },
];

const SAMPLE_CLOSED_SHIFTS: CashierShift[] = [
  {
    id: "shift-kw-yesterday-02",
    shiftNumber: 2,
    terminalId: "POS-TERMINAL-01",
    cashierId: "usr-kasir",
    cashierName: "Budi Setiawan",
    startTime: new Date(Date.now() - 86400000 - 3600000 * 8).toISOString(),
    endTime: new Date(Date.now() - 86400000).toISOString(),
    status: "CLOSED",
    openingCash: 200000,
    cashSalesTotal: 980000,
    qrisSalesTotal: 340000,
    edcSalesTotal: 120000,
    cashInTotal: 0,
    cashOutTotal: 20000,
    refundTotal: 0,
    totalTransactionsCount: 28,
    actualCashCount: 1159500,
    expectedCashTotal: 1160000,
    cashDifference: -500,
    closingNote: "Shift siang selesai. Selisih Rp -500 akibat pembulatan koin kembalian receh.",
    discrepancyCategory: "COIN_ROUNDING",
    discrepancyReasonText: "Selisih Rp -500 akibat 2 transaksi obat OTC tanpa pecahan koin Rp 200/Rp 100.",
    settlementAction: "PHARMACY_ABSORBED",
    supervisorAuth: {
      isAuthorized: true,
      supervisorId: "usr-apj",
      supervisorName: "apt. Farhan Pratama, S.Farm",
      supervisorRole: "KARYAWAN_APOTEKER",
      authMethod: "SUPERVISOR_PIN",
      authorizedAt: new Date(Date.now() - 86400000).toISOString(),
      approvalNote: "Otorisasi PIN APJ disetujui. Toleransi koin receh < Rp 1.000 dibebankan ke apotek.",
    },
    isAuditedByOwner: true,
    auditStatus: "APPROVED",
    auditNote: "Toleransi pembulatan koin kembalian (< Rp 1.000). Disetujui Owner.",
    auditedBy: "dr. H. Bambang Soedibyo, Sp.Rad",
    auditedAt: new Date(Date.now() - 86400000 + 1800000).toISOString(),
    xReportsCount: 1,
    lastXReportTime: new Date(Date.now() - 86400000 - 3600000 * 4).toISOString(),
  },
  {
    id: "shift-kw-yesterday-01",
    shiftNumber: 1,
    terminalId: "POS-TERMINAL-01",
    cashierId: "usr-kasir",
    cashierName: "Dinda Kirana",
    startTime: new Date(Date.now() - 86400000 - 3600000 * 16).toISOString(),
    endTime: new Date(Date.now() - 86400000 - 3600000 * 8).toISOString(),
    status: "CLOSED",
    openingCash: 200000,
    cashSalesTotal: 1450000,
    qrisSalesTotal: 620000,
    edcSalesTotal: 250000,
    cashInTotal: 0,
    cashOutTotal: 15000,
    refundTotal: 0,
    totalTransactionsCount: 35,
    actualCashCount: 1635000,
    expectedCashTotal: 1635000,
    cashDifference: 0,
    closingNote: "Shift pagi klop 100% tanpa selisih.",
    discrepancyCategory: "NONE_EXACT_MATCH",
    discrepancyReasonText: "Uang fisik tepat 100% klop dengan ekspektasi sistem.",
    settlementAction: "APPROVED_BY_OWNER",
    supervisorAuth: {
      isAuthorized: true,
      supervisorId: "usr-owner",
      supervisorName: "dr. H. Bambang Soedibyo, Sp.Rad",
      supervisorRole: "OWNER",
      authMethod: "SUPERVISOR_PIN",
      authorizedAt: new Date(Date.now() - 86400000 - 3600000 * 8).toISOString(),
      approvalNote: "Kasir teliti, saldo klop sempurna.",
    },
    isAuditedByOwner: true,
    auditStatus: "APPROVED",
    auditNote: "Sangat teliti. Kas klop sempurna.",
    auditedBy: "dr. H. Bambang Soedibyo, Sp.Rad",
    auditedAt: new Date(Date.now() - 86400000 - 3600000 * 7).toISOString(),
    xReportsCount: 2,
    lastXReportTime: new Date(Date.now() - 86400000 - 3600000 * 11).toISOString(),
  },
  {
    id: "shift-kw-2daysago-03",
    shiftNumber: 3,
    terminalId: "POS-TERMINAL-01",
    cashierId: "usr-kasir",
    cashierName: "Budi Setiawan",
    startTime: new Date(Date.now() - 172800000 - 3600000 * 8).toISOString(),
    endTime: new Date(Date.now() - 172800000).toISOString(),
    status: "CLOSED",
    openingCash: 200000,
    cashSalesTotal: 650000,
    qrisSalesTotal: 210000,
    edcSalesTotal: 0,
    cashInTotal: 0,
    cashOutTotal: 10000,
    refundTotal: 0,
    totalTransactionsCount: 19,
    actualCashCount: 820000,
    expectedCashTotal: 840000,
    cashDifference: -20000,
    closingNote: "Shift malam. Terjadi selisih kurang Rp 20.000 salah hitung kembalian pasien resep cito malam.",
    discrepancyCategory: "WRONG_CHANGE",
    discrepancyReasonText: "Salah serah kembalian pasien resep Cito malam (diberi kembalian lebih Rp 20.000).",
    settlementAction: "CASHIER_LIABILITY",
    supervisorAuth: {
      isAuthorized: true,
      supervisorId: "usr-apj",
      supervisorName: "apt. Farhan Pratama, S.Farm",
      supervisorRole: "KARYAWAN_APOTEKER",
      authMethod: "SUPERVISOR_PIN",
      authorizedAt: new Date(Date.now() - 172800000).toISOString(),
      approvalNote: "Otorisasi PIN APJ disetujui. Kasir sepakat bertanggung jawab mengganti selisih via potong honor shift.",
    },
    isAuditedByOwner: true,
    auditStatus: "DISCREPANCY_FLAGGED",
    auditNote: "Selisih Rp 20.000 telah diselesaikan kasir Budi Setiawan.",
    auditedBy: "dr. H. Bambang Soedibyo, Sp.Rad",
    auditedAt: new Date(Date.now() - 172800000 + 3600000 * 4).toISOString(),
    xReportsCount: 1,
    lastXReportTime: new Date(Date.now() - 172800000 - 3600000 * 3).toISOString(),
  },
];

const DEFAULT_INITIAL_SHIFT: CashierShift = {
  id: "shift-kw-01",
  shiftNumber: 1,
  terminalId: "POS-TERMINAL-01",
  cashierId: "usr-kasir",
  cashierName: "Dinda Kirana",
  startTime: new Date().toISOString(),
  endTime: null,
  status: "OPEN",
  openingCash: 200000,
  cashSalesTotal: 145000,
  qrisSalesTotal: 75000,
  edcSalesTotal: 0,
  nonCashSalesTotal: 75000,
  transferSalesTotal: 0,
  bpjsSalesTotal: 0,
  piutangSalesTotal: 0,
  cashInTotal: 0,
  cashOutTotal: 15000,
  refundTotal: 0,
  totalTransactionsCount: 3,
  itemsSoldTotal: 8,
  actualCashCount: null,
  expectedCashTotal: null,
  cashDifference: null,
  pettyCashMovements: SAMPLE_PETTY_CASH,
  xReportsCount: 1,
  lastXReportTime: new Date(Date.now() - 1800000).toISOString(),
  isAuditedByOwner: false,
};

export const useApotekStore = create<ApotekState>()(
  persist(
    (set, get) => ({
      users: SAMPLE_USERS,
      currentUser: SAMPLE_USERS[1], // Default to Owner
      isAuthenticated: true,
      privacyMode: false,
      currentShift: DEFAULT_INITIAL_SHIFT,
      shiftsHistory: SAMPLE_CLOSED_SHIFTS,
      pettyCashMovements: SAMPLE_PETTY_CASH,
      products: INITIAL_PRODUCTS,
      cart: [],
      heldBills: [],
      transactions: [],
      selectedPatient: null,
      selectedDoctor: null,
      densityMode: "DENSE",
      activeInteractionAlerts: [],
      activeAllergyAlerts: [],
      lastCompletedTransaction: null,

      // Authentication
      login: (userId: string) => {
        const found = get().users.find((u) => u.id === userId);
        if (found) {
          set({ currentUser: found, isAuthenticated: true });
          soundEngine.playScanSuccess();
          return true;
        }
        return false;
      },

      logout: () => {
        set({ isAuthenticated: false });
      },

      setCurrentUser: (user) => set({ currentUser: user, isAuthenticated: true }),
      togglePrivacyMode: () => set((state) => ({ privacyMode: !state.privacyMode })),
      setDensityMode: (mode) => set({ densityMode: mode }),

      // Shift & Drawer Management
      openShift: (openingCash, shiftNumber) => {
        const { currentUser } = get();
        const newShift: CashierShift = {
          id: `shift-${Date.now()}`,
          shiftNumber,
          terminalId: "POS-TERMINAL-01",
          cashierId: currentUser.id,
          cashierName: currentUser.name,
          startTime: new Date().toISOString(),
          endTime: null,
          status: "OPEN",
          openingCash,
          cashSalesTotal: 0,
          qrisSalesTotal: 0,
          edcSalesTotal: 0,
          nonCashSalesTotal: 0,
          transferSalesTotal: 0,
          bpjsSalesTotal: 0,
          piutangSalesTotal: 0,
          cashInTotal: 0,
          cashOutTotal: 0,
          refundTotal: 0,
          totalTransactionsCount: 0,
          itemsSoldTotal: 0,
          actualCashCount: null,
          expectedCashTotal: null,
          cashDifference: null,
          pettyCashMovements: [],
          xReportsCount: 0,
          isAuditedByOwner: false,
        };
        set({ currentShift: newShift });
        soundEngine.playScanSuccess();
      },

      closeShift: (actualCashCount, note, denominationCount, discrepancyData) => {
        const { currentShift, shiftsHistory } = get();
        if (!currentShift) return null;

        const expectedCashTotal =
          currentShift.openingCash +
          currentShift.cashSalesTotal +
          currentShift.cashInTotal -
          currentShift.cashOutTotal -
          currentShift.refundTotal;

        const cashDifference = actualCashCount - expectedCashTotal;

        const closedShift: CashierShift = {
          ...currentShift,
          endTime: new Date().toISOString(),
          status: "CLOSED",
          actualCashCount,
          expectedCashTotal,
          cashDifference,
          closingNote: note,
          denominationCount,
          auditStatus: cashDifference === 0 ? "APPROVED" : "PENDING",
          discrepancyCategory: discrepancyData?.category || (cashDifference === 0 ? "NONE_EXACT_MATCH" : "OTHER"),
          discrepancyReasonText: discrepancyData?.reasonText || "",
          supervisorAuth: discrepancyData?.supervisorAuth,
          settlementAction:
            discrepancyData?.settlementAction ||
            (cashDifference === 0 ? "APPROVED_BY_OWNER" : "PENDING_INVESTIGATION"),
        };

        set({
          currentShift: closedShift,
          shiftsHistory: [closedShift, ...shiftsHistory],
        });

        soundEngine.playCheckoutChime();
        return closedShift;
      },

      handoverShift: ({
        physicalCashCounted,
        cashDroppedToVault,
        openingCashForNextShift,
        nextCashierId,
        nextCashierName,
        nextShiftNumber,
        handoverNote,
        confirmedWithNextCashierPin,
        supervisorName,
        denominationCount,
      }) => {
        const { currentShift, shiftsHistory, users } = get();
        if (!currentShift || currentShift.status !== "OPEN") return null;

        const expectedCashTotal =
          currentShift.openingCash +
          currentShift.cashSalesTotal +
          currentShift.cashInTotal -
          currentShift.cashOutTotal -
          currentShift.refundTotal;

        const cashDifference = physicalCashCounted - expectedCashTotal;
        const nextShiftId = `shift-${Date.now()}`;

        const handoverLog: ShiftHandoverLog = {
          id: `ho-${Date.now()}`,
          previousShiftId: currentShift.id,
          nextShiftId,
          previousCashierId: currentShift.cashierId,
          previousCashierName: currentShift.cashierName,
          nextCashierId,
          nextCashierName,
          handoverTime: new Date().toISOString(),
          physicalCashCounted,
          cashDroppedToVault,
          openingCashForNextShift,
          handoverNote,
          confirmedWithNextCashierPin,
          supervisorName,
        };

        const closedShift: CashierShift = {
          ...currentShift,
          endTime: new Date().toISOString(),
          status: "CLOSED",
          actualCashCount: physicalCashCounted,
          expectedCashTotal,
          cashDifference,
          closingNote: `Serah terima shift ke ${nextCashierName} (Shift ${nextShiftNumber}). Setor Brankas: Rp ${cashDroppedToVault.toLocaleString("id-ID")}. ${handoverNote || ""}`.trim(),
          denominationCount,
          auditStatus: cashDifference === 0 ? "APPROVED" : "PENDING",
          discrepancyCategory: cashDifference === 0 ? "NONE_EXACT_MATCH" : "OTHER",
          discrepancyReasonText:
            cashDifference === 0
              ? "Kas klop sempurna saat serah terima kasir."
              : `Selisih kas saat serah terima (${cashDifference > 0 ? "Lebih" : "Kurang"} Rp ${Math.abs(cashDifference).toLocaleString("id-ID")})`,
          settlementAction: cashDifference === 0 ? "APPROVED_BY_OWNER" : "PENDING_INVESTIGATION",
          handoverLog,
        };

        const newShift: CashierShift = {
          id: nextShiftId,
          shiftNumber: nextShiftNumber,
          terminalId: currentShift.terminalId || "POS-TERMINAL-01",
          cashierId: nextCashierId,
          cashierName: nextCashierName,
          startTime: new Date().toISOString(),
          endTime: null,
          status: "OPEN",
          openingCash: openingCashForNextShift,
          cashSalesTotal: 0,
          qrisSalesTotal: 0,
          edcSalesTotal: 0,
          nonCashSalesTotal: 0,
          transferSalesTotal: 0,
          bpjsSalesTotal: 0,
          piutangSalesTotal: 0,
          cashInTotal: 0,
          cashOutTotal: 0,
          refundTotal: 0,
          totalTransactionsCount: 0,
          itemsSoldTotal: 0,
          actualCashCount: null,
          expectedCashTotal: null,
          cashDifference: null,
          pettyCashMovements: [],
          xReportsCount: 0,
          isAuditedByOwner: false,
          handoverLog,
        };

        const incomingUser = users.find((u) => u.id === nextCashierId);

        set((state) => ({
          currentShift: newShift,
          shiftsHistory: [closedShift, ...shiftsHistory],
          currentUser: incomingUser ? incomingUser : state.currentUser,
        }));

        soundEngine.playCheckoutChime();
        return {
          previousShift: closedShift,
          nextShift: newShift,
          handoverLog,
        };
      },

      syncCashierToShift: (cashierId, cashierName) => {
        const { currentShift } = get();
        if (!currentShift || currentShift.status !== "OPEN") return;
        set({
          currentShift: {
            ...currentShift,
            cashierId,
            cashierName,
          },
        });
      },

      verifySupervisorPin: (supervisorId: string, pin: string) => {
        const { users } = get();
        const supervisor = users.find((u) => u.id === supervisorId);
        if (!supervisor) {
          return { success: false, message: "Akun supervisor tidak ditemukan." };
        }

        // Supervisor must have role OWNER, SUPER_ADMIN, or KARYAWAN_APOTEKER
        if (
          supervisor.role !== "OWNER" &&
          supervisor.role !== "SUPER_ADMIN" &&
          supervisor.role !== "KARYAWAN_APOTEKER"
        ) {
          return {
            success: false,
            message: "Hanya APJ, Owner, atau Super Admin yang berwenang mengesahkan selisih kas.",
          };
        }

        // Strict 6-Digit Supervisor PIN Validation
        const VALID_PINS: Record<string, string> = {
          "alwinizam0405@gmail.com": "123456",
          "owner.bambang@kersowaras.com": "888999",
          "apoteker.farhan@kersowaras.com": "456789",
          "usr-alwi": "123456",
          "usr-owner": "888999",
          "usr-apj": "456789",
          "usr-alwi-nizam": "123456",
          "usr-dr-bambang": "888999",
          "usr-apt-farhan": "456789",
        };

        const expectedPin = (supervisor.email && VALID_PINS[supervisor.email]) || (supervisor.id && VALID_PINS[supervisor.id]) || "123456";

        if (pin === expectedPin) {
          soundEngine.playScanSuccess();
          return { success: true, user: supervisor };
        }

        soundEngine.playError();
        return { success: false, message: "PIN otorisasi supervisor salah. Silakan periksa kembali 6-digit PIN Anda." };
      },

      addPettyCash: (amount, type, reason) => {
        const { currentShift, currentUser, pettyCashMovements } = get();
        if (!currentShift || currentShift.status !== "OPEN") return;

        const newMovement: PettyCashMovement = {
          id: `pc-${Date.now()}`,
          shiftId: currentShift.id,
          timestamp: new Date().toISOString(),
          type: type === "IN" ? "PAID_IN" : "PAID_OUT",
          category: type === "IN" ? "CASH_FLOAT_TOPUP" : "OTHER",
          categoryLabel: type === "IN" ? "Penambahan Modal Kasir" : "Kas Keluar Operasional",
          amount,
          reason,
          recipientOrSource: type === "IN" ? "Owner / Brankas" : "Keperluan Operasional",
          recordedBy: currentUser.name,
        };

        if (type === "IN") {
          set({
            currentShift: {
              ...currentShift,
              cashInTotal: currentShift.cashInTotal + amount,
              pettyCashMovements: [newMovement, ...(currentShift.pettyCashMovements || [])],
            },
            pettyCashMovements: [newMovement, ...pettyCashMovements],
          });
        } else {
          set({
            currentShift: {
              ...currentShift,
              cashOutTotal: currentShift.cashOutTotal + amount,
              pettyCashMovements: [newMovement, ...(currentShift.pettyCashMovements || [])],
            },
            pettyCashMovements: [newMovement, ...pettyCashMovements],
          });
        }
      },

      recordPettyCash: ({ type, category, categoryLabel, amount, reason, recipientOrSource }) => {
        const { currentShift, currentUser, pettyCashMovements } = get();
        if (!currentShift || currentShift.status !== "OPEN") return null;

        const newMovement: PettyCashMovement = {
          id: `pc-${Date.now()}`,
          shiftId: currentShift.id,
          timestamp: new Date().toISOString(),
          type,
          category,
          categoryLabel,
          amount,
          reason,
          recipientOrSource,
          recordedBy: currentUser.name,
        };

        const updatedShift: CashierShift = {
          ...currentShift,
          cashInTotal: type === "PAID_IN" ? currentShift.cashInTotal + amount : currentShift.cashInTotal,
          cashOutTotal: type === "PAID_OUT" ? currentShift.cashOutTotal + amount : currentShift.cashOutTotal,
          pettyCashMovements: [newMovement, ...(currentShift.pettyCashMovements || [])],
        };

        set({
          currentShift: updatedShift,
          pettyCashMovements: [newMovement, ...pettyCashMovements],
        });

        soundEngine.playScanSuccess();
        return newMovement;
      },

      recordXReport: () => {
        const { currentShift } = get();
        if (!currentShift) return;
        set({
          currentShift: {
            ...currentShift,
            xReportsCount: (currentShift.xReportsCount || 0) + 1,
            lastXReportTime: new Date().toISOString(),
          },
        });
      },

      auditShift: (shiftId, status, note) => {
        const { shiftsHistory, currentUser } = get();
        const updated = shiftsHistory.map((shift) => {
          if (shift.id === shiftId) {
            return {
              ...shift,
              isAuditedByOwner: true,
              auditStatus: status,
              auditNote: note,
              auditedBy: currentUser.name,
              auditedAt: new Date().toISOString(),
            };
          }
          return shift;
        });
        set({ shiftsHistory: updated });
        soundEngine.playScanSuccess();
      },

      setSelectedPatient: (patient) => {
        set({ selectedPatient: patient });
        get().recalculateClinicalSafety();
      },
      setSelectedDoctor: (doctor) => set({ selectedDoctor: doctor }),
      setLastCompletedTransaction: (tx) => set({ lastCompletedTransaction: tx }),

      // Product & HPP Management
      addProduct: (newProduct) => {
        set((state) => ({
          products: [newProduct, ...state.products],
        }));
        soundEngine.playScanSuccess();
      },

      updateProduct: (productId, updated) => {
        set((state) => ({
          products: state.products.map((p) =>
            p.id === productId ? { ...p, ...updated } : p
          ),
        }));
      },

      updateProductHPP: (productId, hpp, markupPercent) => {
        set((state) => ({
          products: state.products.map((p) => {
            if (p.id === productId) {
              const newSellingPrice = Math.round(hpp * (1 + markupPercent / 100));
              const updatedConversions = p.unitConversions.map((conv) => ({
                ...conv,
                pricePerUnit: Math.round(newSellingPrice * conv.multiplier * 0.95),
              }));
              return {
                ...p,
                hpp,
                markupPercent,
                sellingPrice: newSellingPrice,
                unitConversions: updatedConversions,
              };
            }
            return p;
          }),
        }));
      },

      addBatchToProduct: (productId, newBatch) => {
        set((state) => ({
          products: state.products.map((p) => {
            if (p.id === productId) {
              return {
                ...p,
                batches: [newBatch, ...p.batches],
              };
            }
            return p;
          }),
        }));
        soundEngine.playScanSuccess();
      },

      deleteProduct: (productId) => {
        set((state) => ({
          products: state.products.filter((p) => p.id !== productId),
        }));
      },

      recalculateClinicalSafety: () => {
        const { cart, selectedPatient } = get();
        const productsInCart = cart.map((c) => c.product);
        const interactions = CDSEngine.checkInteractions(productsInCart);
        const allergies = selectedPatient
          ? CDSEngine.checkPatientAllergies(productsInCart, selectedPatient.allergies)
          : [];

        if (interactions.some((i) => i.severity === "CRITICAL_CONTRAINDICATION") || allergies.length > 0) {
          soundEngine.playWarning();
        }

        set({
          activeInteractionAlerts: interactions,
          activeAllergyAlerts: allergies,
        });
      },

      addToCart: (product, quantity = 1, unitName, specificBatchId) => {
        const targetUnit = unitName || product.baseUnit;
        const baseQtyNeeded = FEFOEngine.convertToBaseQuantity(product, targetUnit, quantity);

        let chosenBatch = specificBatchId
          ? product.batches.find((b) => b.id === specificBatchId) || null
          : null;

        if (!chosenBatch) {
          const allocation = FEFOEngine.allocateBatch(product, baseQtyNeeded);
          if (allocation.isExpiredBlock || !allocation.allocatedBatch) {
            soundEngine.playError();
            alert(allocation.warning || "Tidak dapat menambahkan obat!");
            return false;
          }
          chosenBatch = allocation.allocatedBatch;
        }

        const unitConversion = product.unitConversions.find(
          (u) => u.unitName.toUpperCase() === targetUnit.toUpperCase()
        );
        const unitPrice = unitConversion ? unitConversion.pricePerUnit : chosenBatch.sellingPrice;
        const multiplier = unitConversion ? unitConversion.multiplier : 1;

        const cartItemId = `${product.id}-${chosenBatch.id}-${targetUnit}`;
        const existingIndex = get().cart.findIndex((c) => c.cartItemId === cartItemId);

        let newCart = [...get().cart];
        if (existingIndex > -1) {
          const item = newCart[existingIndex];
          const updatedQty = item.quantity + quantity;
          const subtotal = updatedQty * item.unitPrice;
          newCart[existingIndex] = {
            ...item,
            quantity: updatedQty,
            subtotal,
          };
        } else {
          const subtotal = quantity * unitPrice;
          newCart.push({
            cartItemId,
            product,
            selectedBatch: chosenBatch,
            quantity,
            selectedUnit: targetUnit,
            unitMultiplier: multiplier,
            unitPrice,
            subtotal,
          });
        }

        soundEngine.playScanSuccess();
        set({ cart: newCart });
        get().recalculateClinicalSafety();
        return true;
      },

      addRacikanToCart: (recipe) => {
        const cartItemId = `racikan-${Date.now()}`;
        const pseudoProduct: Product = {
          id: `prod-racikan-${Date.now()}`,
          barcode: `RCK-${Date.now().toString().slice(-6)}`,
          name: `[R/] ${recipe.recipeName} (${recipe.packetCount} bks)`,
          genericName: "Formula Campuran Racikan",
          manufacturer: "Laboratorium Apotek Kerso Waras",
          drugClass: "KERAS",
          isHighAlert: false,
          isLasa: false,
          baseUnit: "SACHET",
          hpp: recipe.subtotalIngredients,
          markupPercent: recipe.subtotalIngredients > 0 ? ((recipe.grandTotal - recipe.subtotalIngredients) / recipe.subtotalIngredients) * 100 : 0,
          sellingPrice: recipe.grandTotal,
          storageCondition: "ROOM_TEMP",
          unitConversions: [{ unitName: "SACHET", multiplier: 1, pricePerUnit: recipe.grandTotal }],
          minStockAlert: 0,
          maxStockAlert: 100,
          batches: [
            {
              id: `batch-rck-${Date.now()}`,
              productId: `prod-racikan-${Date.now()}`,
              batchNumber: `RCK-${new Date().toISOString().slice(2, 10).replace(/-/g, "")}`,
              expiryDate: recipe.beyondUseDate,
              purchasePriceHNA: recipe.subtotalIngredients,
              sellingPrice: recipe.grandTotal,
              currentStock: 1,
              reservedStock: 0,
              locationRack: "MEJA-RACIK",
            },
          ],
        };

        const newCartItem: CartItem = {
          cartItemId,
          product: pseudoProduct,
          selectedBatch: pseudoProduct.batches[0],
          quantity: 1,
          selectedUnit: "SACHET",
          unitMultiplier: 1,
          unitPrice: recipe.grandTotal,
          subtotal: recipe.grandTotal,
          isRacikan: true,
          racikanData: recipe,
        };

        soundEngine.playScanSuccess();
        set({ cart: [...get().cart, newCartItem] });
      },

      updateQuantity: (cartItemId, newQty) => {
        if (newQty <= 0) {
          get().removeFromCart(cartItemId);
          return;
        }
        const newCart = get().cart.map((item) => {
          if (item.cartItemId === cartItemId) {
            const subtotal = newQty * item.unitPrice;
            return { ...item, quantity: newQty, subtotal };
          }
          return item;
        });
        set({ cart: newCart });
      },

      removeFromCart: (cartItemId) => {
        const newCart = get().cart.filter((item) => item.cartItemId !== cartItemId);
        set({ cart: newCart });
        get().recalculateClinicalSafety();
      },

      clearCart: () => {
        set({
          cart: [],
          selectedPatient: null,
          selectedDoctor: null,
          activeInteractionAlerts: [],
          activeAllergyAlerts: [],
        });
      },

      parkBill: (note) => {
        const { cart, heldBills, selectedPatient } = get();
        if (cart.length === 0) return;

        const newHeldBill: HeldBill = {
          id: `held-${Date.now()}`,
          heldAt: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
          customerName: selectedPatient?.fullName || "Umum / Walk-in",
          items: [...cart],
          note,
        };

        set({
          heldBills: [newHeldBill, ...heldBills],
          cart: [],
          selectedPatient: null,
          selectedDoctor: null,
          activeInteractionAlerts: [],
          activeAllergyAlerts: [],
        });
        soundEngine.playWarning();
      },

      recallBill: (billId) => {
        const { heldBills } = get();
        const targetBill = heldBills.find((b) => b.id === billId);
        if (!targetBill) return;

        set({
          cart: targetBill.items,
          heldBills: heldBills.filter((b) => b.id !== billId),
        });
        get().recalculateClinicalSafety();
        soundEngine.playScanSuccess();
      },

      deleteHeldBill: (billId) => {
        set((state) => ({
          heldBills: state.heldBills.filter((b) => b.id !== billId),
        }));
      },

      processCheckout: ({ paymentMethod, paidAmount, cashierName = "Kasir 1" }) => {
        const { cart, selectedPatient, selectedDoctor, products, transactions, currentShift } = get();
        if (cart.length === 0) return null;

        const subtotal = cart.reduce((acc, item) => acc + item.subtotal, 0);
        let tuslahTotal = 0;
        let embalaseTotal = 0;

        cart.forEach((item) => {
          if (item.isRacikan && item.racikanData) {
            tuslahTotal += item.racikanData.tuslahFee;
            embalaseTotal += item.racikanData.packagingCost;
          }
        });

        const rawGrandTotal = subtotal + tuslahTotal + embalaseTotal;
        const grandTotal =
          paymentMethod === "CASH"
            ? Math.round(rawGrandTotal / 100) * 100
            : rawGrandTotal;
        const roundingAmount = grandTotal - rawGrandTotal;
        const changeAmount = Math.max(0, paidAmount - grandTotal);

        // FEFO Stock Deduction
        const updatedProducts = products.map((prod) => {
          const cartMatches = cart.filter((c) => c.product.id === prod.id && !c.isRacikan);
          if (cartMatches.length === 0) return prod;

          let updatedBatches = [...prod.batches];
          cartMatches.forEach((match) => {
            const baseUnitsSold = match.quantity * match.unitMultiplier;
            updatedBatches = updatedBatches.map((b) => {
              if (b.id === match.selectedBatch.id) {
                return {
                  ...b,
                  currentStock: Math.max(0, b.currentStock - baseUnitsSold),
                };
              }
              return b;
            });
          });

          return { ...prod, batches: updatedBatches };
        });

        const invoiceNumber = `INV/KW/${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}/${String(transactions.length + 1).padStart(4, "0")}`;

        const activeCashierName = cashierName || currentShift?.cashierName || "Kasir 1";

        const newTransaction: Transaction = {
          id: `tx-${Date.now()}`,
          invoiceNumber,
          timestamp: new Date().toISOString(),
          cashierName: activeCashierName,
          customerName: selectedPatient?.fullName || "Pelanggan Umum",
          customerPhone: selectedPatient?.phone,
          doctorName: selectedDoctor?.name,
          prescriptionNumber: selectedDoctor ? `RXP/${Date.now().toString().slice(-6)}` : undefined,
          items: cart,
          subtotal,
          tuslahTotal,
          embalaseTotal,
          roundingAmount,
          grandTotal,
          paymentMethod,
          paidAmount,
          changeAmount,
          isSynced: true,
        };

        // Update shift aggregates with zero-loss multi-channel synchronization
        let updatedShift = currentShift;
        if (currentShift && currentShift.status === "OPEN") {
          let addCash = 0;
          let addQris = 0;
          let addEdc = 0;
          let addTransfer = 0;
          let addBpjs = 0;
          let addPiutang = 0;

          if (paymentMethod === "CASH") addCash = grandTotal;
          else if (paymentMethod === "QRIS_DYNAMIC") addQris = grandTotal;
          else if (paymentMethod === "EDC_DEBIT" || paymentMethod === "EDC_CREDIT") addEdc = grandTotal;
          else if (paymentMethod === "TRANSFER_BANK") addTransfer = grandTotal;
          else if (paymentMethod === "INSURANCE_BPJS") addBpjs = grandTotal;
          else if (paymentMethod === "PIUTANG") addPiutang = grandTotal;

          const addNonCash = addQris + addEdc + addTransfer + addBpjs + addPiutang;
          const itemsSoldCount = cart.reduce((acc, item) => acc + item.quantity, 0);

          updatedShift = {
            ...currentShift,
            cashSalesTotal: (currentShift.cashSalesTotal || 0) + addCash,
            qrisSalesTotal: (currentShift.qrisSalesTotal || 0) + addQris,
            edcSalesTotal: (currentShift.edcSalesTotal || 0) + addEdc,
            transferSalesTotal: (currentShift.transferSalesTotal || 0) + addTransfer,
            bpjsSalesTotal: (currentShift.bpjsSalesTotal || 0) + addBpjs,
            piutangSalesTotal: (currentShift.piutangSalesTotal || 0) + addPiutang,
            nonCashSalesTotal: (currentShift.nonCashSalesTotal || 0) + addNonCash,
            itemsSoldTotal: (currentShift.itemsSoldTotal || 0) + itemsSoldCount,
            totalTransactionsCount: currentShift.totalTransactionsCount + 1,
          };
        }

        soundEngine.playCheckoutChime();

        set({
          products: updatedProducts,
          transactions: [newTransaction, ...transactions],
          currentShift: updatedShift,
          cart: [],
          selectedPatient: null,
          selectedDoctor: null,
          activeInteractionAlerts: [],
          activeAllergyAlerts: [],
          lastCompletedTransaction: newTransaction,
        });

        return newTransaction;
      },
    }),
    {
      name: "apotek-kerso-waras-storage",
      partialize: (state) => ({
        cart: state.cart,
        heldBills: state.heldBills,
        transactions: state.transactions,
        densityMode: state.densityMode,
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated,
        privacyMode: state.privacyMode,
        currentShift: state.currentShift,
        shiftsHistory: state.shiftsHistory,
      }),
    }
  )
);
