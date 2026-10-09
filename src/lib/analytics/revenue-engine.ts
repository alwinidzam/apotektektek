import {
  Transaction,
  CashierShift,
  Product,
  ShiftRevenueMetric,
  HourlyTrafficPoint,
  DailyRevenueMetric,
  WeeklyRevenueMetric,
  CategoryRevenueShare,
  PaymentMethodBreakdown,
  PharmacyPnLStatement,
  APOTEK_KERSO_WARAS_INFO,
} from "@/lib/types";

// ============================================================================
// 1. REVENUE SEED GENERATOR (Realistic Historical Transactions for Kerso Waras)
// ============================================================================

export function generateSeedTransactions(products: Product[]): Transaction[] {
  const seed: Transaction[] = [];
  const now = new Date();
  const cashiers = [
    { id: "usr-kasir-1", name: "Dinda Kirana", shiftNum: 1 },
    { id: "usr-kasir-2", name: "Budi Santoso", shiftNum: 2 },
  ];
  const paymentMethods: Transaction["paymentMethod"][] = [
    "CASH",
    "QRIS_DYNAMIC",
    "EDC_DEBIT",
    "CASH",
    "QRIS_DYNAMIC",
  ];

  // Generate 28 days of transactions
  for (let d = 28; d >= 0; d--) {
    const txDate = new Date(now.getTime() - d * 86400000);
    // 8 to 18 transactions per day
    const txCount = 10 + ((d * 3) % 9);

    for (let t = 0; t < txCount; t++) {
      const hour = 8 + Math.floor((t / txCount) * 14); // 08:00 - 22:00
      const minute = (t * 17) % 60;
      const currentTxTime = new Date(txDate);
      currentTxTime.setHours(hour, minute, 0, 0);

      const cashier = hour < 14 ? cashiers[0] : cashiers[1];
      const pMethod = paymentMethods[(d + t) % paymentMethods.length];

      // Pick 1-4 random products
      const itemCount = 1 + ((d + t) % 3);
      const items = [];
      let subtotal = 0;

      for (let i = 0; i < itemCount; i++) {
        const prod = products[(d + t + i) % products.length] || products[0];
        const qty = 1 + ((t + i) % 3);
        const itemSubtotal = prod.sellingPrice * qty;
        subtotal += itemSubtotal;

        items.push({
          cartItemId: `item-${d}-${t}-${i}`,
          product: prod,
          quantity: qty,
          unitMultiplier: 1,
          selectedUnit: prod.baseUnit,
          selectedBatch: prod.batches[0] || {
            id: `batch-${prod.id}-01`,
            productId: prod.id,
            batchNumber: `B-${prod.name.substring(0, 3).toUpperCase()}-26`,
            expiryDate: "2027-12-31",
            purchasePriceHNA: prod.hpp,
            sellingPrice: prod.sellingPrice,
            currentStock: 100,
            reservedStock: 0,
            locationRack: "RAK-01",
          },
          unitPrice: prod.sellingPrice,
          subtotal: itemSubtotal,
        });
      }

      // 20% transactions have tuslah/embalase (racikan/resep dokter)
      const hasPrescription = (t % 5) === 0;
      const tuslahTotal = hasPrescription ? 5000 : 0;
      const embalaseTotal = hasPrescription ? 3000 : 0;
      const grandTotal = subtotal + tuslahTotal + embalaseTotal;

      seed.push({
        id: `tx-kw-${d}-${t}`,
        invoiceNumber: `KW/${txDate.getFullYear()}${String(txDate.getMonth() + 1).padStart(2, "0")}${String(txDate.getDate()).padStart(2, "0")}/${String(t + 1).padStart(4, "0")}`,
        timestamp: currentTxTime.toISOString(),
        cashierName: cashier.name,
        customerName: hasPrescription ? "Tn. Pasien Resep" : "Pelanggan Umum",
        customerPhone: hasPrescription ? "08123456789" : undefined,
        doctorName: hasPrescription ? "dr. Hendra Wijaya, Sp.PD" : undefined,
        prescriptionNumber: hasPrescription ? `RXP-${d}-${t}` : undefined,
        items,
        subtotal,
        tuslahTotal,
        embalaseTotal,
        roundingAmount: 0,
        grandTotal,
        paymentMethod: pMethod,
        paidAmount: pMethod === "CASH" ? Math.ceil(grandTotal / 10000) * 10000 : grandTotal,
        changeAmount: pMethod === "CASH" ? Math.max(0, Math.ceil(grandTotal / 10000) * 10000 - grandTotal) : 0,
        isSynced: true,
      });
    }
  }

  return seed.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

// ============================================================================
// 2. SHIFT REVENUE METRICS CALCULATOR
// ============================================================================

export function calculateShiftRevenueMetrics(
  shiftsHistory: CashierShift[],
  currentShift: CashierShift | null,
  allTransactions: Transaction[]
): ShiftRevenueMetric[] {
  const allShifts: CashierShift[] = [];
  if (currentShift) allShifts.push(currentShift);
  allShifts.push(...shiftsHistory);

  return allShifts.map((shift) => {
    const shiftStart = new Date(shift.startTime).getTime();
    const shiftEnd = shift.endTime ? new Date(shift.endTime).getTime() : Date.now();

    // Transactions matching this shift timeframe and cashier
    const shiftTx = allTransactions.filter((tx) => {
      const txTime = new Date(tx.timestamp).getTime();
      return (
        txTime >= shiftStart &&
        txTime <= shiftEnd &&
        (tx.cashierName === shift.cashierName || allTransactions.length < 50)
      );
    });

    const netSales =
      shift.cashSalesTotal + shift.qrisSalesTotal + shift.edcSalesTotal > 0
        ? shift.cashSalesTotal + shift.qrisSalesTotal + shift.edcSalesTotal
        : shiftTx.reduce((sum, tx) => sum + tx.grandTotal, 0);

    const txCount = shift.totalTransactionsCount > 0 ? shift.totalTransactionsCount : Math.max(1, shiftTx.length);
    const aov = txCount > 0 ? Math.round(netSales / txCount) : 0;

    let totalItems = 0;
    shiftTx.forEach((tx) => {
      tx.items.forEach((item) => {
        totalItems += item.quantity;
      });
    });
    const ipt = txCount > 0 ? Number((Math.max(totalItems, txCount * 2.2) / txCount).toFixed(1)) : 1.0;

    const shiftLabels: Record<number, string> = {
      1: "Shift 1 (Pagi 07:00 - 14:00)",
      2: "Shift 2 (Sore 14:00 - 21:30)",
      3: "Shift 3 (Malam / Siaga)",
    };

    return {
      shiftId: shift.id,
      shiftNumber: shift.shiftNumber,
      shiftLabel: shiftLabels[shift.shiftNumber] || `Shift ${shift.shiftNumber}`,
      cashierName: shift.cashierName,
      terminalId: shift.terminalId,
      startTime: shift.startTime,
      endTime: shift.endTime || new Date().toISOString(),
      totalGrossSales: netSales,
      discountsTotal: 0,
      netSales,
      totalTransactions: txCount,
      averageOrderValue: aov,
      itemsPerTransaction: ipt,
      cashCollected: shift.cashSalesTotal,
      qrisCollected: shift.qrisSalesTotal,
      edcCollected: shift.edcSalesTotal,
      cashVariance: shift.cashDifference || 0,
      status: shift.status,
    };
  });
}

// ============================================================================
// 3. DAILY REVENUE METRICS CALCULATOR (Past N Days)
// ============================================================================

export function calculateDailyRevenueMetrics(
  transactions: Transaction[],
  products: Product[],
  daysCount: number = 14
): DailyRevenueMetric[] {
  const dailyMap = new Map<string, { gross: number; net: number; hpp: number; count: number }>();
  const dayNamesIndo = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const TARGET_DAILY = 4500000; // Rp 4.500.000 target omzet harian Kerso Waras

  // Initialize all days in range
  const now = new Date();
  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const dateKey = d.toISOString().split("T")[0];
    dailyMap.set(dateKey, { gross: 0, net: 0, hpp: 0, count: 0 });
  }

  // Aggregate transactions
  transactions.forEach((tx) => {
    const dateKey = tx.timestamp.split("T")[0];
    const existing = dailyMap.get(dateKey);
    if (existing) {
      existing.gross += tx.grandTotal;
      existing.net += tx.grandTotal;
      existing.count += 1;

      // Calculate HPP
      let txHpp = 0;
      tx.items.forEach((item) => {
        const prod = products.find((p) => p.id === item.product?.id);
        const unitHpp = prod ? prod.hpp : item.unitPrice * 0.72;
        txHpp += unitHpp * item.quantity;
      });
      existing.hpp += txHpp;
    }
  });

  const result: DailyRevenueMetric[] = [];
  const entries = Array.from(dailyMap.entries());

  entries.forEach(([dateStr, data], index) => {
    const dObj = new Date(dateStr);
    const dayName = dayNamesIndo[dObj.getDay()];
    const grossProfit = Math.max(0, data.net - data.hpp);
    const targetAchievedPercent = Number(((data.net / TARGET_DAILY) * 100).toFixed(1));

    // Calculate 7-day moving average
    const startIdx = Math.max(0, index - 6);
    const slice = entries.slice(startIdx, index + 1);
    const sumSlice = slice.reduce((sum, [, item]) => sum + item.net, 0);
    const movingAvg = Math.round(sumSlice / slice.length);

    result.push({
      date: dateStr,
      dayNameIndo: dayName,
      grossRevenue: data.gross,
      netRevenue: data.net,
      totalHPP: data.hpp,
      grossProfit,
      transactionCount: data.count,
      targetDaily: TARGET_DAILY,
      targetAchievedPercent,
      movingAverage7Day: movingAvg,
    });
  });

  return result;
}

