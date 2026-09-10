import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Transaction,
  CashIn,
  CashOut,
  DailyClosing,
  BalanceSummary,
  BusinessSettings,
  CashReconciliation
} from '../types';
import { formatRupiah, formatTanggalIndo } from '../utils/formatters';

// Palette Constants (Official BRILink Theme)
const COLOR_PRIMARY = [2, 83, 154] as const; // #02539a BRILink Blue
const COLOR_ACCENT = [243, 112, 33] as const; // #f37021 BRILink Orange
const COLOR_TEXT_DARK = [30, 41, 59] as const; // #1e293b Slate 800
const COLOR_TEXT_MUTED = [100, 116, 139] as const; // #64748b Slate 500
const COLOR_BG_LIGHT = [248, 250, 252] as const; // #f8fafc Slate 50

/**
 * Draws official Kop Surat / Header for Agen BRILink
 */
function drawHeader(doc: jsPDF, settings: BusinessSettings, reportTitle: string, subtitle?: string): number {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Top decorative bar
  doc.setFillColor(...COLOR_PRIMARY);
  doc.rect(0, 0, pageWidth, 5, 'F');
  doc.setFillColor(...COLOR_ACCENT);
  doc.rect(0, 5, pageWidth, 1.5, 'F');

  // Business Header
  doc.setTextColor(...COLOR_PRIMARY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('AGEN BRILINK RESMI', 14, 16);

  doc.setTextColor(...COLOR_TEXT_DARK);
  doc.setFontSize(13);
  doc.text((settings.namaUsaha || 'ATM MINI BRILINK').toUpperCase(), 14, 22);

  doc.setTextColor(...COLOR_TEXT_MUTED);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  const alamat = `${settings.alamat || 'Indonesia'} | Telp/WA: ${settings.nomorHp || '-'}`;
  doc.text(alamat, 14, 27);

  // Date printed on top right
  const printDateStr = `Dicetak: ${new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}`;
  doc.text(printDateStr, pageWidth - 14, 27, { align: 'right' });

  // Divider line
  doc.setDrawColor(203, 213, 225); // Slate 300
  doc.setLineWidth(0.5);
  doc.line(14, 30, pageWidth - 14, 30);

  // Title Banner
  doc.setFillColor(...COLOR_PRIMARY);
  doc.roundedRect(14, 34, pageWidth - 28, 12, 2, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(reportTitle.toUpperCase(), pageWidth / 2, 41.5, { align: 'center' });

  let currentY = 50;
  if (subtitle) {
    doc.setTextColor(...COLOR_TEXT_DARK);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(subtitle, 14, currentY);
    currentY += 5;
  }

  return currentY;
}

/**
 * Draws Signature box at bottom of report
 */
function drawSignatures(doc: jsPDF, startY: number, settings: BusinessSettings, officerName: string) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // If near page end, add a new page
  if (startY > pageHeight - 45) {
    doc.addPage();
    startY = 25;
  }

  const signY = startY + 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLOR_TEXT_DARK);

  // Left: Kasir / Petugas Pelaksana
  doc.text('Petugas Kasir / Operator,', 25, signY);
  doc.line(20, signY + 22, 70, signY + 22);
  doc.setFont('helvetica', 'bold');
  doc.text(`( ${officerName || 'Kasir'} )`, 25, signY + 26);

  // Right: Pemilik / Agen Penanggung Jawab
  const rightX = pageWidth - 75;
  doc.setFont('helvetica', 'normal');
  doc.text('Pemilik Agen BRILink,', rightX + 5, signY);
  doc.line(rightX, signY + 22, rightX + 50, signY + 22);
  doc.setFont('helvetica', 'bold');
  doc.text(`( ${settings.namaPemilik || 'Agen BRILink'} )`, rightX + 5, signY + 26);
}

/**
 * Adds footer page number to all pages
 */
function addFooterPageNumbers(doc: jsPDF) {
  const pageCount = (doc as any).internal.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...COLOR_TEXT_MUTED);
    doc.text(
      `Sistem Rekap Pembukuan ATM Mini BRILink | Halaman ${i} dari ${pageCount}`,
      pageWidth / 2,
      pageHeight - 7,
      { align: 'center' }
    );
  }
}

