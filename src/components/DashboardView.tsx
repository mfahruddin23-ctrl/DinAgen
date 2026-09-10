import React, { useState } from 'react';
import {
  Transaction,
  CashIn,
  CashOut,
  BalanceSummary,
  BusinessSettings,
  TransactionType,
  NavTab
} from '../types';
import {
  formatRupiah,
  formatTanggalIndo,
  getTodayDateString
} from '../utils/formatters';
import {
  Wallet,
  Building2,
  Receipt,
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldAlert,
  Clock,
  Plus,
  Printer,
  ChevronRight,
  Filter,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Zap,
  ArrowRight,
  SlidersHorizontal
} from 'lucide-react';
import { DashboardCharts } from './DashboardCharts';

interface DashboardViewProps {
  transactions: Transaction[];
  cashIn: CashIn[];
  cashOut: CashOut[];
  balance: BalanceSummary;
  settings: BusinessSettings;
  onNewTransaction: (presetType?: TransactionType) => void;
  onViewAllTransactions: () => void;
  onPrintReceipt: (transaction: Transaction) => void;
  onSelectTab?: (tab: NavTab) => void;
}

type FilterPeriod = 'today' | 'week' | 'month' | 'year' | 'custom';

export const DashboardView: React.FC<DashboardViewProps> = ({
  transactions,
  cashIn,
  cashOut,
  balance,
  settings,
  onNewTransaction,
  onViewAllTransactions,
  onPrintReceipt,
  onSelectTab
}) => {
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('today');
  const [customStartDate, setCustomStartDate] = useState(getTodayDateString());
  const [customEndDate, setCustomEndDate] = useState(getTodayDateString());

  const todayStr = getTodayDateString();
  const currentMonthStr = todayStr.substring(0, 7);
  const currentYearStr = todayStr.substring(0, 4);

  // Filtered transactions for stats
  const filteredTransactions = transactions.filter(t => {
    if (!t.tanggal) return false;
    if (filterPeriod === 'today') return t.tanggal === todayStr;
    if (filterPeriod === 'month') return t.tanggal.startsWith(currentMonthStr);
    if (filterPeriod === 'year') return t.tanggal.startsWith(currentYearStr);
    if (filterPeriod === 'week') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      const weekAgo = d.toISOString().slice(0, 10);
      return t.tanggal >= weekAgo && t.tanggal <= todayStr;
    }
    if (filterPeriod === 'custom') {
      return t.tanggal >= customStartDate && t.tanggal <= customEndDate;
    }
    return true;
  });

  const filteredCashIn = cashIn.filter(c => {
    if (filterPeriod === 'today') return c.tanggal === todayStr;
    if (filterPeriod === 'month') return c.tanggal.startsWith(currentMonthStr);
    if (filterPeriod === 'year') return c.tanggal.startsWith(currentYearStr);
    if (filterPeriod === 'week') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      const weekAgo = d.toISOString().slice(0, 10);
      return c.tanggal >= weekAgo;
    }
    if (filterPeriod === 'custom') {
      return c.tanggal >= customStartDate && c.tanggal <= customEndDate;
    }
    return true;
  });

  const filteredCashOut = cashOut.filter(c => {
    if (filterPeriod === 'today') return c.tanggal === todayStr;
    if (filterPeriod === 'month') return c.tanggal.startsWith(currentMonthStr);
    if (filterPeriod === 'year') return c.tanggal.startsWith(currentYearStr);
    if (filterPeriod === 'week') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      const weekAgo = d.toISOString().slice(0, 10);
      return c.tanggal >= weekAgo;
    }
    if (filterPeriod === 'custom') {
      return c.tanggal >= customStartDate && c.tanggal <= customEndDate;
    }
    return true;
  });

  // Calculate Metrics
  const successTrx = filteredTransactions.filter(t => t.status === 'Berhasil');
  const pendingCount = filteredTransactions.filter(t => t.status === 'Pending').length;
  const canceledCount = filteredTransactions.filter(t => t.status === 'Dibatalkan' || t.status === 'Gagal').length;

  const totalNominalTrx = successTrx.reduce((acc, t) => acc + t.nominal, 0);
  const totalBiayaAdmin = successTrx.reduce((acc, t) => acc + t.biayaAdmin, 0);
  const totalKeuntungan = successTrx.reduce((acc, t) => acc + t.keuntungan, 0);

  const totalPemasukan = successTrx.reduce((acc, t) => acc + t.totalBayar, 0) +
    filteredCashIn.reduce((acc, c) => acc + c.nominal, 0);

  const totalPengeluaran = successTrx.reduce((acc, t) => acc + t.modalTransaksi, 0) +
    filteredCashOut.reduce((acc, c) => acc + c.nominal, 0);

  // Today & Month transaction counts
  const trxCountToday = transactions.filter(t => t.tanggal === todayStr).length;
  const trxCountMonth = transactions.filter(t => t.tanggal && t.tanggal.startsWith(currentMonthStr)).length;

  // Recent 5 transactions
  const recentTransactions = transactions.slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Top Banner: Quick Action & Saldo Overview */}
      <div className="bg-gradient-to-r from-[#02539a] via-[#0262b5] to-[#003d73] rounded-3xl p-6 sm:p-7 text-white shadow-xl relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-[#f37021]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-blue-100">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Sistem Kasir & Rekap Pembukuan BRILink Aktif
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {settings.namaUsaha}
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed">
              Pantau arus perputaran modal fisik kas laci, saldo rekening EDC BRILink, dan akumulasi laba admin harian secara presisi.
            </p>
          </div>

          {/* Big Quick Transaction CTA */}
          <div className="flex-shrink-0 w-full md:w-auto">
            <button
              onClick={() => onNewTransaction()}
              className="w-full md:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-[#f37021] hover:bg-[#e06114] text-white font-extrabold text-base shadow-lg shadow-orange-500/40 transform transition hover:-translate-y-0.5 active:scale-98"
            >
              <Plus className="w-6 h-6 stroke-[3]" />
              + TRANSAKSI BARU
            </button>
          </div>
        </div>

        {/* Popular Transaction Fast Shortcuts */}
        <div className="mt-6 pt-5 border-t border-white/15 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-blue-200 uppercase tracking-wider flex items-center gap-1 mr-1">
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            Layanan Populer:
          </span>
          {[
            { label: 'TARIK TUNAI', type: 'Tarik Tunai' as TransactionType },
            { label: 'TRANSFER', type: 'Transfer' as TransactionType },
            { label: 'SETOR TUNAI', type: 'Setor Tunai' as TransactionType },
            { label: 'PLN TOKEN', type: 'Token PLN' as TransactionType },
            { label: 'PULSA', type: 'Pulsa' as TransactionType },
            { label: 'TOP UP DANA', type: 'Top Up DANA' as TransactionType },
          ].map(shortcut => (
            <button
              key={shortcut.label}
              onClick={() => onNewTransaction(shortcut.type)}
              className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition border border-white/20 hover:border-white/40 active:scale-95"
            >
              [ {shortcut.label} ]
            </button>
          ))}
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Filter Data Dashboard:
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { id: 'today', label: 'Hari Ini' },
              { id: 'week', label: '7 Hari Terakhir' },
              { id: 'month', label: 'Bulan Ini' },
              { id: 'year', label: 'Tahun Ini' },
              { id: 'custom', label: 'Custom Tanggal' }
            ] as const
          ).map(btn => (
            <button
              key={btn.id}
              onClick={() => setFilterPeriod(btn.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                filterPeriod === btn.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {filterPeriod === 'custom' && (
          <div className="flex items-center gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
            <input
              type="date"
              value={customStartDate}
              onChange={e => setCustomStartDate(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800"
            />
            <span className="text-xs text-slate-400">s/d</span>
            <input
              type="date"
              value={customEndDate}
              onChange={e => setCustomEndDate(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800"
            />
          </div>
        )}
      </div>

      {/* PRIMARY STAT CARDS: SALDO & PROFIT */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Saldo Kas Tunai */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-blue-400 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Saldo Kas Tunai (Laci)</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-extrabold text-slate-900 dark:text-white">
              {formatRupiah(balance.kasTunai)}
            </div>
            <div className="flex items-center justify-between mt-1">
              <p className="text-[11px] text-slate-500">Uang fisik tunai siap pakai</p>
              {onSelectTab && (
                <button
                  onClick={() => onSelectTab('pengaturan-kas')}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1"
                >
                  <SlidersHorizontal className="w-3 h-3" /> Atur / Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Saldo Rekening BRILink */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-blue-400 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Saldo Rekening BRILink</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-extrabold text-slate-900 dark:text-white">
              {formatRupiah(balance.rekeningBRILink)}
            </div>
            <div className="flex items-center justify-between mt-1">
              <p className="text-[11px] text-slate-500">Saldo mutasi rekening EDC/Web</p>
              {onSelectTab && (
                <button
                  onClick={() => onSelectTab('pengaturan-kas')}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 hover:underline inline-flex items-center gap-1"
                >
                  <SlidersHorizontal className="w-3 h-3" /> Atur / Mutasi
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Total Keuntungan Bersih */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/20 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Total Keuntungan</span>
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-extrabold text-emerald-700 dark:text-emerald-400">
              {formatRupiah(totalKeuntungan)}
            </div>
            <p className="text-[11px] text-emerald-600/80 mt-1">Admin dikurangi biaya provider</p>
          </div>
        </div>

        {/* Total Biaya Admin Diterima */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Biaya Admin</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-extrabold text-slate-900 dark:text-white">
              {formatRupiah(totalBiayaAdmin)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Pendapatan kotor fee admin</p>
          </div>
        </div>
      </div>

      {/* SECONDARY STATS: CASHFLOW & TRANSACTIONS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
            <span>Total Pemasukan</span>
          </div>
          <div className="text-base font-bold text-slate-800 dark:text-slate-100 mt-1">
            {formatRupiah(totalPemasukan)}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <ArrowUpRight className="w-4 h-4 text-rose-600" />
            <span>Total Pengeluaran</span>
          </div>
          <div className="text-base font-bold text-slate-800 dark:text-slate-100 mt-1">
            {formatRupiah(totalPengeluaran)}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Trx Hari Ini</span>
          </div>
          <div className="text-base font-bold text-slate-800 dark:text-slate-100 mt-1">
            {trxCountToday} Transaksi
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
            <span>Trx Bulan Ini</span>
          </div>
          <div className="text-base font-bold text-slate-800 dark:text-slate-100 mt-1">
            {trxCountMonth} Transaksi
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>Trx Pending</span>
          </div>
          <div className="text-base font-bold text-slate-800 dark:text-slate-100 mt-1">
            {pendingCount} Transaksi
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <XCircle className="w-4 h-4 text-rose-600" />
            <span>Trx Dibatalkan</span>
          </div>
          <div className="text-base font-bold text-slate-800 dark:text-slate-100 mt-1">
            {canceledCount} Transaksi
          </div>
        </div>
      </div>

      {/* 5 CHARTS SECTION */}
      <DashboardCharts
        transactions={transactions}
        cashIn={cashIn}
        cashOut={cashOut}
        filterType={filterPeriod}
      />

      {/* RECENT TRANSACTIONS TABLE WITH QUICK PRINT */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Transaksi Terkini</h3>
            <p className="text-xs text-slate-500">Daftar transaksi yang baru saja dilayani</p>
          </div>
          <button
            onClick={onViewAllTransactions}
            className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 transition"
          >
            Lihat Semua Transaksi
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold uppercase border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3">No. Transaksi</th>
                <th className="px-4 py-3">Waktu</th>
                <th className="px-4 py-3">Pelanggan</th>
                <th className="px-4 py-3">Jenis Layanan</th>
                <th className="px-4 py-3">Nominal</th>
                <th className="px-4 py-3">Biaya Admin</th>
                <th className="px-4 py-3">Keuntungan</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentTransactions.map(t => (
                <tr key={t.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                  <td className="px-5 py-3.5 font-mono font-bold text-slate-800 dark:text-slate-200">
                    {t.noTransaksi}
                  </td>
                  <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400">
                    {t.tanggal} <span className="font-mono text-[11px]">{t.jam}</span>
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-slate-800 dark:text-slate-200">
                    {t.pelanggan || '-'}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-medium">
                      {t.jenisTransaksi}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-bold font-mono text-slate-900 dark:text-slate-100">
                    {formatRupiah(t.nominal)}
                  </td>
                  <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400 font-mono">
                    {formatRupiah(t.biayaAdmin)}
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                    {formatRupiah(t.keuntungan)}
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        t.status === 'Berhasil'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : t.status === 'Pending'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button
                      onClick={() => onPrintReceipt(t)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition"
                      title="Cetak Struk Thermal"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