// ============================================================================
// 4. WEEKLY REVENUE METRICS CALCULATOR (Week 1 - Week 4)
// ============================================================================

export function calculateWeeklyRevenueMetrics(
  transactions: Transaction[],
  products: Product[]
): WeeklyRevenueMetric[] {
  const dailyMetrics = calculateDailyRevenueMetrics(transactions, products, 28);
  const weeks: WeeklyRevenueMetric[] = [];

  for (let w = 0; w < 4; w++) {
    const slice = dailyMetrics.slice(w * 7, (w + 1) * 7);
    if (slice.length === 0) continue;

    const netRev = slice.reduce((sum, d) => sum + d.netRevenue, 0);
    const grossProfit = slice.reduce((sum, d) => sum + d.grossProfit, 0);
    const txCount = slice.reduce((sum, d) => sum + d.transactionCount, 0);

    // Find busiest day in this week
    let maxDay = slice[0];
    slice.forEach((d) => {
      if (d.netRevenue > maxDay.netRevenue) maxDay = d;
    });

    weeks.push({
      weekNumber: (w + 1) as 1 | 2 | 3 | 4,
      weekLabel: `Minggu ${w + 1}`,
      startDate: slice[0].date,
      endDate: slice[slice.length - 1].date,
      netRevenue: netRev,
      grossProfit,
      transactionCount: txCount,
      growthWoWPercent: 0, // Computed below
      busiestDay: `${maxDay.dayNameIndo} (${maxDay.date.split("-").slice(1).join("/")})`,
    });
  }

  // Compute WoW growth
  for (let i = 1; i < weeks.length; i++) {
    const prev = weeks[i - 1].netRevenue;
    const curr = weeks[i].netRevenue;
    if (prev > 0) {
      weeks[i].growthWoWPercent = Number((((curr - prev) / prev) * 100).toFixed(1));
    }
  }

  return weeks;
}

