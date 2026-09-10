export type UserRole = 'ADMIN' | 'OPERATOR' | 'OWNER';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  password?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

export type TransactionType =
  | 'Tarik Tunai'
  | 'Setor Tunai'
  | 'Transfer'
  | 'Transfer Antar Bank'
  | 'Pembayaran PLN'
  | 'Token PLN'
  | 'Pulsa'
  | 'Paket Data'
  | 'BPJS'
  | 'PDAM'
  | 'Telkom'
  | 'Multifinance'
  | 'Top Up E-Wallet'
  | 'Top Up DANA'
  | 'Top Up OVO'
  | 'Top Up GoPay'
  | 'Top Up ShopeePay'
  | 'Pembayaran lainnya'
  | 'Transaksi lainnya';

export type TransactionStatus = 'Berhasil' | 'Pending' | 'Dibatalkan' | 'Gagal';

export type PaymentMethod = 'Tunai' | 'Saldo Rekening BRILink' | 'Kartu Debit' | 'Saldo E-Wallet';

export interface Transaction {
  id: string;
  noTransaksi: string;
  tanggal: string; // YYYY-MM-DD
  jam: string;     // HH:mm
  pelanggan: string;
  noHp: string;
  jenisTransaksi: TransactionType;
  noRekeningTujuan: string;
  nominal: number;
  biayaAdmin: number;
  biayaProvider: number; // modal/operasional provider
  totalBayar: number;    // nominal + biayaAdmin
  keuntungan: number;    // biayaAdmin - biayaProvider
  modalTransaksi: number; // nominal yang dikeluarkan dari kas/rekening
  metodePembayaran: PaymentMethod;
  status: TransactionStatus;
  petugas: string;
  keterangan: string;
  createdAt: string;
  updatedAt?: string;
  syncStatus?: 'synced' | 'pending';
}

export type CashInCategory =
  | 'Modal usaha'
  | 'Setoran pemilik'
  | 'Pendapatan transaksi'
  | 'Pendapatan admin'
  | 'Pengembalian dana'
  | 'Lainnya';

export interface CashIn {
  id: string;
  tanggal: string;
  jam: string;
  sumberDana?: string;
  sumber?: string;
  kategori?: CashInCategory | string;
  nominal: number;
  diterimaDari?: string;
  metodePenerimaan?: string;
  keterangan: string;
  petugas: string;
  createdAt: string;
}

export type CashOutCategory =
  | 'Belanja operasional'
  | 'Operasional'
  | 'Listrik'
  | 'Internet'
  | 'Transportasi'
  | 'Gaji'
  | 'Biaya provider'
  | 'Pengisian saldo'
  | 'Penarikan modal'
  | 'Perawatan'
  | 'Lainnya';

export interface CashOut {
  id: string;
  tanggal: string;
  jam: string;
  kategori: CashOutCategory | string;
  nominal: number;
  penerima?: string;
  diberikanKepada?: string;
  metodePembayaran?: string;
  keterangan: string;
  petugas: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  nama: string;
  noHp: string;
  alamat: string;
  totalTransaksi: number;
  totalNominal: number;
  transaksiTerakhir?: string;
  catatan: string;
  createdAt?: string;
}

export interface BalanceSummary {
  kasTunai: number;
  rekeningBRILink: number;
  saldoLayanan: number;
  saldoLainnya: number;
  totalSaldo: number;
  lastUpdated: string;
}

export interface BalanceMutation {
  id: string;
  tanggal: string;
  jam: string;
  tipeAkun?: 'Kas Tunai' | 'Rekening BRILink' | 'Saldo Layanan' | 'Saldo Lainnya' | string;
  jenisMutasi: 'MASUK' | 'KELUAR' | string;
  nominal: number;
  saldoSebelum?: number;
  saldoSesudah?: number;
  referensi?: string;
  keterangan?: string;
  dariAkun?: string;
  keAkun?: string;
  alasan?: string;
  petugas?: string;
  createdAt?: string;
}

export interface CashReconciliation {
  id: string;
  tanggal: string;
  jam: string;
  saldoSistemTunai?: number;
  saldoFisikTunai?: number;
  selisihTunai?: number;
  saldoSistemRekening?: number;
  saldoFisikRekening?: number;
  selisihRekening?: number;
  totalSelisih?: number;
  saldoSistem?: number;
  saldoFisik?: number;
  selisih?: number;
  status: 'SESUAI' | 'KELEBIHAN' | 'KEKURANGAN' | 'Sesuai' | 'Lebih' | 'Kurang';
  petugas: string;
  catatan: string;
  createdAt?: string;
  pecahan?: Record<string, number>;
}

export interface DailyRecap {
  tanggal: string;
  jumlahTransaksi: number;
  totalNominalTransaksi: number;
  totalBiayaAdmin: number;
  totalPemasukan: number;
  totalPengeluaran: number;
  totalKeuntungan: number;
  saldoAwal: number;
  saldoAkhir: number;
}

export interface MonthlyRecap {
  bulanTahun: string; // YYYY-MM
  namaBulan: string;
  totalTransaksi: number;
  totalNominalTransaksi: number;
  totalAdmin: number;
  totalKasMasuk: number;
  totalKasKeluar: number;
  totalKeuntungan: number;
  saldoAwalBulan: number;
  saldoAkhirBulan: number;
}

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

export interface BusinessSettings {
  namaUsaha: string;
  namaPemilik: string;
  alamat: string;
  nomorHp: string;
  logoUrl?: string;
  saldoAwalKasTunai: number;
  saldoAwalRekening: number;
  minKasTunaiLaci?: number;       // Batas minimum kas tunai di laci (peringatan kas menipis)
  maxKasTunaiLaci?: number;       // Batas maksimum kas tunai di laci (peringatan kas menumpuk)
  minSaldoRekening?: number;      // Batas minimum saldo rekening (peringatan saldo rekening menipis)
  targetKeuntunganBulanan: number;
  defaultBiayaAdmin: number;
  namaOperatorDefault: string;
  formatNomorTransaksi: string;
  lebarKertasPrinter: '58mm' | '80mm';
  catatanStruk: string;
  gasWebAppUrl?: string; // Google Apps Script Web App URL
  googleAppsScriptUrl?: string;
  googleSpreadsheetId?: string;
  lastCashResetDate?: string;
  lastCashResetBy?: string;
  lastCashResetNote?: string;
}

export interface AuditLog {
  id: string;
  user: string;
  aktivitas: string;
  tanggal: string;
  jam: string;
  metadata: string;
  keterangan: string;
  username?: string;
  action?: string;
  details?: string;
  timestamp?: string;
  ipAddress?: string;
}

export interface DailyClosing {
  id: string;
  tanggal: string;
  totalTransaksi: number;
  totalNominal: number;
  totalBiayaAdmin: number;
  totalKeuntungan: number;
  totalPemasukanKas: number;
  totalPengeluaranKas: number;
  saldoAwal: number;
  saldoAkhir: number;
  selisihKas: number;
  statusTutupBuku: boolean;
  petugasTutupBuku: string;
  closedAt: string;
}

export type CashMutation = BalanceMutation;
export type CashInSource = string;

export interface BackupRecord {
  id: string;
  tanggal: string;
  jam: string;
  ukuranData: string;
  status: 'BERHASIL' | 'GAGAL';
  petugas: string;
  keterangan: string;
}

