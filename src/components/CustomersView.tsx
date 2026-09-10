import React, { useState } from 'react';
import { Customer, Transaction } from '../types';
import { formatRupiah, generateId } from '../utils/formatters';
import { Users, Plus, Phone, Search, Edit2, Trash2, History, X } from 'lucide-react';

interface CustomersViewProps {
  customers: Customer[];
  transactions: Transaction[];
  onAddCustomer: (customer: Customer) => void;
  onUpdateCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers,
  transactions,
  onAddCustomer,
  onUpdateCustomer,
  onDeleteCustomer
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Customer | null>(null);
  const [historyCustomer, setHistoryCustomer] = useState<Customer | null>(null);

  const [form, setForm] = useState({
    nama: '',
    noHp: '',
    alamat: '',
    catatan: ''
  });

  const filteredCustomers = customers.filter(c => {
    const q = searchTerm.toLowerCase();
    return c.nama.toLowerCase().includes(q) || c.noHp.includes(q);
  });

  const handleOpenAdd = () => {
    setEditItem(null);
    setForm({ nama: '', noHp: '', alamat: '', catatan: '' });
    setShowModal(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setEditItem(c);
    setForm({ nama: c.nama, noHp: c.noHp, alamat: c.alamat, catatan: c.catatan });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nama.trim()) return;

    if (editItem) {
      onUpdateCustomer({
        ...editItem,
        nama: form.nama.trim(),
        noHp: form.noHp.trim() || '-',
        alamat: form.alamat.trim() || '-',
        catatan: form.catatan.trim() || '-'
      });
    } else {
      const newCust: Customer = {
        id: generateId('CUS'),
        nama: form.nama.trim(),
        noHp: form.noHp.trim() || '-',
        alamat: form.alamat.trim() || '-',
        totalTransaksi: 0,
        totalNominal: 0,
        catatan: form.catatan.trim() || '-',
        createdAt: new Date().toISOString()
      };
      onAddCustomer(newCust);
    }
    setShowModal(false);
  };

  // Transactions of selected customer in history modal
  const customerTrxList = historyCustomer
    ? transactions.filter(t => t.pelanggan?.toLowerCase() === historyCustomer.nama.toLowerCase() || (historyCustomer.noHp !== '-' && t.noHp === historyCustomer.noHp))
    : [];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Data Pelanggan BRILink</h2>
          <p className="text-xs text-slate-500">Database nasabah tetap untuk kemudahan input transaksi berulang</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#02539a] hover:bg-[#003d73] text-white shadow-sm"
        >
          <Plus className="w-4 h-4" />
          + Tambah Pelanggan
        </button>
      </div>

      {/* SEARCH BAR */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama atau nomor HP nasabah..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          />
        </div>
      </div>

      {/* CUSTOMER LIST TABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold uppercase border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-5 py-3.5">Nama Pelanggan</th>
              <th className="px-4 py-3.5">Nomor HP</th>
              <th className="px-4 py-3.5">Alamat</th>
              <th className="px-4 py-3.5">Total Trx</th>
              <th className="px-4 py-3.5">Volume Transaksi</th>
              <th className="px-4 py-3.5">Catatan</th>
              <th className="px-4 py-3.5 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  Tidak ada data nasabah.
                </td>
              </tr>
            ) : (
              filteredCustomers.map(c => {
                // Calculate dynamic metrics from transaction list
                const trxs = transactions.filter(t => t.pelanggan?.toLowerCase() === c.nama.toLowerCase());
                const count = trxs.length || c.totalTransaksi;
                const totalNom = trxs.reduce((s, t) => s + t.nominal, 0) || c.totalNominal;

                return (
                  <tr key={c.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-3.5 font-bold text-slate-800 dark:text-slate-100">
                      {c.nama}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-600 dark:text-slate-400">
                      {c.noHp}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500">{c.alamat}</td>
                    <td className="px-4 py-3.5 font-semibold text-blue-600">
                      {count} Trx
                    </td>
                    <td className="px-4 py-3.5 font-mono font-bold text-slate-800 dark:text-slate-200">
                      {formatRupiah(totalNom)}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500">{c.catatan}</td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setHistoryCustomer(c)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100"
                          title="Riwayat Transaksi"
                        >
                          <History className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-slate-100"
                          title="Ubah Data"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Hapus pelanggan ${c.nama}?`)) {
                              onDeleteCustomer(c.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL: TAMBAH / EDIT PELANGGAN */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              {editItem ? 'Ubah Data Pelanggan' : 'Tambah Pelanggan Baru'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  value={form.nama}
                  onChange={e => setForm({ ...form, nama: e.target.value })}
                  placeholder="Nama nasabah"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Nomor HP / WhatsApp</label>
                <input
                  type="text"
                  value={form.noHp}
                  onChange={e => setForm({ ...form, noHp: e.target.value })}
                  placeholder="0812xxxxxxxx"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Alamat / RT RW</label>
                <input
                  type="text"
                  value={form.alamat}
                  onChange={e => setForm({ ...form, alamat: e.target.value })}
                  placeholder="Desa / Dusun / RT RW"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Catatan</label>
                <input
                  type="text"
                  value={form.catatan}
                  onChange={e => setForm({ ...form, catatan: e.target.value })}
                  placeholder="Nasabah bansos, warung tetangga, dll"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold bg-[#02539a] hover:bg-[#003d73] text-white"
                >
                  Simpan Pelanggan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RIWAYAT TRANSAKSI PELANGGAN */}
      {historyCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Riwayat Transaksi: {historyCustomer.nama}
                </h3>
                <p className="text-xs text-slate-400">{historyCustomer.noHp} • {historyCustomer.alamat}</p>
              </div>
              <button onClick={() => setHistoryCustomer(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {customerTrxList.length === 0 ? (
                <p className="py-8 text-center text-xs text-slate-400">Belum ada rekaman transaksi untuk nasabah ini.</p>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-bold uppercase">
                    <tr>
                      <th className="p-2">No. Trx</th>
                      <th className="p-2">Waktu</th>
                      <th className="p-2">Layanan</th>
                      <th className="p-2">Nominal</th>
                      <th className="p-2">Admin</th>
                      <th className="p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {customerTrxList.map(t => (
                      <tr key={t.id}>
                        <td className="p-2 font-mono font-bold text-slate-700 dark:text-slate-300">{t.noTransaksi}</td>
                        <td className="p-2">{t.tanggal} {t.jam}</td>
                        <td className="p-2">{t.jenisTransaksi}</td>
                        <td className="p-2 font-bold font-mono">{formatRupiah(t.nominal)}</td>
                        <td className="p-2 font-mono">{formatRupiah(t.biayaAdmin)}</td>
                        <td className="p-2">
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-bold">
                            {t.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setHistoryCustomer(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800"
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