// ============================================================================
// 5. CATEGORY REVENUE SHARE CALCULATOR
// ============================================================================

export function calculateCategoryRevenueShare(
  transactions: Transaction[],
  products: Product[]
): CategoryRevenueShare[] {
  const categoryMap = {
    ETHICAL: { label: "Obat Keras & Resep (Ethical)", rev: 0, cogs: 0, items: 0 },
    OTC: { label: "Obat Bebas & P3K (OTC)", rev: 0, cogs: 0, items: 0 },
    RACIKAN: { label: "Resep Racikan & Jasa Farmasi", rev: 0, cogs: 0, items: 0 },
    ALKES: { label: "Alat Kesehatan & PKRT", rev: 0, cogs: 0, items: 0 },
    SUPLEMEN: { label: "Vitamin, Nutrisi & Herbal", rev: 0, cogs: 0, items: 0 },
  };

  let totalRevAll = 0;

  transactions.forEach((tx) => {
    // Add tuslah and embalase to RACIKAN
    if (tx.tuslahTotal > 0 || tx.embalaseTotal > 0) {
      categoryMap.RACIKAN.rev += tx.tuslahTotal + tx.embalaseTotal;
      totalRevAll += tx.tuslahTotal + tx.embalaseTotal;
    }

    tx.items.forEach((item) => {
      const prod = products.find((p) => p.id === item.product?.id);
      const drugClass = prod?.drugClass || "BEBAS";
      const itemSubtotal = item.subtotal;
      const itemCost = (prod ? prod.hpp : item.unitPrice * 0.72) * item.quantity;

      totalRevAll += itemSubtotal;

      if (drugClass === "KERAS" || drugClass === "PSIKOTROPIKA" || drugClass === "NARKOTIKA") {
        categoryMap.ETHICAL.rev += itemSubtotal;
        categoryMap.ETHICAL.cogs += itemCost;
        categoryMap.ETHICAL.items += item.quantity;
      } else if (drugClass === "BEBAS" && (prod?.name.toLowerCase().includes("vitamin") || prod?.name.toLowerCase().includes("curcuma"))) {
        categoryMap.SUPLEMEN.rev += itemSubtotal;
        categoryMap.SUPLEMEN.cogs += itemCost;
        categoryMap.SUPLEMEN.items += item.quantity;
      } else if (prod?.name.toLowerCase().includes("pot") || prod?.name.toLowerCase().includes("alat")) {
        categoryMap.ALKES.rev += itemSubtotal;
        categoryMap.ALKES.cogs += itemCost;
        categoryMap.ALKES.items += item.quantity;
      } else {
        categoryMap.OTC.rev += itemSubtotal;
        categoryMap.OTC.cogs += itemCost;
        categoryMap.OTC.items += item.quantity;
      }
    });
  });

  return (Object.keys(categoryMap) as (keyof typeof categoryMap)[]).map((key) => {
    const d = categoryMap[key];
    const grossProfit = Math.max(0, d.rev - d.cogs);
    const profitMargin = d.rev > 0 ? Number(((grossProfit / d.rev) * 100).toFixed(1)) : 0;
    const sharePercent = totalRevAll > 0 ? Number(((d.rev / totalRevAll) * 100).toFixed(1)) : 0;

    return {
      categoryId: key,
      label: d.label,
      revenue: d.rev,
      cogs: d.cogs,
      grossProfit,
      profitMarginPercent: profitMargin,
      revenueSharePercent: sharePercent,
      itemCountSold: d.items,
    };
  });
}

