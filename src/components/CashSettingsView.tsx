import React, { useState } from 'react';
import { BusinessSettings, BalanceSummary, UserRole, NavTab } from '../types';
import { StorageService } from '../services/storage';
import { AppsScriptSyncService } from '../services/appsScriptSync';
import {
  Wallet,
  Building2,
  SlidersHorizontal,
  Scale,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  ArrowRightLeft,
  Coins,
  History,
  ShieldAlert,
  Download,
  Printer,
  Copy,
  Plus,
  Minus,
  Sparkles,
  Info,
  Layers,
  ArrowUpRight,
  ArrowDownLeft,
  Lock
} from 'lucide-react';

interface CashSettingsViewProps {
  settings: BusinessSettings;
  balance: BalanceSummary;
  userRole: UserRole;
  currentUsername: string;
  onSaveSettings: (settings: BusinessSettings) => void;
  onDataMutated: () => void;
  onSelectTab: (tab: NavTab) => void;
}

export const CashSettingsView: React.FC<CashSettingsViewProps> = ({
  settings,
  balance,
  userRole,
  currentUsername,
  onSaveSettings,
  onDataMutated,
  onSelectTab
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'pengaturan' | 'kalibrasi' | 'shift' | 'reset-data' | 'audit'>('pengaturan');

  // Form states: Parameter Kas
  const [saldoAwalKas, setSaldoAwalKas] = useState<number>(settings.saldoAwalKasTunai || 0);
  const [saldoAwalBank, setSaldoAwalBank] = useState<number>(settings.saldoAwalRekening || 0);
  const [minKasLaci, setMinKasLaci] = useState<number>(settings.minKasTunaiLaci ?? 3000000);
  const [maxKasLaci, setMaxKasLaci] = useState<number>(settings.maxKasTunaiLaci ?? 25000000);
  const [minBank, setMinBank] = useState<number>(settings.minSaldoRekening ?? 5000000);
  const [settingFeedback, setSettingFeedback] = useState<string | null>(null);

  // Form states: Kalibrasi Saldo
  const [hitungFisikKas, setHitungFisikKas] = useState<string>('');
  const [hitungFisikBank, setHitungFisikBank] = useState<string>('');
  const [modeKalibrasi, setModeKalibrasi] = useState<'transaction' | 'baseline'>('transaction');
  const [alasanKalibrasi, setAlasanKalibrasi] = useState<string>('');
  const [kalibrasiFeedback, setKalibrasiFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Form states: Tutup Shift & Serah Terima Kas
  const [petugasShiftBaru, setPetugasShiftBaru] = useState<string>('');
  const [modalShiftBaru, setModalShiftBaru] = useState<number>(5000000);
  const [catatanShift, setCatatanShift] = useState<string>('');
  const [shiftFeedback, setShiftFeedback] = useState<{ success: boolean; message: string; receiptText?: string } | null>(null);

  // Form states: Reset Data
  const [resetType, setResetType] = useState<'cashflow_only' | 'reconciliations_only' | 'all_transactions' | 'full_factory_reset'>('cashflow_only');
  const [newCashAfterReset, setNewCashAfterReset] = useState<number>(settings.saldoAwalKasTunai || 10000000);
  const [newBankAfterReset, setNewBankAfterReset] = useState<number>(settings.saldoAwalRekening || 30000000);
  const [confirmKeyword, setConfirmKeyword] = useState<string>('');
  const [resetFeedback, setResetFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Quick Action Modal states
  const [quickModal, setQuickModal] = useState<'tambahKas' | 'tarikKas' | 'setorBank' | 'tarikBank' | null>(null);
  const [quickNominal, setQuickNominal] = useState<number>(1000000);
  const [quickCatatan, setQuickCatatan] = useState<string>('');

  const formatRupiah = (val: number) => {
    return 'Rp ' + Math.round(val).toLocaleString('id-ID');
  };

  const isAuthorizedToReset = userRole === 'ADMIN' || userRole === 'OWNER';

  // Warnings check
  const isKasMenipis = balance.kasTunai < minKasLaci;
  const isKasMenumpuk = balance.kasTunai > maxKasLaci;
  const isBankMenipis = balance.rekeningBRILink < minBank;

  // Kalibrasi Difference Calculations
  const targetKasVal = hitungFisikKas !== '' ? parseFloat(hitungFisikKas) || 0 : undefined;
  const targetBankVal = hitungFisikBank !== '' ? parseFloat(hitungFisikBank) || 0 : undefined;
  const selisihKasTunai = targetKasVal !== undefined ? targetKasVal - balance.kasTunai : 0;
  const selisihRekening = targetBankVal !== undefined ? targetBankVal - balance.rekeningBRILink : 0;

  // Shift handover calculations
  const sisaKasShiftDisetor = balance.kasTunai - modalShiftBaru;

  // Handlers
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.saveCashSettings(
      {
        saldoAwalKasTunai: Number(saldoAwalKas),
        saldoAwalRekening: Number(saldoAwalBank),
        minKasTunaiLaci: Number(minKasLaci),
        maxKasTunaiLaci: Number(maxKasLaci),
        minSaldoRekening: Number(minBank)
      },
      currentUsername
    );

    const updated = StorageService.getSettings();
    onSaveSettings(updated);
    AppsScriptSyncService.syncSettings(updated, currentUsername);
    setSettingFeedback('Parameter kas & batas keamanan berhasil diperbarui!');
    setTimeout(() => setSettingFeedback(null), 4000);
    onDataMutated();
  };

  const handleExecuteKalibrasi = () => {
    if (targetKasVal === undefined && targetBankVal === undefined) {
      alert('Silakan masukkan nilai uang fisik kas laci atau saldo rekening aktual.');
      return;
    }
    if (!alasanKalibrasi.trim()) {
      alert('Harap isi alasan/keterangan penyesuaian saldo.');
      return;
    }

    const res = StorageService.adjustCashBalance({
      targetKasTunai: targetKasVal,
      targetRekening: targetBankVal,
      mode: modeKalibrasi,
      reason: alasanKalibrasi.trim(),
      actor: currentUsername
    });

    setKalibrasiFeedback(res);
    if (res.success) {
      setHitungFisikKas('');
      setHitungFisikBank('');
      setAlasanKalibrasi('');
      onDataMutated();
      const updated = StorageService.getSettings();
      onSaveSettings(updated);
      AppsScriptSyncService.syncSettings(updated, currentUsername);
    }
  };

  const handleExecuteShiftReset = () => {
    if (modalShiftBaru < 0) {
      alert('Modal shift baru tidak boleh kurang dari 0.');
      return;
    }

    const res = StorageService.resetDailyShiftCash({
      newKasTunai: modalShiftBaru,
      note: `Petugas keluar: ${currentUsername}${petugasShiftBaru ? `, Petugas masuk: ${petugasShiftBaru}` : ''}. ${catatanShift}`,
      actor: currentUsername
    });

    if (res.success) {
      const receiptText = `
========================================
       BERITA ACARA SERAH TERIMA KAS
       ${settings.namaUsaha}
========================================
Waktu        : ${new Date().toLocaleString('id-ID')}
Kasir Selesai: ${currentUsername}
Kasir Baru   : ${petugasShiftBaru || '-'}
----------------------------------------
Kas Sebelum  : ${formatRupiah(balance.kasTunai)}
Modal Shift  : ${formatRupiah(modalShiftBaru)}
${res.selisihKas >= 0 ? 'Disetor Toko : ' + formatRupiah(res.selisihKas) : 'Injeksi Modal: ' + formatRupiah(Math.abs(res.selisihKas))}
Status Kas   : Kas Laci Siap Operasional
Catatan      : ${catatanShift || 'Serah terima normal tanpa selisih'}
========================================
Tanda Tangan Kasir Selesai: ( ${currentUsername} )
Tanda Tangan Kasir Baru   : ( ${petugasShiftBaru || 'Kasir'} )
========================================
`;
      setShiftFeedback({
        success: true,
        message: res.message,
        receiptText
      });
      onDataMutated();
      const updated = StorageService.getSettings();
      onSaveSettings(updated);
      AppsScriptSyncService.syncSettings(updated, currentUsername);
    } else {
      setShiftFeedback({ success: false, message: res.message });
    }
  };

  const handleExecuteResetData = () => {
    if (!isAuthorizedToReset) {
      alert('Akses Ditolak: Hanya Akun ADMIN atau OWNER yang berhak melakukan reset data.');
      return;
    }

    if (confirmKeyword.trim().toUpperCase() !== 'RESET KAS') {
      alert('Kata kunci konfirmasi salah! Ketik "RESET KAS" secara tepat untuk melanjutkan.');
      return;
    }

    const confirmed = window.confirm(
      'PERINGATAN: Tindakan ini akan mereset data pembukuan sesuai opsi yang dipilih! Cadangan data akan otomatis dibuat terlebih dahulu. Apakah Anda yakin?'
    );
    if (!confirmed) return;

    const res = StorageService.clearCashData({
      resetType,
      newInitialCash: newCashAfterReset,
      newInitialBank: newBankAfterReset,
      actor: currentUsername
    });

    setResetFeedback(res);
    setConfirmKeyword('');
    if (res.success) {
      onDataMutated();
      const updated = StorageService.getSettings();
      onSaveSettings(updated);
      AppsScriptSyncService.syncSettings(updated, currentUsername);
    }
  };

  const handleDownloadBackup = () => {
    const backupJson = StorageService.exportBackupJson();
    const blob = new Blob([backupJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_brilink_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExecuteQuickAction = () => {
    if (quickNominal <= 0) {
      alert('Nominal harus lebih dari 0');
      return;
    }

    if (quickModal === 'tambahKas') {
      StorageService.quickCashInjection(quickNominal, quickCatatan, currentUsername);
    } else if (quickModal === 'tarikKas') {
      StorageService.quickCashWithdrawal(quickNominal, quickCatatan, currentUsername);
    } else if (quickModal === 'setorBank') {
      StorageService.transferCashToBank(quickNominal, quickCatatan, currentUsername);
    } else if (quickModal === 'tarikBank') {
      StorageService.transferBankToCash(quickNominal, quickCatatan, currentUsername);
    }

    setQuickModal(null);
    setQuickNominal(1000000);
    setQuickCatatan('');
    onDataMutated();
  };

  const copyReceiptToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Berita acara kasir berhasil disalin ke clipboard! Siap dikirim ke WhatsApp Pemilik.');
  };

  // Get audit logs related to cash
  const allLogs = StorageService.getAuditLogs();
  const cashLogs = allLogs.filter(log => {
    const act = (log.action || log.aktivitas || '').toLowerCase();
    const det = (log.details || log.keterangan || '').toLowerCase();
    return (
      act.includes('kas') ||
      act.includes('saldo') ||
      act.includes('reset') ||
      det.includes('kas') ||
      det.includes('rekening')
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner: Status Saldo & Ringkasan Cepat */}
      <div className="bg-gradient-to-r from-slate-900 via-[#02539a] to-slate-900 rounded-3xl p-6 sm:p-7 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-[#f37021]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-blue-100">
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-300" />
              Pusat Manajemen Kas &amp; Kontrol Saldo BRILink
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Pengaturan &amp; Reset Kas
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed">
              Atur batas aman modal laci fisik, lakukan kalibrasi selisih uang riil, laksanakan tutup shift kasir, dan kelola reset data pembukuan secara aman.
            </p>
          </div>

          {/* Quick Buttons for Cash Operations */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <button
              onClick={() => {
                setQuickModal('tambahKas');
                setQuickNominal(1000000);
                setQuickCatatan('Tambah Modal Kas Laci dari Pemilik');
              }}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              + Tambah Kas Laci
            </button>
            <button
              onClick={() => {
                setQuickModal('tarikKas');
                setQuickNominal(1000000);
                setQuickCatatan('Tarik Modal Kas Laci / Prive Pemilik');
              }}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md transition active:scale-95"
            >
              <Minus className="w-4 h-4" />
              - Tarik Kas Laci
            </button>
            <button
              onClick={() => {
                setQuickModal('setorBank');
                setQuickNominal(2000000);
                setQuickCatatan('Setor uang fisik laci ke rekening bank');
              }}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition active:scale-95"
            >
              <ArrowRightLeft className="w-4 h-4" />
              Setor Kas ke Bank
            </button>
          </div>
        </div>

        {/* 3 Overview Stat Cards */}
        <div className="mt-6 pt-5 border-t border-white/15 grid grid-cols-1 sm:grid-cols-3 gap-3 text-white">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <div className="flex items-center justify-between text-xs text-blue-100 font-medium">
              <span>Saldo Kas Tunai (Laci)</span>
              <Wallet className="w-4 h-4 text-blue-200" />
            </div>
            <div className="mt-2 text-xl font-extrabold">{formatRupiah(balance.kasTunai)}</div>
            <div className="mt-1 flex items-center gap-1.5 text-[11px]">
              {isKasMenipis ? (
                <span className="px-2 py-0.5 rounded-md bg-rose-500/80 text-white font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Menipis
                </span>
              ) : isKasMenumpuk ? (
                <span className="px-2 py-0.5 rounded-md bg-amber-500/80 text-white font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Menumpuk (Segera Setor)
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/80 text-white font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Kondisi Kas Aman
                </span>
              )}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <div className="flex items-center justify-between text-xs text-blue-100 font-medium">
              <span>Saldo Rekening BRILink</span>
              <Building2 className="w-4 h-4 text-indigo-200" />
            </div>
            <div className="mt-2 text-xl font-extrabold">{formatRupiah(balance.rekeningBRILink)}</div>
            <div className="mt-1 flex items-center gap-1.5 text-[11px]">
              {isBankMenipis ? (
                <span className="px-2 py-0.5 rounded-md bg-rose-500/80 text-white font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Saldo Bank Rendah
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/80 text-white font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Mutasi Bank Stabil
                </span>
              )}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <div className="flex items-center justify-between text-xs text-blue-100 font-medium">
              <span>Total Modal Likuiditas Aktif</span>
              <Coins className="w-4 h-4 text-amber-300" />
            </div>
            <div className="mt-2 text-xl font-extrabold text-amber-200">{formatRupiah(balance.totalSaldo)}</div>
            <div className="mt-1 text-[11px] text-blue-100">
              {settings.lastCashResetDate ? `Reset Terakhir: ${settings.lastCashResetDate}` : 'Modal terintegrasi aktif'}
            </div>
          </div>
        </div>
      </div>

      {/* WARNING NOTIFICATIONS IF THRESHOLDS TRIGGERED */}
      {(isKasMenipis || isKasMenumpuk || isBankMenipis) && (
        <div className="space-y-2">
          {isKasMenipis && (
            <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-rose-900 dark:text-rose-200">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-600">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold">Peringatan: Saldo Kas Laci Menipis!</span>
                  <p className="text-rose-700 dark:text-rose-300">
                    Sisa kas fisik laci {formatRupiah(balance.kasTunai)} (di bawah batas minimal aman {formatRupiah(minKasLaci)}). Berpotensi gagal saat ada nasabah ingin Tarik Tunai.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setQuickModal('tarikBank');
                  setQuickNominal(3000000);
                  setQuickCatatan('Tarik uang dari ATM untuk isi kas fisik laci');
                }}
                className="px-3 py-1.5 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-500 whitespace-nowrap shadow-xs"
              >
                Tarik ATM ke Kas Laci
              </button>
            </div>
          )}

          {isKasMenumpuk && (
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-600">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold">Perhatian: Uang Tunai di Laci Terlalu Tebal!</span>
                  <p className="text-amber-700 dark:text-amber-300">
                    Uang fisik mencapai {formatRupiah(balance.kasTunai)} (melebihi batas aman {formatRupiah(maxKasLaci)}). Disarankan segera setor ke rekening bank demi keamanan toko.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setQuickModal('setorBank');
                  setQuickNominal(5000000);
                  setQuickCatatan('Setor tunai uang laci ke rekening bank BRILink');
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-600 text-white font-bold text-xs hover:bg-amber-500 whitespace-nowrap shadow-xs"
              >
                Setor Kas ke Bank
              </button>
            </div>
          )}

          {isBankMenipis && (
            <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-indigo-900 dark:text-indigo-200">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold">Perhatian: Saldo Rekening BRILink Menipis!</span>
                  <p className="text-indigo-700 dark:text-indigo-300">
                    Saldo rekening bank tersisa {formatRupiah(balance.rekeningBRILink)} (di bawah batas minimal {formatRupiah(minBank)}). Nasabah tidak dapat melakukan Transfer / Setor Tunai jika saldo rekening kosong.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setQuickModal('setorBank');
                  setQuickNominal(3000000);
                  setQuickCatatan('Setor tunai ke rekening bank untuk isi kuota transaksi transfer');
                }}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-500 whitespace-nowrap shadow-xs"
              >
                Setor Tunai ke Bank
              </button>
            </div>
          )}
        </div>
      )}

      {/* SUB-TABS NAVIGATION */}
      <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap gap-1.5">
        {[
          { id: 'pengaturan' as const, label: '⚙️ Parameter & Batas Kas', icon: SlidersHorizontal },
          { id: 'kalibrasi' as const, label: '⚖️ Kalibrasi / Sesuaikan Saldo', icon: Scale },
          { id: 'shift' as const, label: '🔄 Tutup Shift & Reset Harian', icon: RotateCcw },
          { id: 'reset-data' as const, label: '⚠️ Reset Data & Buku Baru', icon: ShieldAlert },
          { id: 'audit' as const, label: '📋 Riwayat Penyesuaian', icon: History },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
              activeSubTab === tab.id
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: PARAMETER & BATAS KAS */}
      {activeSubTab === 'pengaturan' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div className="border-b pb-4 border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-blue-600" />
                Pengaturan Parameter Saldo &amp; Batas Keamanan Kas
              </h2>
              <p className="text-xs text-slate-500">
                Tentukan modal awal dasar dan batasan alarm keamanan untuk kas laci fisik serta rekening bank.
              </p>
            </div>
            {settingFeedback && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {settingFeedback}
              </div>
            )}
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Saldo Awal Kas Tunai */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Modal Awal Kas Tunai (Laci)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">Rp</span>
                  <input
                    type="number"
                    step={50000}
                    value={saldoAwalKas}
                    onChange={e => setSaldoAwalKas(Number(e.target.value))}
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 font-mono text-sm font-bold text-slate-900 dark:text-white"
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Baseline modal kas fisik saat sistem mulai digunakan.
                </p>
              </div>

              {/* Saldo Awal Rekening BRILink */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Modal Awal Rekening BRILink
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">Rp</span>
                  <input
                    type="number"
                    step={50000}
                    value={saldoAwalBank}
                    onChange={e => setSaldoAwalBank(Number(e.target.value))}
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 font-mono text-sm font-bold text-slate-900 dark:text-white"
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Baseline saldo rekening EDC/Web BRILink saat sistem mulai digunakan.
                </p>
              </div>

              {/* Batas Minimal Kas Laci */}
              <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 space-y-2">
                <label className="block text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center justify-between">
                  <span>Batas Minimal Kas Tunai Laci</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-200">Alarm Kas Habis</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs font-bold text-amber-600">Rp</span>
                  <input
                    type="number"
                    step={50000}
                    value={minKasLaci}
                    onChange={e => setMinKasLaci(Number(e.target.value))}
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-800 font-mono text-sm font-bold text-slate-900 dark:text-white"
                  />
                </div>
                <p className="text-[11px] text-amber-700 dark:text-amber-400">
                  Sistem memberi peringatan jika kas laci di bawah nominal ini agar kasir segera tarik tunai.
                </p>
              </div>

              {/* Batas Maksimal Kas Laci */}
              <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 space-y-2">
                <label className="block text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center justify-between">
                  <span>Batas Maksimal Kas Tunai Laci</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-200">Alarm Kas Menumpuk</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs font-bold text-amber-600">Rp</span>
                  <input
                    type="number"
                    step={50000}
                    value={maxKasLaci}
                    onChange={e => setMaxKasLaci(Number(e.target.value))}
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-800 font-mono text-sm font-bold text-slate-900 dark:text-white"
                  />
                </div>
                <p className="text-[11px] text-amber-700 dark:text-amber-400">
                  Peringatan keamanan jika uang tunai laci terlalu besar, agar kasir segera setor ke bank.
                </p>
              </div>

              {/* Batas Minimal Saldo Rekening */}
              <div className="sm:col-span-2 p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/60 space-y-2">
                <label className="block text-xs font-bold text-blue-900 dark:text-blue-300 flex items-center justify-between">
                  <span>Batas Minimal Saldo Rekening BRILink</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200">Alarm Rekening Habis</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs font-bold text-blue-600">Rp</span>
                  <input
                    type="number"
                    step={50000}
                    value={minBank}
                    onChange={e => setMinBank(Number(e.target.value))}
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-800 font-mono text-sm font-bold text-slate-900 dark:text-white"
                  />
                </div>
                <p className="text-[11px] text-blue-700 dark:text-blue-400">
                  Peringatan jika kuota transfer/setor tunai di rekening menipis, agar agen segera menyetor uang kas laci ke bank.
                </p>
              </div>
            </div>

            {/* Formula Explanation Card */}
            <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-1.5">
              <div className="font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                <Info className="w-4 h-4 text-blue-600" />
                Rumus Arus Kas Sistem BRILink:
              </div>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                <li><strong>Kas Laci</strong> = Saldo Awal Kas + Penerimaan Setor/Transfer/Tagihan + Admin Diterima + Kas Masuk - Penarikan Nasabah - Kas Keluar.</li>
                <li><strong>Rekening Bank</strong> = Saldo Awal Bank + Kredit Tarik Tunai + Fee Sharing - Debet Setor/Transfer/PLN - Biaya Provider.</li>
              </ul>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition active:scale-95"
              >
                Simpan Parameter Kas
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: KALIBRASI / SESUAIKAN SALDO KAS */}
      {activeSubTab === 'kalibrasi' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div className="border-b pb-4 border-slate-100 dark:border-slate-800">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Scale className="w-5 h-5 text-blue-600" />
              Kalibrasi &amp; Penyesuaian Saldo Kas Fisik vs Sistem
            </h2>
            <p className="text-xs text-slate-500">
              Gunakan fitur ini jika ada perbedaan antara jumlah uang fisik di laci atau rekening dengan catatan sistem.
            </p>
          </div>

          {kalibrasiFeedback && (
            <div
              className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-3 ${
                kalibrasiFeedback.success
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <div>{kalibrasiFeedback.message}</div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Fisik */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                1. Masukkan Hasil Hitung Aktual
              </h3>

              <div className="space-y-2">
                <label className="block text-xs font-semibold">
                  Uang Fisik Kas Laci Aktual (Hasil Hitung Riil)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">Rp</span>
                  <input
                    type="number"
                    placeholder={`Saldo sistem saat ini: ${balance.kasTunai}`}
                    value={hitungFisikKas}
                    onChange={e => setHitungFisikKas(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-sm"
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Sistem mencatat: {formatRupiah(balance.kasTunai)}</span>
                  {targetKasVal !== undefined && (
                    <span className={`font-bold ${selisihKasTunai === 0 ? 'text-emerald-600' : selisihKasTunai > 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                      Selisih: {selisihKasTunai >= 0 ? '+' : ''}{formatRupiah(selisihKasTunai)}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold">
                  Saldo Rekening BRILink Aktual (Cek m-Banking / EDC)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">Rp</span>
                  <input
                    type="number"
                    placeholder={`Saldo sistem saat ini: ${balance.rekeningBRILink}`}
                    value={hitungFisikBank}
                    onChange={e => setHitungFisikBank(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-sm"
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Sistem mencatat: {formatRupiah(balance.rekeningBRILink)}</span>
                  {targetBankVal !== undefined && (
                    <span className={`font-bold ${selisihRekening === 0 ? 'text-emerald-600' : selisihRekening > 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                      Selisih: {selisihRekening >= 0 ? '+' : ''}{formatRupiah(selisihRekening)}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold">
                  Alasan / Keterangan Penyesuaian *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Hitung fisik laci sore hari, koreksi receh kembalian"
                  value={alasanKalibrasi}
                  onChange={e => setAlasanKalibrasi(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>
            </div>

            {/* Metode & Review Penyesuaian */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                2. Pilih Metode Penyesuaian
              </h3>

              <div className="space-y-2.5">
                <label
                  onClick={() => setModeKalibrasi('transaction')}
                  className={`block p-4 rounded-xl border cursor-pointer transition ${
                    modeKalibrasi === 'transaction'
                      ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-500 ring-2 ring-blue-500/20'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-blue-600" />
                      Mode Transaksi (Disarankan / Standar Akuntansi)
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold">Rekomendasi</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Selisih lebih dicatat sebagai <strong>Kas Masuk</strong>, selisih kurang dicatat sebagai <strong>Kas Keluar</strong>. Riwayat audit dan rekap keuangan tetap runtut dan transparan.
                  </p>
                </label>

                <label
                  onClick={() => setModeKalibrasi('baseline')}
                  className={`block p-4 rounded-xl border cursor-pointer transition ${
                    modeKalibrasi === 'baseline'
                      ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-500 ring-2 ring-blue-500/20'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <RotateCcw className="w-4 h-4 text-indigo-600" />
                      Mode Kalibrasi Baseline Langsung
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Langsung menyelaraskan angka modal awal sistem sehingga saldo berjalan tepat sesuai target, tanpa menambah transaksi kas baru.
                  </p>
                </label>
              </div>

              {/* Ringkasan Dampak Penyesuaian */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200">Ringkasan Efek Penyesuaian:</span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-500 block">Kas Tunai Menjadi:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {targetKasVal !== undefined ? formatRupiah(targetKasVal) : formatRupiah(balance.kasTunai)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Rekening Bank Menjadi:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {targetBankVal !== undefined ? formatRupiah(targetBankVal) : formatRupiah(balance.rekeningBRILink)}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleExecuteKalibrasi}
                disabled={targetKasVal === undefined && targetBankVal === undefined}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs shadow-md transition active:scale-98 flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Terapkan Penyesuaian Saldo Kas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TUTUP SHIFT & RESET HARIAN */}
      {activeSubTab === 'shift' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div className="border-b pb-4 border-slate-100 dark:border-slate-800">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-blue-600" />
              Serah Terima Kasir &amp; Reset Modal Shift Baru
            </h2>
            <p className="text-xs text-slate-500">
              Tetapkan modal kas fisik laci untuk shift berikutnya. Sisa kelebihan kas di laci otomatis dicatat disetor ke pemilik / brankas.
            </p>
          </div>

          {shiftFeedback && (
            <div className="space-y-3">
              <div
                className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-3 ${
                  shiftFeedback.success
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <div>{shiftFeedback.message}</div>
              </div>

              {shiftFeedback.receiptText && (
                <div className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                    <span className="font-bold text-emerald-400">Berita Acara Kasir Siap Dicetak</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyReceiptToClipboard(shiftFeedback.receiptText!)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" /> Salin WhatsApp
                      </button>
                      <button
                        onClick={() => window.print()}
                        className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-[11px] flex items-center gap-1 font-bold"
                      >
                        <Printer className="w-3 h-3" /> Cetak Struk
                      </button>
                    </div>
                  </div>
                  <pre className="whitespace-pre-wrap text-[11px] leading-relaxed">
                    {shiftFeedback.receiptText}
                  </pre>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="text-xs text-slate-500 block">Total Uang Fisik Kas Laci Saat Ini:</span>
                <span className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">
                  {formatRupiah(balance.kasTunai)}
                </span>
                <p className="text-[11px] text-slate-400">
                  Hitung fisik laci sebelum pergantian shift dilakukan.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold">
                  Modal Kas Laci untuk Shift Baru (Float Modal) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">Rp</span>
                  <input
                    type="number"
                    step={100000}
                    value={modalShiftBaru}
                    onChange={e => setModalShiftBaru(Number(e.target.value))}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-sm font-bold"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {[2000000, 3000000, 5000000, 10000000].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setModalShiftBaru(val)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 text-[11px] font-semibold text-slate-600 dark:text-slate-300"
                    >
                      {formatRupiah(val)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Kasir Selesai (Saat Ini)</label>
                  <input
                    type="text"
                    disabled
                    value={currentUsername}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Kasir Shift Baru</label>
                  <input
                    type="text"
                    placeholder="Nama kasir pengganti"
                    value={petugasShiftBaru}
                    onChange={e => setPetugasShiftBaru(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Catatan Serah Terima Kasir</label>
                <input
                  type="text"
                  placeholder="Kondisi struk, titipan, atau catatan operasional shift"
                  value={catatanShift}
                  onChange={e => setCatatanShift(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs"
                />
              </div>
            </div>

            {/* Shift Handover Live Summary */}
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-850 border border-blue-100 dark:border-slate-700 space-y-4">
                <h3 className="text-xs font-bold text-blue-900 dark:text-blue-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  Kalkulasi Serah Terima Shift:
                </h3>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-blue-100 dark:border-slate-700">
                    <span className="text-slate-600 dark:text-slate-400">Total Kas di Laci:</span>
                    <span className="font-bold">{formatRupiah(balance.kasTunai)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-blue-100 dark:border-slate-700">
                    <span className="text-slate-600 dark:text-slate-400">Modal Diserahkan ke Shift Baru:</span>
                    <span className="font-bold text-blue-600">{formatRupiah(modalShiftBaru)}</span>
                  </div>
                  <div className="flex justify-between py-1 pt-2 font-bold">
                    <span className="text-slate-800 dark:text-slate-200">
                      {sisaKasShiftDisetor >= 0 ? 'Sisa Kas Disetor ke Pemilik / Brankas:' : 'Kekurangan Kas (Injeksi Modal):'}
                    </span>
                    <span className={`text-base ${sisaKasShiftDisetor >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {formatRupiah(Math.abs(sisaKasShiftDisetor))}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-blue-200 dark:border-slate-700 text-[11px] text-slate-500">
                  💡 Dengan menekan tombol proses, sistem otomatis mencatat penarikan kas sisa ke pemilik dan menyetel kas laci tepat sebesar modal shift baru.
                </div>

                <button
                  onClick={handleExecuteShiftReset}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition active:scale-98 flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Proses Tutup Shift &amp; Setel Kas Baru
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: RESET DATA KAS & PEMBUKUAN */}
      {activeSubTab === 'reset-data' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-rose-200 dark:border-rose-900/60 shadow-xs space-y-6">
          <div className="border-b pb-4 border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-rose-600 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                Zona Perhatian Khusus: Reset Data Kas &amp; Pembukuan
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Digunakan saat memulai tahun pembukuan baru, mengosongkan riwayat kas masuk/keluar, atau mengembalikan ke data awal.
              </p>
            </div>
            <button
              onClick={handleDownloadBackup}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-300 transition"
            >
              <Download className="w-4 h-4 text-blue-600" />
              Unduh Backup JSON
            </button>
          </div>

          {!isAuthorizedToReset && (
            <div className="p-4 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 text-xs flex items-center gap-3">
              <Lock className="w-5 h-5 text-rose-600 flex-shrink-0" />
              <div>
                <strong>Akses Dibatasi:</strong> Hanya pengguna dengan peran <strong>ADMIN</strong> atau <strong>OWNER</strong> yang memiliki wewenang untuk mereset transaksi dan pembukuan.
              </div>
            </div>
          )}

          {resetFeedback && (
            <div
              className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-3 ${
                resetFeedback.success
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <div>{resetFeedback.message}</div>
            </div>
          )}

          <div className="space-y-4">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              1. Pilih Cakupan Data yang Ingin Direset:
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {[
                {
                  id: 'cashflow_only' as const,
                  title: 'Kosongkan Arus Kas Saja',
                  desc: 'Menghapus seluruh riwayat Kas Masuk & Kas Keluar manual. Transaksi nasabah tetap utuh tersimpan.',
                  badge: 'Aman'
                },
                {
                  id: 'reconciliations_only' as const,
                  title: 'Bersihkan Riwayat Rekonsiliasi',
                  desc: 'Menghapus riwayat rekonsiliasi kas terdahulu.',
                  badge: 'Aman'
                },
                {
                  id: 'all_transactions' as const,
                  title: 'Mulai Buku Transaksi Baru (Reset Semua TRX)',
                  desc: 'Mengosongkan semua transaksi nasabah, kas masuk/keluar, mutasi, dan rekap. Modal awal baru bisa disetel ulang.',
                  badge: 'Kritis'
                },
                {
                  id: 'full_factory_reset' as const,
                  title: 'Kembalikan ke Data Demo Pabrik',
                  desc: 'Mereset seluruh data aplikasi ke kondisi bawaan contoh awal instalasi.',
                  badge: 'Pabrik'
                },
              ].map(opt => (
                <label
                  key={opt.id}
                  onClick={() => setResetType(opt.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition ${
                    resetType === opt.id
                      ? 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-500 ring-2 ring-rose-500/20'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white">{opt.title}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        opt.badge === 'Kritis'
                          ? 'bg-rose-100 text-rose-700'
                          : opt.badge === 'Pabrik'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {opt.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">{opt.desc}</p>
                </label>
              ))}
            </div>

            {/* If reset all transactions, allow setting new baseline balance */}
            {resetType === 'all_transactions' && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  Setel Modal Awal untuk Pembukuan Baru:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-500 mb-1">Modal Awal Kas Tunai (Laci)</label>
                    <input
                      type="number"
                      step={100000}
                      value={newCashAfterReset}
                      onChange={e => setNewCashAfterReset(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">Modal Awal Rekening BRILink</label>
                    <input
                      type="number"
                      step={100000}
                      value={newBankAfterReset}
                      onChange={e => setNewBankAfterReset(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Confirmation input */}
            <div className="p-4 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 space-y-3">
              <label className="block text-xs font-bold text-rose-900 dark:text-rose-200">
                2. Ketik kata konfirmasi: <span className="font-mono bg-rose-200 dark:bg-rose-900 px-2 py-0.5 rounded text-rose-900 dark:text-white">RESET KAS</span> untuk mengonfirmasi:
              </label>
              <input
                type="text"
                disabled={!isAuthorizedToReset}
                placeholder="Ketik RESET KAS di sini..."
                value={confirmKeyword}
                onChange={e => setConfirmKeyword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-800 font-mono text-sm tracking-wider"
              />

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <span className="text-[11px] text-slate-500">
                  🛡️ Sistem otomatis membuat backup data lokal sebelum proses reset dijalankan.
                </span>
                <button
                  onClick={handleExecuteResetData}
                  disabled={!isAuthorizedToReset || confirmKeyword.trim().toUpperCase() !== 'RESET KAS'}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-extrabold text-xs shadow-md transition active:scale-95 flex items-center justify-center gap-2"
                >
                  <ShieldAlert className="w-4 h-4" />
                  Eksekusi Reset Sekarang
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: RIWAYAT PENYESUAIAN KAS (AUDIT LOG) */}
      {activeSubTab === 'audit' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="border-b pb-4 border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <History className="w-5 h-5 text-blue-600" />
                Riwayat Penyesuaian &amp; Pengaturan Kas
              </h2>
              <p className="text-xs text-slate-500">
                Catatan riwayat setiap penyesuaian modal, kalibrasi selisih kas, serah terima shift, dan reset data.
              </p>
            </div>
            <button
              onClick={() => onSelectTab('audit-log')}
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              Lihat Semua Audit Log &rarr;
            </button>
          </div>

          {cashLogs.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-400">
              Belum ada riwayat aktivitas penyesuaian kas yang tercatat.
            </div>
          ) : (
            <div className="space-y-2">
              {cashLogs.map(log => (
                <div
                  key={log.id}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-blue-600 dark:text-blue-400">
                        {log.action || log.aktivitas}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium">
                        Oleh: {log.user || log.username || 'Sistem'}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300">
                      {log.details || log.keterangan || '-'}
                    </p>
                  </div>
                  <div className="text-[11px] text-slate-400 whitespace-nowrap">
                    {log.timestamp || `${log.tanggal} ${log.jam}`}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* QUICK ACTION MODALS (TAMBAH KAS, TARIK KAS, MUTASI BANK) */}
      {quickModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {quickModal === 'tambahKas' && <Plus className="w-5 h-5 text-emerald-600" />}
                {quickModal === 'tarikKas' && <Minus className="w-5 h-5 text-amber-600" />}
                {quickModal === 'setorBank' && <ArrowUpRight className="w-5 h-5 text-blue-600" />}
                {quickModal === 'tarikBank' && <ArrowDownLeft className="w-5 h-5 text-indigo-600" />}
                {quickModal === 'tambahKas' && 'Tambah Modal Kas Laci'}
                {quickModal === 'tarikKas' && 'Tarik Modal Kas Laci'}
                {quickModal === 'setorBank' && 'Setor Kas Laci ke Bank'}
                {quickModal === 'tarikBank' && 'Tarik Bank ke Kas Laci'}
              </h3>
              <button
                onClick={() => setQuickModal(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Nominal (Rp) *</label>
                <input
                  type="number"
                  step={50000}
                  value={quickNominal}
                  onChange={e => setQuickNominal(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-base font-bold"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[500000, 1000000, 2000000, 5000000].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setQuickNominal(amt)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold"
                    >
                      {formatRupiah(amt)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Keterangan / Keperluan</label>
                <input
                  type="text"
                  value={quickCatatan}
                  onChange={e => setQuickCatatan(e.target.value)}
                  placeholder="Keterangan transaksi..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-[11px] text-slate-500">
                {quickModal === 'tambahKas' && 'Uang kas fisik laci akan bertambah dari injeksi modal pemilik.'}
                {quickModal === 'tarikKas' && 'Uang kas fisik laci akan berkurang karena ditarik oleh pemilik atau disetor.'}
                {quickModal === 'setorBank' && 'Uang fisik laci berkurang dan saldo rekening BRILink bertambah.'}
                {quickModal === 'tarikBank' && 'Saldo rekening BRILink berkurang dan uang fisik laci bertambah.'}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setQuickModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteQuickAction}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition"
              >
                Konfirmasi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
