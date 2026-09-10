import React, { useState } from 'react';
import { AuditLog } from '../types';
import { formatTanggalIndo } from '../utils/formatters';
import { ShieldCheck, History, Search, Filter } from 'lucide-react';

interface AuditLogViewProps {
  logs: AuditLog[];
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ logs }) => {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  const filtered = logs.filter(log => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchAksi = log.action?.toLowerCase().includes(q);
      const matchUser = log.username?.toLowerCase().includes(q);
      const matchDetail = log.details?.toLowerCase().includes(q);
      if (!matchAksi && !matchUser && !matchDetail) return false;
    }
    if (actionFilter !== 'ALL' && !log.action?.includes(actionFilter)) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Audit Log &amp; Rekam Jejak Sistem</h2>
        <p className="text-xs text-slate-500">
          Catatan otomatis seluruh aktivitas krusial kasir, perubahan data transaksi, dan keamanan sistem
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Cari aktivitas, user, atau rincian..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800"
          />
        </div>

        <select
          value={actionFilter}
          onChange={e => setActionFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800"
        >
          <option value="ALL">Semua Jenis Aksi</option>
          <option value="LOGIN">Login &amp; Autentikasi</option>
          <option value="TRANSAKSI">Transaksi</option>
          <option value="KAS">Kas Masuk/Keluar</option>
          <option value="TUTUP_BUKU">Tutup Buku</option>
          <option value="PENGATURAN">Pengaturan</option>
        </select>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold uppercase border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-5 py-3.5">Waktu</th>
              <th className="px-4 py-3.5">Petugas / User</th>
              <th className="px-4 py-3.5">Aksi / Operasi</th>
              <th className="px-4 py-3.5">Rincian Perubahan</th>
              <th className="px-4 py-3.5">Perangkat / IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400">
                  Tidak ada catatan audit log.
                </td>
              </tr>
            ) : (
              filtered.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3.5 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                    {log.username}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-semibold font-mono text-[11px]">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-700 dark:text-slate-300">
                    {log.details}
                  </td>
                  <td className="px-4 py-3.5 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                    {log.ipAddress}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
