import React, { useState } from 'react';
import { User, BusinessSettings } from '../types';
import { StorageService } from '../services/storage';
import { ShieldCheck, Lock, User as UserIcon, LogIn, Eye, EyeOff } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
  allUsers: User[];
  settings?: BusinessSettings;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess, settings }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const currentSettings = settings || StorageService.getSettings();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    setTimeout(() => {
      const result = StorageService.loginCheck(username, password);
      setIsLoading(false);
      if (result.success && result.user) {
        onLoginSuccess(result.user);
      } else {
        setErrorMsg(result.error || 'Username atau password salah. Pastikan akun terdaftar dan aktif.');
      }
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#00264d] to-slate-900 flex items-center justify-center p-4">
      {/* Background glow circle */}
      <div className="absolute w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md bg-white dark:bg-slate-900/95 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-8 overflow-hidden backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header Branding */}
        <div className="text-center space-y-2 mb-8">
          {currentSettings.appLogoUrl ? (
            <div className="inline-flex items-center justify-center mb-2">
              <img
                src={currentSettings.appLogoUrl}
                alt="Logo Aplikasi"
                className="w-16 h-16 rounded-2xl object-contain shadow-xl p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
          ) : (
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#02539a] to-[#00386b] text-white shadow-xl shadow-blue-500/20 mb-2 relative">
              <span className="text-2xl font-black tracking-tight">BRI</span>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#f37021] rounded-full border-2 border-white dark:border-slate-900" />
            </div>
          )}

          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            ATM MINI BRILINK
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {currentSettings.namaUsaha || 'Sistem Rekap Pembukuan, Mutasi Kas & Struk Kasir'}
          </p>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="mb-5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {/* Form Login */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Username Petugas
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                required
                autoComplete="username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Masukkan username akun Anda"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Masukkan password"
                className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-blue-600 via-[#02539a] to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/25 transition transform active:scale-98 disabled:opacity-70 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            {isLoading ? 'Memverifikasi Akun...' : 'Masuk ke Sistem Pembukuan'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            Akses Terproteksi &bull; Manajemen Pengguna &bull; Audit Log
          </p>
        </div>
      </div>
    </div>
  );
};
