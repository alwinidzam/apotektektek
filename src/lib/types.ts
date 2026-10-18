export type DrugClass =
  | "BEBAS"
  | "BEBAS_TERBATAS"
  | "KERAS"
  | "PREKURSOR"
  | "OOT"
  | "PSIKOTROPIKA"
  | "NARKOTIKA";

export type BaseUnit =
  | "TABLET"
  | "KAPSUL"
  | "KAPLET"
  | "BOTOL"
  | "TUBE"
  | "SACHET"
  | "AMPUL"
  | "VIAL"
  | "POT"
  | "STRIP"
  | "BOX";

export interface BatchItem {
  id: string;
  productId: string;
  batchNumber: string;
  expiryDate: string; // ISO String
  purchasePriceHNA: number;
  sellingPrice: number;
  currentStock: number; // in base units
  reservedStock: number;
  locationRack: string;
}

export interface UnitConversion {
  unitName: string;
  multiplier: number; // Multiplier to base unit
  pricePerUnit: number;
}

export type UserRole =
  | "SUPER_ADMIN"
  | "OWNER"
  | "KARYAWAN_KASIR"
  | "KARYAWAN_APOTEKER";

export interface UserProfile {
  id: string;
  name: string;
  username?: string;
  email?: string;
  role: UserRole;
  title: string;
  avatar: string;
  sipaNumber?: string;
}

export type StorageCondition =
  | "ROOM_TEMP"
  | "COOL"
  | "CHILLER_2_8"
  | "FREEZER";

export interface Product {
  id: string;
  kfaCode?: string; // Kamus Farmasi Alkes (9-digit SatuSehat)
  barcode: string;
  name: string;
  genericName: string;
  manufacturer: string;
  drugClass: DrugClass;
  isHighAlert: boolean;
  isLasa: boolean;
  tallManName?: string;
  baseUnit: BaseUnit;
  unitConversions: UnitConversion[];
  hpp: number; // Harga Pokok Penjualan / HNA Netto (strictly before PPN & discount)
  markupPercent: number; // Markup margin % (e.g. 25%)
  sellingPrice: number; // Harga Jual Apotek (HJA = HPP * (1 + markup% / 100))
  bpomNie?: string; // Nomor Izin Edar BPOM
  storageCondition?: StorageCondition;
  shelfLocation?: string;
  het?: number; // Harga Eceran Tertinggi Kemenkes
  minStockAlert: number;
  maxStockAlert: number;
  batches: BatchItem[];
  contraindications?: string[];
  maxDailyDoseAdultMg?: number;
  description?: string;
  defaultSigna?: string; // Aturan pakai default untuk Etiket Otomatis (misal: "3 x sehari 1 Tablet (Sesudah Makan)")
  usageType?: "OBAT_DALAM" | "OBAT_LUAR";
}

export interface CartItem {
  cartItemId: string;
  product: Product;
  selectedBatch: BatchItem;
  quantity: number;
  selectedUnit: string;
  unitMultiplier: number;
  unitPrice: number;
  subtotal: number;
  signaUsage?: string; // Aturan pakai etiket otomatis per item
  isRacikan?: boolean;
  racikanData?: CompoundingRecipe;
}

export interface CompoundingIngredient {
  productId: string;
  productName: string;
  selectedBatchId: string;
  strengthPerTabletMg: number;
  prescribedDosePerPacketMg?: number; // for DTD
  totalPrescribedDoseMg?: number; // for Non-DTD
  requiredQuantityTablets: number;
  cost: number;
}

export interface CompoundingRecipe {
  id: string;
  recipeName: string;
  method: "DTD" | "NON_DTD";
  packetCount: number;
  dosageSigna: string;
  patientAgeYears?: number;
  patientWeightKg?: number;
  patientName: string;
  ingredients: CompoundingIngredient[];
  packagingType: "KAPSUL" | "PUYER_PERKAMEN" | "POT_SALEP" | "BOTOL_SIRUP";
  packagingCost: number; // Embalase
  tuslahFee: number; // Jasa Farmasi
  subtotalIngredients: number;
  grandTotal: number;
  beyondUseDate: string; // BUD
  notes?: string;
}

export type PaymentMethodType =
  | "CASH"
  | "QRIS_DYNAMIC"
  | "EDC_DEBIT"
  | "EDC_CREDIT"
  | "TRANSFER_BANK"
  | "INSURANCE_BPJS"
  | "PIUTANG"
  | "SPLIT";