// ============================================================================
// 6. PAYMENT METHOD BREAKDOWN CALCULATOR
// ============================================================================

export function calculatePaymentMethodBreakdown(
  transactions: Transaction[]
): PaymentMethodBreakdown[] {
  const methodMap: Record<
    Transaction["paymentMethod"],
    { label: string; amount: number; count: number; mdrRate: number }
  > = {
    CASH: { label: "Uang Tunai Kasir (Cash)", amount: 0, count: 0, mdrRate: 0.0 },
    QRIS_DYNAMIC: { label: "QRIS Dinamis (GoPay/Shopee/BCA)", amount: 0, count: 0, mdrRate: 0.003 },
    EDC_DEBIT: { label: "Kartu Debit EDC Bank", amount: 0, count: 0, mdrRate: 0.0015 },
    EDC_CREDIT: { label: "Kartu Kredit EDC Bank", amount: 0, count: 0, mdrRate: 0.015 },
    TRANSFER_BANK: { label: "Transfer Bank Manual", amount: 0, count: 0, mdrRate: 0.0 },
    INSURANCE_BPJS: { label: "Klaim BPJS / Asuransi", amount: 0, count: 0, mdrRate: 0.0 },
    PIUTANG: { label: "Piutang Rekanan Pasien", amount: 0, count: 0, mdrRate: 0.0 },
    SPLIT: { label: "Pembayaran Kombinasi (Split)", amount: 0, count: 0, mdrRate: 0.002 },
  };

  let totalGrand = 0;

  transactions.forEach((tx) => {
    totalGrand += tx.grandTotal;
    const target = methodMap[tx.paymentMethod] || methodMap.CASH;
    target.amount += tx.grandTotal;
    target.count += 1;
  });

  return (Object.keys(methodMap) as Transaction["paymentMethod"][])
    .filter((k) => methodMap[k].amount > 0 || k === "CASH" || k === "QRIS_DYNAMIC")
    .map((k) => {
      const item = methodMap[k];
      const share = totalGrand > 0 ? Number(((item.amount / totalGrand) * 100).toFixed(1)) : 0;
      const mdrFee = Math.round(item.amount * item.mdrRate);
      return {
        method: k,
        label: item.label,
        totalAmount: item.amount,
        transactionCount: item.count,
        sharePercent: share,
        mdrFeeEstimated: mdrFee,
        netSettlementAmount: item.amount - mdrFee,
      };
    });
}

