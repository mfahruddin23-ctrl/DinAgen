import React, { useState, useRef } from 'react';
import { BusinessSettings, NavTab } from '../types';
import {
  Save,
  Building,
  Printer,
  Sliders,
  Database,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Wallet,
  SlidersHorizontal,
  Image as ImageIcon,
  Upload,
  Trash2,
  Sparkles,
  Users,
  Eye,
  Info,
  Check
} from 'lucide-react';
import { AppsScriptSyncService } from '../services/appsScriptSync';

interface SettingsViewProps {
  settings: BusinessSettings;
  onSaveSettings: (settings: BusinessSettings) => void;
  onOpenAppsScriptCodeModal: () => void;
  onSelectTab?: (tab: NavTab) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSaveSettings,
  onOpenAppsScriptCodeModal,
  onSelectTab
}) => {
  const [formData, setFormData] = useState<BusinessSettings>({ ...settings });
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  const businessLogoInputRef = useRef<HTMLInputElement>(null);
  const appLogoInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (field: keyof BusinessSettings, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const processImageFile = (file: File, callback: (base64Url: string) => void) => {
    if (!file.type.startsWith('image/')) {
      alert('File harus berupa gambar (JPG, PNG, WebP, SVG).');
      return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      const result = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400;
        let width = img.width;
        let height = img.height;
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.9);
          callback(dataUrl);
        } else {
          callback(result);
        }
      };
      img.onerror = () => callback(result);
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const url = (formData.googleAppsScriptUrl || formData.gasWebAppUrl || '').trim();
    const updated = {
      ...formData,
      googleAppsScriptUrl: url,
      gasWebAppUrl: url,
      googleSpreadsheetId: (formData.googleSpreadsheetId || '').trim()
    };
    onSaveSettings(updated);
    AppsScriptSyncService.setConfiguration(updated.googleSpreadsheetId, url);
    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 4000);
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);

    // Temporarily apply current input URLs for testing
    AppsScriptSyncService.setConfiguration(formData.googleSpreadsheetId, formData.googleAppsScriptUrl || formData.gasWebAppUrl);
    const res = await AppsScriptSyncService.testConnection(formData.googleAppsScriptUrl || formData.gasWebAppUrl);
    setTestingConnection(false);
    setTestResult(res);
  };

  return (
    <div className="space-y-6">
      {/* Header View */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Pengaturan Usaha &amp; Identitas Sistem
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kustomisasi profil gerai, logo usaha untuk struk kasir, logo aplikasi, batas kas, dan integrasi Google Sheets
          </p>
        </div>

        {onSelectTab && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onSelectTab('users')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 font-bold text-xs transition"
            >
              <Users className="w-4 h-4" />
              <span>Kelola Pengguna &amp; Kasir</span>
            </button>
          </div>
        )}
      </div>

      {saveSuccessNotice && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>Seluruh perubahan pengaturan profil, logo, printer, dan integrasi berhasil disimpan!</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* SECTION: PENGATURAN LOGO USAHA & LOGO APLIKASI */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b pb-4 border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Identitas Visual &amp; Pengaturan Logo
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Atur logo usaha untuk struk thermal kasir &amp; logo aplikasi untuk navbar dan halaman login
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* CARD 1: LOGO USAHA (STRUK THERMAL & NOTA) */}
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Printer className="w-3.5 h-3.5 text-blue-600" />
                      1. Logo Usaha (Struk Kasir Thermal &amp; Nota)
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Tercetak di bagian paling atas struk kertas thermal (58mm / 80mm) dan nota digital WhatsApp
                    </p>
                  </div>
                  {formData.logoUrl && (
                    <button
                      type="button"
                      onClick={() => handleChange('logoUrl', '')}
                      className="text-[11px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Hapus
                    </button>
                  )}
                </div>

                {/* Upload or URL Controls */}
                <div className="space-y-2 text-xs">
                  <input
                    type="file"
                    ref={businessLogoInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        processImageFile(file, url => handleChange('logoUrl', url));
                      }
                    }}
                  />

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => businessLogoInputRef.current?.click()}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-dashed border-blue-400 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/30 hover:bg-blue-100 text-blue-700 dark:text-blue-300 font-bold text-xs transition"
                    >
                      <Upload className="w-4 h-4" />
                      Unggah Logo dari Komputer/HP
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Atau tempel Link / URL Gambar:
                    </label>
                    <input
                      type="url"
                      placeholder="https://contoh.com/logo-usaha.png"
                      value={formData.logoUrl || ''}
                      onChange={e => handleChange('logoUrl', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Real-time Preview: Mini Thermal Receipt */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Pratinjau Hasil Struk Kasir Thermal:</span>
                  <span className="text-[10px] text-blue-600 font-semibold">{formData.lebarKertasPrinter}</span>
                </div>

                <div className="bg-white text-slate-900 p-4 rounded-xl border border-slate-300 shadow-xs font-mono text-[11px] max-w-[260px] mx-auto text-center space-y-1.5">
                  {formData.logoUrl ? (
                    <div className="flex justify-center mb-2">
                      <img
                        src={formData.logoUrl}
                        alt="Logo Usaha"
                        className="max-h-12 max-w-[140px] object-contain filter grayscale contrast-125"
                      />
                    </div>
                  ) : (
                    <div className="py-2 px-3 border border-dashed border-slate-300 rounded-lg text-slate-400 text-[10px] italic">
                      [ Belum ada logo usaha ]
                    </div>
                  )}
                  <div className="font-bold text-xs tracking-wider">ATM MINI BRILINK</div>
                  <div className="font-bold text-[11px] uppercase leading-tight">{formData.namaUsaha || 'NAMA GERAI'}</div>
                  <div className="text-[9px] text-slate-600 leading-tight">{formData.alamat || 'Alamat Gerai'}</div>
                  <div className="text-[9px] text-slate-600">HP: {formData.nomorHp || '08xx-xxxx-xxxx'}</div>
                  <div className="border-t border-dashed border-slate-400 pt-1 text-[9px] text-slate-500">
                    -- CONTOH STRUK TRANSAKSI --
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 2: LOGO APLIKASI (NAVBAR, SIDEBAR & LOGIN) */}
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      2. Logo Aplikasi (Navbar, Sidebar &amp; Form Login)
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Ikon brand yang tampil di bar atas aplikasi, navigasi samping, dan kartu masuk petugas
                    </p>
                  </div>
                  {formData.appLogoUrl && (
                    <button
                      type="button"
                      onClick={() => handleChange('appLogoUrl', '')}
                      className="text-[11px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Reset ke BRI
                    </button>
                  )}
                </div>

                {/* Upload or URL Controls */}
                <div className="space-y-2 text-xs">
                  <input
                    type="file"
                    ref={appLogoInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        processImageFile(file, url => handleChange('appLogoUrl', url));
                      }
                    }}
                  />

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => appLogoInputRef.current?.click()}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-dashed border-indigo-400 dark:border-indigo-700 bg-indigo-50/50 dark:bg-indigo-950/30 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-bold text-xs transition"
                    >
                      <Upload className="w-4 h-4" />
                      Unggah Logo Aplikasi Baru
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Atau tempel Link / URL Gambar:
                    </label>
                    <input
                      type="url"
                      placeholder="https://contoh.com/logo-aplikasi.png"
                      value={formData.appLogoUrl || ''}
                      onChange={e => handleChange('appLogoUrl', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Real-time Preview: Navbar & Login Header */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-2">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Pratinjau Tampilan Header Navbar &amp; Form Login:
                </div>

                {/* Navbar Mini Preview */}
                <div className="p-3 rounded-xl bg-slate-900 text-white border border-slate-800 flex items-center gap-3">
                  {formData.appLogoUrl ? (
                    <img
                      src={formData.appLogoUrl}
                      alt="Preview Logo"
                      className="w-8 h-8 rounded-xl object-contain bg-white/10 p-0.5 border border-white/20"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#02539a] to-[#00386b] flex items-center justify-center text-white font-black text-xs relative overflow-hidden flex-shrink-0">
                      <span>BRI</span>
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-[#f37021] rounded-full" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-xs tracking-tight">ATM MINI BRILINK</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[#f37021]/30 text-[#ff8f49] font-bold">
                        REKAP
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate max-w-[180px]">
                      {formData.namaUsaha || 'Nama Usaha'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 1: Profil Usaha */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b pb-3 border-slate-100 dark:border-slate-800">
            <Building className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">Profil Usaha BRILink</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold mb-1">Nama Usaha / Gerai Agen *</label>
              <input
                type="text"
                required
                value={formData.namaUsaha}
                onChange={e => handleChange('namaUsaha', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Nama Pemilik Usaha</label>
              <input
                type="text"
                value={formData.namaPemilik}
                onChange={e => handleChange('namaPemilik', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Nomor Telepon / WhatsApp Agen</label>
              <input
                type="text"
                value={formData.nomorHp}
                onChange={e => handleChange('nomorHp', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Alamat Lengkap Gerai</label>
              <input
                type="text"
                value={formData.alamat}
                onChange={e => handleChange('alamat', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold mb-1">Catatan Footer Struk</label>
              <input
                type="text"
                value={formData.catatanStruk}
                onChange={e => handleChange('catatanStruk', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Preferensi Transaksi & Printer */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b pb-3 border-slate-100 dark:border-slate-800">
            <Printer className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
              Pengaturan Transaksi &amp; Printer Thermal
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold mb-1">Default Biaya Admin (Rp)</label>
              <input
                type="number"
                step={500}
                value={formData.defaultBiayaAdmin}
                onChange={e => handleChange('defaultBiayaAdmin', Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-sm"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Format Nomor Transaksi</label>
              <input
                type="text"
                value={formData.formatNomorTransaksi}
                onChange={e => handleChange('formatNomorTransaksi', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-sm"
              />
              <span className="text-[10px] text-slate-400">Contoh: TRX-YYYYMMDD-0001</span>
            </div>

            <div>
              <label className="block font-semibold mb-1">Lebar Kertas Printer Thermal</label>
              <select
                value={formData.lebarKertasPrinter}
                onChange={e => handleChange('lebarKertasPrinter', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              >
                <option value="58mm">58 mm (Printer Kasir Mini Bluetooth)</option>
                <option value="80mm">80 mm (Printer POS Thermal Standar)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2b: Ambang Batas Kas & Saldo Rekening */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-amber-500" />
              <div>
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                  Ambang Batas Kas Laci &amp; Saldo Rekening
                </h3>
                <p className="text-[11px] text-slate-400">Peringatan otomatis saat kas fisik terlalu sedikit atau terlalu banyak</p>
              </div>
            </div>
            {onSelectTab && (
              <button
                type="button"
                onClick={() => onSelectTab('pengaturan-kas')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 transition"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Buka Menu Reset &amp; Kalibrasi Kas
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold mb-1">Batas Minimum Kas Laci (Rp)</label>
              <input
                type="number"
                step={50000}
                value={formData.minKasTunaiLaci || 500000}
                onChange={e => handleChange('minKasTunaiLaci', Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-sm"
              />
              <span className="text-[10px] text-slate-400">Peringatan jika kas laci &lt; nilai ini</span>
            </div>

            <div>
              <label className="block font-semibold mb-1">Batas Maksimum Kas Laci (Rp)</label>
              <input
                type="number"
                step={1000000}
                value={formData.maxKasTunaiLaci || 15000000}
                onChange={e => handleChange('maxKasTunaiLaci', Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-sm"
              />
              <span className="text-[10px] text-slate-400">Rekomendasi setor ke rekening/bank</span>
            </div>

            <div>
              <label className="block font-semibold mb-1">Batas Minimum Saldo Rekening (Rp)</label>
              <input
                type="number"
                step={500000}
                value={formData.minSaldoRekening || 2000000}
                onChange={e => handleChange('minSaldoRekening', Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-sm"
              />
              <span className="text-[10px] text-slate-400">Peringatan jika saldo EDC/web tipis</span>
            </div>
          </div>
        </div>

        {/* Section 3: Integrasi Google Apps Script & Google Sheets */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-blue-200 dark:border-blue-900/60 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                  Integrasi Google Apps Script &amp; Google Spreadsheet
                </h3>
                <p className="text-[11px] text-slate-400">Semua data otomatis tersimpan ke 10 sheet database Spreadsheet</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenAppsScriptCodeModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 transition"
            >
              Lihat Source Code Script (10 File)
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold mb-1">
                Google Apps Script Web App URL (Deployment Endpoint)
              </label>
              <input
                type="url"
                placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                value={formData.googleAppsScriptUrl}
                onChange={e => handleChange('googleAppsScriptUrl', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-xs"
              />
              <span className="text-[11px] text-slate-400">
                Didapat setelah mengklik Deploy &gt; New Deployment &gt; Web app (Access: Anyone) di Apps Script.
              </span>
            </div>

            <div>
              <label className="block font-semibold mb-1">
                Google Spreadsheet ID (Database)
              </label>
              <input
                type="text"
                placeholder="Contoh: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                value={formData.googleSpreadsheetId}
                onChange={e => handleChange('googleSpreadsheetId', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-xs"
              />
            </div>

            {/* Test Connection Button & Indicator */}
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testingConnection}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 transition"
              >
                <RefreshCw className={`w-4 h-4 ${testingConnection ? 'animate-spin text-blue-600' : ''}`} />
                {testingConnection ? 'Menguji Koneksi...' : 'Uji Koneksi Spreadsheet'}
              </button>

              {testResult && (
                <div
                  className={`text-xs px-3 py-1.5 rounded-xl font-medium flex items-center gap-1.5 ${
                    testResult.success
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {testResult.message}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-extrabold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-500/20 active:scale-98 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            Simpan Seluruh Pengaturan &amp; Logo
          </button>
        </div>
      </form>
    </div>
  );
};