export interface Transaction {
  id: string;
  invoiceNumber: string;
  timestamp: string;
  cashierName: string;
  customerName: string;
  customerPhone?: string;
  doctorName?: string;
  doctorSip?: string;
  prescriptionNumber?: string;
  transactionMode?: "SWAMEDIKASI" | "RESEP_DOKTER";
  isPrescriptionVerified?: boolean;
  items: CartItem[];
  subtotal: number;
  tuslahTotal: number;
  embalaseTotal: number;
  roundingAmount: number;
  grandTotal: number;
  paymentMethod: PaymentMethodType;
  paidAmount: number;
  changeAmount: number;
  satusehatDispenseId?: string;
  isSynced: boolean;
  isOfflineCached?: boolean;
  responseLatencyMs?: number;
}

export interface HeldBill {
  id: string;
  heldAt: string;
  customerName: string;
  items: CartItem[];
  note?: string;
}

export interface SPOrder {
  id: string;
  spNumber: string;
  type: "REGULER" | "PREKURSOR" | "OOT" | "PSIKOTROPIKA" | "NARKOTIKA";
  pbfName: string;
  pbfAddress: string;
  date: string;
  apjName: string;
  apjSipa: string;
  apotekSia: string;
  items: {
    productName: string;
    genericName: string;
    form: string;
    quantity: number;
    unit: string;
    note?: string;
  }[];
  status: "DRAFT" | "SUBMITTED" | "FULFILLED";
}

export interface SipnapReportRow {
  no: number;
  kfaCode: string;
  productName: string;
  dosageForm: string;
  unit: string;
  initialStock: number;
  incomingQty: number;
  incomingInvoiceNo: string;
  incomingPbfName: string;
  outgoingPrescriptionQty: number;
  prescriptionNo: string;
  prescriptionDate: string;
  doctorName: string;
  doctorSip: string;
  patientName: string;
  patientAddress: string;
  destructionQty: number;
  finalStock: number;
}

export type ShiftStatus = "OPEN" | "CLOSED";

export type PettyCashCategory =
  | "COLD_CHAIN_ICE"
  | "RECEIPT_PAPER"
  | "COURIER_FEE"
  | "CASH_FLOAT_TOPUP"
  | "CLEANING_SUPPLIES"
  | "EMERGENCY_EXPENSE"
  | "OTHER";

export interface PettyCashMovement {
  id: string;
  shiftId: string;
  timestamp: string;
  type: "PAID_IN" | "PAID_OUT";
  category: PettyCashCategory;
  categoryLabel: string;
  amount: number;
  reason: string;
  recipientOrSource: string;
  recordedBy: string;
}

export interface RupiahDenominationCount {
  bills: {
    100000: number;
    50000: number;
    20000: number;
    10000: number;
    5000: number;
    2000: number;
    1000: number;
  };
  coins: {
    1000: number;
    500: number;
    200: number;
    100: number;
  };
  totalBills: number;
  totalCoins: number;
  grandTotal: number;
}

export type DiscrepancyReasonCategory =
  | "NONE_EXACT_MATCH" // Kas Klop
  | "WRONG_CHANGE" // Salah Hitung Kembalian Pasien Tunai
  | "COIN_ROUNDING" // Pembulatan Uang Receh / Koin
  | "OFFLINE_RECEIPT" // Struk Penjualan Tertinggal / Belum Terinput
  | "DAMAGED_OR_COUNTERFEIT" // Uang Rusak Sobek / Ditolak
  | "PETTY_CASH_MISMATCH" // Selisih Bon Kas Kecil (Petty Cash)
  | "CASHIER_OVERPAY" // Kesalahan Input Nominal Bayar
  | "OTHER"; // Keterangan Khusus

export interface ReconciliationSupervisorAuth {
  isAuthorized: boolean;
  supervisorId: string;
  supervisorName: string;
  supervisorRole: UserRole;
  authMethod: "SUPERVISOR_PIN" | "PASSWORD_OVERRIDE";
  authorizedAt: string;
  approvalNote?: string;
}

export type DiscrepancySettlementAction =
  | "APPROVED_BY_OWNER"
  | "CASHIER_LIABILITY"
  | "PHARMACY_ABSORBED"
  | "PENDING_INVESTIGATION";

export interface ShiftHandoverLog {
  id: string;
  previousShiftId: string;
  nextShiftId: string;
  previousCashierId: string;
  previousCashierName: string;
  nextCashierId: string;
  nextCashierName: string;
  handoverTime: string;
  physicalCashCounted: number;
  cashDroppedToVault: number; // Setoran ke brankas apotek
  openingCashForNextShift: number; // Modal uang kembalian diserahkan ke kasir berikutnya
  handoverNote?: string;
  confirmedWithNextCashierPin: boolean;
  supervisorName?: string;
}

