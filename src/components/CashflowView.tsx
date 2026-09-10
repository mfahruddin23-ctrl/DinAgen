import React, { useState } from 'react';
import {
  CashIn,
  CashOut,
  CashMutation,
  BalanceSummary,
  User,
  CashInSource,
  CashOutCategory,
  PaymentMethod,
  NavTab
} from '../types';
import {
  formatRupiah,
  formatTanggalIndo,
  generateId,
  getCurrentTimeString,
  getTodayDateString
} from '../utils/formatters';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Trash2,
  Download,
  WalletCards,
  ArrowRightLeft,
  Sliders,
  DollarSign,
  SlidersHorizontal
} from 'lucide-react';

interface CashflowViewProps {
  type: 'in' | 'out' | 'mutation';
  cashInList: CashIn[];
  cashOutList: CashOut[];
  mutationsList: CashMutation[];
  balance: BalanceSummary;
  currentUser: User | null;
  onAddCashIn: (item: CashIn) => void;
  onDeleteCashIn: (id: string) => void;
  onAddCashOut: (item: CashOut) => void;
  onDeleteCashOut: (id: string) => void;
  onAddMutation: (item: CashMutation) => void;
  onSelectTab?: (tab: NavTab) => void;
}

export const CashflowView: React.FC<CashflowViewProps> = ({
  type,
  cashInList,
  cashOutList,
  mutationsList,
  balance,
  currentUser,
  onAddCashIn,
  onDeleteCashIn,
  onAddCashOut,
  onDeleteCashOut,
  onAddMutation,
  onSelectTab
}) => {
  // Modal states
  const [showInModal, setShowInModal] = useState(false);
  const [showOutModal, setShowOutModal] = useState(false);
  const [showMutationModal, setShowMutationModal] = useState(false);

  // Form states for Cash In
  const [inData, setInData] = useState<Partial<CashIn>>({
    tanggal: getTodayDateString(),
    jam: getCurrentTimeString(),
    sumber: 'Modal Awal',
    nominal: 1000000,
    diterimaDari: 'Pemilik',
    metodePenerimaan: 'Tunai',
    keterangan: ''
  });

  // Form states for Cash Out
  const [outData, setOutData] = useState<Partial<CashOut>>({
    tanggal: getTodayDateString(),
    jam: getCurrentTimeString(),
    kategori: 'Operasional',
    nominal: 50000,
    diberikanKepada: 'Toko ATK',
    metodePembayaran: 'Tunai',
    keterangan: ''
  });

  // Form states for Mutation
  const [mutationData, setMutationData] = useState<Partial<CashMutation>>({
    tanggal: getTodayDateString(),
    jam: getCurrentTimeString(),
    jenisMutasi: 'Setor Kas ke Rekening',
    dariAkun: 'Kas Tunai',
    keAkun: 'Rekening BRILink',
    nominal: 1000000,
    alasan: 'Setor uang fisik ke rekening untuk modal transfer nasabah'
  });

  // Submit Cash In
  const handleCashInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inData.nominal || inData.nominal <= 0) return;
    const newItem: CashIn = {
      id: generateId('CIN'),
      tanggal: inData.tanggal || getTodayDateString(),
      jam: inData.jam || getCurrentTimeString(),
      sumber: (inData.sumber as CashInSource) || 'Modal Awal',
      nominal: Number(inData.nominal),
      diterimaDari: inData.diterimaDari || 'Kasir',
      metodePenerimaan: (inData.metodePenerimaan as PaymentMethod) || 'Tunai',
      keterangan: inData.keterangan || '',
      petugas: currentUser?.name || 'Kasir',
      createdAt: new Date().toISOString()
    };
    onAddCashIn(newItem);
    setShowInModal(false);
  };

  // Submit Cash Out
  const handleCashOutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!outData.nominal || outData.nominal <= 0) return;
    const newItem: CashOut = {
      id: generateId('COT'),
      tanggal: outData.tanggal || getTodayDateString(),
      jam: outData.jam || getCurrentTimeString(),
      kategori: (outData.kategori as CashOutCategory) || 'Operasional',
      nominal: Number(outData.nominal),
      diberikanKepada: outData.diberikanKepada || '-',
      metodePembayaran: (outData.metodePembayaran as PaymentMethod) || 'Tunai',
      keterangan: outData.keterangan || '',
      petugas: currentUser?.name || 'Kasir',
      createdAt: new Date().toISOString()
    };
    onAddCashOut(newItem);
    setShowOutModal(false);
  };

  // Submit Mutation
  const handleMutationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mutationData.nominal || mutationData.nominal <= 0) return;
    const newItem: CashMutation = {
      id: generateId('MUT'),
      tanggal: mutationData.tanggal || getTodayDateString(),
      jam: mutationData.jam || getCurrentTimeString(),
      jenisMutasi: mutationData.jenisMutasi || 'Setor Kas ke Rekening',
      dariAkun: mutationData.dariAkun || 'Kas Tunai',
      keAkun: mutationData.keAkun || 'Rekening BRILink',
      nominal: Number(mutationData.nominal),
      alasan: mutationData.alasan || '-',
      petugas: currentUser?.name || 'Kasir',
      createdAt: new Date().toISOString()
    };
    onAddMutation(newItem);
    setShowMutationModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Overview Balance Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500">Saldo Kas Tunai (Fisik Laci)</span>
            <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
              {formatRupiah(balance.kasTunai)}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500">Saldo Rekening BRILink (EDC / Web)</span>
            <div className="text-xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">
              {formatRupiah(balance.rekeningBRILink)}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
            <WalletCards className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Quick Link to Reset & Pengaturan Kas */}
      {onSelectTab && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-850 p-3.5 rounded-2xl border border-blue-100 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <SlidersHorizontal className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span>Ingin mengatur batas minimal kas laci, kalibrasi fisik, serah terima shift, atau reset kas?</span>
          </div>
          <button
            onClick={() => onSelectTab('pengaturan-kas')}
            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs whitespace-nowrap shadow-xs transition active:scale-95 flex items-center gap-1.5"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Buka Pengaturan &amp; Reset Kas
          </button>
        </div>
      )}

      {/* VIEW: KAS MASUK */}
      {type === 'in' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Rekap Kas Masuk (Pemasukan)</h2>
              <p className="text-xs text-slate-500">Penambahan modal, setoran kas tunai, atau pemasukan lain</p>
            </div>
            <button
              onClick={() => setShowInModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
            >
              <Plus className="w-4 h-4" />
              + Catat Kas Masuk
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold uppercase border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Waktu</th>
                  <th className="px-4 py-3.5">Sumber / Kategori</th>
                  <th className="px-4 py-3.5">Nominal</th>
                  <th className="px-4 py-3.5">Diterima Dari</th>
                  <th className="px-4 py-3.5">Metode</th>
                  <th className="px-4 py-3.5">Petugas</th>
                  <th className="px-4 py-3.5">Keterangan</th>
                  <th className="px-4 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {cashInList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      Belum ada data kas masuk.
                    </td>
                  </tr>
                ) : (
                  cashInList.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="px-5 py-3.5 font-mono text-slate-700 dark:text-slate-300">
                        {item.tanggal} <span className="text-slate-400 text-[11px]">{item.jam}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-semibold text-[11px]">
                          {item.sumber}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-bold font-mono text-emerald-600 dark:text-emerald-400">
                        +{formatRupiah(item.nominal)}
                      </td>
                      <td className="px-4 py-3.5 font-medium">{item.diterimaDari}</td>
                      <td className="px-4 py-3.5">{item.metodePenerimaan}</td>
                      <td className="px-4 py-3.5 text-slate-500">{item.petugas}</td>
                      <td className="px-4 py-3.5 text-slate-500">{item.keterangan || '-'}</td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => onDeleteCashIn(item.id)}
                          className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: KAS KELUAR */}
      {type === 'out' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Rekap Kas Keluar (Pengeluaran)</h2>
              <p className="text-xs text-slate-500">Biaya operasional, pembelian kertas struk, kuota, atau sewa</p>
            </div>
            <button
              onClick={() => setShowOutModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
            >
              <Plus className="w-4 h-4" />
              + Catat Kas Keluar
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold uppercase border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Waktu</th>
                  <th className="px-4 py-3.5">Kategori</th>
                  <th className="px-4 py-3.5">Nominal</th>
                  <th className="px-4 py-3.5">Diberikan Kepada</th>
                  <th className="px-4 py-3.5">Metode</th>
                  <th className="px-4 py-3.5">Petugas</th>
                  <th className="px-4 py-3.5">Keterangan</th>
                  <th className="px-4 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {cashOutList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      Belum ada data kas keluar.
                    </td>
                  </tr>
                ) : (
                  cashOutList.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="px-5 py-3.5 font-mono text-slate-700 dark:text-slate-300">
                        {item.tanggal} <span className="text-slate-400 text-[11px]">{item.jam}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 font-semibold text-[11px]">
                          {item.kategori}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-bold font-mono text-rose-600 dark:text-rose-400">
                        -{formatRupiah(item.nominal)}
                      </td>
                      <td className="px-4 py-3.5 font-medium">{item.diberikanKepada}</td>
                      <td className="px-4 py-3.5">{item.metodePembayaran}</td>
                      <td className="px-4 py-3.5 text-slate-500">{item.petugas}</td>
                      <td className="px-4 py-3.5 text-slate-500">{item.keterangan || '-'}</td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => onDeleteCashOut(item.id)}
                          className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: MUTASI SALDO */}
      {type === 'mutation' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Mutasi & Perputaran Saldo Modal</h2>
              <p className="text-xs text-slate-500">Perpindahan saldo kas tunai laci ke rekening BRILink atau sebaliknya</p>
            </div>
            <button
              onClick={() => setShowMutationModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            >
              <ArrowRightLeft className="w-4 h-4" />
              + Mutasi / Penyesuaian Saldo
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold uppercase border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Waktu</th>
                  <th className="px-4 py-3.5">Jenis Mutasi</th>
                  <th className="px-4 py-3.5">Dari Akun</th>
                  <th className="px-4 py-3.5">Ke Akun</th>
                  <th className="px-4 py-3.5">Nominal</th>
                  <th className="px-4 py-3.5">Petugas</th>
                  <th className="px-4 py-3.5">Alasan / Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {mutationsList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Belum ada mutasi saldo tercatat.
                    </td>
                  </tr>
                ) : (
                  mutationsList.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="px-5 py-3.5 font-mono text-slate-700 dark:text-slate-300">
                        {item.tanggal} <span className="text-slate-400 text-[11px]">{item.jam}</span>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-blue-600 dark:text-blue-400">
                        {item.jenisMutasi}
                      </td>
                      <td className="px-4 py-3.5 font-medium">{item.dariAkun}</td>
                      <td className="px-4 py-3.5 font-medium text-emerald-600">{item.keAkun}</td>
                      <td className="px-4 py-3.5 font-bold font-mono text-slate-900 dark:text-slate-100">
                        {formatRupiah(item.nominal)}
                      </td>
                      <td className="px-4 py-3.5 text-slate-500">{item.petugas}</td>
                      <td className="px-4 py-3.5 text-slate-500">{item.alasan}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: INPUT KAS MASUK */}
      {showInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Tambah Kas Masuk</h3>
            <form onSubmit={handleCashInSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Sumber Pemasukan</label>
                <select
                  value={inData.sumber}
                  onChange={e => setInData({ ...inData, sumber: e.target.value as CashInSource })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <option value="Modal Awal">Modal Awal</option>
                  <option value="Setoran Tunai Nasabah">Setoran Tunai Nasabah</option>
                  <option value="Pendapatan Lain">Pendapatan Lain</option>
                  <option value="Pelunasan Piutang">Pelunasan Piutang</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Nominal (Rp)</label>
                <input
                  type="number"
                  step={1000}
                  required
                  value={inData.nominal || ''}
                  onChange={e => setInData({ ...inData, nominal: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-mono font-bold text-sm bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Diterima Dari</label>
                <input
                  type="text"
                  required
                  value={inData.diterimaDari || ''}
                  onChange={e => setInData({ ...inData, diterimaDari: e.target.value })}
                  placeholder="Contoh: Pemilik / Kasir / Nasabah"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Keterangan</label>
                <input
                  type="text"
                  value={inData.keterangan || ''}
                  onChange={e => setInData({ ...inData, keterangan: e.target.value })}
                  placeholder="Catatan tambahan..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowInModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Simpan Pemasukan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: INPUT KAS KELUAR */}
      {showOutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Tambah Kas Keluar</h3>
            <form onSubmit={handleCashOutSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Kategori Pengeluaran</label>
                <select
                  value={outData.kategori}
                  onChange={e => setOutData({ ...outData, kategori: e.target.value as CashOutCategory })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <option value="Operasional">Operasional</option>
                  <option value="Beli Kertas Struk">Beli Kertas Struk</option>
                  <option value="Kuota Internet">Kuota Internet</option>
                  <option value="Listrik / Sewa Tempat">Listrik / Sewa Tempat</option>
                  <option value="Tarik Saldo Pemilik">Tarik Saldo Pemilik</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Nominal (Rp)</label>
                <input
                  type="number"
                  step={1000}
                  required
                  value={outData.nominal || ''}
                  onChange={e => setOutData({ ...outData, nominal: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-mono font-bold text-sm bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Diberikan Kepada</label>
                <input
                  type="text"
                  required
                  value={outData.diberikanKepada || ''}
                  onChange={e => setOutData({ ...outData, diberikanKepada: e.target.value })}
                  placeholder="Contoh: Toko Kertas / Provider Telkomsel"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Keterangan</label>
                <input
                  type="text"
                  value={outData.keterangan || ''}
                  onChange={e => setOutData({ ...outData, keterangan: e.target.value })}
                  placeholder="Rincian pengeluaran..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowOutModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold bg-rose-600 hover:bg-rose-700 text-white"
                >
                  Simpan Pengeluaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: INPUT MUTASI SALDO */}
      {showMutationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Mutasi & Pergeseran Saldo</h3>
            <form onSubmit={handleMutationSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Jenis Pergerakan</label>
                <select
                  value={mutationData.jenisMutasi}
                  onChange={e => {
                    const val = e.target.value;
                    let dari = 'Kas Tunai';
                    let ke = 'Rekening BRILink';
                    if (val === 'Tarik Rekening ke Kas') {
                      dari = 'Rekening BRILink';
                      ke = 'Kas Tunai';
                    } else if (val === 'Top Up Modal Luar') {
                      dari = 'Bank Eksternal';
                      ke = 'Rekening BRILink';
                    }
                    setMutationData({ ...mutationData, jenisMutasi: val, dariAkun: dari, keAkun: ke });
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <option value="Setor Kas ke Rekening">Setor Kas Tunai ke Rekening (Uang Tunai -&gt; Rekening)</option>
                  <option value="Tarik Rekening ke Kas">Tarik Rekening ke Kas Tunai (Rekening -&gt; Uang Tunai)</option>
                  <option value="Top Up Modal Luar">Top Up Modal Baru</option>
                  <option value="Penyesuaian Saldo">Penyesuaian Selisih (Adjustment)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Nominal (Rp)</label>
                <input
                  type="number"
                  step={10000}
                  required
                  value={mutationData.nominal || ''}
                  onChange={e => setMutationData({ ...mutationData, nominal: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-mono font-bold text-sm bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Alasan / Catatan Mutasi</label>
                <input
                  type="text"
                  required
                  value={mutationData.alasan || ''}
                  onChange={e => setMutationData({ ...mutationData, alasan: e.target.value })}
                  placeholder="Contoh: Setor fisik laci ke ATM BRI terdekat"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowMutationModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Eksekusi Mutasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
