import React, { useState } from 'react';
import { StorageService } from '../services/storage';
import {
  Download,
  Upload,
  HardDriveDownload,
  AlertTriangle,
  RotateCcw,
  CheckCircle,
  FileJson
} from 'lucide-react';

interface BackupViewProps {
  onDataRestored: () => void;
}

export const BackupView: React.FC<BackupViewProps> = ({ onDataRestored }) => {
  const [restoring, setRestoring] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const handleDownloadBackup = () => {
    const jsonStr = StorageService.exportBackupJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BACKUP_ATM_MINI_BRILINK_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setStatusMsg('File backup JSON berhasil diunduh ke komputer/HP Anda.');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const text = event.target?.result as string;
        setRestoring(true);
        const ok = StorageService.importBackupJson(text);
        setRestoring(false);
        if (ok) {
          setStatusMsg('Data berhasil dipulihkan dari file backup!');
          onDataRestored();
        } else {
          alert('Format file backup tidak valid.');
        }
      } catch (err) {
        setRestoring(false);
        alert('Gagal memproses file backup.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = () => {
    if (confirm('PERINGATAN: Apakah Anda yakin ingin mereset data aplikasi ke data contoh demo awal?')) {
      StorageService.resetToInitialData();
      onDataRestored();
      setStatusMsg('Data berhasil direset ke seed demo bawaan.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Backup &amp; Restore Database</h2>
        <p className="text-xs text-slate-500">
          Amankan seluruh catatan transaksi, kas masuk, kas keluar, dan pelanggan dalam format terenkripsi
        </p>
      </div>

      {statusMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          {statusMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Download Backup */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">Download Backup JSON</h3>
              <p className="text-xs text-slate-400">Simpan salinan database lengkap ke penyimpanan lokal</p>
            </div>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            File backup mencakup seluruh riwayat transaksi BRILink, data kas masuk/keluar, mutasi rekening, rekonsiliasi kas, data nasabah, dan pengaturan gerai.
          </p>

          <button
            onClick={handleDownloadBackup}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition"
          >
            <Download className="w-4 h-4" />
            Unduh Berkas Backup Sekarang
          </button>
        </div>

        {/* Card 2: Restore from Backup */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">Pulihkan Data (Restore)</h3>
              <p className="text-xs text-slate-400">Unggah file backup JSON yang telah Anda simpan sebelumnya</p>
            </div>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Data saat ini akan digabungkan atau diperbarui dengan data yang terdapat pada berkas cadangan JSON yang Anda pilih.
          </p>

          <label className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition cursor-pointer">
            <Upload className="w-4 h-4" />
            {restoring ? 'Memulihkan Data...' : 'Pilih File Backup JSON'}
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Danger Zone: Reset Data */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-rose-200 dark:border-rose-900/60 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-600" />
          <h3 className="font-bold text-sm text-rose-800 dark:text-rose-400">Zona Bahaya / Reset Sistem</h3>
        </div>

        <p className="text-xs text-slate-500">
          Jika Anda ingin menguji coba ulang aplikasi atau membersihkan data simulasi, Anda dapat mengembalikan seluruh pembukuan ke data seed awal.
        </p>

        <button
          onClick={handleResetData}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/50 dark:text-rose-300 transition border border-rose-200 dark:border-rose-800"
        >
          <RotateCcw className="w-4 h-4" />
          Reset ke Data Awal Demo
        </button>
      </div>
    </div>
  );
};