export interface CashierShift {
  id: string;
  shiftNumber: 1 | 2 | 3;
  terminalId: string;
  cashierId: string;
  cashierName: string;
  startTime: string;
  endTime: string | null;
  status: ShiftStatus;
  openingCash: number;
  cashSalesTotal: number;
  qrisSalesTotal: number;
  edcSalesTotal: number;
  nonCashSalesTotal?: number;
  transferSalesTotal?: number;
  bpjsSalesTotal?: number;
  piutangSalesTotal?: number;
  cashInTotal: number;
  cashOutTotal: number;
  refundTotal: number;
  totalTransactionsCount: number;
  itemsSoldTotal?: number;
  actualCashCount: number | null; // Blind cash count
  expectedCashTotal: number | null; // Calculated upon closing
  cashDifference: number | null; // actual - expected
  closingNote?: string;
  denominationCount?: RupiahDenominationCount;
  pettyCashMovements?: PettyCashMovement[];
  xReportsCount?: number;
  lastXReportTime?: string;
  isAuditedByOwner: boolean;
  auditStatus?: "PENDING" | "APPROVED" | "DISCREPANCY_FLAGGED";
  auditNote?: string;
  auditedBy?: string;
  auditedAt?: string;
  // Discrepancy & Supervisor Login Authorization
  discrepancyCategory?: DiscrepancyReasonCategory;
  discrepancyReasonText?: string;
  supervisorAuth?: ReconciliationSupervisorAuth;
  settlementAction?: DiscrepancySettlementAction;
  // Handover Metadata
  handoverLog?: ShiftHandoverLog;
}

export interface PharmacyProfile {
  name: string;
  tagline: string;
  address: string;
  rtRw: string;
  village: string;
  district: string;
  regency: string;
  province: string;
  postalCode: string;
  phone: string;
  whatsapp: string;
  siaNumber: string;
  sipaNumber: string;
  apjName: string;
  ownerName: string;
}

export const APOTEK_KERSO_WARAS_INFO: PharmacyProfile = {
  name: "Apotek Kerso Waras",
  tagline: "Melayani dengan Sepenuh Hati untuk Kesehatan Anda",
  address: "Jl. Raya Jepara-Bugel, RT.04/RW.01, Desa Kerso",
  rtRw: "RT.04/RW.01",
  village: "Desa Kerso",
  district: "Kec. Kedung",
  regency: "Kabupaten Jepara",
  province: "Jawa Tengah",
  postalCode: "59463",
  phone: "(0291) 751-2345",
  whatsapp: "0812-3456-7890",
  siaNumber: "440/0912/DPMPTSP/JEPARA/2021",
  sipaNumber: "19930812/SIPA_33.20/2022/2001",
  apjName: "apt. Farhan Pratama, S.Farm",
  ownerName: "dr. H. Bambang Soedibyo, Sp.Rad",
};

// ==========================================
// REVENUE ANALYTICS & TIME-SERIES MODELS
// ==========================================

export interface ShiftRevenueMetric {
  shiftId: string;
  shiftNumber: 1 | 2 | 3;
  shiftLabel: string;
  cashierName: string;
  terminalId: string;
  startTime: string;
  endTime: string;
  totalGrossSales: number;
  discountsTotal: number;
  netSales: number;
  totalTransactions: number;
  averageOrderValue: number; // Basket size (AOV)
  itemsPerTransaction: number;
  cashCollected: number;
  qrisCollected: number;
  edcCollected: number;
  cashVariance: number;
  status: ShiftStatus;
}

export interface HourlyTrafficPoint {
  hourString: string; // "08:00", "09:00", ...
  hourNumber: number; // 8 - 22
  totalOmzet: number;
  transactionCount: number;
  isPeakHour: boolean;
}

export interface DailyRevenueMetric {
  date: string; // YYYY-MM-DD
  dayNameIndo: string; // "Senin", "Selasa", dll.
  grossRevenue: number;
  netRevenue: number;
  totalHPP: number;
  grossProfit: number;
  transactionCount: number;
  targetDaily: number;
  targetAchievedPercent: number;
  movingAverage7Day: number;
}

export interface WeeklyRevenueMetric {
  weekNumber: 1 | 2 | 3 | 4 | 5;
  weekLabel: string; // "Minggu I (1-7)", dll.
  startDate: string;
  endDate: string;
  netRevenue: number;
  grossProfit: number;
  transactionCount: number;
  growthWoWPercent: number;
  busiestDay: string;
}

export interface CategoryRevenueShare {
  categoryId: "ETHICAL" | "OTC" | "RACIKAN" | "ALKES" | "SUPLEMEN";
  label: string;
  revenue: number;
  cogs: number;
  grossProfit: number;
  profitMarginPercent: number;
  revenueSharePercent: number;
  itemCountSold: number;
}

