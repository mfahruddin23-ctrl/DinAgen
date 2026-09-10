import React from 'react';
import { NavTab } from './Sidebar';
import { LayoutDashboard, ReceiptText, Plus, CalendarCheck, MoreHorizontal } from 'lucide-react';

interface BottomNavProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onQuickNewTransaction: () => void;
  onOpenMobileSidebar: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  onQuickNewTransaction,
  onOpenMobileSidebar
}) => {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 py-1 flex items-center justify-around">
      <button
        onClick={() => onSelectTab('dashboard')}
        className={`flex flex-col items-center py-1 px-3 text-[10px] font-semibold transition ${
          currentTab === 'dashboard' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'
        }`}
      >
        <LayoutDashboard className="w-5 h-5 mb-0.5" />
        Dashboard
      </button>

      <button
        onClick={() => onSelectTab('transaksi')}
        className={`flex flex-col items-center py-1 px-3 text-[10px] font-semibold transition ${
          currentTab === 'transaksi' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'
        }`}
      >
        <ReceiptText className="w-5 h-5 mb-0.5" />
        Transaksi
      </button>

      {/* Floating Center Button */}
      <div className="-mt-6">
        <button
          onClick={onQuickNewTransaction}
          className="w-13 h-13 rounded-full bg-gradient-to-tr from-blue-700 to-[#02539a] text-white flex items-center justify-center shadow-lg shadow-blue-500/40 border-4 border-white dark:border-slate-900 transform active:scale-95 transition"
          aria-label="Tambah Transaksi Cepat"
        >
          <Plus className="w-7 h-7 stroke-[2.5]" />
        </button>
      </div>

      <button
        onClick={() => onSelectTab('rekap-harian')}
        className={`flex flex-col items-center py-1 px-3 text-[10px] font-semibold transition ${
          currentTab === 'rekap-harian' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'
        }`}
      >
        <CalendarCheck className="w-5 h-5 mb-0.5" />
        Rekap
      </button>

      <button
        onClick={onOpenMobileSidebar}
        className="flex flex-col items-center py-1 px-3 text-[10px] font-semibold text-slate-500 dark:text-slate-400"
      >
        <MoreHorizontal className="w-5 h-5 mb-0.5" />
        Menu
      </button>
    </div>
  );
};