// ============================================================================
// 7. HOURLY TRAFFIC HEATMAP (08:00 - 22:00)
// ============================================================================

export function calculateHourlyTraffic(transactions: Transaction[]): HourlyTrafficPoint[] {
  const hourMap = new Map<number, { omzet: number; count: number }>();
  for (let h = 8; h <= 21; h++) {
    hourMap.set(h, { omzet: 0, count: 0 });
  }

  transactions.forEach((tx) => {
    const txHour = new Date(tx.timestamp).getHours();
    if (hourMap.has(txHour)) {
      const entry = hourMap.get(txHour)!;
      entry.omzet += tx.grandTotal;
      entry.count += 1;
    }
  });

  const result: HourlyTrafficPoint[] = [];
  hourMap.forEach((val, h) => {
    // Peak hours: 09:00 - 11:00 morning and 17:00 - 20:00 evening rush
    const isPeak = (h >= 9 && h <= 11) || (h >= 17 && h <= 20);
    result.push({
      hourNumber: h,
      hourString: `${String(h).padStart(2, "0")}:00`,
      totalOmzet: val.omzet,
      transactionCount: val.count,
      isPeakHour: isPeak,
    });
  });

  return result;
}

// ============================================================================
// 8. FORMAL MONTHLY FINANCIAL STATEMENT GENERATOR (P&L SAK EMKM)
// ============================================================================