export interface PaymentMethodBreakdown {
  method: PaymentMethodType;
  label: string;
  totalAmount: number;
  transactionCount: number;
  sharePercent: number;
  mdrFeeEstimated: number;
  netSettlementAmount: number;
}

// ==========================================
// FORMAL MONTHLY FINANCIAL STATEMENT (P&L SAK EMKM)
// ==========================================

export interface PharmacyPnLRevenueSection {
  salesOTC: number;
  salesEthical: number;
  salesAlkes: number;
  salesSupplements: number;
  feeTuslahJasaResep: number;
  feeEmbalaseWadah: number;
  grossRevenue: number;
  discountsSales: number;
  returnsSales: number;
  netRevenue: number;
}

export interface PharmacyPnLCOGSSection {
  beginningInventory: number;
  purchasesPBFGross: number;
  purchasesDiscountsPBF: number;
  purchasesReturnsPBF: number;
  netPurchasesPBF: number;
  goodsAvailableForSale: number;
  endingInventory: number;
  totalCOGS: number;
}

export interface PharmacyPnLOPEXSection {
  salariesAPJ: number;
  salariesTTK: number;
  salariesCashiers: number;
  staffAllowances: number;
  totalPersonnelCost: number;

  electricityPLN: number;
  waterPDAM: number;
  internetAndSoftwareSubscription: number;
  totalUtilitiesCost: number;

  facilityRentAmortization: number;
  regulatorySiaSipaAmortization: number;
  totalOccupancyCost: number;

  packagingBagsAndPots: number;
  thermalPaperAndLabels: number;
  totalPackagingCost: number;

  coldChainIceExpenses: number;
  courierEmergencyPBFExpenses: number;
  miscellaneousPettyCashExpenses: number;
  totalPettyCashMovementCost: number;

  totalOPEX: number;
}

export interface PharmacyPnLStatement {
  id: string;
  periodYear: number;
  periodMonth: number; // 1 - 12
  periodMonthName: string; // "Oktober 2026"
  createdAt: string;

  revenue: PharmacyPnLRevenueSection;
  cogs: PharmacyPnLCOGSSection;
  grossProfit: number;
  grossMarginPercent: number;

  opex: PharmacyPnLOPEXSection;
  ebitdaOperatingProfit: number;
  operatingMarginPercent: number;

  otherIncome: number;
  otherExpensesMDR: number;
  netOtherGainLoss: number;

  ebtPreTaxProfit: number;
  incomeTaxUMKM: number; // PPh Final 0.5% (PP 55/2022)
  netProfit: number;
  netMarginPercent: number;

  // Cash Reconciliation & Audit
  physicalCashDeposited: number;
  digitalFundsBankSettled: number;
  accumulatedCashVariance: number;

  // Signatory & Compliance
  preparedByStaffName: string;
  verifiedByApjName: string;
  verifiedByApjSipa: string;
  approvedByOwnerName: string;
  status: "DRAFT" | "SUBMITTED" | "APPROVED_BY_OWNER";
  approvedAt?: string;
  auditNotes?: string;
}

// ============================================================================
// STANDAR NFR & RBAC 3-LEVEL: PURCHASE ORDER (PO), STOCK OPNAME & BARANG MASUK
// ============================================================================

export type PurchaseOrderStatus =
  | "MENUNGGU_PERSETUJUAN"
  | "DISETUJUI_PEMILIK"
  | "DITOLAK"
  | "SELESAI_DITERIMA";

export interface PurchaseOrderItem {
  productId: string;
  productName: string;
  unit: string;
  currentStock: number;
  orderQty: number;
  estimatedUnitCost: number;
  subtotal: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierName: string;
  createdAt: string;
  createdBy: string;
  createdByRole: string;
  status: PurchaseOrderStatus;
  isAutoGenerated?: boolean;
  triggerReason?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedReason?: string;
  receivedAt?: string;
  receivedBy?: string;
  items: PurchaseOrderItem[];
  totalEstimatedCost: number;
  notes?: string;
}

export interface StockOpnameRecord {
  id: string;
  timestamp: string;
  productId: string;
  productName: string;
  batchId: string;
  batchNumber: string;
  systemStock: number;
  physicalStock: number;
  difference: number;
  reason: string;
  executedBy: string;
}

export interface IncomingGoodsRecord {
  id: string;
  timestamp: string;
  invoiceNumber: string;
  supplierName: string;
  productId: string;
  productName: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  purchasePriceHNA: number;
  sellingPrice: number;
  locationRack: string;
  recordedBy: string;
}


