import React, { useState, useEffect } from 'react';
import {
  Transaction,
  TransactionType,
  PaymentMethod,
  TransactionStatus,
  Customer,
  BusinessSettings,
  User
} from '../types';
import {
  formatRupiah,
  generateId,
  generateTransactionNumber,
  getCurrentTimeString,
  getTodayDateString
} from '../utils/formatters';
import { X, Sparkles, UserCheck, Calculator, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

interface TransactionModalProps {
  isOpen: boolean;
  initialData?: Transaction | null;
  settings: BusinessSettings;
  currentUser: User | null;
  customers: Customer[];
  totalTransactionCount: number;
  onClose: () => void;
  onSave: (transaction: Transaction) => void;
  onShowReceipt?: (transaction: Transaction) => void;
}

const ALL_TRANSACTION_TYPES: TransactionType[] = [
  'Tarik Tunai',
  'Setor Tunai',
  'Transfer',
  'Transfer Antar Bank',
  'Pembayaran PLN',
  'Token PLN',
  'Pulsa',
  'Paket Data',
  'BPJS',
  'PDAM',
  'Telkom',
  'Multifinance',
  'Top Up E-Wallet',
  'Top Up DANA',
  'Top Up OVO',
  'Top Up GoPay',
  'Top Up ShopeePay',
  'Pembayaran lainnya',
  'Transaksi lainnya'
];

const POPULAR_TYPES: { label: string; type: TransactionType; defaultAdmin: number; defaultProvider: number }[] = [
  { label: 'Tarik Tunai', type: 'Tarik Tunai', defaultAdmin: 5000, defaultProvider: 1000 },
  { label: 'Transfer BRI', type: 'Transfer', defaultAdmin: 5000, defaultProvider: 1000 },
  { label: 'Transfer Bank Lain', type: 'Transfer Antar Bank', defaultAdmin: 7500, defaultProvider: 2500 },
  { label: 'Setor Tunai', type: 'Setor Tunai', defaultAdmin: 5000, defaultProvider: 1000 },
  { label: 'Token PLN', type: 'Token PLN', defaultAdmin: 3000, defaultProvider: 500 },
  { label: 'Tagihan PLN', type: 'Pembayaran PLN', defaultAdmin: 3000, defaultProvider: 500 },
  { label: 'Top Up DANA', type: 'Top Up DANA', defaultAdmin: 3000, defaultProvider: 500 },
  { label: 'Top Up Shopee', type: 'Top Up ShopeePay', defaultAdmin: 3000, defaultProvider: 500 },
  { label: 'Pulsa / Paket', type: 'Pulsa', defaultAdmin: 2000, defaultProvider: 500 },
  { label: 'BPJS', type: 'BPJS', defaultAdmin: 3000, defaultProvider: 500 },
];

const NOMINAL_PRESETS = [50000, 100000, 200000, 500000, 1000000, 1500000, 2000000, 5000000];

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  initialData,
  settings,
  currentUser,
  customers,
  totalTransactionCount,
  onClose,
  onSave,
  onShowReceipt
}) => {
  const [formData, setFormData] = useState<Partial<Transaction>>({
    id: '',
    noTransaksi: '',
    tanggal: getTodayDateString(),
    jam: getCurrentTimeString(),
    pelanggan: '',
    noHp: '',
    jenisTransaksi: 'Tarik Tunai',
    noRekeningTujuan: '',
    nominal: 500000,
    biayaAdmin: settings.defaultBiayaAdmin || 5000,
    biayaProvider: 1000,
    totalBayar: 505000,
    keuntungan: 4000,
    modalTransaksi: 500000,
    metodePembayaran: 'Tunai',
    status: 'Berhasil',
    petugas: currentUser?.name || settings.namaOperatorDefault,
    keterangan: ''
  });

  const [customerSuggestions, setCustomerSuggestions] = useState<Customer[]>([]);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({ ...initialData });
      } else {
        const id = generateId('TRX');
        const noTrx = generateTransactionNumber(settings.formatNomorTransaksi, totalTransactionCount);
        const defAdmin = settings.defaultBiayaAdmin || 5000;
        const defProvider = 1000;
        const nominal = 500000;
        
        setFormData({
          id,
          noTransaksi: noTrx,
          tanggal: getTodayDateString(),
          jam: getCurrentTimeString(),
          pelanggan: '',
          noHp: '',
          jenisTransaksi: 'Tarik Tunai',
          noRekeningTujuan: '',
          nominal,
          biayaAdmin: defAdmin,
          biayaProvider: defProvider,
          totalBayar: nominal + defAdmin,
          keuntungan: defAdmin - defProvider,
          modalTransaksi: nominal,
          metodePembayaran: 'Tunai',
          status: 'Berhasil',
          petugas: currentUser?.name || settings.namaOperatorDefault,
          keterangan: ''
        });
      }
    }
  }, [isOpen, initialData, settings, currentUser, totalTransactionCount]);

  // Recalculate totals whenever nominal, biayaAdmin, or biayaProvider changes
  const updateCalculatedFields = (nom: number, admin: number, prov: number) => {
    const total = nom + admin;
    const untung = admin - prov;
    setFormData(prev => ({
      ...prev,
      nominal: nom,
      biayaAdmin: admin,
      biayaProvider: prov,
      totalBayar: total,
      keuntungan: untung,
      modalTransaksi: nom
    }));
  };

  const handleNominalChange = (val: number) => {
    const admin = formData.biayaAdmin || 0;
    const prov = formData.biayaProvider || 0;
    updateCalculatedFields(val, admin, prov);
  };

  const handleAdminChange = (adminVal: number) => {
    const nom = formData.nominal || 0;
    const prov = formData.biayaProvider || 0;
    updateCalculatedFields(nom, adminVal, prov);
  };

  const handleProviderChange = (provVal: number) => {
    const nom = formData.nominal || 0;
    const admin = formData.biayaAdmin || 0;
    updateCalculatedFields(nom, admin, provVal);
  };

  const handleSelectPopularType = (item: typeof POPULAR_TYPES[0]) => {
    const nom = formData.nominal || 0;
    setFormData(prev => ({
      ...prev,
      jenisTransaksi: item.type,
      biayaAdmin: item.defaultAdmin,
      biayaProvider: item.defaultProvider,
      totalBayar: nom + item.defaultAdmin,
      keuntungan: item.defaultAdmin - item.defaultProvider
    }));
  };

  const handleCustomerNameChange = (name: string) => {
    setFormData(prev => ({ ...prev, pelanggan: name }));
    if (name.trim().length > 1) {
      const match = customers.filter(c =>
        c.nama.toLowerCase().includes(name.toLowerCase()) ||
        c.noHp.includes(name)
      );
      setCustomerSuggestions(match.slice(0, 4));
    } else {
      setCustomerSuggestions([]);
    }
  };

  const selectCustomer = (c: Customer) => {
    setFormData(prev => ({
      ...prev,
      pelanggan: c.nama,
      noHp: c.noHp !== '-' ? c.noHp : prev.noHp
    }));
    setCustomerSuggestions([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nominal || formData.nominal <= 0) {
      alert('Nominal transaksi harus lebih dari 0.');
      return;
    }

    const payload: Transaction = {
      id: formData.id || generateId('TRX'),
      noTransaksi: formData.noTransaksi || generateTransactionNumber(settings.formatNomorTransaksi, totalTransactionCount),
      tanggal: formData.tanggal || getTodayDateString(),
      jam: formData.jam || getCurrentTimeString(),
      pelanggan: formData.pelanggan?.trim() || 'Pelanggan Tunai',
      noHp: formData.noHp?.trim() || '-',
      jenisTransaksi: formData.jenisTransaksi || 'Tarik Tunai',
      noRekeningTujuan: formData.noRekeningTujuan?.trim() || '-',
      nominal: Number(formData.nominal) || 0,
      biayaAdmin: Number(formData.biayaAdmin) || 0,
      biayaProvider: Number(formData.biayaProvider) || 0,
      totalBayar: (Number(formData.nominal) || 0) + (Number(formData.biayaAdmin) || 0),
      keuntungan: (Number(formData.biayaAdmin) || 0) - (Number(formData.biayaProvider) || 0),
      modalTransaksi: Number(formData.nominal) || 0,
      metodePembayaran: formData.metodePembayaran || 'Tunai',
      status: formData.status || 'Berhasil',
      petugas: formData.petugas || currentUser?.name || 'Kasir',
      keterangan: formData.keterangan || '',
      createdAt: formData.createdAt || new Date().toISOString(),
      syncStatus: 'synced'
    };

    onSave(payload);

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });
    } catch {
      // ignore
    }

    onClose();

    if (onShowReceipt) {
      setTimeout(() => {
        onShowReceipt(payload);
      }, 350);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full my-6 overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">
                {initialData ? 'Ubah Transaksi BRILink' : 'Input Transaksi Baru'}
              </h3>
              <p className="text-xs text-blue-200">
                {formData.noTransaksi} • {formData.tanggal} {formData.jam}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Quick Popular Shortcuts */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Pilihan Cepat Jenis Transaksi:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_TYPES.map(item => {
                const isActive = formData.jenisTransaksi === item.type;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => handleSelectPopularType(item)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
                      isActive
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Grid Rows: Pelanggan & HP */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nama Pelanggan <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Budi Hartono"
                value={formData.pelanggan || ''}
                onChange={e => handleCustomerNameChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {/* Customer suggestions dropdown */}
              {customerSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-20 overflow-hidden">
                  <div className="p-1 text-[10px] uppercase font-bold text-slate-400 bg-slate-50 dark:bg-slate-900 px-3 py-1">
                    Pelanggan Terdaftar:
                  </div>
                  {customerSuggestions.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => selectCustomer(c)}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 dark:hover:bg-blue-900/40 flex items-center justify-between border-b border-slate-100 dark:border-slate-700/50 last:border-0"
                    >
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{c.nama}</span>
                      <span className="text-slate-500 text-[11px]">{c.noHp}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nomor HP Pelanggan
              </label>
              <input
                type="text"
                placeholder="0812xxxxxxxx"
                value={formData.noHp || ''}
                onChange={e => setFormData({ ...formData, noHp: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Jenis Transaksi & Nomor Tujuan / Rekening */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Kategori Transaksi
              </label>
              <select
                value={formData.jenisTransaksi}
                onChange={e => setFormData({ ...formData, jenisTransaksi: e.target.value as TransactionType })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {ALL_TRANSACTION_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nomor Rekening / ID Pelanggan / Nomor Tujuan
              </label>
              <input
                type="text"
                placeholder="Contoh: Rekening BRI / ID Token PLN"
                value={formData.noRekeningTujuan || ''}
                onChange={e => setFormData({ ...formData, noRekeningTujuan: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Nominal Transaksi & Presets */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Nominal Transaksi (Rp) <span className="text-rose-500">*</span>
              </label>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                {formatRupiah(formData.nominal)}
              </span>
            </div>
            <input
              type="number"
              step={1000}
              min={1000}
              required
              value={formData.nominal || ''}
              onChange={e => handleNominalChange(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-base font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {/* Nominal Presets Chips */}
            <div className="flex flex-wrap gap-1 mt-2">
              {NOMINAL_PRESETS.map(preset => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleNominalChange(preset)}
                  className={`px-2 py-1 rounded-md text-[11px] font-medium transition ${
                    formData.nominal === preset
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {preset >= 1000000 ? `${preset / 1000000} Jt` : `${preset / 1000} Rb`}
                </button>
              ))}
            </div>
          </div>

          {/* Admin & Provider Fee */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Biaya Admin ke Pelanggan (Rp)
              </label>
              <input
                type="number"
                step={500}
                value={formData.biayaAdmin || ''}
                onChange={e => handleAdminChange(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Biaya Provider / Operasional (Rp)
              </label>
              <input
                type="number"
                step={500}
                value={formData.biayaProvider ?? ''}
                onChange={e => handleProviderChange(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* REALTIME CALCULATION SUMMARY CARD */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
              <Calculator className="w-4 h-4 text-blue-600" />
              Perhitungan Otomatis Sistem
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1 text-xs">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block">Total Dibayar Nasabah:</span>
                <span className="text-base font-extrabold text-blue-600 dark:text-blue-400">
                  {formatRupiah(formData.totalBayar)}
                </span>
                <span className="text-[10px] text-slate-400 block">(Nominal + Biaya Admin)</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block">Keuntungan Agen:</span>
                <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                  {formatRupiah(formData.keuntungan)}
                </span>
                <span className="text-[10px] text-slate-400 block">(Admin - Provider)</span>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="text-slate-500 dark:text-slate-400 block">Modal Saldo:</span>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  {formatRupiah(formData.nominal)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Method, Status, & Operator */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Metode Pembayaran
              </label>
              <select
                value={formData.metodePembayaran}
                onChange={e => setFormData({ ...formData, metodePembayaran: e.target.value as PaymentMethod })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Tunai">Tunai</option>
                <option value="Saldo Rekening BRILink">Saldo Rekening BRILink</option>
                <option value="Kartu Debit">Kartu Debit</option>
                <option value="Saldo E-Wallet">Saldo E-Wallet</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Status Transaksi
              </label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as TransactionStatus })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Berhasil">Berhasil</option>
                <option value="Pending">Pending</option>
                <option value="Dibatalkan">Dibatalkan</option>
                <option value="Gagal">Gagal</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Petugas / Operator
              </label>
              <input
                type="text"
                value={formData.petugas || ''}
                onChange={e => setFormData({ ...formData, petugas: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Keterangan */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Catatan / Keterangan (Opsional)
            </label>
            <input
              type="text"
              placeholder="Contoh: Tarik tunai bansos PKH / titip no resi"
              value={formData.keterangan || ''}
              onChange={e => setFormData({ ...formData, keterangan: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Submit Action Buttons */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-500/20 transition transform active:scale-98"
            >
              Simpan & Cetak Struk
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
