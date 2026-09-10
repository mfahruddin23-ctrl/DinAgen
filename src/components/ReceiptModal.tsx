import React, { useState } from 'react';
import { Transaction, BusinessSettings } from '../types';
import { formatRupiah, formatTanggalIndo } from '../utils/formatters';
import { Printer, Share2, Copy, Check, X, Smartphone, Download } from 'lucide-react';
import { PdfReportService } from '../services/pdfReportService';

interface ReceiptModalProps {
  transaction: Transaction | null;
  settings: BusinessSettings;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ transaction, settings, onClose }) => {
  const [paperWidth, setPaperWidth] = useState<'58mm' | '80mm'>(settings.lebarKertasPrinter || '58mm');
  const [copied, setCopied] = useState(false);

  if (!transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    PdfReportService.generateReceiptPdf({
      transaction,
      settings,
      paperWidth
    });
  };

  const receiptPlainText = `
================================
     ATM MINI BRILINK
${settings.namaUsaha.toUpperCase()}
${settings.alamat}
Telp: ${settings.nomorHp}
================================
No. Trx : ${transaction.noTransaksi}
Tanggal : ${formatTanggalIndo(transaction.tanggal)} ${transaction.jam}
Petugas : ${transaction.petugas}
Pelanggan: ${transaction.pelanggan || '-'}
--------------------------------
Jenis   : ${transaction.jenisTransaksi}
Tujuan  : ${transaction.noRekeningTujuan || '-'}
Nominal : ${formatRupiah(transaction.nominal)}
Admin   : ${formatRupiah(transaction.biayaAdmin)}
--------------------------------
TOTAL   : ${formatRupiah(transaction.totalBayar)}
Status  : ${transaction.status.toUpperCase()}
--------------------------------
${settings.catatanStruk}
Terima kasih atas kunjungan Anda.
================================
  `.trim();

  const handleCopy = () => {
    navigator.clipboard.writeText(receiptPlainText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const encoded = encodeURIComponent(receiptPlainText);
    const url = transaction.noHp && transaction.noHp !== '-'
      ? `https://wa.me/${transaction.noHp.replace(/^0/, '62').replace(/[^0-9]/g, '')}?text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">Cetak Struk Transaksi</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Pratinjau Struk Thermal Mesin Kasir</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Paper Size Selector */}
        <div className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-600 dark:text-slate-300">Format Kertas Thermal:</span>
          <div className="flex gap-1 bg-white dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setPaperWidth('58mm')}
              className={`px-3 py-1 rounded-md font-medium transition ${
                paperWidth === '58mm'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              58mm (Kecil)
            </button>
            <button
              onClick={() => setPaperWidth('80mm')}
              className={`px-3 py-1 rounded-md font-medium transition ${
                paperWidth === '80mm'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              80mm (Standar)
            </button>
          </div>
        </div>

        {/* Receipt Container */}
        <div className="flex-1 overflow-y-auto p-5 bg-slate-100 dark:bg-slate-950/60 flex justify-center">
          <div
            id="thermal-receipt-container"
            className={`bg-white text-slate-900 font-mono text-xs p-5 shadow-md border border-slate-200 transition-all ${
              paperWidth === '58mm' ? 'w-[280px]' : 'w-[360px]'
            }`}
          >
            {/* Header Struk */}
            <div className="text-center mb-3">
              <div className="font-bold text-sm tracking-wider">ATM MINI BRILINK</div>
              <div className="font-bold text-xs uppercase leading-snug">{settings.namaUsaha}</div>
              <div className="text-[10px] text-slate-600 leading-tight mt-0.5">{settings.alamat}</div>
              <div className="text-[10px] text-slate-600">HP: {settings.nomorHp}</div>
            </div>

            <div className="border-t border-b border-dashed border-slate-400 py-1.5 my-2 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>No.Trx:</span>
                <span className="font-bold">{transaction.noTransaksi}</span>
              </div>
              <div className="flex justify-between">
                <span>Waktu:</span>
                <span>{transaction.tanggal} {transaction.jam}</span>
              </div>
              <div className="flex justify-between">
                <span>Petugas:</span>
                <span>{transaction.petugas}</span>
              </div>
              <div className="flex justify-between">
                <span>Pelanggan:</span>
                <span className="font-semibold">{transaction.pelanggan || '-'}</span>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-1.5 text-[11px] my-2">
              <div className="flex justify-between">
                <span>Transaksi:</span>
                <span className="font-bold text-right">{transaction.jenisTransaksi}</span>
              </div>
              {transaction.noRekeningTujuan && transaction.noRekeningTujuan !== '-' && (
                <div className="flex justify-between">
                  <span>Tujuan:</span>
                  <span className="text-right truncate max-w-[180px]">{transaction.noRekeningTujuan}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Nominal:</span>
                <span>{formatRupiah(transaction.nominal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Biaya Admin:</span>
                <span>{formatRupiah(transaction.biayaAdmin)}</span>
              </div>
            </div>

            {/* Total */}
            <div className="border-t-2 border-dashed border-slate-700 pt-2 pb-2 my-2">
              <div className="flex justify-between text-xs font-bold">
                <span>TOTAL DIBAYAR:</span>
                <span className="text-sm">{formatRupiah(transaction.totalBayar)}</span>
              </div>
              <div className="flex justify-between text-[11px] mt-1">
                <span>Metode:</span>
                <span>{transaction.metodePembayaran}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span>Status:</span>
                <span className="font-bold uppercase text-emerald-700">{transaction.status}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center text-[10px] text-slate-500 mt-3 pt-2 border-t border-dashed border-slate-400 space-y-0.5">
              <p>{settings.catatanStruk}</p>
              <p className="font-semibold text-slate-700">Terima kasih atas kunjungan Anda</p>
              <p className="text-[9px] pt-1 text-slate-400">ATM MINI BRILINK SYSTEM</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-wrap gap-2 justify-end">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Tersalin!' : 'Salin Teks'}
          </button>
          <button
            onClick={handleShareWhatsApp}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition"
          >
            <Smartphone className="w-4 h-4" />
            Kirim WhatsApp
          </button>
          <button
            onClick={handleDownloadPdf}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#02539a] hover:bg-[#003d73] text-white shadow-sm transition"
            title="Simpan Struk dalam Format File PDF"
          >
            <Download className="w-4 h-4" />
            Unduh Struk PDF
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-900 text-white shadow-md transition"
          >
            <Printer className="w-4 h-4" />
            Cetak Struk Thermal
          </button>
        </div>
      </div>
    </div>
  );
};
