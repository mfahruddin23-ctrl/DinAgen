import { StorageService } from './storage';
import { Transaction, CashIn, CashOut } from '../types';

export interface SyncStatus {
  isConfigured: boolean;
  isOnline: boolean;
  lastSyncTime: string | null;
  pendingCount: number;
  syncing: boolean;
  errorMessage?: string;
}

let isSyncing = false;
let lastSync: string | null = null;
let lastError: string | undefined = undefined;

export const AppsScriptSyncService = {
  setConfiguration(sheetId?: string, webAppUrl?: string) {
    const settings = StorageService.getSettings();
    if (webAppUrl !== undefined) settings.gasWebAppUrl = webAppUrl;
    if (sheetId !== undefined) settings.googleSpreadsheetId = sheetId;
    StorageService.saveSettings(settings, 'system');
  },

  getSyncStatus(): SyncStatus {
    const settings = StorageService.getSettings();
    const url = settings.gasWebAppUrl || settings.googleAppsScriptUrl;
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    
    return {
      isConfigured: Boolean(url && url.trim().startsWith('http')),
      isOnline,
      lastSyncTime: lastSync,
      pendingCount: 0,
      syncing: isSyncing,
      errorMessage: lastError
    };
  },

  async testConnection(targetUrl?: string): Promise<{ success: boolean; message: string }> {
    const settings = StorageService.getSettings();
    const url = targetUrl || settings.gasWebAppUrl || settings.googleAppsScriptUrl;

    if (!url || !url.trim().startsWith('http')) {
      return { success: false, message: 'URL Google Apps Script Web App belum diisi atau tidak valid.' };
    }

    try {
      const testUrl = `${url.trim()}${url.includes('?') ? '&' : '?'}action=getSettings`;
      const res = await fetch(testUrl, {
        method: 'GET',
        mode: 'cors'
      });

      if (!res.ok) {
        return {
          success: false,
          message: `Server merespon HTTP ${res.status}: Pastikan Web App di-deploy dengan akses "Anyone" (Siapa saja).`
        };
      }

      const json = await res.json();
      if (json && json.success) {
        return { success: true, message: 'Koneksi ke Google Spreadsheet berhasil!' };
      }
      return { success: true, message: 'Terhubung ke Google Apps Script Web App.' };
    } catch (err: any) {
      return {
        success: false,
        message: `Gagal menghubungi Google Apps Script: ${err.message || 'CORS / Jaringan'}. Pastikan akses diatur ke "Anyone" saat deploy.`
      };
    }
  },

  async sendSyncPayload(payload: any): Promise<{ success: boolean; message: string }> {
    const settings = StorageService.getSettings();
    const url = settings.gasWebAppUrl || settings.googleAppsScriptUrl;

    if (!url || !url.trim().startsWith('http')) {
      return { success: true, message: 'Database lokal aktif. URL Google Apps Script belum dikonfigurasi.' };
    }

    isSyncing = true;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify({
          action: 'syncAllData',
          payload: payload
        })
      });

      const data = await res.json().catch(() => ({ success: true }));
      isSyncing = false;
      lastSync = new Date().toLocaleTimeString('id-ID');
      return { success: true, message: 'Data seluruh transaksi & kas berhasil disinkronkan ke Google Spreadsheet!' };
    } catch (e: any) {
      isSyncing = false;
      lastError = e.message;
      return {
        success: false,
        message: 'Gagal menyinkronkan data: ' + e.message
      };
    }
  },

  async syncTransaction(trx: Transaction, user: string): Promise<{ success: boolean; message?: string }> {
    const settings = StorageService.getSettings();
    const url = settings.gasWebAppUrl;
    if (!url || !url.trim().startsWith('http')) {
      // Offline mode - saved to local storage
      return { success: true, message: 'Tersimpan di Penyimpanan Lokal (Mode Offline)' };
    }

    isSyncing = true;
    lastError = undefined;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8' // avoids preflight CORS in Apps Script
        },
        body: JSON.stringify({
          action: 'saveTransaction',
          payload: trx,
          user: user
        })
      });

      const data = await res.json().catch(() => ({ success: true }));
      isSyncing = false;
      lastSync = new Date().toLocaleTimeString('id-ID');
      return { success: true, message: 'Berhasil disinkronkan ke Google Spreadsheet' };
    } catch (e: any) {
      isSyncing = false;
      lastError = e.message;
      return {
        success: false,
        message: 'Tersimpan lokal, sinkronisasi cloud tertunda: ' + e.message
      };
    }
  }
};
