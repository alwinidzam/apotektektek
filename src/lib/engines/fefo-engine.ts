import { BatchItem, Product } from "../types";

export interface BatchAllocationResult {
  allocatedBatch: BatchItem | null;
  warning?: string;
  isExpiredBlock?: boolean;
}

export class FEFOEngine {
  /**
   * Mengalokasikan batch secara otomatis berdasarkan tanggal kedaluwarsa terdekat (Strict FEFO)
   * Menyaring batch yang sudah expired atau stok habis.
   */
  static allocateBatch(product: Product, requiredBaseQuantity: number): BatchAllocationResult {
    const now = new Date();

    // Urutkan batch berdasarkan expiry date terdekat (ASC)
    const validBatches = [...product.batches]
      .filter((b) => (b.currentStock - b.reservedStock) > 0)
      .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

    if (validBatches.length === 0) {
      return {
        allocatedBatch: null,
        warning: `Stok obat ${product.name} habis di seluruh batch!`,
      };
    }

    const earliestBatch = validBatches[0];
    const expiry = new Date(earliestBatch.expiryDate);
    const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Hard block expired
    if (diffDays <= 0) {
      return {
        allocatedBatch: null,
        warning: `Batch terdekat (${earliestBatch.batchNumber}) telah KEDALUWARSA! Penjualan diblokir oleh sistem demi keselamatan pasien.`,
        isExpiredBlock: true,
      };
    }

    let warning: string | undefined = undefined;
    if (diffDays < 30) {
      warning = `Perhatian APJ: Batch ${earliestBatch.batchNumber} mendekati kedaluwarsa (${diffDays} hari tersisa).`;
    } else if (diffDays <= 90) {
      warning = `Informasi: Masa simpan batch ${earliestBatch.batchNumber} tersisa ${diffDays} hari.`;
    }

    const available = earliestBatch.currentStock - earliestBatch.reservedStock;
    if (available < requiredBaseQuantity) {
      warning = `Stok pada batch ${earliestBatch.batchNumber} tersisa ${available} ${product.baseUnit}, tidak mencukupi permintaan ${requiredBaseQuantity} ${product.baseUnit}.`;
    }

    return {
      allocatedBatch: earliestBatch,
      warning,
    };
  }

  /**
   * Menghitung Reorder Point (ROP) otomatis
   * ROP = (Average Daily Usage * Lead Time) + Safety Stock
   */
  static calculateROP(
    averageDailyUsage: number,
    leadTimeDays: number,
    safetyStock: number
  ): number {
    return Math.ceil(averageDailyUsage * leadTimeDays + safetyStock);
  }

  /**
   * Menghitung Moving Average Cost (MAC) saat Penerimaan Barang (LPB)
   */
  static calculateMovingAverageCost(
    currentQty: number,
    currentCost: number,
    incomingQty: number,
    incomingCost: number
  ): number {
    const totalQty = currentQty + incomingQty;
    if (totalQty === 0) return 0;
    return Math.round((currentQty * currentCost + incomingQty * incomingCost) / totalQty);
  }

  /**
   * Konversi pecahan unit ke base unit (satuan terkecil)
   */
  static convertToBaseQuantity(product: Product, unitName: string, quantity: number): number {
    if (unitName.toUpperCase() === product.baseUnit.toUpperCase()) {
      return quantity;
    }
    const conversion = product.unitConversions.find(
      (u) => u.unitName.toUpperCase() === unitName.toUpperCase()
    );
    if (!conversion) return quantity;
    return quantity * conversion.multiplier;
  }
}
