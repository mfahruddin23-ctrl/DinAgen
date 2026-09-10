import { StorageService } from './storage';
import { Transaction, CashIn, CashOut, BalanceMutation, CashReconciliation, BusinessSettings } from '../types';

export interface SyncQueueItem {
  id: string;
  action: string;
  payload: any;
  user: string;
  timestamp: string;
  retryCount: number;
}

export interface SyncStatus {
  isConfigured: boolean;
  isOnline: boolean;
  lastSyncTime: string | null;
  pendingCount: number;
  syncing: boolean;
  lastAction?: string;
  errorMessage?: string;
  webAppUrl?: string;
  spreadsheetId?: string;
}

type SyncListener = (status: SyncStatus) => void;

const OFFLINE_QUEUE_KEY = 'brilink_offline_queue_v1';

let isSyncing = false;
let lastSync: string | null = null;
let lastError: string | undefined = undefined;
let lastActionName: string | undefined = undefined;
const listeners: Set<SyncListener> = new Set();

function notifyStatus() {
  const current = AppsScriptSyncService.getSyncStatus();
  listeners.forEach(fn => {
    try {
      fn(current);
    } catch (e) {
      console.error('Error in sync listener:', e);
    }
  });
}

function getStoredQueue(): SyncQueueItem[] {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveQueue(queue: SyncQueueItem[]): void {
  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.error('Failed to save sync queue:', e);
  }
  notifyStatus();
}

