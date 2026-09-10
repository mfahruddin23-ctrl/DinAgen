import React, { useState, useEffect } from 'react';
import { APPS_SCRIPT_FILES } from '../data/appsScriptCode';
import { AppsScriptSyncService, SyncStatus } from '../services/appsScriptSync';
import { StorageService } from '../services/storage';
import {
  FileCode,
  Copy,
  Check,
  ExternalLink,
  Table,
  Play,
  CloudUpload,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Link,
  Radio,
  Clock,
  ShieldCheck,
  Send
} from 'lucide-react';

export const AppsScriptView: React.FC = () => {
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(() => AppsScriptSyncService.getSyncStatus());
  
  // Quick URL & Spreadsheet ID state
  const currentSettings = StorageService.getSettings();
  const [webAppUrlInput, setWebAppUrlInput] = useState(
    currentSettings.gasWebAppUrl || currentSettings.googleAppsScriptUrl || ''
  );
  const [spreadsheetIdInput, setSpreadsheetIdInput] = useState(
    currentSettings.googleSpreadsheetId || ''
  );
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const [testStatus, setTestStatus] = useState<{ loading: boolean; msg: string | null; success?: boolean }>({
    loading: false,
    msg: null
  });
  const [syncStatusAction, setSyncStatusAction] = useState<{ loading: boolean; msg: string | null; success?: boolean }>({
    loading: false,
    msg: null
  });

  useEffect(() => {
    const unsub = AppsScriptSyncService.subscribe((status) => {
      setSyncStatus(status);
    });
    return unsub;
  }, []);

  const activeFile = APPS_SCRIPT_FILES[activeFileIndex];

  const handleCopyCode = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleSaveConfig = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    AppsScriptSyncService.setConfiguration(spreadsheetIdInput, webAppUrlInput);
    setSaveSuccessMsg('Konfigurasi Google Spreadsheet berhasil disimpan!');
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  const handleTestConnection = async () => {
    setTestStatus({ loading: true, msg: null });
    // save first if input changed
    AppsScriptSyncService.setConfiguration(spreadsheetIdInput, webAppUrlInput);
    const res = await AppsScriptSyncService.testConnection(webAppUrlInput);
    setTestStatus({
      loading: false,
      msg: res.message,
      success: res.success
    });
  };

  const handleSyncToSheets = async () => {
    setSyncStatusAction({ loading: true, msg: 'Sedang menyinkronkan seluruh data lokal ke Google Spreadsheet...' });
    const payload = {
      transactions: StorageService.getTransactions(),
      cashIn: StorageService.getCashIn(),
      cashOut: StorageService.getCashOut(),
      mutations: StorageService.getMutations(),
      customers: StorageService.getCustomers(),
      settings: StorageService.getSettings()
    };

    const res = await AppsScriptSyncService.sendSyncPayload(payload);
    setSyncStatusAction({
      loading: false,
      msg: res.message,
      success: res.success
    });
  };

  const handleFlushQueue = async () => {
    setSyncStatusAction({ loading: true, msg: 'Mengirimkan antrean transaksi tertunda...' });
    await AppsScriptSyncService.flushOfflineQueue();
    setSyncStatusAction({
      loading: false,
      msg: 'Proses pengiriman antrean transaksi selesai.',
      success: true
    });
  };

  const sheetNames = [
    { name: 'TRANSAKSI', desc: 'Seluruh pencatatan transaksi nasabah, admin, fee provider & laba' },
    { name: 'KAS_MASUK', desc: 'Catatan arus modal kas masuk dan setoran tunai' },
    { name: 'KAS_KELUAR', desc: 'Catatan beban operasional, kertas struk, kuota, sewa dll' },
    { name: 'SALDO', desc: 'Perputaran kas tunai laci ke rekening BRILink dan saldo layanan' },
    { name: 'REKONSILIASI', desc: 'Riwayat hitung uang fisik laci vs saldo sistem' },
    { name: 'REKAP_HARIAN', desc: 'Riwayat tutup buku harian dan evaluasi omset' },
    { name: 'REKAP_BULANAN', desc: 'Laporan laba rugi dan evaluasi performa per bulan' },
    { name: 'PELANGGAN', desc: 'Data direktori nasabah tetap agen' },
    { name: 'USERS', desc: 'Data pengguna sistem (Admin, Operator, Kasir, Owner)' },
    { name: 'SETTINGS', desc: 'Konfigurasi profil usaha dan parameter sistem' },
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          Integrasi Google Apps Script &amp; Google Spreadsheet
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 font-semibold">
            Realtime Sync Active
          </span>
        </h2>
        <p className="text-xs text-slate-500">
          Database spreadsheet otomatis terisi seketika setiap kali Anda menambah, mengedit, atau menghapus transaksi.
        </p>
      </div>

      {/* QUICK CONFIG & REALTIME STATUS CARD */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Radio className={`w-5 h-5 ${syncStatus.isConfigured ? 'text-emerald-500 animate-pulse' : 'text-amber-500'}`} />
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Status Koneksi Spreadsheet Realtime
              </h3>
              <p className="text-[11px] text-slate-500">
                {syncStatus.isConfigured
                  ? 'Siap kirim realtime: Setiap transaksi disimpan langsung ke Google Sheet'
                  : 'Koneksi belum terpasang. Masukkan Web App URL di bawah.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {syncStatus.isConfigured ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Terhubung Realtime
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Belum Terkonfigurasi
              </span>
            )}

            {syncStatus.lastSyncTime && (
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Sync: {syncStatus.lastSyncTime}
              </span>
            )}
          </div>
        </div>

        {/* Configuration Form */}
        <form onSubmit={handleSaveConfig} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                Google Apps Script Web App URL *
              </label>
              <input
                type="url"
                required
                placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                value={webAppUrlInput}
                onChange={(e) => setWebAppUrlInput(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-xs text-slate-900 dark:text-white"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                URL didapat setelah Deploy &gt; New Deployment &gt; Web app (Who has access: Anyone).
              </span>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                Google Spreadsheet ID (Opsional)
              </label>
              <input
                type="text"
                placeholder="Contoh: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                value={spreadsheetIdInput}
                onChange={(e) => setSpreadsheetIdInput(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-xs text-slate-900 dark:text-white"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                ID spreadsheet dari URL docs.google.com/spreadsheets/d/<strong>ID_DI_SINI</strong>/edit
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition shadow-xs"
              >
                Simpan Konfigurasi
              </button>
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testStatus.loading}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testStatus.loading ? 'animate-spin text-blue-600' : ''}`} />
                Uji Koneksi
              </button>
            </div>

            {/* Offline Queue Badge & Flush Button */}
            {syncStatus.pendingCount > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-amber-700 dark:text-amber-300 font-semibold bg-amber-50 dark:bg-amber-950/50 px-3 py-1 rounded-xl border border-amber-200 dark:border-amber-800">
                  {syncStatus.pendingCount} transaksi dalam antrean offline
                </span>
                <button
                  type="button"
                  onClick={handleFlushQueue}
                  disabled={syncStatusAction.loading}
                  className="flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold bg-amber-600 text-white hover:bg-amber-700 transition shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  Kirim Sekarang
                </button>
              </div>
            )}
          </div>

          {/* Feedback messages */}
          {saveSuccessMsg && (
            <div className="p-3 rounded-xl text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              {saveSuccessMsg}
            </div>
          )}

          {testStatus.msg && (
            <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${testStatus.success ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
              {testStatus.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
              {testStatus.msg}
            </div>
          )}
        </form>
      </div>

      {/* Sync Action Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-400/20 px-2.5 py-0.5 rounded-full inline-block mb-1">
              AUTO-PUSH SPREADSHEET
            </span>
            <h3 className="text-lg font-bold">Sinkronisasi Penuh (Initial Bulk Sync)</h3>
            <p className="text-xs text-slate-300 max-w-xl">
              Selain realtime otomatis pada tiap transaksi baru, Anda dapat menekan tombol ini untuk mengunggah seluruh data yang sudah ada di penyimpanan lokal ke Google Spreadsheet.
            </p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleSyncToSheets}
              disabled={syncStatusAction.loading}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#f37021] hover:bg-[#e06114] shadow-md shadow-orange-500/30 transition"
            >
              <CloudUpload className={`w-4 h-4 ${syncStatusAction.loading ? 'animate-spin' : ''}`} />
              {syncStatusAction.loading ? 'Menyinkronkan...' : 'Sinkronkan Semua Data Lokal ke Spreadsheet'}
            </button>
          </div>
        </div>

        {syncStatusAction.msg && (
          <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${syncStatusAction.success ? 'bg-emerald-500/20 text-emerald-200' : 'bg-blue-500/20 text-blue-200'}`}>
            {syncStatusAction.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />}
            {syncStatusAction.msg}
          </div>
        )}
      </div>

      {/* TUTORIAL STEP-BY-STEP */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Play className="w-4 h-4 text-blue-600" />
          Panduan Langkah Setup Database Spreadsheet &amp; Apps Script
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold inline-flex items-center justify-center text-xs">
              1
            </span>
            <div className="font-bold text-slate-800 dark:text-slate-100">Buat Google Spreadsheet</div>
            <p className="text-slate-500 leading-relaxed">
              Buka Google Drive, buat spreadsheet baru dengan nama <code className="text-blue-600 font-bold">DATABASE_BRILINK</code>. Salin ID Spreadsheet dari URL browser Anda.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold inline-flex items-center justify-center text-xs">
              2
            </span>
            <div className="font-bold text-slate-800 dark:text-slate-100">Buka Apps Script &amp; Salin Kode</div>
            <p className="text-slate-500 leading-relaxed">
              Di Spreadsheet, klik menu <strong>Extensions &gt; Apps Script</strong>. Buat 10 file script (.gs) sesuai daftar di bawah dan salin masing-masing kode.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold inline-flex items-center justify-center text-xs">
              3
            </span>
            <div className="font-bold text-slate-800 dark:text-slate-100">Deploy Web App</div>
            <p className="text-slate-500 leading-relaxed">
              Klik <strong>Deploy &gt; New Deployment &gt; Web app</strong>. Pilih <code className="text-blue-600 font-bold">Execute as: Me</code> dan <code className="text-blue-600 font-bold">Who has access: Anyone</code>. Salin Web App URL ke kotak konfigurasi di atas.
            </p>
          </div>
        </div>
      </div>

      {/* 10 SHEETS STRUCTURE OVERVIEW */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Table className="w-4 h-4 text-emerald-600" />
          Struktur 10 Sheet Database Google Spreadsheet
        </h3>
        <p className="text-xs text-slate-500">
          Fungsi <code className="text-blue-600 font-bold">setupInitialDatabase()</code> pada file <code>Database.gs</code> otomatis membuat dan memformat seluruh sheet &amp; header tabel ini:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 pt-2">
          {sheetNames.map((s, idx) => (
            <div key={s.name} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-mono font-extrabold text-blue-600 dark:text-blue-400 block">
                #{idx + 1} {s.name}
              </span>
              <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                {s.desc}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* SOURCE CODE EXPLORER (10 FILES) */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col">
        {/* File Tabs Bar */}
        <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1 sm:pb-0">
            {APPS_SCRIPT_FILES.map((file, idx) => {
              const isActive = activeFileIndex === idx;
              return (
                <button
                  key={file.name}
                  onClick={() => setActiveFileIndex(idx)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5" />
                  {file.name}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => handleCopyCode(activeFile.code, activeFileIndex)}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-200 hover:bg-blue-600 hover:text-white transition shadow-sm border border-slate-700"
          >
            {copiedIndex === activeFileIndex ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                Tersalin!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Salin Kode {activeFile.name}
              </>
            )}
          </button>
        </div>

        {/* Code Content */}
        <div className="p-4 bg-slate-950 overflow-x-auto max-h-[500px]">
          <pre className="font-mono text-xs text-slate-200 leading-relaxed select-all">
            <code>{activeFile.code}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
