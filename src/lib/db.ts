import Dexie, { Table } from "dexie";
import { CartItem, Product, Transaction } from "./types";

export interface OfflineQueueItem {
  id: string;
  transaction: Transaction;
  queuedAt: string;
  retryCount: number;
  status: "PENDING" | "SYNCED" | "FAILED";
}

export class ApotekOfflineDB extends Dexie {
  cachedProducts!: Table<Product, string>;
  offlineQueue!: Table<OfflineQueueItem, string>;

  constructor() {
    super("ApotekProLocalDB");
    this.version(1).stores({
      cachedProducts: "id, barcode, name, drugClass",
      offlineQueue: "id, queuedAt, status",
    });
  }
}

export const localDB = new ApotekOfflineDB();
