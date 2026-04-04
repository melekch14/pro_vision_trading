import { Injectable } from '@angular/core';

export interface OrderExportHistoryEntry {
  id: string;
  exportedAt: string;
  exportedBy: string;
  format: 'CSV' | 'PDF' | 'Excel';
  filename: string;
  totalOrders: number;
}

@Injectable({
  providedIn: 'root'
})
export class OrderExportHistoryService {
  private readonly storageKey = 'order_export_history_v1';

  getHistory(): OrderExportHistoryEntry[] {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  addEntry(entry: Omit<OrderExportHistoryEntry, 'id'>): void {
    const current = this.getHistory();
    const newEntry: OrderExportHistoryEntry = {
      ...entry,
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    };
    current.unshift(newEntry);
    localStorage.setItem(this.storageKey, JSON.stringify(current));
  }

  clear(): void {
    localStorage.removeItem(this.storageKey);
  }
}
