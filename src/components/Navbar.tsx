import React, { useState, useEffect } from 'react';
import { User, BusinessSettings } from '../types';
import {
  formatTanggalIndo,
  getCurrentTimeString
} from '../utils/formatters';
import {
  ShieldCheck,
  User as UserIcon,
  LogOut,
  Moon,
  Sun,
  Database,
  CloudCheck,
  CloudOff,
  Menu,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { AppsScriptSyncService, SyncStatus } from '../services/appsScriptSync';

interface NavbarProps {
  currentUser: User | null;
  settings: BusinessSettings;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onLogout: () => void;
  onSwitchUser: (user: User) => void;
  allUsers: User[];
  onOpenAppsScriptModal: () => void;
  onOpenMobileSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  settings,
  darkMode,
  onToggleDarkMode,
  onLogout,
  onSwitchUser,
  allUsers,
  onOpenAppsScriptModal,
  onOpenMobileSidebar
}) => {
  const [timeStr, setTimeStr] = useState(getCurrentTimeString());
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(() => AppsScriptSyncService.getSyncStatus());

  useEffect(() => {
    const unsub = AppsScriptSyncService.subscribe((status) => {
      setSyncStatus(status);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeStr(getCurrentTimeString());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-amber-500/10 text-amber-700 border-amber-300 dark:bg-amber-400/20 dark:text-amber-300 dark:border-amber-700';
      case 'OWNER':
        return 'bg-purple-500/10 text-purple-700 border-purple-300 dark:bg-purple-400/20 dark:text-purple-300 dark:border-purple-700';
      default:
        return 'bg-emerald-500/10 text-emerald-700 border-emerald-300 dark:bg-emerald-400/20 dark:text-emerald-300 dark:border-emerald-700';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Left: Mobile Menu & Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileSidebar}
            className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Buka Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            {/* BRILink Logo Badge / Custom App Logo */}
            {settings.appLogoUrl ? (
              <img
                src={settings.appLogoUrl}
                alt="Logo Aplikasi"
                className="w-9 h-9 rounded-xl object-contain bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-0.5 shadow-xs flex-shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#02539a] to-[#00386b] flex items-center justify-center text-white font-extrabold shadow-sm relative overflow-hidden flex-shrink-0">
                <span className="text-sm font-black tracking-tight">BRI</span>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#f37021] rounded-full" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white tracking-tight">
                  ATM MINI BRILINK
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-[#f37021]/15 text-[#f37021] dark:bg-[#f37021]/25 dark:text-[#ff8f49] border border-[#f37021]/30">
                  REKAP
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[170px] sm:max-w-[260px] leading-tight">
                {settings.namaUsaha}
              </p>
            </div>
          </div>
        </div>

        {/* Center: Live Date & Clock (Desktop) */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 text-xs text-slate-600 dark:text-slate-300 font-medium">
          <span>{formatTanggalIndo(new Date().toISOString().slice(0, 10))}</span>
          <span className="text-slate-300 dark:text-slate-600">•</span>
          <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{timeStr} WIB</span>
        </div>

        {/* Right: Sync Status, Dark Mode, User Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Google Spreadsheet Sync Status Pill */}
          <button
            onClick={onOpenAppsScriptModal}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold border transition shadow-xs ${
              syncStatus.syncing
                ? 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800'
                : syncStatus.pendingCount > 0
                ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                : syncStatus.isConfigured
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
            }`}
            title={
              syncStatus.syncing
                ? 'Sedang mengirim data realtime ke Google Spreadsheet...'
                : syncStatus.pendingCount > 0
                ? `${syncStatus.pendingCount} transaksi dalam antrean sinkronisasi. Klik untuk detail.`
                : syncStatus.isConfigured
                ? `Sinkronisasi Realtime Spreadsheet Aktif. Terakhir: ${syncStatus.lastSyncTime || 'Baru saja'}`
                : 'Hubungkan Google Spreadsheet agar transaksi otomatis masuk secara realtime'
            }
          >
            {syncStatus.syncing ? (
              <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
            ) : syncStatus.pendingCount > 0 ? (
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping inline-block" />
                <span className="font-bold text-[11px]">{syncStatus.pendingCount}</span>
              </div>
            ) : syncStatus.isConfigured ? (
              <CloudCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Database className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            )}
            <span className="hidden sm:inline">
              {syncStatus.syncing
                ? 'Sync Spreadsheet...'
                : syncStatus.pendingCount > 0
                ? `${syncStatus.pendingCount} Pending`
                : syncStatus.isConfigured
                ? 'Spreadsheet Realtime'
                : 'Setup Spreadsheet'}
            </span>
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={onToggleDarkMode}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Toggle tema gelap/terang"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* User Account / Role Badge */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition text-left"
            >
              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                {currentUser?.name.charAt(0) || 'U'}
              </div>
              <div className="hidden sm:block">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">
                  {currentUser?.name.split(' ')[0] || 'Pengguna'}
                </div>
                <div className={`text-[9px] font-extrabold uppercase px-1 rounded-sm border inline-block ${getRoleBadge(currentUser?.role)}`}>
                  {currentUser?.role || 'GUEST'}
                </div>
              </div>
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{currentUser?.name}</p>
                  <p className="text-[11px] text-slate-500">@{currentUser?.username} • {currentUser?.role}</p>
                </div>

                <div className="py-1">
                  <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400">
                    Ganti Role Cepat:
                  </div>
                  {allUsers.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        onSwitchUser(u);
                        setShowUserMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition ${
                        currentUser?.id === u.id
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-bold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span>{u.name}</span>
                      <span className={`text-[9px] px-1 rounded border font-semibold ${getRoleBadge(u.role)}`}>
                        {u.role}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onLogout();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 font-medium"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Keluar Sistem
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