export const AppsScriptSyncService = {
  subscribe(listener: SyncListener): () => void {
    listeners.add(listener);
    // immediately call with current status
    listener(this.getSyncStatus());
    return () => {
      listeners.delete(listener);
    };
  },

  getEndpointUrl(): string | null {
    const settings = StorageService.getSettings();
    const url = (settings.gasWebAppUrl || settings.googleAppsScriptUrl || '').trim();
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return null;
  },

  setConfiguration(sheetId?: string, webAppUrl?: string) {
    const settings = StorageService.getSettings();
    if (webAppUrl !== undefined) {
      settings.gasWebAppUrl = webAppUrl.trim();
      settings.googleAppsScriptUrl = webAppUrl.trim();
    }
    if (sheetId !== undefined) {
      settings.googleSpreadsheetId = sheetId.trim();
    }
    StorageService.saveSettings(settings, 'system');
    notifyStatus();
  },

  getSyncStatus(): SyncStatus {
    const settings = StorageService.getSettings();
    const url = this.getEndpointUrl();
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    const queue = getStoredQueue();

    return {
      isConfigured: Boolean(url),
      isOnline,
      lastSyncTime: lastSync,
      pendingCount: queue.length,
      syncing: isSyncing,
      lastAction: lastActionName,
      errorMessage: lastError,
      webAppUrl: url || undefined,
      spreadsheetId: settings.googleSpreadsheetId || undefined
    };
  },

  async testConnection(targetUrl?: string): Promise<{ success: boolean; message: string }> {
    const url = targetUrl?.trim() || this.getEndpointUrl();

    if (!url) {
      return {
        success: false,
        message: 'URL Google Apps Script Web App belum diisi atau formatnya salah (harus diawali https://).'
      };
    }

    try {
      const separator = url.includes('?') ? '&' : '?';
      const testUrl = `${url}${separator}action=getSettings&_t=${Date.now()}`;
      
      const res = await fetch(testUrl, {
        method: 'GET',
        mode: 'cors'
      });

      if (!res.ok) {
        return {
          success: false,
          message: `Respon server HTTP ${res.status}. Pastikan pada menu Deploy Google Apps Script diatur "Execute as: Me" dan "Who has access: Anyone".`
        };
      }

      const json = await res.json().catch(() => null);
      if (json && (json.success !== false)) {
        lastSync = new Date().toLocaleTimeString('id-ID');
        notifyStatus();
        return {
          success: true,
          message: 'Koneksi ke Google Spreadsheet berhasil dan siap menerima data realtime!'
        };
      }

      return {
        success: true,
        message: 'Terhubung ke Google Apps Script Web App.'
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Gagal menghubungi Google Apps Script: ${err.message || 'CORS / Jaringan'}. Pastikan akses diatur ke "Anyone" saat New Deployment.`
      };
    }
  },

  /**
   * Internal transport method to execute POST to Apps Script Web App
   */
  async postAction(action: string, payload: any, user: string): Promise<{ success: boolean; message?: string }> {
    const url = this.getEndpointUrl();

    if (!url) {
      // Not configured yet: enqueue in offline queue so data is preserved for future sync
      const queue = getStoredQueue();
      queue.push({
        id: 'Q-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        action,
        payload,
        user,
        timestamp: new Date().toISOString(),
        retryCount: 0
      });
      saveQueue(queue);
      return {
        success: true,
        message: 'Disimpan di penyimpanan lokal. Konfigurasikan Web App URL di Pengaturan untuk realtime spreadsheet.'
      };
    }

    // If device is offline, enqueue immediately
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      const queue = getStoredQueue();
      queue.push({
        id: 'Q-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        action,
        payload,
        user,
        timestamp: new Date().toISOString(),
        retryCount: 0
      });
      saveQueue(queue);
      return {
        success: true,
        message: 'Koneksi internet offline. Transaksi dimasukkan ke antrean sinkronisasi otomatis.'
      };
    }

    isSyncing = true;
    lastActionName = action;
    lastError = undefined;
    notifyStatus();

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          // 'text/plain;charset=utf-8' prevents CORS preflight OPTIONS check on Google Apps Script
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify({
          action,
          payload,
          user,
          timestamp: new Date().toISOString()
        })
      });

      const data = await response.json().catch(() => ({ success: true }));
      isSyncing = false;
      lastSync = new Date().toLocaleTimeString('id-ID');
      notifyStatus();

      // If we have pending queue items, trigger background flush
      const queue = getStoredQueue();
      if (queue.length > 0) {
        this.flushOfflineQueue();
      }

      return {
        success: data?.success !== false,
        message: data?.message || 'Data realtime berhasil masuk ke Google Spreadsheet!'
      };
    } catch (e: any) {
      isSyncing = false;
      lastError = e?.message || 'Gagal sinkronisasi';

      // Push to queue for background retry
      const queue = getStoredQueue();
      queue.push({
        id: 'Q-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        action,
        payload,
        user,
        timestamp: new Date().toISOString(),
        retryCount: 1
      });
      saveQueue(queue);

      return {
        success: false,
        message: 'Tersimpan lokal, sinkronisasi realtime ke spreadsheet tertunda: ' + (e?.message || 'Jaringan')
      };
    }
  },

  /**
   * Sync a newly created transaction to Google Spreadsheet in real-time
   */
  async syncTransaction(trx: Transaction, user?: string): Promise<{ success: boolean; message?: string }> {
    const operator = user || trx.petugas || 'Kasir';
    return this.postAction('saveTransaction', trx, operator);
  },

  /**
   * Sync an edited transaction to Google Spreadsheet
   */
  async syncUpdateTransaction(trx: Transaction, user?: string): Promise<{ success: boolean; message?: string }> {
    const operator = user || trx.petugas || 'Kasir';
    return this.postAction('updateTransaction', trx, operator);
  },

  /**
   * Sync transaction deletion
   */
  async syncDeleteTransaction(id: string, user?: string): Promise<{ success: boolean; message?: string }> {
    const operator = user || 'Kasir';
    return this.postAction('deleteTransaction', { id }, operator);
  },

  /**
   * Sync cash in
   */
  async syncCashIn(item: CashIn, user?: string): Promise<{ success: boolean; message?: string }> {
    const operator = user || item.petugas || 'Kasir';
    return this.postAction('saveCashIn', item, operator);
  },

  /**
   * Sync cash out
   */
  async syncCashOut(item: CashOut, user?: string): Promise<{ success: boolean; message?: string }> {
    const operator = user || item.petugas || 'Kasir';
    return this.postAction('saveCashOut', item, operator);
  },

  /**
   * Sync reconciliation
   */
  async syncReconciliation(rec: CashReconciliation, user?: string): Promise<{ success: boolean; message?: string }> {
    const operator = user || rec.petugas || 'Kasir';
    return this.postAction('saveReconciliation', rec, operator);
  },

  /**
   * Sync mutation / cash adjustment to Google Spreadsheet
   */
  async syncMutation(mutation: BalanceMutation, user?: string): Promise<{ success: boolean; message?: string }> {
    const operator = user || mutation.petugas || 'Kasir';
    return this.postAction('saveMutation', mutation, operator);
  },

  /**
   * Sync business / cash settings to Google Spreadsheet
   */
  async syncSettings(settings: BusinessSettings, user?: string): Promise<{ success: boolean; message?: string }> {
    const operator = user || 'admin';
    return this.postAction('saveSettings', settings, operator);
  },

  /**
   * Send all local data at once to populate Google Spreadsheet
   */
  async sendSyncPayload(payload: any): Promise<{ success: boolean; message: string }> {
    const url = this.getEndpointUrl();

    if (!url) {
      return {
        success: false,
        message: 'URL Google Apps Script Web App belum dikonfigurasi di Pengaturan.'
      };
    }

    isSyncing = true;
    lastActionName = 'syncAllData';
    notifyStatus();

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify({
          action: 'syncAllData',
          payload: payload,
          user: StorageService.getCurrentUser()?.username || 'admin',
          timestamp: new Date().toISOString()
        })
      });

      const data = await res.json().catch(() => ({ success: true }));
      isSyncing = false;
      lastSync = new Date().toLocaleTimeString('id-ID');
      
      // Clear queue on full sync
      saveQueue([]);

      return {
        success: true,
        message: data.message || 'Seluruh data transaksi & kas berhasil disinkronkan ke Google Spreadsheet!'
      };
    } catch (e: any) {
      isSyncing = false;
      lastError = e.message;
      notifyStatus();
      return {
        success: false,
        message: 'Gagal menyinkronkan data ke spreadsheet: ' + e.message
      };
    }
  },

  /**
   * Automatically flush the offline queue sequentially
   */
  async flushOfflineQueue(): Promise<void> {
    const url = this.getEndpointUrl();
    if (!url) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;

    const queue = getStoredQueue();
    if (queue.length === 0 || isSyncing) return;

    isSyncing = true;
    notifyStatus();

    const remaining: SyncQueueItem[] = [];

    for (const item of queue) {
      try {
        await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: item.action,
            payload: item.payload,
            user: item.user,
            timestamp: item.timestamp
          })
        });
      } catch (e) {
        item.retryCount = (item.retryCount || 0) + 1;
        if (item.retryCount < 5) {
          remaining.push(item);
        }
      }
    }

    isSyncing = false;
    lastSync = new Date().toLocaleTimeString('id-ID');
    saveQueue(remaining);
  }
};

// Listen to browser network changes to automatically flush queue
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    notifyStatus();
    AppsScriptSyncService.flushOfflineQueue();
  });

  window.addEventListener('offline', () => {
    notifyStatus();
  });

  // Background polling every 2 minutes to flush if any pending items exist
  setInterval(() => {
    const queue = getStoredQueue();
    if (queue.length > 0) {
      AppsScriptSyncService.flushOfflineQueue();
    }
  }, 120000);
}
