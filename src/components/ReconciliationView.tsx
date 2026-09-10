import React, { useState } from 'react';
import { CashReconciliation, BalanceSummary, User, BusinessSettings } from '../types';
import {
  formatRupiah,
  formatTanggalIndo,
  generateId,
  getCurrentTimeString,
  getTodayDateString
} from '../utils/formatters';
import { PdfReportService } from '../services/pdfReportService';
import {
  Scale,
  Save,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Coins,
  Banknote,
  RotateCcw,
  Download,
  FileText
} from 'lucide-react';

interface ReconciliationViewProps {
  balance: BalanceSummary;
  reconciliationHistory: CashReconciliation[];
  currentUser: User | null;
  settings?: BusinessSettings;
  onSaveReconciliation: (rec: CashReconciliation) => void;
}

export const ReconciliationView: React.FC<ReconciliationViewProps> = ({
  balance,
  reconciliationHistory,
  currentUser,
  settings,
  onSaveReconciliation
}) => {
  // Denominations count
  const [counts, setCounts] = useState({
    c100k: 0,
    c50k: 0,
    c20k: 0,
    c10k: 0,
    c5k: 0,
    c2k: 0,
    c1k: 0,
    koin: 0
  });

  const [catatan, setCatatan] = useState('');

  // Calculations
  const total100k = counts.c100k * 100000;
  const total50k = counts.c50k * 50000;
  const total20k = counts.c20k * 20000;
  const total10k = counts.c10k * 10000;
  const total5k = counts.c5k * 5000;
  const total2k = counts.c2k * 2000;
  const total1k = counts.c1k * 1000;
  const totalKoin = Number(counts.koin) || 0;

  const totalFisik =
    total100k +
    total50k +
    total20k +
    total10k +
    total5k +
    total2k +
    total1k +
    totalKoin;

  const saldoSistem = balance.kasTunai;
  const selisih = totalFisik - saldoSistem;

  let status: 'Sesuai' | 'Lebih' | 'Kurang' = 'Sesuai';
  if (selisih > 0) status = 'Lebih';
  if (selisih < 0) status = 'Kurang';

  const handleReset = () => {
    setCounts({
      c100k: 0,
      c50k: 0,
      c20k: 0,
      c10k: 0,
      c5k: 0,
      c2k: 0,
      c1k: 0,
      koin: 0
    });
    setCatatan('');
  };

  const handleSave = () => {
    const item: CashReconciliation = {
      id: generateId('REC'),
      tanggal: getTodayDateString(),
      jam: getCurrentTimeString(),
      petugas: currentUser?.name || 'Kasir',
      saldoSistem,
      saldoFisik: totalFisik,
      selisih,
      status,
      pecahan: {
        '100000': counts.c100k,
        '50000': counts.c50k,
        '20000': counts.c20k,
        '10000': counts.c10k,
        '5000': counts.c5k,
        '2000': counts.c2k,
        '1000': counts.c1k,
        koin: counts.koin
      },
      catatan
    };

    onSaveReconciliation(item);
    alert('Hasil rekonsiliasi kas laci berhasil disimpan ke riwayat!');
  };

  const handleExportPdf = (rec: CashReconciliation) => {
    PdfReportService.generateReconciliationPdf({
      reconciliation: rec,
      settings: settings || {
        namaUsaha: 'ATM MINI BRILINK',
        alamat: 'Indonesia',
        nomorHp: '-',
        namaPemilik: 'Agen BRILink',
        biayaAdminDefault: 5000,
        biayaProviderDefault: 2000,
        lebarKertasPrinter: '58mm',
        catatanStruk: 'Terima Kasih',
        sinkronisasiGoogleSheets: false
      },
      currentUser: currentUser?.name || 'Kasir'
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Rekonsiliasi Kas Laci</h2>
        <p className="text-xs text-slate-500">
          Form penghitungan uang tunai fisik untuk mencocokkan saldo kas sistem dengan uang asli di laci
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Form Input Lembar Pecahan */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Banknote className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                Hitung Lembar Uang Kertas &amp; Koin
              </h3>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>

          <div className="space-y-2.5">
            {[
              { key: 'c100k', label: 'Rp 100.000', val: counts.c100k, subtotal: total100k, color: 'text-rose-600' },
              { key: 'c50k', label: 'Rp 50.000', val: counts.c50k, subtotal: total50k, color: 'text-blue-600' },
              { key: 'c20k', label: 'Rp 20.000', val: counts.c20k, subtotal: total20k, color: 'text-emerald-600' },
              { key: 'c10k', label: 'Rp 10.000', val: counts.c10k, subtotal: total10k, color: 'text-purple-600' },
              { key: 'c5k', label: 'Rp 5.000', val: counts.c5k, subtotal: total5k, color: 'text-amber-600' },
              { key: 'c2k', label: 'Rp 2.000', val: counts.c2k, subtotal: total2k, color: 'text-slate-600' },
              { key: 'c1k', label: 'Rp 1.000', val: counts.c1k, subtotal: total1k, color: 'text-teal-600' },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between gap-3 text-xs p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className={`font-bold w-24 ${item.color}`}>{item.label}</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    value={item.val || ''}
                    onChange={e => setCounts({ ...counts, [item.key]: Math.max(0, parseInt(e.target.value) || 0) })}
                    placeholder="0"
                    className="w-20 px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 font-mono text-center text-xs bg-white dark:bg-slate-800"
                  />
                  <span className="text-slate-400 text-[11px] w-12">lembar</span>
                </div>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200 w-28 text-right">
                  {formatRupiah(item.subtotal)}
                </span>
              </div>
            ))}

            {/* Pecahan Koin */}
            <div className="flex items-center justify-between gap-3 text-xs p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-1 font-bold w-24 text-amber-600">
                <Coins className="w-3.5 h-3.5" />
                <span>Koin (Rp)</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  step={500}
                  value={counts.koin || ''}
                  onChange={e => setCounts({ ...counts, koin: Math.max(0, parseInt(e.target.value) || 0) })}
                  placeholder="0"
                  className="w-32 px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 font-mono text-right text-xs bg-white dark:bg-slate-800"
                />
              </div>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200 w-28 text-right">
                {formatRupiah(totalKoin)}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
              Catatan / Keterangan Selisih:
            </label>
            <input
              type="text"
              value={catatan}
              onChange={e => setCatatan(e.target.value)}
              placeholder="Contoh: Belum memasukkan uang kembalian atau uang sobek"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-800"
            />
          </div>
        </div>

        {/* Right: Perbandingan Saldo & Status */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
            <div className="flex items-center gap-2 border-b pb-3 border-slate-100 dark:border-slate-800">
              <Scale className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                Hasil Perbandingan Kas
              </h3>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex justify-between items-center">
                <span className="text-xs text-slate-500">Saldo Kas Sistem:</span>
                <span className="font-mono font-bold text-base text-slate-800 dark:text-slate-200">
                  {formatRupiah(saldoSistem)}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 flex justify-between items-center">
                <span className="text-xs font-semibold text-blue-800 dark:text-blue-300">Total Uang Fisik Laci:</span>
                <span className="font-mono font-extrabold text-lg text-blue-600 dark:text-blue-400">
                  {formatRupiah(totalFisik)}
                </span>
              </div>

              {/* Selisih */}
              <div
                className={`p-4 rounded-xl border flex flex-col justify-between items-center text-center gap-1 ${
                  status === 'Sesuai'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                    : status === 'Lebih'
                    ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                    : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
                  {status === 'Sesuai' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4" />
                  )}
                  STATUS: {status}
                </div>

                <div className="text-2xl font-black font-mono mt-1">
                  {selisih > 0 ? `+${formatRupiah(selisih)}` : formatRupiah(selisih)}
                </div>

                <p className="text-[11px] opacity-80">
                  {status === 'Sesuai'
                    ? 'Sempurna! Uang fisik di laci cocok dengan catatan sistem.'
                    : status === 'Lebih'
                    ? 'Uang fisik lebih banyak dari pencatatan pembukuan.'
                    : 'Uang fisik di laci kurang dari catatan pembukuan sistem!'}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSave}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs bg-[#02539a] hover:bg-[#003d73] text-white shadow-md transition"
              >
                <Save className="w-4 h-4" />
                Simpan Hasil
              </button>
              <button
                type="button"
                onClick={() => {
                  const currentItem: CashReconciliation = {
                    id: generateId('REC'),
                    tanggal: getTodayDateString(),
                    jam: getCurrentTimeString(),
                    petugas: currentUser?.name || 'Kasir',
                    saldoSistem,
                    saldoFisik: totalFisik,
                    selisih,
                    status,
                    pecahan: {
                      '100000': counts.c100k,
                      '50000': counts.c50k,
                      '20000': counts.c20k,
                      '10000': counts.c10k,
                      '5000': counts.c5k,
                      '2000': counts.c2k,
                      '1000': counts.c1k,
                      koin: counts.koin
                    },
                    catatan
                  };
                  handleExportPdf(currentItem);
                }}
                className="px-4 flex items-center justify-center gap-1.5 py-3 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-900 text-white shadow-sm transition"
                title="Cetak & Unduh Berita Acara Rekonsiliasi Kas Format PDF"
              >
                <Download className="w-4 h-4" />
                Unduh PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Riwayat Rekonsiliasi Sebelumnya */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">Riwayat Rekonsiliasi Kas Laci</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold uppercase border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Waktu</th>
                <th className="px-4 py-3">Petugas</th>
                <th className="px-4 py-3">Saldo Sistem</th>
                <th className="px-4 py-3">Saldo Fisik</th>
                <th className="px-4 py-3">Selisih</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Catatan</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {reconciliationHistory.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-slate-400">
                    Belum ada riwayat rekonsiliasi yang disimpan.
                  </td>
                </tr>
              ) : (
                reconciliationHistory.map(rec => (
                  <tr key={rec.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-mono">
                      {rec.tanggal} <span className="text-slate-400 text-[11px]">{rec.jam}</span>
                    </td>
                    <td className="px-4 py-3 font-medium">{rec.petugas}</td>
                    <td className="px-4 py-3 font-mono">{formatRupiah(rec.saldoSistem)}</td>
                    <td className="px-4 py-3 font-mono font-bold text-blue-600">{formatRupiah(rec.saldoFisik)}</td>
                    <td className="px-4 py-3 font-mono font-bold">
                      <span className={rec.selisih === 0 ? 'text-emerald-600' : rec.selisih > 0 ? 'text-amber-600' : 'text-rose-600'}>
                        {rec.selisih > 0 ? `+${formatRupiah(rec.selisih)}` : formatRupiah(rec.selisih)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          rec.status === 'Sesuai'
                            ? 'bg-emerald-100 text-emerald-800'
                            : rec.status === 'Lebih'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {rec.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{rec.catatan || '-'}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleExportPdf(rec)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 transition"
                        title="Unduh Berita Acara PDF"
                      >
                        <Download className="w-3.5 h-3.5" />
                        PDF
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
