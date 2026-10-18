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
  IncomingGoodsRecord,
  PaymentMethodType,
  PettyCashCategory,
  PettyCashMovement,
  Product,
  PurchaseOrder,
  PurchaseOrderItem,
  ReconciliationSupervisorAuth,
  RupiahDenominationCount,
  ShiftHandoverLog,
  StockOpnameRecord,
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
  purchaseOrders: PurchaseOrder[];
  stockOpnameRecords: StockOpnameRecord[];
  incomingGoodsRecords: IncomingGoodsRecord[];
  isOfflineSimulated: boolean;
  offlineQueueIds: string[];
  lastCacheSyncAt: string;
  lastSearchLatencyMs: number;
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

  // Standar NFR 2 & RBAC Level 1/2: Gudang, Stock Opname, Barang Masuk, & Purchase Order (PO)
  executeStockOpname: (params: {
    productId: string;
    batchId: string;
    physicalStock: number;
    reason: string;
  }) => { success: boolean; message: string; record?: StockOpnameRecord };
  recordIncomingGoods: (params: {
    invoiceNumber: string;
    supplierName: string;
    productId: string;
    batchNumber: string;
    expiryDate: string;
    quantity: number;
    purchasePriceHNA: number;
    sellingPrice?: number;
    locationRack: string;
  }) => { success: boolean; message: string; record?: IncomingGoodsRecord };
  createPurchaseOrder: (params: {
    supplierName: string;
    items: PurchaseOrderItem[];
    notes?: string;
  }) => { success: boolean; message: string; po?: PurchaseOrder };
  approvePurchaseOrder: (poId: string) => { success: boolean; message: string };
  rejectPurchaseOrder: (poId: string, reason: string) => { success: boolean; message: string };
  receiveApprovedPO: (poId: string) => { success: boolean; message: string };
  runAutomatedReorderEngine: () => { createdCount: number; message: string };

  // Standar NFR 1 & 3: Kecepatan Respons (< 0.2 dtk) & Local Caching (Uptime 99.9%)
  setLastSearchLatencyMs: (ms: number) => void;
  toggleOfflineSimulation: () => void;
  syncOfflineCacheNow: () => number;

  // POS & Cart Actions
  addToCart: (product: Product, quantity?: number, unitName?: string, specificBatchId?: string) => boolean;
  addRacikanToCart: (recipe: CompoundingRecipe) => void;
  updateQuantity: (cartItemId: string, newQty: number) => void;
  updateItemSigna: (cartItemId: string, signa: string) => void;
  removeFromCart: (cartItemId: string) => void;
  clearCart: () => void;
  
  parkBill: (note?: string) => void;
  recallBill: (billId: string) => void;
  deleteHeldBill: (billId: string) => void;

  processCheckout: (params: {
    paymentMethod: PaymentMethodType;
    paidAmount: number;
    cashierName?: string;
    transactionMode?: "SWAMEDIKASI" | "RESEP_DOKTER";
    customerName?: string;
    doctorName?: string;
    doctorSip?: string;
    prescriptionNumber?: string;
    isPrescriptionVerified?: boolean;
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

const INITIAL_PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    id: "po-auto-2026-001",
    poNumber: "PO/AUTO/202610/001",
    supplierName: "PT. Anugrah Argon Medica (AAM)",
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    createdBy: "Pengingat Stok Otomatis",
    createdByRole: "Sistem Inventaris",
    status: "MENUNGGU_PERSETUJUAN",
    isAutoGenerated: true,
    triggerReason: "Stok Cefixime 100 mg (sisa 15 kapsul) dan Sanmol 500 mg (habis) berada di bawah batas aman.",
    notes: "Draf pesanan dibuat otomatis karena stok menyentuh batas minimum.",
    items: [
      {
        productId: "prod-015",
        productName: "Cefixime 100 mg",
        unit: "Box (100 Kapsul)",
        currentStock: 15,
        orderQty: 5,
        estimatedUnitCost: 160000,
        subtotal: 800000,
      },
      {
        productId: "prod-012",
        productName: "Sanmol 500 mg",
        unit: "Box (100 Tablet)",
        currentStock: 0,
        orderQty: 5,
        estimatedUnitCost: 180000,
        subtotal: 900000,
      },
    ],
    totalEstimatedCost: 1700000,
  },
  {
    id: "po-kw-2026-001",
    poNumber: "PO/KW/202610/001",
    supplierName: "PT. Kimia Farma Trading & Distribution",
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    createdBy: "apt. Farhan Pratama, S.Farm",
    createdByRole: "Petugas Gudang",
    status: "MENUNGGU_PERSETUJUAN",
    isAutoGenerated: false,
    notes: "Pengadaan rutin obat reguler dan antibiotik.",
    items: [
      {
        productId: "prod-002",
        productName: "Amoxicillin 500 mg",
        unit: "Box (100 Kapsul)",
        currentStock: 80,
        orderQty: 10,
        estimatedUnitCost: 110000,
        subtotal: 1100000,
      },
      {
        productId: "prod-001",
        productName: "Paracetamol 500 mg",
        unit: "Box (100 Tablet)",
        currentStock: 165,
        orderQty: 15,
        estimatedUnitCost: 60000,
        subtotal: 900000,
      },
    ],
    totalEstimatedCost: 2000000,
  },
  {
    id: "po-kw-2026-003",
    poNumber: "PO/KW/202610/003",
    supplierName: "PT. Enseval Putera Megatrading Tbk",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    createdBy: "apt. Farhan Pratama, S.Farm",
    createdByRole: "Petugas Gudang",
    status: "DISETUJUI_PEMILIK",
    approvedBy: "dr. H. Bambang Soedibyo, Sp.Rad",
    approvedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    notes: "Disetujui Pemilik Apotek, menunggu pengiriman barang dari distributor.",
    items: [
      {
        productId: "prod-005",
        productName: "Metronidazole 500 mg",
        unit: "Box (100 Tablet)",
        currentStock: 40,
        orderQty: 5,
        estimatedUnitCost: 120000,
        subtotal: 600000,
      },
    ],
    totalEstimatedCost: 600000,
  },
];

