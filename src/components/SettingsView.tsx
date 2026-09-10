import React, { useState } from 'react';
import { BusinessSettings } from '../types';
import {
  Save,
  Building,
  Printer,
  Sliders,
  Database,
  CheckCircle2,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { AppsScriptSyncService } from '../services/appsScriptSync';

interface SettingsViewProps {
  settings: BusinessSettings;
  onSaveSettings: (settings: BusinessSettings) => void;
  onOpenAppsScriptCodeModal: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSaveSettings,
  onOpenAppsScriptCodeModal
}) => {
  const [formData, setFormData] = useState<BusinessSettings>({ ...settings });
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleChange = (field: keyof BusinessSettings, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    alert('Pengaturan usaha berhasil diperbarui!');
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
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Pengaturan Usaha &amp; Sistem</h2>
        <p className="text-xs text-slate-500">
          Kustomisasi profil gerai ATM Mini BRILink, konfigurasi printer thermal, dan integrasi Google Sheets
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Profil Usaha */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
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
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
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

        {/* Section 3: Integrasi Google Apps Script & Google Sheets */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-blue-200 dark:border-blue-900/60 shadow-xs space-y-4">
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
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-extrabold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-500/20"
          >
            <Save className="w-4 h-4" />
            Simpan Seluruh Pengaturan
          </button>
        </div>
      </form>
    </div>
  );
};
