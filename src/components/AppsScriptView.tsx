import React, { useState } from 'react';
import { APPS_SCRIPT_FILES } from '../data/appsScriptCode';
import { AppsScriptSyncService } from '../services/appsScriptSync';
import { StorageService } from '../services/storage';
import {
  FileCode,
  Copy,
  Check,
  ExternalLink,
  Table,
  Terminal,
  Play,
  CloudUpload,
  RefreshCw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const AppsScriptView: React.FC = () => {
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [testStatus, setTestStatus] = useState<{ loading: boolean; msg: string | null; success?: boolean }>({
    loading: false,
    msg: null
  });
  const [syncStatus, setSyncStatus] = useState<{ loading: boolean; msg: string | null; success?: boolean }>({
    loading: false,
    msg: null
  });

  const activeFile = APPS_SCRIPT_FILES[activeFileIndex];

  const handleCopyCode = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleTestConnection = async () => {
    setTestStatus({ loading: true, msg: null });
    const res = await AppsScriptSyncService.testConnection();
    setTestStatus({
      loading: false,
      msg: res.message,
      success: res.success
    });
  };

  const handleSyncToSheets = async () => {
    setSyncStatus({ loading: true, msg: 'Sedang menyinkronkan seluruh data lokal ke Google Spreadsheet...' });
    const payload = {
      transactions: StorageService.getTransactions(),
      cashIn: StorageService.getCashIn(),
      cashOut: StorageService.getCashOut(),
      mutations: StorageService.getMutations(),
      customers: StorageService.getCustomers(),
      settings: StorageService.getSettings()
    };

    const res = await AppsScriptSyncService.sendSyncPayload(payload);
    setSyncStatus({
      loading: false,
      msg: res.message,
      success: res.success
    });
  };

  const sheetNames = [
    { name: 'TRANSAKSI', desc: 'Seluruh pencatatan transaksi nasabah, admin, fee provider & laba' },
    { name: 'KAS_MASUK', desc: 'Catatan arus modal kas masuk dan setoran tunai' },
    { name: 'KAS_KELUAR', desc: 'Catatan beban operasional, kertas struk, kuota, sewa dll' },
    { name: 'MUTASI_SALDO', desc: 'Perputaran kas tunai laci ke rekening BRILink dan sebaliknya' },
    { name: 'REKONSILIASI', desc: 'Riwayat hitung uang fisik laci vs saldo sistem' },
    { name: 'REKAP_HARIAN', desc: 'Riwayat tutup buku harian dan evaluasi omset' },
    { name: 'PELANGGAN', desc: 'Data direktori nasabah tetap agen' },
    { name: 'USERS', desc: 'Data pengguna sistem (Admin, Operator, Kasir, Owner)' },
    { name: 'AUDIT_LOG', desc: 'Rekam jejak keamanan audit transaksi' },
    { name: 'SETTINGS', desc: 'Konfigurasi profil usaha dan printer' },
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Integrasi Google Apps Script &amp; Google Spreadsheet
        </h2>
        <p className="text-xs text-slate-500">
          Backend serverless gratis tanpa biaya hosting menggunakan Google Apps Script &amp; database Google Sheets
        </p>
      </div>

      {/* Sync Action & Connection Tester Box */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-400/20 px-2.5 py-0.5 rounded-full inline-block mb-1">
              CLOUD SYNC SYSTEM
            </span>
            <h3 className="text-lg font-bold">Sinkronisasi Dua Arah Real-time</h3>
            <p className="text-xs text-slate-300 max-w-xl">
              Aplikasi ini beroperasi dengan model offline-first (respons sekejap di browser) dan dapat secara otomatis menyinkronkan seluruh data ke Google Spreadsheet Anda.
            </p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleTestConnection}
              disabled={testStatus.loading}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 border border-white/20 transition"
            >
              <RefreshCw className={`w-4 h-4 ${testStatus.loading ? 'animate-spin' : ''}`} />
              Tes Koneksi
            </button>
            <button
              onClick={handleSyncToSheets}
              disabled={syncStatus.loading}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#f37021] hover:bg-[#e06114] shadow-md shadow-orange-500/30 transition"
            >
              <CloudUpload className={`w-4 h-4 ${syncStatus.loading ? 'animate-spin' : ''}`} />
              Sinkronkan ke Spreadsheet
            </button>
          </div>
        </div>

        {/* Status Responses */}
        {testStatus.msg && (
          <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${testStatus.success ? 'bg-emerald-500/20 text-emerald-200' : 'bg-amber-500/20 text-amber-200'}`}>
            {testStatus.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-amber-400" />}
            {testStatus.msg}
          </div>
        )}

        {syncStatus.msg && (
          <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${syncStatus.success ? 'bg-emerald-500/20 text-emerald-200' : 'bg-blue-500/20 text-blue-200'}`}>
            {syncStatus.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />}
            {syncStatus.msg}
          </div>
        )}
      </div>

      {/* TUTORIAL STEP-BY-STEP */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Play className="w-4 h-4 text-blue-600" />
          Panduan Langkah Mudah Setup Database Spreadsheet &amp; Apps Script
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
              Klik <strong>Deploy &gt; New Deployment &gt; Web app</strong>. Pilih <code className="text-blue-600 font-bold">Execute as: Me</code> dan <code className="text-blue-600 font-bold">Who has access: Anyone</code>. Salin Web App URL ke Pengaturan.
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
          Fungsi <code className="text-blue-600 font-bold">setupInitialDatabase()</code> pada file <code>Database.gs</code> akan otomatis membuat dan memformat seluruh sheet &amp; header tabel ini secara instan:
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