const INITIAL_STOCK_OPNAME: StockOpnameRecord[] = [
  {
    id: "so-202610-01",
    timestamp: new Date(Date.now() - 3600000 * 6).toISOString(),
    productId: "prod-001",
    productName: "Paracetamol 500 mg",
    batchId: "batch-pcm-01",
    batchNumber: "B-PCM24-001",
    systemStock: 120,
    physicalStock: 120,
    difference: 0,
    reason: "Pengecekan rutin stok fisik rak pagi hari.",
    executedBy: "apt. Farhan Pratama, S.Farm",
  },
];

const INITIAL_INCOMING_GOODS: IncomingGoodsRecord[] = [
  {
    id: "in-202610-01",
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    invoiceNumber: "FKT/KFTD/2026/0891",
    supplierName: "PT. Kimia Farma Trading & Distribution",
    productId: "prod-001",
    productName: "Paracetamol 500 mg",
    batchNumber: "B-PCM24-001",
    expiryDate: "2027-05-15",
    quantity: 120,
    purchasePriceHNA: 600,
    sellingPrice: 1000,
    locationRack: "Rak A-01",
    recordedBy: "apt. Farhan Pratama, S.Farm",
  },
];

// Real-Time Cross-Tab BroadcastChannel Helper
function broadcastRealtimeSync(type: string) {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") return;
  try {
    const channel = new BroadcastChannel("kerso_waras_realtime_sync");
    channel.postMessage({ type, timestamp: Date.now() });
    channel.close();
  } catch {}
}

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
      purchaseOrders: INITIAL_PURCHASE_ORDERS,
      stockOpnameRecords: INITIAL_STOCK_OPNAME,
      incomingGoodsRecords: INITIAL_INCOMING_GOODS,
      isOfflineSimulated: false,
      offlineQueueIds: [],
      lastCacheSyncAt: new Date().toISOString(),
      lastSearchLatencyMs: 0.4,
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
          lastCacheSyncAt: new Date().toISOString(),
        }));
        broadcastRealtimeSync("PRODUCTS_UPDATED");
      },

      // ======================================================================
      // STANDAR 2: AKURASI DATA 100% REAL-TIME & VALIDASI INPUT KETAT
      // ======================================================================
      executeStockOpname: ({ productId, batchId, physicalStock, reason }) => {
        const { products, stockOpnameRecords, currentUser } = get();

        if (!productId || !batchId) {
          soundEngine.playError();
          return { success: false, message: "Pilih produk dan nomor batch terlebih dahulu." };
        }
        if (Number.isNaN(physicalStock) || physicalStock < 0 || !Number.isInteger(physicalStock)) {
          soundEngine.playError();
          return {
            success: false,
            message: "Validasi Ketat: Stok fisik harus berupa angka bulat positif (>= 0).",
          };
        }

        const targetProd = products.find((p) => p.id === productId);
        if (!targetProd) {
          return { success: false, message: "Produk tidak ditemukan di database gudang." };
        }

        const targetBatch = targetProd.batches.find((b) => b.id === batchId);
        if (!targetBatch) {
          return { success: false, message: "Nomor batch tidak ditemukan." };
        }

        const systemStock = targetBatch.currentStock;
        const difference = physicalStock - systemStock;

        if (difference !== 0 && (!reason || reason.trim().length < 5)) {
          soundEngine.playError();
          return {
            success: false,
            message:
              "Validasi Ketat: Terdapat selisih stok fisik vs sistem. Alasan penyesuaian wajib diisi (minimal 5 karakter).",
          };
        }

        const newRecord: StockOpnameRecord = {
          id: `so-${Date.now()}`,
          timestamp: new Date().toISOString(),
          productId: targetProd.id,
          productName: targetProd.name,
          batchId: targetBatch.id,
          batchNumber: targetBatch.batchNumber,
          systemStock,
          physicalStock,
          difference,
          reason:
            reason.trim() ||
            "Audit rutin Stock Opname — jumlah fisik 100% sesuai catatan sistem.",
          executedBy: `${currentUser.name} (${currentUser.role === "KARYAWAN_APOTEKER" ? "Petugas Gudang" : "Pemilik"})`,
        };

        const updatedProducts = products.map((p) => {
          if (p.id !== productId) return p;
          return {
            ...p,
            batches: p.batches.map((b) =>
              b.id === batchId ? { ...b, currentStock: physicalStock } : b
            ),
          };
        });

        set({
          products: updatedProducts,
          stockOpnameRecords: [newRecord, ...stockOpnameRecords],
          lastCacheSyncAt: new Date().toISOString(),
        });

        soundEngine.playCheckoutChime();
        broadcastRealtimeSync("STOCK_OPNAME_EXECUTED");

        return {
          success: true,
          message: `Stock Opname ${targetProd.name} (Batch ${targetBatch.batchNumber}) berhasil! Stok diperbarui real-time menjadi ${physicalStock} ${targetProd.baseUnit}.`,
          record: newRecord,
        };
      },

      recordIncomingGoods: ({
        invoiceNumber,
        supplierName,
        productId,
        batchNumber,
        expiryDate,
        quantity,
        purchasePriceHNA,
        sellingPrice,
        locationRack,
      }) => {
        const { products, incomingGoodsRecords, currentUser } = get();

        // Strict Form Validation
        if (!invoiceNumber || invoiceNumber.trim().length < 3) {
          soundEngine.playError();
          return {
            success: false,
            message: "Validasi Ketat: Nomor Faktur Supplier wajib diisi dengan benar.",
          };
        }
        if (!supplierName || supplierName.trim().length < 3) {
          soundEngine.playError();
          return {
            success: false,
            message: "Validasi Ketat: Nama Supplier / PBF wajib diisi.",
          };
        }
        if (!productId) {
          soundEngine.playError();
          return {
            success: false,
            message: "Validasi Ketat: Pilih obat yang diterima terlebih dahulu.",
          };
        }
        if (!batchNumber || batchNumber.trim().length < 3) {
          soundEngine.playError();
          return {
            success: false,
            message: "Validasi Ketat: Nomor Batch fisik kemasan obat wajib diisi.",
          };
        }
        if (!expiryDate) {
          soundEngine.playError();
          return {
            success: false,
            message: "Validasi Ketat: Tanggal Kedaluwarsa (ED) obat wajib diisi.",
          };
        }

        const expTime = new Date(expiryDate).getTime();
        if (Number.isNaN(expTime) || expTime <= Date.now()) {
          soundEngine.playError();
          return {
            success: false,
            message:
              "Validasi Ketat Ditolak: Obat sudah kedaluwarsa atau tanggal ED tidak valid!",
          };
        }

        if (!Number.isInteger(quantity) || quantity <= 0) {
          soundEngine.playError();
          return {
            success: false,
            message: "Validasi Ketat: Jumlah barang masuk harus berupa angka bulat > 0.",
          };
        }

        if (Number.isNaN(purchasePriceHNA) || purchasePriceHNA <= 0) {
          soundEngine.playError();
          return {
            success: false,
            message: "Validasi Ketat: Harga Beli (HNA) per satuan harus lebih dari Rp 0.",
          };
        }

        const targetProd = products.find((p) => p.id === productId);
        if (!targetProd) {
          return { success: false, message: "Obat tidak ditemukan di master produk." };
        }

        const cleanBatchNo = batchNumber.trim().toUpperCase();
        const finalSellingPrice =
          sellingPrice && sellingPrice > purchasePriceHNA
            ? sellingPrice
            : Math.max(targetProd.sellingPrice, Math.round(purchasePriceHNA * 1.25));
        const cleanRack = (locationRack || "RAK-A01").trim().toUpperCase();

        const updatedProducts = products.map((p) => {
          if (p.id !== productId) return p;

          const existingBatchIdx = p.batches.findIndex(
            (b) => b.batchNumber.toUpperCase() === cleanBatchNo
          );

          let updatedBatches = [...p.batches];
          if (existingBatchIdx > -1) {
            const existing = updatedBatches[existingBatchIdx];
            updatedBatches[existingBatchIdx] = {
              ...existing,
              currentStock: existing.currentStock + quantity,
              purchasePriceHNA,
              sellingPrice: finalSellingPrice,
              expiryDate,
              locationRack: cleanRack,
            };
          } else {
            updatedBatches = [
              {
                id: `batch-${Date.now()}`,
                productId: p.id,
                batchNumber: cleanBatchNo,
                expiryDate,
                purchasePriceHNA,
                sellingPrice: finalSellingPrice,
                currentStock: quantity,
                reservedStock: 0,
                locationRack: cleanRack,
              },
              ...updatedBatches,
            ];
          }

          return {
            ...p,
            hpp: purchasePriceHNA,
            sellingPrice: finalSellingPrice,
            batches: updatedBatches,
          };
        });

        const newIncoming: IncomingGoodsRecord = {
          id: `in-${Date.now()}`,
          timestamp: new Date().toISOString(),
          invoiceNumber: invoiceNumber.trim().toUpperCase(),
          supplierName: supplierName.trim(),
          productId: targetProd.id,
          productName: targetProd.name,
          batchNumber: cleanBatchNo,
          expiryDate,
          quantity,
          purchasePriceHNA,
          sellingPrice: finalSellingPrice,
          locationRack: cleanRack,
          recordedBy: currentUser.name,
        };

        set({
          products: updatedProducts,
          incomingGoodsRecords: [newIncoming, ...incomingGoodsRecords],
          lastCacheSyncAt: new Date().toISOString(),
        });

        soundEngine.playCheckoutChime();
        broadcastRealtimeSync("INCOMING_GOODS_RECORDED");

        return {
          success: true,
          message: `Barang masuk (+${quantity} ${targetProd.baseUnit} ${targetProd.name}) berhasil dicatat & langsung menambah stok kasir secara real-time!`,
          record: newIncoming,
        };
      },

      // ======================================================================
      // STANDAR 4: RBAC LEVEL 1 (PERSETUJUAN PO PEMILIK) & LEVEL 2 (GUDANG)
      // ======================================================================
      createPurchaseOrder: ({ supplierName, items, notes }) => {
        const { purchaseOrders, currentUser } = get();

        if (!supplierName || supplierName.trim().length < 3) {
          soundEngine.playError();
          return {
            success: false,
            message: "Validasi Ketat: Nama Supplier / PBF tujuan wajib diisi.",
          };
        }
        if (!items || items.length === 0) {
          soundEngine.playError();
          return {
            success: false,
            message: "Validasi Ketat: Tambahkan minimal 1 item obat ke dalam Purchase Order.",
          };
        }
        for (const it of items) {
          if (!Number.isInteger(it.orderQty) || it.orderQty <= 0) {
            soundEngine.playError();
            return {
              success: false,
              message: `Validasi Ketat: Jumlah pesanan untuk ${it.productName} harus > 0.`,
            };
          }
        }

        const totalEstimatedCost = items.reduce((acc, it) => acc + it.subtotal, 0);
        const poNumber = `PO/KW/${new Date().getFullYear()}${String(
          new Date().getMonth() + 1
        ).padStart(2, "0")}/${String(purchaseOrders.length + 1).padStart(3, "0")}`;

        const newPO: PurchaseOrder = {
          id: `po-${Date.now()}`,
          poNumber,
          supplierName: supplierName.trim(),
          createdAt: new Date().toISOString(),
          createdBy: currentUser.name,
          createdByRole:
            currentUser.role === "KARYAWAN_APOTEKER"
              ? "Level 2 — Petugas Gudang"
              : "Level 1 — Pemilik Apotek",
          status: "MENUNGGU_PERSETUJUAN",
          items,
          totalEstimatedCost,
          notes: notes?.trim() || "Pemesanan stok obat reguler ke distributor resmi.",
        };

        set({
          purchaseOrders: [newPO, ...purchaseOrders],
          lastCacheSyncAt: new Date().toISOString(),
        });

        soundEngine.playScanSuccess();
        broadcastRealtimeSync("PO_CREATED");

        return {
          success: true,
          message: `Purchase Order ${poNumber} berhasil dibuat dan menunggu persetujuan Level 1 (Pemilik Apotek).`,
          po: newPO,
        };
      },

      approvePurchaseOrder: (poId) => {
        const { purchaseOrders, currentUser } = get();

        if (currentUser.role !== "OWNER" && currentUser.role !== "SUPER_ADMIN") {
          soundEngine.playError();
          return {
            success: false,
            message:
              "Akses Ditolak (RBAC): Hanya Level 1 (Pemilik Apotek) yang memiliki wewenang menyetujui Purchase Order (PO)!",
          };
        }

        const target = purchaseOrders.find((p) => p.id === poId);
        if (!target) {
          return { success: false, message: "Data Purchase Order tidak ditemukan." };
        }

        const updatedPOs = purchaseOrders.map((po) =>
          po.id === poId
            ? {
                ...po,
                status: "DISETUJUI_PEMILIK" as const,
                approvedBy: currentUser.name,
                approvedAt: new Date().toISOString(),
              }
            : po
        );

        set({
          purchaseOrders: updatedPOs,
          lastCacheSyncAt: new Date().toISOString(),
        });

        soundEngine.playCheckoutChime();
        broadcastRealtimeSync("PO_APPROVED");

        return {
          success: true,
          message: `Purchase Order ${target.poNumber} ke ${target.supplierName} resmi DISETUJUI oleh Pemilik Apotek!`,
        };
      },

      rejectPurchaseOrder: (poId, reason) => {
        const { purchaseOrders, currentUser } = get();

        if (currentUser.role !== "OWNER" && currentUser.role !== "SUPER_ADMIN") {
          soundEngine.playError();
          return {
            success: false,
            message:
              "Akses Ditolak (RBAC): Hanya Level 1 (Pemilik Apotek) yang berwenang menolak Purchase Order!",
          };
        }

        const updatedPOs = purchaseOrders.map((po) =>
          po.id === poId
            ? {
                ...po,
                status: "DITOLAK" as const,
                approvedBy: currentUser.name,
                approvedAt: new Date().toISOString(),
                rejectedReason: reason || "Ditolak oleh Pemilik Apotek saat evaluasi anggaran.",
              }
            : po
        );

        set({
          purchaseOrders: updatedPOs,
          lastCacheSyncAt: new Date().toISOString(),
        });

        soundEngine.playWarning();
        broadcastRealtimeSync("PO_REJECTED");

        return {
          success: true,
          message: "Purchase Order telah ditolak oleh Pemilik Apotek.",
        };
      },

      receiveApprovedPO: (poId) => {
        const { purchaseOrders, products, incomingGoodsRecords, currentUser } = get();

        const targetPO = purchaseOrders.find((p) => p.id === poId);
        if (!targetPO) {
          return { success: false, message: "Purchase Order tidak ditemukan." };
        }
        if (targetPO.status !== "DISETUJUI_PEMILIK") {
          soundEngine.playError();
          return {
            success: false,
            message:
              "Validasi RBAC: Purchase Order harus disetujui Level 1 (Pemilik Apotek) terlebih dahulu sebelum barang dapat diterima ke gudang!",
          };
        }

        const newIncomingRecords: IncomingGoodsRecord[] = [];
        const futureExpiry = new Date(Date.now() + 86400000 * 540).toISOString().split("T")[0];

        const updatedProducts = products.map((prod) => {
          const poItem = targetPO.items.find((it) => it.productId === prod.id);
          if (!poItem) return prod;

          // Convert BOX order quantity into base units (e.g. 1 BOX = 100 or 50 tablets, or use highest conversion multiplier)
          const boxConversion =
            prod.unitConversions.length > 1
              ? prod.unitConversions[prod.unitConversions.length - 1]
              : prod.unitConversions[0];
          const multiplier = boxConversion?.multiplier || 50;
          const addedBaseUnits = poItem.orderQty * multiplier;
          const newBatchNo = `PO${targetPO.poNumber.replace(/[^0-9]/g, "").slice(-5)}`;

          newIncomingRecords.push({
            id: `in-po-${Date.now()}-${prod.id}`,
            timestamp: new Date().toISOString(),
            invoiceNumber: `FKT/${targetPO.poNumber}`,
            supplierName: targetPO.supplierName,
            productId: prod.id,
            productName: prod.name,
            batchNumber: newBatchNo,
            expiryDate: futureExpiry,
            quantity: addedBaseUnits,
            purchasePriceHNA: prod.hpp,
            sellingPrice: prod.sellingPrice,
            locationRack: prod.batches[0]?.locationRack || "RAK-A01",
            recordedBy: currentUser.name,
          });

          const updatedBatches = [...prod.batches];
          if (updatedBatches.length > 0) {
            updatedBatches[0] = {
              ...updatedBatches[0],
              currentStock: updatedBatches[0].currentStock + addedBaseUnits,
            };
          } else {
            updatedBatches.push({
              id: `batch-po-${Date.now()}`,
              productId: prod.id,
              batchNumber: newBatchNo,
              expiryDate: futureExpiry,
              purchasePriceHNA: prod.hpp,
              sellingPrice: prod.sellingPrice,
              currentStock: addedBaseUnits,
              reservedStock: 0,
              locationRack: "RAK-A01",
            });
          }

          return {
            ...prod,
            batches: updatedBatches,
          };
        });

        const updatedPOs = purchaseOrders.map((po) =>
          po.id === poId
            ? {
                ...po,
                status: "SELESAI_DITERIMA" as const,
                receivedAt: new Date().toISOString(),
                receivedBy: currentUser.name,
              }
            : po
        );

        set({
          products: updatedProducts,
          purchaseOrders: updatedPOs,
          incomingGoodsRecords: [...newIncomingRecords, ...incomingGoodsRecords],
          lastCacheSyncAt: new Date().toISOString(),
        });

        soundEngine.playCheckoutChime();
        broadcastRealtimeSync("PO_RECEIVED_INTO_STOCK");

        return {
          success: true,
          message: `Barang dari ${targetPO.poNumber} telah diterima ke Gudang dan stok kasir bertambah secara 100% Real-Time!`,
        };
      },

      runAutomatedReorderEngine: () => {
        const { products, purchaseOrders } = get();
        // Find products whose total stock <= minStockAlert (excluding packaging items)
        const lowStockProducts = products.filter((p) => {
          if (p.id.startsWith("pkg-")) return false;
          const totalStock = p.batches.reduce((sum, b) => sum + b.currentStock, 0);
          return totalStock <= p.minStockAlert;
        });

        // Filter out products that already have a pending PO (MENUNGGU_PERSETUJUAN or DISETUJUI_PEMILIK)
        const activePOProductIds = new Set<string>();
        purchaseOrders.forEach((po) => {
          if (po.status === "MENUNGGU_PERSETUJUAN" || po.status === "DISETUJUI_PEMILIK") {
            po.items.forEach((it) => activePOProductIds.add(it.productId));
          }
        });

        const productsNeedingAutoPO = lowStockProducts.filter(
          (p) => !activePOProductIds.has(p.id)
        );

        if (productsNeedingAutoPO.length === 0) {
          return {
            createdCount: 0,
            message:
              lowStockProducts.length > 0
                ? `Seluruh ${lowStockProducts.length} obat yang menyentuh batas minimum sudah memiliki Draf PO aktif yang siap disetujui Pemilik.`
                : "Seluruh stok obat berada di atas batas aman minimum.",
          };
        }

        const poItems: PurchaseOrderItem[] = productsNeedingAutoPO.map((p) => {
          const currentStock = p.batches.reduce((s, b) => s + b.currentStock, 0);
          const estimatedUnitCost = Math.max(25000, p.hpp * 100);
          const orderQty = 5; // 5 Box restock
          return {
            productId: p.id,
            productName: p.name,
            unit: `BOX (100 ${p.baseUnit})`,
            currentStock,
            orderQty,
            estimatedUnitCost,
            subtotal: orderQty * estimatedUnitCost,
          };
        });

        const totalEstimatedCost = poItems.reduce((s, i) => s + i.subtotal, 0);
        const poNumber = `PO/AUTO/${new Date().getFullYear()}${String(
          new Date().getMonth() + 1
        ).padStart(2, "0")}/${String(purchaseOrders.length + 1).padStart(3, "0")}`;

        const autoPO: PurchaseOrder = {
          id: `po-auto-${Date.now()}`,
          poNumber,
          supplierName: "PT. Kimia Farma Trading & Distribution",
          createdAt: new Date().toISOString(),
          createdBy: "Sistem Otomatis (Stok Minimum)",
          createdByRole: "Peringatan Stok Minimum",
          status: "MENUNGGU_PERSETUJUAN",
          isAutoGenerated: true,
          triggerReason: `Stok ${productsNeedingAutoPO
            .map((p) => p.name)
            .join(", ")} menyentuh batas aman minimum.`,
          items: poItems,
          totalEstimatedCost,
          notes:
            "Draf PO dibuat otomatis saat stok menyentuh batas minimum.",
        };

        set({
          purchaseOrders: [autoPO, ...purchaseOrders],
          lastCacheSyncAt: new Date().toISOString(),
        });

        soundEngine.playCheckoutChime();
        broadcastRealtimeSync("AUTO_PO_GENERATED");

        return {
          createdCount: productsNeedingAutoPO.length,
          message: `Automated Reorder Engine membuat Draf PO Otomatis (${poNumber}) untuk ${productsNeedingAutoPO.length} obat yang menyentuh batas minimum!`,
        };
      },

      // ======================================================================
      // STANDAR 1 & 3: TELEMETRI < 0.2 DETIK & LOCAL CACHING (UPTIME 99.9%)
      // ======================================================================
      setLastSearchLatencyMs: (ms) => set({ lastSearchLatencyMs: ms }),

      toggleOfflineSimulation: () => {
        const nextMode = !get().isOfflineSimulated;
        set({
          isOfflineSimulated: nextMode,
          lastCacheSyncAt: new Date().toISOString(),
        });
        soundEngine.playKeyTap();
      },

      syncOfflineCacheNow: () => {
        const { offlineQueueIds, transactions } = get();
        const syncedCount = offlineQueueIds.length;
        const updatedTx = transactions.map((tx) =>
          offlineQueueIds.includes(tx.id) ? { ...tx, isSynced: true, isOfflineCached: false } : tx
        );
        set({
          offlineQueueIds: [],
          transactions: updatedTx,
          isOfflineSimulated: false,
          lastCacheSyncAt: new Date().toISOString(),
        });
        soundEngine.playCheckoutChime();
        broadcastRealtimeSync("OFFLINE_CACHE_SYNCED");
        return syncedCount;
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
        if (!Number.isFinite(quantity) || quantity <= 0) {
          soundEngine.playError();
          return false;
        }

        // Always read latest product state from store for 100% real-time stock accuracy
        const latestProduct = get().products.find((p) => p.id === product.id) || product;
        const targetUnit = unitName || latestProduct.baseUnit;
        const baseQtyNeeded = FEFOEngine.convertToBaseQuantity(latestProduct, targetUnit, quantity);

        let chosenBatch = specificBatchId
          ? latestProduct.batches.find((b) => b.id === specificBatchId) || null
          : null;

        if (!chosenBatch) {
          const allocation = FEFOEngine.allocateBatch(latestProduct, baseQtyNeeded);
          if (allocation.isExpiredBlock || !allocation.allocatedBatch) {
            soundEngine.playError();
            return false;
          }
          chosenBatch = allocation.allocatedBatch;
        }

        const unitConversion = latestProduct.unitConversions.find(
          (u) => u.unitName.toUpperCase() === targetUnit.toUpperCase()
        );
        const unitPrice = unitConversion ? unitConversion.pricePerUnit : chosenBatch.sellingPrice;
        const multiplier = unitConversion ? unitConversion.multiplier : 1;

        const cartItemId = `${latestProduct.id}-${chosenBatch.id}-${targetUnit}`;
        const existingIndex = get().cart.findIndex((c) => c.cartItemId === cartItemId);

        let newCart = [...get().cart];
        if (existingIndex > -1) {
          const item = newCart[existingIndex];
          const updatedQty = item.quantity + quantity;
          const totalBaseUnitsRequired = updatedQty * multiplier;

          // Strict Validation: Never allow cart quantity to exceed real-time batch stock
          if (totalBaseUnitsRequired > chosenBatch.currentStock) {
            soundEngine.playError();
            return false;
          }

          const subtotal = updatedQty * item.unitPrice;
          newCart[existingIndex] = {
            ...item,
            product: latestProduct,
            selectedBatch: chosenBatch,
            quantity: updatedQty,
            subtotal,
          };
        } else {
          if (baseQtyNeeded > chosenBatch.currentStock) {
            soundEngine.playError();
            return false;
          }

          const subtotal = quantity * unitPrice;
          const autoSigna =
            latestProduct.defaultSigna ||
            (latestProduct.drugClass === "KERAS"
              ? `3 x sehari 1 ${latestProduct.baseUnit} — Sesudah Makan (Habiskan)`
              : `3 x sehari 1 ${latestProduct.baseUnit} — Sesudah Makan`);

          newCart.push({
            cartItemId,
            product: latestProduct,
            selectedBatch: chosenBatch,
            quantity,
            selectedUnit: targetUnit,
            unitMultiplier: multiplier,
            unitPrice,
            subtotal,
            signaUsage: autoSigna,
          });
        }

        soundEngine.playScanSuccess();
        set({ cart: newCart, lastCacheSyncAt: new Date().toISOString() });
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
          signaUsage: recipe.dosageSigna || "3 x sehari 1 Bungkus — Sesudah Makan",
          isRacikan: true,
          racikanData: recipe,
        };

        soundEngine.playScanSuccess();
        set({ cart: [...get().cart, newCartItem] });
      },

      updateQuantity: (cartItemId, newQty) => {
        if (!Number.isFinite(newQty) || newQty <= 0) {
          get().removeFromCart(cartItemId);
          return;
        }
        const safeQty = Math.floor(newQty);
        const currentCart = get().cart;
        const targetItem = currentCart.find((i) => i.cartItemId === cartItemId);
        if (!targetItem) return;

        // Strict Real-Time Stock Validation
        if (!targetItem.isRacikan) {
          const liveProduct = get().products.find((p) => p.id === targetItem.product.id);
          const liveBatch = liveProduct?.batches.find((b) => b.id === targetItem.selectedBatch.id);
          const maxStock = liveBatch ? liveBatch.currentStock : targetItem.selectedBatch.currentStock;
          const requiredBaseUnits = safeQty * targetItem.unitMultiplier;

          if (requiredBaseUnits > maxStock) {
            soundEngine.playError();
            return;
          }
        }

        const newCart = currentCart.map((item) => {
          if (item.cartItemId === cartItemId) {
            const subtotal = safeQty * item.unitPrice;
            return { ...item, quantity: safeQty, subtotal };
          }
          return item;
        });
        set({ cart: newCart, lastCacheSyncAt: new Date().toISOString() });
      },

      updateItemSigna: (cartItemId, signa) => {
        const newCart = get().cart.map((item) =>
          item.cartItemId === cartItemId ? { ...item, signaUsage: signa } : item
        );
        set({ cart: newCart, lastCacheSyncAt: new Date().toISOString() });
      },

      removeFromCart: (cartItemId) => {
        const newCart = get().cart.filter((item) => item.cartItemId !== cartItemId);
        set({ cart: newCart, lastCacheSyncAt: new Date().toISOString() });
        get().recalculateClinicalSafety();
      },

      clearCart: () => {
        set({
          cart: [],
          selectedPatient: null,
          selectedDoctor: null,
          activeInteractionAlerts: [],
          activeAllergyAlerts: [],
          lastCacheSyncAt: new Date().toISOString(),
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
          lastCacheSyncAt: new Date().toISOString(),
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
          lastCacheSyncAt: new Date().toISOString(),
        });
        get().recalculateClinicalSafety();
        soundEngine.playScanSuccess();
      },

      deleteHeldBill: (billId) => {
        set((state) => ({
          heldBills: state.heldBills.filter((b) => b.id !== billId),
          lastCacheSyncAt: new Date().toISOString(),
        }));
      },

      processCheckout: ({
        paymentMethod,
        paidAmount,
        cashierName = "Kasir 1",
        transactionMode = "SWAMEDIKASI",
        customerName,
        doctorName,
        doctorSip,
        prescriptionNumber,
        isPrescriptionVerified,
      }) => {
        const startPerf = typeof performance !== "undefined" ? performance.now() : 0;
        const {
          cart,
          selectedPatient,
          selectedDoctor,
          products,
          transactions,
          currentShift,
          isOfflineSimulated,
          offlineQueueIds,
        } = get();
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

        // 100% Real-Time Atomic Stock Deduction (Updates Warehouse Stock Immediately)
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

        const invoiceNumber = `INV/KW/${new Date().getFullYear()}${String(
          new Date().getMonth() + 1
        ).padStart(2, "0")}/${String(transactions.length + 1).padStart(4, "0")}`;

        const activeCashierName = cashierName || currentShift?.cashierName || "Kasir 1";
        const isOffline =
          isOfflineSimulated || (typeof navigator !== "undefined" && !navigator.onLine);
        const endPerf = typeof performance !== "undefined" ? performance.now() : 1.2;
        const responseLatencyMs = Math.max(0.4, Number((endPerf - startPerf).toFixed(2)));

        const txId = `tx-${Date.now()}`;
        const finalCustomerName =
          customerName?.trim() || selectedPatient?.fullName || "Pasien Swamedikasi";
        const finalDoctorName =
          transactionMode === "RESEP_DOKTER"
            ? doctorName?.trim() || selectedDoctor?.name || "dr. Hendra Wijaya, Sp.PD"
            : undefined;
        const finalPrescriptionNo =
          transactionMode === "RESEP_DOKTER"
            ? prescriptionNumber?.trim() || `RXP/${Date.now().toString().slice(-6)}`
            : undefined;

        const newTransaction: Transaction = {
          id: txId,
          invoiceNumber,
          timestamp: new Date().toISOString(),
          cashierName: activeCashierName,
          customerName: finalCustomerName,
          customerPhone: selectedPatient?.phone,
          doctorName: finalDoctorName,
          doctorSip: transactionMode === "RESEP_DOKTER" ? doctorSip || "SIP.503/442/DS/2024" : undefined,
          prescriptionNumber: finalPrescriptionNo,
          transactionMode,
          isPrescriptionVerified: transactionMode === "RESEP_DOKTER" ? (isPrescriptionVerified ?? true) : false,
          items: cart,
          subtotal,
          tuslahTotal,
          embalaseTotal,
          roundingAmount,
          grandTotal,
          paymentMethod,
          paidAmount,
          changeAmount,
          isSynced: !isOffline,
          isOfflineCached: isOffline,
          responseLatencyMs,
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
          offlineQueueIds: isOffline ? [txId, ...offlineQueueIds] : offlineQueueIds,
          lastCacheSyncAt: new Date().toISOString(),
          currentShift: updatedShift,
          cart: [],
          selectedPatient: null,
          selectedDoctor: null,
          activeInteractionAlerts: [],
          activeAllergyAlerts: [],
          lastCompletedTransaction: newTransaction,
        });

        // Automatically trigger Automated Reorder Engine if any product dropped below minStockAlert!
        try {
          get().runAutomatedReorderEngine();
        } catch {}

        broadcastRealtimeSync("POS_CHECKOUT_STOCK_DEDUCTED");

        return newTransaction;
      },
    }),
    {
      name: "apotek-kerso-waras-v2",
      partialize: (state) => ({
        products: state.products,
        cart: state.cart,
        heldBills: state.heldBills,
        transactions: state.transactions,
        purchaseOrders: state.purchaseOrders,
        stockOpnameRecords: state.stockOpnameRecords,
        incomingGoodsRecords: state.incomingGoodsRecords,
        isOfflineSimulated: state.isOfflineSimulated,
        offlineQueueIds: state.offlineQueueIds,
        lastCacheSyncAt: state.lastCacheSyncAt,
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

// Subscribe to Cross-Tab BroadcastChannel so multiple open tabs (e.g. POS Kasir + Gudang + Owner) stay 100% synchronized in 0ms
if (typeof window !== "undefined" && typeof BroadcastChannel !== "undefined") {
  try {
    const syncChannel = new BroadcastChannel("kerso_waras_realtime_sync");
    syncChannel.onmessage = () => {
      useApotekStore.persist.rehydrate();
    };
  } catch {}
}