export const PdfReportService = {
  /**
   * 1. EXPORT REKAP TRANSAKSI HARIAN (PDF)
   */
  generateDailyReportPdf(params: {
    selectedDate: string;
    transactions: Transaction[];
    cashIn: CashIn[];
    cashOut: CashOut[];
    closingRecord?: DailyClosing;
    settings: BusinessSettings;
    currentUser: string;
  }) {
    const { selectedDate, transactions, cashIn, cashOut, closingRecord, settings, currentUser } = params;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();

    const formattedDate = formatTanggalIndo(selectedDate);
    let y = drawHeader(doc, settings, 'Laporan Rekap Transaksi Harian', `Tanggal Operasional: ${formattedDate}`);

    // Filter data for this date
    const dayTrx = transactions.filter(t => t.tanggal === selectedDate);
    const daySuccessTrx = dayTrx.filter(t => t.status === 'Berhasil');
    const dayCashIn = cashIn.filter(c => c.tanggal === selectedDate);
    const dayCashOut = cashOut.filter(c => c.tanggal === selectedDate);

    const totalTrxCount = daySuccessTrx.length;
    const totalNominal = daySuccessTrx.reduce((s, t) => s + t.nominal, 0);
    const totalAdmin = daySuccessTrx.reduce((s, t) => s + t.biayaAdmin, 0);
    const totalKeuntungan = daySuccessTrx.reduce((s, t) => s + t.keuntungan, 0);
    const totalUangMasuk = daySuccessTrx.reduce((s, t) => s + t.totalBayar, 0) + dayCashIn.reduce((s, c) => s + c.nominal, 0);
    const totalUangKeluar = daySuccessTrx.reduce((s, t) => s + t.modalTransaksi, 0) + dayCashOut.reduce((s, c) => s + c.nominal, 0);

    // Summary Metric Boxes
    const boxWidth = (pageWidth - 28 - 9) / 4;
    const boxHeight = 16;
    const metrics: Array<{ title: string; val: string; color: readonly [number, number, number] }> = [
      { title: 'TOTAL TRANSAKSI', val: `${totalTrxCount} Trx`, color: COLOR_PRIMARY },
      { title: 'VOLUME PERPUTARAN', val: formatRupiah(totalNominal), color: COLOR_PRIMARY },
      { title: 'BIAYA ADMIN', val: formatRupiah(totalAdmin), color: COLOR_ACCENT },
      { title: 'LABA BERSIH HARIAN', val: formatRupiah(totalKeuntungan), color: [16, 185, 129] }
    ];

    metrics.forEach((m, idx) => {
      const x = 14 + idx * (boxWidth + 3);
      doc.setFillColor(...COLOR_BG_LIGHT);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(x, y, boxWidth, boxHeight, 1.5, 1.5, 'FD');

      doc.setTextColor(...COLOR_TEXT_MUTED);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.text(m.title, x + 3, y + 5);

      doc.setTextColor(m.color[0], m.color[1], m.color[2]);
      doc.setFontSize(8.5);
      doc.text(m.val, x + 3, y + 12);
    });

    y += boxHeight + 6;

    // Financial Cash Flow Summary sub-block
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(14, y, pageWidth - 28, 14, 1.5, 1.5, 'F');
    doc.setTextColor(...COLOR_TEXT_DARK);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(`Total Uang Masuk Kas: ${formatRupiah(totalUangMasuk)}`, 18, y + 5);
    doc.text(`Total Uang Keluar Kas: ${formatRupiah(totalUangKeluar)}`, 18, y + 10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Net Perubahan Kas: ${formatRupiah(totalUangMasuk - totalUangKeluar)}`, pageWidth / 2 + 10, y + 5);
    doc.text(
      `Status Tutup Buku: ${closingRecord ? 'SUDAH DITUTUP (VALID)' : 'BELUM DITUTUP / AKTIF'}`,
      pageWidth / 2 + 10,
      y + 10
    );

    y += 18;

    // Table of transactions
    const tableRows = dayTrx.map((t, idx) => [
      (idx + 1).toString(),
      t.jam || '-',
      t.noTransaksi,
      t.pelanggan || '-',
      t.jenisTransaksi,
      t.noRekeningTujuan || '-',
      formatRupiah(t.nominal),
      formatRupiah(t.biayaAdmin),
      formatRupiah(t.keuntungan),
      t.status
    ]);

    autoTable(doc, {
      startY: y,
      head: [['No', 'Jam', 'No Trx', 'Pelanggan', 'Layanan', 'Tujuan', 'Nominal', 'Admin', 'Laba', 'Status']],
      body: tableRows.length > 0 ? tableRows : [['-', '-', 'Belum ada data transaksi pada tanggal ini', '', '', '', '', '', '', '']],
      headStyles: {
        fillColor: [...COLOR_PRIMARY],
        textColor: 255,
        fontSize: 7.5,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 7,
        textColor: [...COLOR_TEXT_DARK]
      },
      alternateRowStyles: {
        fillColor: [...COLOR_BG_LIGHT]
      },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 12, halign: 'center' },
        2: { cellWidth: 22 },
        3: { cellWidth: 24 },
        4: { cellWidth: 26 },
        5: { cellWidth: 22 },
        6: { cellWidth: 22, halign: 'right' },
        7: { cellWidth: 16, halign: 'right' },
        8: { cellWidth: 16, halign: 'right' },
        9: { cellWidth: 14, halign: 'center' }
      },
      margin: { left: 14, right: 14 }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 5;
    drawSignatures(doc, finalY, settings, currentUser);
    addFooterPageNumbers(doc);

    doc.save(`Laporan_Rekap_Harian_${selectedDate}.pdf`);
  },

  /**
   * 2. EXPORT REKAP PERFORMA BULANAN (PDF)
   */
  generateMonthlyReportPdf(params: {
    selectedMonth: string;
    transactions: Transaction[];
    cashIn: CashIn[];
    cashOut: CashOut[];
    settings: BusinessSettings;
    currentUser: string;
  }) {
    const { selectedMonth, transactions, cashIn, cashOut, settings, currentUser } = params;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();

    const [year, month] = selectedMonth.split('-');
    const dateObj = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
    const monthName = dateObj.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

    let y = drawHeader(doc, settings, 'Laporan Rekap Performa Bulanan', `Periode Bulan: ${monthName}`);

    // Filter transactions for selected month
    const monthTrx = transactions.filter(t => t.tanggal?.startsWith(selectedMonth) && t.status === 'Berhasil');
    const monthCashOut = cashOut.filter(c => c.tanggal?.startsWith(selectedMonth));

    const totalCount = monthTrx.length;
    const totalOmset = monthTrx.reduce((s, t) => s + t.nominal, 0);
    const totalAdmin = monthTrx.reduce((s, t) => s + t.biayaAdmin, 0);
    const totalFeeProvider = monthTrx.reduce((s, t) => s + t.biayaProvider, 0);
    const totalKeuntunganTrx = monthTrx.reduce((s, t) => s + t.keuntungan, 0);
    const totalBebanOperasional = monthCashOut.reduce((s, c) => s + c.nominal, 0);
    const labaBersihAkhir = totalKeuntunganTrx - totalBebanOperasional;

    // Metric summary cards
    const boxWidth = (pageWidth - 28 - 9) / 4;
    const boxHeight = 16;
    const metrics: Array<{ title: string; val: string; color: readonly [number, number, number] }> = [
      { title: 'TOTAL TRANSAKSI', val: `${totalCount} Trx`, color: COLOR_PRIMARY },
      { title: 'TOTAL OMSET VOLUME', val: formatRupiah(totalOmset), color: COLOR_PRIMARY },
      { title: 'PENDAPATAN ADMIN', val: formatRupiah(totalAdmin), color: COLOR_ACCENT },
      { title: 'LABA BERSIH AKHIR', val: formatRupiah(labaBersihAkhir), color: [16, 185, 129] }
    ];

    metrics.forEach((m, idx) => {
      const x = 14 + idx * (boxWidth + 3);
      doc.setFillColor(...COLOR_BG_LIGHT);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(x, y, boxWidth, boxHeight, 1.5, 1.5, 'FD');

      doc.setTextColor(...COLOR_TEXT_MUTED);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.text(m.title, x + 3, y + 5);

      doc.setTextColor(m.color[0], m.color[1], m.color[2]);
      doc.setFontSize(8.5);
      doc.text(m.val, x + 3, y + 12);
    });

    y += boxHeight + 8;

    // Breakdown per Jenis Layanan
    doc.setTextColor(...COLOR_PRIMARY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Rincian Performa per Jenis Layanan', 14, y);
    y += 3;

    // Aggregate by service type
    const serviceMap: Record<string, { count: number; volume: number; admin: number; profit: number }> = {};
    monthTrx.forEach(t => {
      const key = t.jenisTransaksi || 'Lainnya';
      if (!serviceMap[key]) {
        serviceMap[key] = { count: 0, volume: 0, admin: 0, profit: 0 };
      }
      serviceMap[key].count += 1;
      serviceMap[key].volume += t.nominal;
      serviceMap[key].admin += t.biayaAdmin;
      serviceMap[key].profit += t.keuntungan;
    });

    const breakdownRows = Object.entries(serviceMap).map(([layanan, data], i) => [
      (i + 1).toString(),
      layanan,
      `${data.count} Trx`,
      formatRupiah(data.volume),
      formatRupiah(data.admin),
      formatRupiah(data.profit),
      `${totalCount > 0 ? Math.round((data.count / totalCount) * 100) : 0}%`
    ]);

    autoTable(doc, {
      startY: y,
      head: [['No', 'Jenis Layanan Transaksi', 'Frekuensi', 'Total Volume (Rp)', 'Total Admin', 'Laba Bersih', 'Porsi']],
      body: breakdownRows.length > 0 ? breakdownRows : [['-', 'Belum ada transaksi di bulan ini', '-', '-', '-', '-', '-']],
      headStyles: { fillColor: [...COLOR_PRIMARY], textColor: 255, fontSize: 8 },
      bodyStyles: { fontSize: 7.5 },
      alternateRowStyles: { fillColor: [...COLOR_BG_LIGHT] },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 50 },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 35, halign: 'right' },
        4: { cellWidth: 25, halign: 'right' },
        5: { cellWidth: 25, halign: 'right' },
        6: { cellWidth: 15, halign: 'center' }
      },
      margin: { left: 14, right: 14 }
    });

    let currentY = (doc as any).lastAutoTable.finalY + 8;

    // Breakdown Pengeluaran Operasional
    doc.setTextColor(...COLOR_PRIMARY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Rincian Biaya Operasional Toko Bulan Ini', 14, currentY);
    currentY += 3;

    const expenseRows = monthCashOut.map((c, i) => [
      (i + 1).toString(),
      c.tanggal,
      c.kategori || 'Operasional',
      c.keterangan || '-',
      c.penerima || c.diberikanKepada || '-',
      formatRupiah(c.nominal)
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['No', 'Tanggal', 'Kategori Pengeluaran', 'Keterangan Beban', 'Penerima', 'Nominal Beban']],
      body: expenseRows.length > 0 ? expenseRows : [['-', '-', 'Tidak ada pengeluaran operasional bulan ini', '-', '-', '-']],
      headStyles: { fillColor: [15, 23, 42], textColor: 255, fontSize: 8 },
      bodyStyles: { fontSize: 7.5 },
      alternateRowStyles: { fillColor: [...COLOR_BG_LIGHT] },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 25, halign: 'center' },
        2: { cellWidth: 40 },
        3: { cellWidth: 50 },
        4: { cellWidth: 30 },
        5: { cellWidth: 25, halign: 'right' }
      },
      margin: { left: 14, right: 14 }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 5;
    drawSignatures(doc, finalY, settings, currentUser);
    addFooterPageNumbers(doc);

    doc.save(`Laporan_Rekap_Bulanan_${selectedMonth}.pdf`);
  },

  /**
   * 3. EXPORT LAPORAN KEUANGAN KOMPREHENSIF (LABA RUGI, ARUS KAS, NERACA) (PDF)
   */
  generateFinancialReportPdf(params: {
    selectedMonth: string;
    transactions: Transaction[];
    cashIn: CashIn[];
    cashOut: CashOut[];
    balance: BalanceSummary;
    settings: BusinessSettings;
    currentUser: string;
  }) {
    const { selectedMonth, transactions, cashIn, cashOut, balance, settings, currentUser } = params;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();

    const [year, month] = selectedMonth.split('-');
    const dateObj = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
    const monthName = dateObj.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

    let y = drawHeader(doc, settings, 'Laporan Keuangan Komprehensif', `Periode Buku: ${monthName}`);

    // Data calculations
    const monthTrx = transactions.filter(t => t.tanggal?.startsWith(selectedMonth) && t.status === 'Berhasil');
    const monthCashIn = cashIn.filter(c => c.tanggal?.startsWith(selectedMonth));
    const monthCashOut = cashOut.filter(c => c.tanggal?.startsWith(selectedMonth));

    const pendapatanAdmin = monthTrx.reduce((s, t) => s + t.biayaAdmin, 0);
    const biayaProvider = monthTrx.reduce((s, t) => s + t.biayaProvider, 0);
    const labaKotor = pendapatanAdmin - biayaProvider;
    const bebanOperasional = monthCashOut.reduce((s, c) => s + c.nominal, 0);
    const labaBersihAkhir = labaKotor - bebanOperasional;

    const uangMasuk = monthTrx.reduce((s, t) => s + t.totalBayar, 0) + monthCashIn.reduce((s, c) => s + c.nominal, 0);
    const uangKeluar = monthTrx.reduce((s, t) => s + t.modalTransaksi, 0) + monthCashOut.reduce((s, c) => s + c.nominal, 0);
    const netKas = uangMasuk - uangKeluar;

    const modalAwal = 50000000;
    const totalAktiva = balance.kasTunai + balance.rekeningBRILink;
    const labaAkumulasi = totalAktiva - modalAwal;

    // LAPORAN 1: LABA RUGI
    doc.setTextColor(...COLOR_PRIMARY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text('I. LAPORAN LABA RUGI (PROFIT & LOSS STATEMENT)', 14, y);
    y += 2;

    autoTable(doc, {
      startY: y,
      head: [['Komponen Keuangan', 'Keterangan Akun', 'Nominal (Rp)']],
      body: [
        ['PENDAPATAN USAHA', 'Pendapatan Fee & Biaya Admin Transaksi', formatRupiah(pendapatanAdmin)],
        ['BEBAN POKOK PENDAPATAN', 'Biaya Fee Provider / EDC BRILink', `-${formatRupiah(biayaProvider)}`],
        ['LABA KOTOR (GROSS PROFIT)', 'Laba Kotor Transaksi Sebelum Operasional', formatRupiah(labaKotor)],
        ['BEBAN OPERASIONAL', 'Beban Kertas Struk, Kuota Internet, Listrik, Toko', `-${formatRupiah(bebanOperasional)}`],
        ['LABA BERSIH (NET PROFIT)', 'Laba Bersih Usaha yang Dihasilkan', formatRupiah(labaBersihAkhir)]
      ],
      headStyles: { fillColor: [...COLOR_PRIMARY], textColor: 255, fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 55, fontStyle: 'bold' },
        1: { cellWidth: 85 },
        2: { cellWidth: 42, halign: 'right', fontStyle: 'bold' }
      },
      margin: { left: 14, right: 14 }
    });

    y = (doc as any).lastAutoTable.finalY + 7;

    // LAPORAN 2: ARUS KAS
    doc.setTextColor(...COLOR_PRIMARY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text('II. LAPORAN ARUS KAS (CASH FLOW STATEMENT)', 14, y);
    y += 2;

    autoTable(doc, {
      startY: y,
      head: [['Aktivitas Arus Kas', 'Rincian Aliran Dana', 'Nominal (Rp)']],
      body: [
        ['Arus Kas Masuk', 'Penerimaan Pembayaran Nasabah + Kas Masuk', `+${formatRupiah(uangMasuk)}`],
        ['Arus Kas Keluar', 'Pencairan Modal Tarik Tunai + Biaya Operasional', `-${formatRupiah(uangKeluar)}`],
        ['Net Aliran Kas', 'Surplus / Defisit Arus Kas Periode Berjalan', formatRupiah(netKas)],
        ['Saldo Kas Tunai Fisik', 'Uang Tunai Riil di Laci Kasir', formatRupiah(balance.kasTunai)],
        ['Saldo Rekening Bank', 'Saldo Rekening Operasional / EDC BRILink', formatRupiah(balance.rekeningBRILink)],
        ['Total Likuiditas Kas', 'Total Kas Fisik + Saldo Rekening Bank', formatRupiah(totalAktiva)]
      ],
      headStyles: { fillColor: [79, 70, 229], textColor: 255, fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 55, fontStyle: 'bold' },
        1: { cellWidth: 85 },
        2: { cellWidth: 42, halign: 'right', fontStyle: 'bold' }
      },
      margin: { left: 14, right: 14 }
    });

    y = (doc as any).lastAutoTable.finalY + 7;

    // LAPORAN 3: NERACA
    doc.setTextColor(...COLOR_PRIMARY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text('III. NERACA KEUANGAN SEDERHANA (BALANCE SHEET)', 14, y);
    y += 2;

    autoTable(doc, {
      startY: y,
      head: [['Posisi Keuangan (AKTIVA)', 'Nominal (Rp)', 'Posisi Keuangan (PASIVA)', 'Nominal (Rp)']],
      body: [
        ['Kas Fisik Laci', formatRupiah(balance.kasTunai), 'Kewajiban / Hutang', 'Rp 0'],
        ['Saldo Rekening BRILink', formatRupiah(balance.rekeningBRILink), 'Modal Awal Disetor', formatRupiah(modalAwal)],
        ['Aset Lancar Lainnya', 'Rp 0', 'Laba Ditahan / Akumulasi', formatRupiah(labaAkumulasi)],
        ['TOTAL AKTIVA', formatRupiah(totalAktiva), 'TOTAL PASIVA', formatRupiah(totalAktiva)]
      ],
      headStyles: { fillColor: [15, 23, 42], textColor: 255, fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 50, fontStyle: 'bold' },
        1: { cellWidth: 41, halign: 'right' },
        2: { cellWidth: 50, fontStyle: 'bold' },
        3: { cellWidth: 41, halign: 'right' }
      },
      margin: { left: 14, right: 14 }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 5;
    drawSignatures(doc, finalY, settings, currentUser);
    addFooterPageNumbers(doc);

    doc.save(`Laporan_Keuangan_Komprehensif_${selectedMonth}.pdf`);
  },

  /**
   * 4. EXPORT DAFTAR TRANSAKSI TERFILTER (PDF)
   */
  generateTransactionListPdf(params: {
    transactions: Transaction[];
    settings: BusinessSettings;
    currentUser: string;
    filterLabel?: string;
  }) {
    const { transactions, settings, currentUser, filterLabel } = params;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();

    let y = drawHeader(
      doc,
      settings,
      'Laporan Daftar Riwayat Transaksi',
      `Filter Data: ${filterLabel || 'Semua Transaksi'} | Total Record: ${transactions.length} Transaksi`
    );

    const totalVolume = transactions.reduce((s, t) => s + (t.status === 'Berhasil' ? t.nominal : 0), 0);
    const totalAdmin = transactions.reduce((s, t) => s + (t.status === 'Berhasil' ? t.biayaAdmin : 0), 0);
    const totalLaba = transactions.reduce((s, t) => s + (t.status === 'Berhasil' ? t.keuntungan : 0), 0);

    // Summary Box
    doc.setFillColor(...COLOR_BG_LIGHT);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(14, y, pageWidth - 28, 9, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...COLOR_PRIMARY);
    doc.text(
      `Total Volume Sukses: ${formatRupiah(totalVolume)}   |   Total Fee Admin: ${formatRupiah(
        totalAdmin
      )}   |   Total Laba Bersih: ${formatRupiah(totalLaba)}`,
      18,
      y + 6
    );

    y += 12;

    const rows = transactions.map((t, idx) => [
      (idx + 1).toString(),
      t.tanggal || '-',
      t.jam || '-',
      t.noTransaksi,
      t.pelanggan || '-',
      t.jenisTransaksi,
      t.noRekeningTujuan || '-',
      formatRupiah(t.nominal),
      formatRupiah(t.biayaAdmin),
      formatRupiah(t.totalBayar),
      formatRupiah(t.keuntungan),
      t.metodePembayaran || 'Tunai',
      t.status
    ]);

    autoTable(doc, {
      startY: y,
      head: [
        [
          'No',
          'Tanggal',
          'Jam',
          'No Trx',
          'Pelanggan',
          'Jenis Layanan',
          'Rek/No Tujuan',
          'Nominal',
          'Admin',
          'Total Bayar',
          'Laba',
          'Metode',
          'Status'
        ]
      ],
      body: rows.length > 0 ? rows : [['-', '-', '-', 'Tidak ada data transaksi yang cocok dengan filter ini', '', '', '', '', '', '', '', '', '']],
      headStyles: { fillColor: [...COLOR_PRIMARY], textColor: 255, fontSize: 7.5, fontStyle: 'bold' },
      bodyStyles: { fontSize: 6.8 },
      alternateRowStyles: { fillColor: [...COLOR_BG_LIGHT] },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 18, halign: 'center' },
        2: { cellWidth: 12, halign: 'center' },
        3: { cellWidth: 26 },
        4: { cellWidth: 24 },
        5: { cellWidth: 28 },
        6: { cellWidth: 26 },
        7: { cellWidth: 24, halign: 'right' },
        8: { cellWidth: 18, halign: 'right' },
        9: { cellWidth: 24, halign: 'right' },
        10: { cellWidth: 18, halign: 'right' },
        11: { cellWidth: 18, halign: 'center' },
        12: { cellWidth: 16, halign: 'center' }
      },
      margin: { left: 14, right: 14 }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 5;
    drawSignatures(doc, finalY, settings, currentUser);
    addFooterPageNumbers(doc);

    doc.save(`Laporan_Daftar_Transaksi_${new Date().toISOString().slice(0, 10)}.pdf`);
  },

  /**
   * 5. EXPORT BERITA ACARA REKONSILIASI KAS (PDF)
   */
  generateReconciliationPdf(params: {
    reconciliation: CashReconciliation;
    settings: BusinessSettings;
    currentUser: string;
  }) {
    const { reconciliation, settings, currentUser } = params;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();

    let y = drawHeader(
      doc,
      settings,
      'Berita Acara Rekonsiliasi Kas Laci',
      `Tanggal Penghitungan: ${formatTanggalIndo(reconciliation.tanggal)} ${reconciliation.jam || ''}`
    );

    const selisihVal = reconciliation.selisih ?? 0;
    const isBalance = Math.abs(selisihVal) === 0;

    // Comparison summary box
    doc.setFillColor(...COLOR_BG_LIGHT);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(14, y, pageWidth - 28, 22, 2, 2, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...COLOR_TEXT_MUTED);
    doc.text('Saldo Kas Sistem:', 20, y + 6);
    doc.text('Saldo Fisik Laci:', pageWidth / 2, y + 6);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...COLOR_PRIMARY);
    doc.text(formatRupiah(reconciliation.saldoSistem ?? 0), 20, y + 13);
    doc.text(formatRupiah(reconciliation.saldoFisik ?? 0), pageWidth / 2, y + 13);

    doc.setFontSize(8.5);
    doc.text(
      `Status: ${reconciliation.status.toUpperCase()} (Selisih: ${formatRupiah(selisihVal)})`,
      20,
      y + 19
    );

    y += 28;

    // Breakdown Pecahan Uang
    if (reconciliation.pecahan) {
      doc.setTextColor(...COLOR_PRIMARY);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.text('Rincian Lembar Uang Kertas & Koin Fisik', 14, y);
      y += 3;

      const p = reconciliation.pecahan;
      const breakdown = [
        ['1', 'Rp 100.000', `${p['100000'] || 0} Lembar`, formatRupiah((p['100000'] || 0) * 100000)],
        ['2', 'Rp 50.000', `${p['50000'] || 0} Lembar`, formatRupiah((p['50000'] || 0) * 50000)],
        ['3', 'Rp 20.000', `${p['20000'] || 0} Lembar`, formatRupiah((p['20000'] || 0) * 20000)],
        ['4', 'Rp 10.000', `${p['10000'] || 0} Lembar`, formatRupiah((p['10000'] || 0) * 10000)],
        ['5', 'Rp 5.000', `${p['5000'] || 0} Lembar`, formatRupiah((p['5000'] || 0) * 5000)],
        ['6', 'Rp 2.000', `${p['2000'] || 0} Lembar`, formatRupiah((p['2000'] || 0) * 2000)],
        ['7', 'Rp 1.000', `${p['1000'] || 0} Lembar`, formatRupiah((p['1000'] || 0) * 1000)],
        ['8', 'Koin Logam', `${p['koin'] || 0} Keping`, formatRupiah((p['koin'] || 0) * 500)],
        ['', 'TOTAL UANG FISIK DI LACI', '', formatRupiah(reconciliation.saldoFisik ?? 0)]
      ];

      autoTable(doc, {
        startY: y,
        head: [['No', 'Pecahan Rupiah', 'Jumlah Fisik', 'Subtotal (Rp)']],
        body: breakdown,
        headStyles: { fillColor: [...COLOR_PRIMARY], textColor: 255, fontSize: 8 },
        bodyStyles: { fontSize: 8 },
        alternateRowStyles: { fillColor: [...COLOR_BG_LIGHT] },
        columnStyles: {
          0: { cellWidth: 12, halign: 'center' },
          1: { cellWidth: 60 },
          2: { cellWidth: 40, halign: 'center' },
          3: { cellWidth: 70, halign: 'right', fontStyle: 'bold' }
        },
        margin: { left: 14, right: 14 }
      });

      y = (doc as any).lastAutoTable.finalY + 6;
    }

    // Catatan
    if (reconciliation.catatan) {
      doc.setTextColor(...COLOR_TEXT_DARK);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`Catatan Petugas: "${reconciliation.catatan}"`, 14, y);
      y += 5;
    }

    drawSignatures(doc, y, settings, reconciliation.petugas || currentUser);
    addFooterPageNumbers(doc);

    doc.save(`Berita_Acara_Rekonsiliasi_${reconciliation.tanggal}.pdf`);
  },

  /**
   * 6. EXPORT STRUK TRANSAKSI THERMAL RESMI (PDF)
   */
  generateReceiptPdf(params: {
    transaction: Transaction;
    settings: BusinessSettings;
    paperWidth?: '58mm' | '80mm';
  }) {
    const { transaction, settings, paperWidth = '58mm' } = params;

    // Dimensions: 58mm = width 58mm, 80mm = width 80mm. Dynamic height around 140mm
    const w = paperWidth === '58mm' ? 58 : 80;
    const h = paperWidth === '58mm' ? 145 : 155;

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [w, h]
    });

    const cx = w / 2;
    let y = 8;

    // Header Struk
    doc.setTextColor(0, 0, 0);
    doc.setFont('courier', 'bold');
    doc.setFontSize(paperWidth === '58mm' ? 9.5 : 11);
    doc.text('ATM MINI BRILINK', cx, y, { align: 'center' });
    y += 4.5;

    doc.setFontSize(paperWidth === '58mm' ? 8 : 9);
    doc.text((settings.namaUsaha || 'AGEN BRILINK').toUpperCase(), cx, y, { align: 'center' });
    y += 4;

    doc.setFont('courier', 'normal');
    doc.setFontSize(paperWidth === '58mm' ? 6.5 : 7.5);
    doc.text(settings.alamat || 'Indonesia', cx, y, { align: 'center' });
    y += 3.5;
    doc.text(`Telp: ${settings.nomorHp || '-'}`, cx, y, { align: 'center' });
    y += 4;

    // Dashed divider
    doc.setLineDashPattern([1, 1], 0);
    doc.line(3, y, w - 3, y);
    y += 4;

    // Metadata
    const row = (label: string, val: string) => {
      doc.setFont('courier', 'normal');
      doc.text(label, 4, y);
      doc.setFont('courier', 'bold');
      doc.text(val, w - 4, y, { align: 'right' });
      y += 3.8;
    };

    row('No. Trx :', transaction.noTransaksi);
    row('Waktu   :', `${transaction.tanggal} ${transaction.jam}`);
    row('Petugas :', transaction.petugas);
    if (transaction.pelanggan && transaction.pelanggan !== '-') {
      row('Nasabah :', transaction.pelanggan);
    }

    y += 1;
    doc.line(3, y, w - 3, y);
    y += 4;

    // Transaction Details
    row('Layanan :', transaction.jenisTransaksi);
    if (transaction.noRekeningTujuan && transaction.noRekeningTujuan !== '-') {
      row('Tujuan  :', transaction.noRekeningTujuan);
    }
    row('Nominal :', formatRupiah(transaction.nominal));
    row('Admin   :', formatRupiah(transaction.biayaAdmin));

    y += 1;
    doc.line(3, y, w - 3, y);
    y += 4;

    // Total
    doc.setFont('courier', 'bold');
    doc.setFontSize(paperWidth === '58mm' ? 8 : 9);
    doc.text('TOTAL DIBAYAR:', 4, y);
    doc.text(formatRupiah(transaction.totalBayar), w - 4, y, { align: 'right' });
    y += 4.5;

    doc.setFont('courier', 'normal');
    doc.setFontSize(paperWidth === '58mm' ? 6.5 : 7.5);
    row('Metode  :', transaction.metodePembayaran || 'Tunai');
    row('Status  :', transaction.status.toUpperCase());

    y += 1;
    doc.line(3, y, w - 3, y);
    y += 4.5;

    // Footer note
    doc.setFont('courier', 'normal');
    doc.setFontSize(paperWidth === '58mm' ? 6 : 7);
    if (settings.catatanStruk) {
      doc.text(settings.catatanStruk, cx, y, { align: 'center' });
      y += 3.5;
    }
    doc.text('Terima kasih atas kunjungan Anda', cx, y, { align: 'center' });
    y += 3.5;
    doc.text('*** SIMPAN STRUK INI SEBAGAI BUKTI ***', cx, y, { align: 'center' });

    doc.save(`Struk_${transaction.noTransaksi}.pdf`);
  }
};