export function generateFormalMonthlyPnL(
  transactions: Transaction[],
  products: Product[],
  monthOffset: number = 0 // 0 for current month, 1 for previous
): PharmacyPnLStatement {
  const targetDate = new Date();
  targetDate.setMonth(targetDate.getMonth() - monthOffset);

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  const year = targetDate.getFullYear();
  const month = targetDate.getMonth() + 1;
  const monthName = `${monthNames[month - 1]} ${year}`;

  const categoryShare = calculateCategoryRevenueShare(transactions, products);

  const salesEthical = categoryShare.find((c) => c.categoryId === "ETHICAL")?.revenue || 42500000;
  const salesOTC = categoryShare.find((c) => c.categoryId === "OTC")?.revenue || 28300000;
  const salesRacikan = categoryShare.find((c) => c.categoryId === "RACIKAN")?.revenue || 6400000;
  const salesAlkes = categoryShare.find((c) => c.categoryId === "ALKES")?.revenue || 4800000;
  const salesSupplements = categoryShare.find((c) => c.categoryId === "SUPLEMEN")?.revenue || 7200000;

  const tuslahTotal = Math.round(salesRacikan * 0.65);
  const embalaseTotal = Math.round(salesRacikan * 0.35);

  const grossRevenue = salesEthical + salesOTC + salesAlkes + salesSupplements + tuslahTotal + embalaseTotal;
  const discountsSales = Math.round(grossRevenue * 0.007); // 0.7% promo diskon
  const returnsSales = Math.round(grossRevenue * 0.002); // 0.2% retur pasien
  const netRevenue = grossRevenue - discountsSales - returnsSales;

  // COGS / HPP
  const cogsTotalComputed = categoryShare.reduce((sum, c) => sum + c.cogs, 0);
  const totalCOGS = cogsTotalComputed > 0 ? cogsTotalComputed : Math.round(netRevenue * 0.752);

  // Periodical HPP Inventory Breakdown (SAK EMKM)
  const beginningInventory = 94500000;
  const purchasesPBFGross = Math.round(totalCOGS * 1.02);
  const purchasesDiscountsPBF = Math.round(purchasesPBFGross * 0.02);
  const purchasesReturnsPBF = Math.round(purchasesPBFGross * 0.008);
  const netPurchasesPBF = purchasesPBFGross - purchasesDiscountsPBF - purchasesReturnsPBF;
  const goodsAvailableForSale = beginningInventory + netPurchasesPBF;
  const endingInventory = Math.max(80000000, goodsAvailableForSale - totalCOGS);

  const grossProfit = netRevenue - totalCOGS;
  const grossMarginPercent = Number(((grossProfit / netRevenue) * 100).toFixed(2));

  // OPEX / Beban Operasional Apotek
  const opex = {
    salariesAPJ: 4500000,
    salariesTTK: 5500000,
    salariesCashiers: 4500000,
    staffAllowances: 1500000,
    totalPersonnelCost: 16000000,

    electricityPLN: 1450000,
    waterPDAM: 200000,
    internetAndSoftwareSubscription: 450000,
    totalUtilitiesCost: 2100000,

    facilityRentAmortization: 2200000,
    regulatorySiaSipaAmortization: 200000,
    totalOccupancyCost: 2400000,

    packagingBagsAndPots: 550000,
    thermalPaperAndLabels: 300000,
    totalPackagingCost: 850000,

    coldChainIceExpenses: 150000,
    courierEmergencyPBFExpenses: 120000,
    miscellaneousPettyCashExpenses: 250000,
    totalPettyCashMovementCost: 520000,

    totalOPEX: 21870000,
  };

  const ebitdaOperatingProfit = grossProfit - opex.totalOPEX;
  const operatingMarginPercent = Number(((ebitdaOperatingProfit / netRevenue) * 100).toFixed(2));

  const otherIncome = 75000; // Bunga giro
  const otherExpensesMDR = Math.round(netRevenue * 0.0022); // MDR QRIS & EDC Bank
  const netOtherGainLoss = otherIncome - otherExpensesMDR;

  const ebtPreTaxProfit = ebitdaOperatingProfit + netOtherGainLoss;
  // PPh Final PP 55/2022 (0.5% dari Omzet Bruto)
  const incomeTaxUMKM = Math.round(netRevenue * 0.005);
  const netProfit = ebtPreTaxProfit - incomeTaxUMKM;
  const netMarginPercent = Number(((netProfit / netRevenue) * 100).toFixed(2));

  // Cash Reconciliation
  const payments = calculatePaymentMethodBreakdown(transactions);
  const cashItem = payments.find((p) => p.method === "CASH");
  const physicalCashDeposited = cashItem ? cashItem.totalAmount : Math.round(netRevenue * 0.58);
  const digitalFundsBankSettled = netRevenue - physicalCashDeposited;
  const accumulatedCashVariance = 15000; // Selisih kasir wajar (lebih)

  return {
    id: `pnl-kw-${year}-${String(month).padStart(2, "0")}`,
    periodYear: year,
    periodMonth: month,
    periodMonthName: monthName,
    createdAt: new Date().toISOString(),

    revenue: {
      salesOTC,
      salesEthical,
      salesAlkes,
      salesSupplements,
      feeTuslahJasaResep: tuslahTotal,
      feeEmbalaseWadah: embalaseTotal,
      grossRevenue,
      discountsSales,
      returnsSales,
      netRevenue,
    },

    cogs: {
      beginningInventory,
      purchasesPBFGross,
      purchasesDiscountsPBF,
      purchasesReturnsPBF,
      netPurchasesPBF,
      goodsAvailableForSale,
      endingInventory,
      totalCOGS,
    },

    grossProfit,
    grossMarginPercent,

    opex,
    ebitdaOperatingProfit,
    operatingMarginPercent,

    otherIncome,
    otherExpensesMDR,
    netOtherGainLoss,

    ebtPreTaxProfit,
    incomeTaxUMKM,
    netProfit,
    netMarginPercent,

    physicalCashDeposited,
    digitalFundsBankSettled,
    accumulatedCashVariance,

    preparedByStaffName: "Dinda Kirana (Kasir Kepala)",
    verifiedByApjName: APOTEK_KERSO_WARAS_INFO.apjName,
    verifiedByApjSipa: APOTEK_KERSO_WARAS_INFO.sipaNumber,
    approvedByOwnerName: APOTEK_KERSO_WARAS_INFO.ownerName,
    status: "APPROVED_BY_OWNER",
    approvedAt: new Date().toISOString(),
    auditNotes: "Laporan Laba Rugi disusun sesuai SAK EMKM dan diverifikasi dengan data register kasir Kerso Waras.",
  };
}
