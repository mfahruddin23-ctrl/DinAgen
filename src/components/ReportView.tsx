import React, { useState } from 'react';
import {
  Transaction,
  CashIn,
  CashOut,
  DailyClosing,
  BalanceSummary,
  BusinessSettings,
  User
} from '../types';
import {
  formatRupiah,
  formatTanggalIndo,
  getTodayDateString
} from '../utils/formatters';
import {
  Calendar,
  FileSpreadsheet,
  Printer,
  Download,
  Lock,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Scale,
  BarChart3,
  CheckCircle,
  HelpCircle,
  FileText
} from 'lucide-react';
import { PdfReportService } from '../services/pdfReportService';

interface ReportViewProps {
  mode: 'harian' | 'bulanan' | 'laporan';
  transactions: Transaction[];
  cashInList: CashIn[];
  cashOutList: CashOut[];
  dailyClosings: DailyClosing[];
  balance: BalanceSummary;
  settings: BusinessSettings;
  currentUser: User | null;
  onSaveDailyClosing: (closing: DailyClosing) => void;
}

export const ReportView: React.FC<ReportViewProps> = ({
  mode,
  transactions,
  cashInList,
  cashOutList,
  dailyClosings,
  balance,
  settings,
  currentUser,
  onSaveDailyClosing
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [selectedMonth, setSelectedMonth] = useState<string>(getTodayDateString().slice(0, 7));

  // --- REKAP HARIAN CALCULATIONS ---
  const dayTrx = transactions.filter(t => t.tanggal === selectedDate && t.status === 'Berhasil');
  const dayCashIn = cashInList.filter(c => c.tanggal === selectedDate);
  const dayCashOut = cashOutList.filter(c => c.tanggal === selectedDate);

  const dayTotalTrxCount = dayTrx.length;
  const dayTotalNominal = dayTrx.reduce((sum, t) => sum + t.nominal, 0);
  const dayTotalAdmin = dayTrx.reduce((sum, t) => sum + t.biayaAdmin, 0);
  const dayTotalKeuntungan = dayTrx.reduce((sum, t) => sum + t.keuntungan, 0);
  const dayPemasukan = dayTrx.reduce((sum, t) => sum + t.totalBayar, 0) + dayCashIn.reduce((sum, c) => sum + c.nominal, 0);
  const dayPengeluaran = dayTrx.reduce((sum, t) => sum + t.modalTransaksi, 0) + dayCashOut.reduce((sum, c) => sum + c.nominal, 0);

  const isClosedToday = dailyClosings.some(d => d.tanggal === selectedDate);

  const handleTutupBukuHarian = () => {
    if (confirm(`Tutup buku untuk tanggal ${formatTanggalIndo(selectedDate)}? Data ringkasan harian akan dikunci.`)) {
      const closing: DailyClosing = {
        id: `CLS-${selectedDate}`,
        tanggal: selectedDate,
        totalTransaksi: dayTotalTrxCount,
        totalNominal: dayTotalNominal,
        totalBiayaAdmin: dayTotalAdmin,
        totalKeuntungan: dayTotalKeuntungan,
        totalPemasukanKas: dayPemasukan,
        totalPengeluaranKas: dayPengeluaran,
        saldoAwal: balance.kasTunai - (dayPemasukan - dayPengeluaran),
        saldoAkhir: balance.kasTunai,
        selisihKas: 0,
        statusTutupBuku: true,
        petugasTutupBuku: currentUser?.name || 'Kasir',
        closedAt: new Date().toISOString()
      };
      onSaveDailyClosing(closing);
      alert('Tutup buku harian berhasil dieksekusi!');
    }
  };

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handlePrintDailyPdf = () => {
    setIsGeneratingPdf(true);
    try {
      const closingRecord = dailyClosings.find(c => c.tanggal === selectedDate);
      PdfReportService.generateDailyReportPdf({
        selectedDate,
        transactions,
        cashIn: cashInList,
        cashOut: cashOutList,
        closingRecord,
        settings,
        currentUser: currentUser?.name || 'Kasir'
      });
    } catch (err) {
      console.error('Gagal membuat PDF Harian:', err);
      alert('Terjadi kesalahan saat memproses laporan PDF.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrintMonthlyPdf = () => {
    setIsGeneratingPdf(true);
    try {
      PdfReportService.generateMonthlyReportPdf({
        selectedMonth,
        transactions,
        cashIn: cashInList,
        cashOut: cashOutList,
        settings,
        currentUser: currentUser?.name || 'Kasir'
      });
    } catch (err) {
      console.error('Gagal membuat PDF Bulanan:', err);
      alert('Terjadi kesalahan saat memproses laporan PDF.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrintFinancialPdf = () => {
    setIsGeneratingPdf(true);
    try {
      PdfReportService.generateFinancialReportPdf({
        selectedMonth,
        transactions,
        cashIn: cashInList,
        cashOut: cashOutList,
        balance,
        settings,
        currentUser: currentUser?.name || 'Kasir'
      });
    } catch (err) {
      console.error('Gagal membuat PDF Keuangan:', err);
      alert('Terjadi kesalahan saat memproses laporan PDF.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrintRekap = () => {
    window.print();
  };

  // --- REKAP BULANAN CALCULATIONS ---
  const monthTrx = transactions.filter(t => t.tanggal?.startsWith(selectedMonth) && t.status === 'Berhasil');
  const monthCashIn = cashInList.filter(c => c.tanggal?.startsWith(selectedMonth));
  const monthCashOut = cashOutList.filter(c => c.tanggal?.startsWith(selectedMonth));

  const monthTotalCount = monthTrx.length;
  const monthOmset = monthTrx.reduce((s, t) => s + t.nominal, 0);
  const monthPendapatanAdmin = monthTrx.reduce((s, t) => s + t.biayaAdmin, 0);
  const monthBiayaProvider = monthTrx.reduce((s, t) => s + t.biayaProvider, 0);
  const monthKeuntunganTrx = monthTrx.reduce((s, t) => s + t.keuntungan, 0);
  const monthBiayaOperasional = monthCashOut.reduce((s, c) => s + c.nominal, 0);
  const monthLabaBersih = monthKeuntunganTrx - monthBiayaOperasional;
  const monthAvgPerDay = Math.round(monthTotalCount / 30);

  // --- FINANCIAL STATEMENTS CALCULATIONS ---
  // 1. Laba Rugi
  const labaKotor = monthPendapatanAdmin - monthBiayaProvider;
  const bebanOperasional = monthBiayaOperasional;
  const labaBersihAkhir = labaKotor - bebanOperasional;

  // 2. Neraca
  const asetKasFisik = balance.kasTunai;
  const asetRekening = balance.rekeningBRILink;
  const totalAset = asetKasFisik + asetRekening;
  const modalAwal = 50000000;
  const labaDitahan = totalAset - modalAwal;

  return (
    <div className="space-y-6">
      {/* 1. REKAP HARIAN */}
      {mode === 'harian' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Rekap Transaksi Harian</h2>
              <p className="text-xs text-slate-500">Laporan penutupan buku kasir dan evaluasi kinerja harian</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-800"
              />
              <button
                onClick={handlePrintDailyPdf}
                disabled={isGeneratingPdf}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#02539a] hover:bg-[#003d73] text-white shadow-xs transition"
                title="Cetak dan Unduh Laporan Rekap Harian Format PDF"
              >
                <Download className="w-4 h-4" />
                {isGeneratingPdf ? 'Membuat PDF...' : 'Cetak / Unduh PDF'}
              </button>
              <button
                onClick={handlePrintRekap}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition"
                title="Cetak langsung ke printer"
              >
                <Printer className="w-4 h-4" />
                Cetak Kertas
              </button>
              <button
                disabled={isClosedToday}
                onClick={handleTutupBukuHarian}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition ${
                  isClosedToday
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                    : 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm'
                }`}
              >
                <Lock className="w-4 h-4" />
                {isClosedToday ? 'Buku Sudah Ditutup' : 'Tutup Buku Harian'}
              </button>
            </div>
          </div>

          {/* PRINTABLE REKAP SUMMARY CARD */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
            <div className="border-b pb-4 border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-blue-600 tracking-wider">REKAP OPERASIONAL</span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {formatTanggalIndo(selectedDate)}
                </h3>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Status Tutup Buku:</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isClosedToday ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {isClosedToday ? 'TUTUP BUKU SELESAI' : 'AKTIF BERJALAN'}
                </span>
              </div>
            </div>

            {/* Metrics 4 Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <span className="text-xs text-slate-500">Frekuensi Transaksi</span>
                <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                  {dayTotalTrxCount} <span className="text-xs font-normal text-slate-500">Trx</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <span className="text-xs text-slate-500">Total Nominal Volume</span>
                <div className="text-lg font-extrabold font-mono text-slate-900 dark:text-white mt-1">
                  {formatRupiah(dayTotalNominal)}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/40">
                <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">Biaya Admin Diterima</span>
                <div className="text-lg font-extrabold font-mono text-blue-600 dark:text-blue-400 mt-1">
                  {formatRupiah(dayTotalAdmin)}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/40">
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Keuntungan Bersih Hari Ini</span>
                <div className="text-xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                  {formatRupiah(dayTotalKeuntungan)}
                </div>
              </div>
            </div>

            {/* Detail Cashflow Harian */}
            <div className="border-t pt-4 border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-2">
                <div className="font-bold text-slate-700 dark:text-slate-300">Arus Uang Masuk Hari Ini:</div>
                <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800">
                  <span>Pembayaran Nasabah (Nominal + Admin):</span>
                  <span className="font-mono font-semibold">{formatRupiah(dayTrx.reduce((s, t) => s + t.totalBayar, 0))}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800">
                  <span>Kas Masuk Lainnya / Modal:</span>
                  <span className="font-mono font-semibold">{formatRupiah(dayCashIn.reduce((s, c) => s + c.nominal, 0))}</span>
                </div>
                <div className="flex justify-between py-1 font-bold text-emerald-600">
                  <span>Total Uang Masuk Kas:</span>
                  <span className="font-mono">{formatRupiah(dayPemasukan)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="font-bold text-slate-700 dark:text-slate-300">Arus Uang Keluar Hari Ini:</div>
                <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800">
                  <span>Pencairan Modal Tarik Tunai:</span>
                  <span className="font-mono font-semibold">{formatRupiah(dayTrx.reduce((s, t) => s + t.modalTransaksi, 0))}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800">
                  <span>Pengeluaran Operasional Toko:</span>
                  <span className="font-mono font-semibold">{formatRupiah(dayCashOut.reduce((s, c) => s + c.nominal, 0))}</span>
                </div>
                <div className="flex justify-between py-1 font-bold text-rose-600">
                  <span>Total Modal / Kas Keluar:</span>
                  <span className="font-mono">{formatRupiah(dayPengeluaran)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. REKAP BULANAN */}
      {mode === 'bulanan' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Rekap Performa Bulanan</h2>
              <p className="text-xs text-slate-500">Analisis kinerja bisnis bulanan dan perbandingan pertumbuhan</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="month"
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-800"
              />
              <button
                onClick={handlePrintMonthlyPdf}
                disabled={isGeneratingPdf}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#02539a] hover:bg-[#003d73] text-white shadow-xs transition"
                title="Cetak & Unduh Laporan Performa Bulanan Format PDF"
              >
                <Download className="w-4 h-4" />
                {isGeneratingPdf ? 'Membuat PDF...' : 'Cetak / Unduh PDF Bulanan'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs text-slate-500">Total Transaksi 1 Bulan</span>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {monthTotalCount} <span className="text-xs font-normal text-slate-500">Transaksi</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Rata-rata ~{monthAvgPerDay} trx / hari</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs text-slate-500">Total Omset Perputaran</span>
              <div className="text-lg font-extrabold font-mono text-slate-900 dark:text-white mt-1">
                {formatRupiah(monthOmset)}
              </div>
              <p className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1 font-semibold">
                <TrendingUp className="w-3.5 h-3.5" />
                Volume Perputaran Modal
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs text-slate-500">Total Pendapatan Admin</span>
              <div className="text-lg font-extrabold font-mono text-blue-600 dark:text-blue-400 mt-1">
                {formatRupiah(monthPendapatanAdmin)}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Fee admin kotor nasabah</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/20 shadow-xs">
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Laba Bersih Akhir</span>
              <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                {formatRupiah(monthLabaBersih)}
              </div>
              <p className="text-[11px] text-emerald-600 mt-1">Keuntungan - Operasional</p>
            </div>
          </div>
        </div>
      )}

      {/* 3. LAPORAN KEUANGAN LENGKAP (LABA RUGI, ARUS KAS, NERACA) */}
      {mode === 'laporan' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Laporan Keuangan Komprehensif</h2>
              <p className="text-xs text-slate-500">Standar akuntansi pembukuan: Laba Rugi, Arus Kas, dan Neraca</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrintFinancialPdf}
                disabled={isGeneratingPdf}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#02539a] hover:bg-[#003d73] text-white shadow-sm transition"
                title="Cetak & Unduh Laporan Keuangan Format PDF"
              >
                <Download className="w-4 h-4" />
                {isGeneratingPdf ? 'Membuat PDF...' : 'Cetak / Unduh PDF Keuangan'}
              </button>
              <button
                onClick={handlePrintRekap}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition"
              >
                <Printer className="w-4 h-4" />
                Cetak Kertas
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Laporan Laba Rugi */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="border-b pb-3 border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase text-blue-600">LAPORAN 1</span>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Laba Rugi (Profit &amp; Loss)</h3>
              </div>
              <div className="space-y-2 text-xs">
                <div className="font-bold text-slate-700 dark:text-slate-300">Pendapatan:</div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Biaya Admin Transaksi:</span>
                  <span className="font-mono font-semibold">{formatRupiah(monthPendapatanAdmin)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Biaya Fee Provider:</span>
                  <span className="font-mono text-rose-500">-{formatRupiah(monthBiayaProvider)}</span>
                </div>
                <div className="flex justify-between py-1 font-bold border-t pt-1 border-slate-100 dark:border-slate-800">
                  <span>Laba Kotor:</span>
                  <span className="font-mono text-blue-600">{formatRupiah(labaKotor)}</span>
                </div>

                <div className="font-bold text-slate-700 dark:text-slate-300 pt-3">Beban Operasional:</div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Kertas Struk, Kuota, Listrik:</span>
                  <span className="font-mono text-rose-500">-{formatRupiah(bebanOperasional)}</span>
                </div>

                <div className="flex justify-between py-3 font-extrabold border-t-2 border-dashed pt-2 border-slate-300 dark:border-slate-700 text-sm">
                  <span className="text-emerald-700 dark:text-emerald-300">LABA BERSIH:</span>
                  <span className="font-mono text-emerald-600 text-base">{formatRupiah(labaBersihAkhir)}</span>
                </div>
              </div>
            </div>

            {/* Laporan Arus Kas */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="border-b pb-3 border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase text-indigo-600">LAPORAN 2</span>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Arus Kas (Cash Flow)</h3>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Total Arus Uang Masuk:</span>
                  <span className="font-mono font-bold text-emerald-600">+{formatRupiah(dayPemasukan)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Total Arus Uang Keluar:</span>
                  <span className="font-mono font-bold text-rose-600">-{formatRupiah(dayPengeluaran)}</span>
                </div>
                <div className="flex justify-between py-2 border-t border-slate-100 dark:border-slate-800 font-bold">
                  <span>Net Perubahan Kas:</span>
                  <span className="font-mono text-blue-600">
                    {formatRupiah(dayPemasukan - dayPengeluaran)}
                  </span>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Saldo Kas Tunai Saat Ini:</span>
                    <span className="font-mono font-bold">{formatRupiah(balance.kasTunai)}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Saldo Rekening BRILink:</span>
                    <span className="font-mono font-bold text-indigo-600">{formatRupiah(balance.rekeningBRILink)}</span>
                  </div>
                  <div className="flex justify-between py-2 bg-slate-50 dark:bg-slate-800/80 px-2 rounded-lg font-extrabold">
                    <span>Total Likuiditas:</span>
                    <span className="font-mono text-sm text-blue-600">
                      {formatRupiah(balance.kasTunai + balance.rekeningBRILink)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Laporan Neraca Sederhana */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="border-b pb-3 border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase text-purple-600">LAPORAN 3</span>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Neraca (Balance Sheet)</h3>
              </div>
              <div className="space-y-2 text-xs">
                <div className="font-bold text-slate-700 dark:text-slate-300">Aktiva (Aset Lancar):</div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Kas Fisik Laci:</span>
                  <span className="font-mono">{formatRupiah(asetKasFisik)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Saldo Rekening EDC BRILink:</span>
                  <span className="font-mono">{formatRupiah(asetRekening)}</span>
                </div>
                <div className="flex justify-between py-1 font-bold border-t border-slate-100 dark:border-slate-800">
                  <span>TOTAL AKTIVA:</span>
                  <span className="font-mono text-blue-600">{formatRupiah(totalAset)}</span>
                </div>

                <div className="font-bold text-slate-700 dark:text-slate-300 pt-3">Pasiva (Kewajiban &amp; Ekuitas):</div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Kewajiban / Titipan Nasabah:</span>
                  <span className="font-mono">Rp 0</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Modal Disetor &amp; Saldo Awal:</span>
                  <span className="font-mono">{formatRupiah(modalAwal)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Laba Usaha Akumulatif:</span>
                  <span className="font-mono text-emerald-600">{formatRupiah(labaDitahan)}</span>
                </div>
                <div className="flex justify-between py-1 font-bold border-t border-slate-100 dark:border-slate-800">
                  <span>TOTAL PASIVA:</span>
                  <span className="font-mono text-blue-600">{formatRupiah(totalAset)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
