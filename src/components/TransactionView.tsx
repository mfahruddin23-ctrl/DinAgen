import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType, TransactionStatus, UserRole, BusinessSettings, User } from '../types';
import { formatRupiah, formatTanggalIndo } from '../utils/formatters';
import { PdfReportService } from '../services/pdfReportService';
import {
  Search,
  Filter,
  Printer,
  Edit2,
  Trash2,
  Download,
  Plus,
  ArrowUpDown,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText
} from 'lucide-react';

interface TransactionViewProps {
  transactions: Transaction[];
  userRole?: UserRole;
  settings?: BusinessSettings;
  currentUser?: User | null;
  onNewTransaction: () => void;
  onEditTransaction: (trx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onPrintReceipt: (trx: Transaction) => void;
}

export const TransactionView: React.FC<TransactionViewProps> = ({
  transactions,
  userRole = 'ADMIN',
  settings,
  currentUser,
  onNewTransaction,
  onEditTransaction,
  onDeleteTransaction,
  onPrintReceipt
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'nominal' | 'keuntungan'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDetail, setSelectedDetail] = useState<Transaction | null>(null);

  const itemsPerPage = 10;

  // Filtered & Sorted list
  const filteredList = useMemo(() => {
    return transactions.filter(t => {
      // Search debounce check
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchNo = t.noTransaksi?.toLowerCase().includes(q);
        const matchName = t.pelanggan?.toLowerCase().includes(q);
        const matchHp = t.noHp?.includes(q);
        const matchRek = t.noRekeningTujuan?.toLowerCase().includes(q);
        const matchKet = t.keterangan?.toLowerCase().includes(q);
        if (!matchNo && !matchName && !matchHp && !matchRek && !matchKet) {
          return false;
        }
      }

      // Type filter
      if (typeFilter !== 'ALL' && t.jenisTransaksi !== typeFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'ALL' && t.status !== statusFilter) {
        return false;
      }

      // Date range
      if (startDate && t.tanggal < startDate) return false;
      if (endDate && t.tanggal > endDate) return false;

      return true;
    }).sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'date') {
        const d1 = `${a.tanggal} ${a.jam}`;
        const d2 = `${b.tanggal} ${b.jam}`;
        cmp = d1.localeCompare(d2);
      } else if (sortBy === 'nominal') {
        cmp = a.nominal - b.nominal;
      } else if (sortBy === 'keuntungan') {
        cmp = a.keuntungan - b.keuntungan;
      }
      return sortOrder === 'desc' ? -cmp : cmp;
    });
  }, [transactions, searchTerm, typeFilter, statusFilter, startDate, endDate, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredList.length / itemsPerPage) || 1;
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredList.slice(start, start + itemsPerPage);
  }, [filteredList, currentPage]);

  const handleExportCSV = () => {
    const headers = [
      'No Transaksi',
      'Tanggal',
      'Jam',
      'Pelanggan',
      'No HP',
      'Jenis Transaksi',
      'Nomor Tujuan',
      'Nominal',
      'Biaya Admin',
      'Biaya Provider',
      'Total Bayar',
      'Keuntungan',
      'Metode Pembayaran',
      'Status',
      'Petugas',
      'Keterangan'
    ];

    const rows = filteredList.map(t => [
      t.noTransaksi,
      t.tanggal,
      t.jam,
      `"${t.pelanggan || '-'}"`,
      `"${t.noHp || '-'}"`,
      `"${t.jenisTransaksi}"`,
      `"${t.noRekeningTujuan || '-'}"`,
      t.nominal,
      t.biayaAdmin,
      t.biayaProvider,
      t.totalBayar,
      t.keuntungan,
      t.metodePembayaran,
      t.status,
      `"${t.petugas}"`,
      `"${t.keterangan || '-'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `TRANSAKSI_BRILINK_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    const filterInfo = [
      typeFilter !== 'ALL' ? `Layanan: ${typeFilter}` : null,
      statusFilter !== 'ALL' ? `Status: ${statusFilter}` : null,
      searchTerm ? `Pencarian: "${searchTerm}"` : null
    ].filter(Boolean).join(' | ') || 'Semua Data';

    PdfReportService.generateTransactionListPdf({
      transactions: filteredList,
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
      currentUser: currentUser?.name || 'Kasir',
      filterLabel: filterInfo
    });
  };

  const handleDelete = (id: string, noTrx: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus transaksi ${noTrx}? Tindakan ini akan dicatat dalam audit log.`)) {
      onDeleteTransaction(id);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Data Transaksi BRILink</h2>
          <p className="text-xs text-slate-500">Catat dan kelola seluruh transaksi nasabah agen ATM Mini</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[#02539a] hover:bg-[#003d73] text-white shadow-xs transition"
            title="Cetak dan Unduh Daftar Transaksi Format PDF"
          >
            <Download className="w-4 h-4" />
            Cetak / Unduh PDF
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Export CSV
          </button>
          <button
            onClick={onNewTransaction}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#02539a] hover:bg-[#003d73] text-white shadow-sm transition"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            Tambah Transaksi
          </button>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Cari no trx, pelanggan, nomor rekening..."
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Jenis Transaksi */}
          <div>
            <select
              value={typeFilter}
              onChange={e => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Semua Jenis Layanan</option>
              <option value="Tarik Tunai">Tarik Tunai</option>
              <option value="Setor Tunai">Setor Tunai</option>
              <option value="Transfer">Transfer</option>
              <option value="Transfer Antar Bank">Transfer Antar Bank</option>
              <option value="Token PLN">Token PLN</option>
              <option value="Pembayaran PLN">Pembayaran PLN</option>
              <option value="Top Up DANA">Top Up DANA</option>
              <option value="Top Up ShopeePay">Top Up ShopeePay</option>
              <option value="Pulsa">Pulsa</option>
              <option value="BPJS">BPJS</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <select
              value={statusFilter}
              onChange={e => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Semua Status</option>
              <option value="Berhasil">Berhasil</option>
              <option value="Pending">Pending</option>
              <option value="Dibatalkan">Dibatalkan</option>
              <option value="Gagal">Gagal</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <button
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              <span className="flex items-center gap-1">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                Urut: {sortBy === 'date' ? 'Waktu' : sortBy === 'nominal' ? 'Nominal' : 'Keuntungan'}
              </span>
              <span className="text-[10px] font-bold uppercase text-blue-600">{sortOrder}</span>
            </button>
          </div>
        </div>

        {/* Date Filter row */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <span className="text-slate-500">Rentang Tanggal:</span>
          <input
            type="date"
            value={startDate}
            onChange={e => {
              setStartDate(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800"
          />
          <span className="text-slate-400">s/d</span>
          <input
            type="date"
            value={endDate}
            onChange={e => {
              setEndDate(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800"
          />
          {(startDate || endDate || searchTerm || typeFilter !== 'ALL' || statusFilter !== 'ALL') && (
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setSearchTerm('');
                setTypeFilter('ALL');
                setStatusFilter('ALL');
              }}
              className="text-xs text-rose-600 hover:underline ml-2"
            >
              Reset Filter
            </button>
          )}
          <span className="ml-auto text-slate-400 text-xs">
            Ditemukan: <strong>{filteredList.length}</strong> data
          </span>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold uppercase border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3.5">No. Transaksi</th>
                <th className="px-4 py-3.5">Waktu</th>
                <th className="px-4 py-3.5">Pelanggan</th>
                <th className="px-4 py-3.5">Jenis Transaksi</th>
                <th className="px-4 py-3.5">No. Rekening / Tujuan</th>
                <th className="px-4 py-3.5">Nominal</th>
                <th className="px-4 py-3.5">Admin</th>
                <th className="px-4 py-3.5">Total Bayar</th>
                <th className="px-4 py-3.5">Keuntungan</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedList.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    Tidak ada data transaksi yang sesuai filter.
                  </td>
                </tr>
              ) : (
                paginatedList.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                      {t.noTransaksi}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {t.tanggal} <span className="font-mono text-[11px] text-slate-400">{t.jam}</span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{t.pelanggan || '-'}</div>
                      <div className="text-[10px] text-slate-400">{t.noHp || '-'}</div>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-medium text-[11px]">
                        {t.jenisTransaksi}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-600 dark:text-slate-400 max-w-[150px] truncate">
                      {t.noRekeningTujuan || '-'}
                    </td>
                    <td className="px-4 py-3.5 font-bold font-mono text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      {formatRupiah(t.nominal)}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {formatRupiah(t.biayaAdmin)}
                    </td>
                    <td className="px-4 py-3.5 font-bold font-mono text-blue-600 dark:text-blue-400 whitespace-nowrap">
                      {formatRupiah(t.totalBayar)}
                    </td>
                    <td className="px-4 py-3.5 font-bold font-mono text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                      +{formatRupiah(t.keuntungan)}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
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
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedDetail(t)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Detail Transaksi"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onPrintReceipt(t)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Cetak Struk Thermal"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        {(userRole === 'ADMIN' || userRole === 'OPERATOR') && (
                          <button
                            onClick={() => onEditTransaction(t)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Ubah Transaksi"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {userRole === 'ADMIN' && (
                          <button
                            onClick={() => handleDelete(t.id, t.noTransaksi)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                            title="Hapus Transaksi"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>
            Halaman {currentPage} dari {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* DETAIL MODAL */}
      {selectedDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Detail Transaksi</h3>
              <span className="font-mono text-xs text-blue-600">{selectedDetail.noTransaksi}</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/50">
                <span className="text-slate-500">Waktu:</span>
                <span className="font-semibold">{formatTanggalIndo(selectedDetail.tanggal)} {selectedDetail.jam}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/50">
                <span className="text-slate-500">Pelanggan:</span>
                <span className="font-semibold">{selectedDetail.pelanggan} ({selectedDetail.noHp})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/50">
                <span className="text-slate-500">Jenis Transaksi:</span>
                <span className="font-semibold">{selectedDetail.jenisTransaksi}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/50">
                <span className="text-slate-500">Nomor Rek/Tujuan:</span>
                <span className="font-mono">{selectedDetail.noRekeningTujuan}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/50">
                <span className="text-slate-500">Nominal Transaksi:</span>
                <span className="font-bold font-mono">{formatRupiah(selectedDetail.nominal)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/50">
                <span className="text-slate-500">Biaya Admin:</span>
                <span className="font-mono">{formatRupiah(selectedDetail.biayaAdmin)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/50">
                <span className="text-slate-500">Biaya Provider:</span>
                <span className="font-mono">{formatRupiah(selectedDetail.biayaProvider)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/50 bg-blue-50/50 dark:bg-blue-950/20 px-2 rounded-lg">
                <span className="font-bold text-slate-700 dark:text-slate-300">Total Dibayar:</span>
                <span className="font-bold text-blue-600 font-mono text-sm">{formatRupiah(selectedDetail.totalBayar)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/50 bg-emerald-50/50 dark:bg-emerald-950/20 px-2 rounded-lg">
                <span className="font-bold text-emerald-800 dark:text-emerald-300">Keuntungan Bersih:</span>
                <span className="font-bold text-emerald-600 font-mono text-sm">{formatRupiah(selectedDetail.keuntungan)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/50">
                <span className="text-slate-500">Petugas Kasir:</span>
                <span>{selectedDetail.petugas}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Catatan:</span>
                <span>{selectedDetail.keterangan || '-'}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  onPrintReceipt(selectedDetail);
                  setSelectedDetail(null);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700"
              >
                <Printer className="w-4 h-4" />
                Cetak Struk
              </button>
              <button
                onClick={() => setSelectedDetail(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
