import React from 'react';
import { UserRole } from '../types';
import {
  LayoutDashboard,
  ReceiptText,
  ArrowDownLeft,
  ArrowUpRight,
  WalletCards,
  Scale,
  CalendarCheck,
  BarChart3,
  FileSpreadsheet,
  Users,
  History,
  Settings,
  HardDriveDownload,
  Database,
  PlusCircle,
  SlidersHorizontal,
  X
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'transaksi'
  | 'kas-masuk'
  | 'kas-keluar'
  | 'mutasi-saldo'
  | 'rekonsiliasi'
  | 'pengaturan-kas'
  | 'rekap-harian'
  | 'rekap-bulanan'
  | 'laporan'
  | 'pelanggan'
  | 'audit-log'
  | 'settings'
  | 'backup'
  | 'apps-script';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  userRole?: UserRole;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onQuickNewTransaction: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  userRole = 'ADMIN',
  isOpenMobile,
  onCloseMobile,
  onQuickNewTransaction
}) => {
  const navSections = [
    {
      title: 'UTAMA',
      items: [
        { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
        { id: 'transaksi' as NavTab, label: 'Transaksi BRILink', icon: ReceiptText, badge: 'Utama' },
      ]
    },
    {
      title: 'ARUS KAS & SALDO',
      items: [
        { id: 'kas-masuk' as NavTab, label: 'Kas Masuk', icon: ArrowDownLeft },
        { id: 'kas-keluar' as NavTab, label: 'Kas Keluar', icon: ArrowUpRight },
        { id: 'mutasi-saldo' as NavTab, label: 'Mutasi Saldo', icon: WalletCards },
        { id: 'rekonsiliasi' as NavTab, label: 'Rekonsiliasi Kas', icon: Scale },
        { id: 'pengaturan-kas' as NavTab, label: 'Reset & Pengaturan Kas', icon: SlidersHorizontal, badge: 'Penting' },
      ]
    },
    {
      title: 'REKAP & LAPORAN',
      items: [
        { id: 'rekap-harian' as NavTab, label: 'Rekap Harian', icon: CalendarCheck },
        { id: 'rekap-bulanan' as NavTab, label: 'Rekap Bulanan', icon: BarChart3 },
        { id: 'laporan' as NavTab, label: 'Laporan Keuangan', icon: FileSpreadsheet },
      ]
    },
    {
      title: 'DATA & SISTEM',
      items: [
        { id: 'pelanggan' as NavTab, label: 'Data Pelanggan', icon: Users },
        { id: 'apps-script' as NavTab, label: 'Google Spreadsheet & Script', icon: Database, badge: '10 Sheets' },
        ...(userRole === 'ADMIN' || userRole === 'OWNER'
          ? [
              { id: 'audit-log' as NavTab, label: 'Audit Log Aktivitas', icon: History },
              { id: 'settings' as NavTab, label: 'Pengaturan Usaha', icon: Settings },
              { id: 'backup' as NavTab, label: 'Backup & Restore', icon: HardDriveDownload },
            ]
          : [])
      ]
    }
  ];

  const handleNav = (tab: NavTab) => {
    onSelectTab(tab);
    if (isOpenMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-xs"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 lg:top-16 left-0 z-40 h-full lg:h-[calc(100vh-4rem)] w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-200 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Mobile Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between lg:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#02539a] flex items-center justify-center text-white font-bold text-xs">
              BRI
            </div>
            <span className="font-bold text-sm text-slate-800 dark:text-slate-100">Menu Pembukuan</span>
          </div>
          <button onClick={onCloseMobile} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick New Transaction CTA Button */}
        <div className="p-4 pb-2">
          <button
            onClick={() => {
              onQuickNewTransaction();
              if (isOpenMobile) onCloseMobile();
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-extrabold text-sm text-white bg-gradient-to-r from-blue-600 via-[#02539a] to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md shadow-blue-500/25 transition transform active:scale-98"
          >
            <PlusCircle className="w-5 h-5 text-amber-300" />
            + TRANSAKSI BARU
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
          {navSections.map(section => (
            <div key={section.title}>
              <div className="px-3 mb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {section.title}
              </div>
              <div className="space-y-0.5">
                {section.items.map(item => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNav(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer info */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 text-center">
          <p className="font-semibold text-slate-600 dark:text-slate-400">ATM MINI BRILINK v2.5</p>
          <p className="text-[10px]">Google Sheets Connected</p>
        </div>
      </aside>
    </>
  );
};
