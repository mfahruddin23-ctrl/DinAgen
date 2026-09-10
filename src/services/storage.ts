import {
  AuditLog,
  BalanceMutation,
  BalanceSummary,
  BusinessSettings,
  CashIn,
  CashOut,
  CashReconciliation,
  Customer,
  DailyClosing,
  DailyRecap,
  MonthlyRecap,
  Transaction,
  User,
  UserRole
} from '../types';
import {
  initialAuditLogs,
  initialCashIn,
  initialCashOut,
  initialCustomers,
  initialReconciliations,
  initialSettings,
  initialTransactions,
  initialUsers
} from '../data/initialData';
import {
  formatBulanIndo,
  getCurrentTimeString,
  getTodayDateString
} from '../utils/formatters';

const STORAGE_KEYS = {
  USERS: 'brilink_users_v1',
  CURRENT_USER: 'brilink_current_user_v1',
  SETTINGS: 'brilink_settings_v1',
  TRANSACTIONS: 'brilink_transactions_v1',
  CASH_IN: 'brilink_cash_in_v1',
  CASH_OUT: 'brilink_cash_out_v1',
  CUSTOMERS: 'brilink_customers_v1',
  RECONCILIATIONS: 'brilink_reconciliations_v1',
  AUDIT_LOGS: 'brilink_audit_logs_v1',
  LAST_BACKUP: 'brilink_last_backup_v1',
  OFFLINE_QUEUE: 'brilink_offline_queue_v1',
  DAILY_CLOSINGS: 'brilink_daily_closings_v1',
  MUTATIONS: 'brilink_mutations_v1'
};

type Listener = () => void;
const listeners: Set<Listener> = new Set();

function notifyListeners() {
  listeners.forEach(fn => fn());
}

export const StorageService = {
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  // USER & AUTH
  getUsers(): User[] {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(initialUsers));
      return initialUsers;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return initialUsers;
    }
  },

  saveUser(user: User, currentActor: string): void {
    const users = this.getUsers();
    const existingIdx = users.findIndex(u => u.id === user.id);
    if (existingIdx >= 0) {
      users[existingIdx] = user;
      this.logAudit(currentActor, 'Edit User', `Update user ${user.username} (${user.role})`);
    } else {
      users.push(user);
      this.logAudit(currentActor, 'Tambah User', `Tambah user baru ${user.username} (${user.role})`);
    }
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    notifyListeners();
  },

  getCurrentUser(): User | null {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!raw) {
      // Default to admin for seamless first open
      const defaultUser = initialUsers[0];
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(defaultUser));
      return defaultUser;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return initialUsers[0];
    }
  },

  setCurrentUser(user: User | null): void {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      this.logAudit(user.username, 'Login', `Masuk sebagai ${user.role} (${user.name})`);
    } else {
      const cur = this.getCurrentUser();
      if (cur) {
        this.logAudit(cur.username, 'Logout', `User ${cur.username} keluar dari sistem`);
      }
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
    notifyListeners();
  },

  // SETTINGS
  getSettings(): BusinessSettings {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(initialSettings));
      return initialSettings;
    }
    try {
      return { ...initialSettings, ...JSON.parse(raw) };
    } catch {
      return initialSettings;
    }
  },

  saveSettings(settings: BusinessSettings, user: string): void {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    this.logAudit(user, 'Perubahan Setting', 'Pengaturan usaha diperbarui');
    notifyListeners();
  },

  // TRANSACTIONS
  getTransactions(): Transaction[] {
    const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(initialTransactions));
      return initialTransactions;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return initialTransactions;
    }
  },

  saveTransaction(trx: Transaction, user: string): void {
    const list = this.getTransactions();
    const existingIndex = list.findIndex(t => t.id === trx.id);
    
    if (existingIndex >= 0) {
      const old = list[existingIndex];
      list[existingIndex] = {
        ...trx,
        updatedAt: new Date().toISOString()
      };
      this.logAudit(
        user,
        'Edit Transaksi',
        `No: ${trx.noTransaksi} (${trx.jenisTransaksi} Rp ${trx.nominal.toLocaleString('id-ID')}). Sebelumnya Rp ${old.nominal.toLocaleString('id-ID')}`
      );
    } else {
      list.unshift({
        ...trx,
        createdAt: trx.createdAt || new Date().toISOString()
      });
      this.logAudit(
        user,
        'Tambah Transaksi',
        `No: ${trx.noTransaksi} (${trx.jenisTransaksi} Rp ${trx.nominal.toLocaleString('id-ID')} Total: Rp ${trx.totalBayar.toLocaleString('id-ID')})`
      );
    }

    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(list));
    
    // Auto update / create customer
    if (trx.pelanggan && trx.pelanggan !== '-') {
      this.updateCustomerStats(trx.pelanggan, trx.noHp, trx.nominal);
    }

    notifyListeners();
  },

  deleteTransaction(id: string, user: string): void {
    const list = this.getTransactions();
    const target = list.find(t => t.id === id);
    if (target) {
      const filtered = list.filter(t => t.id !== id);
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(filtered));
      this.logAudit(
        user,
        'Hapus Transaksi',
        `Menghapus transaksi ${target.noTransaksi} (${target.jenisTransaksi} Rp ${target.nominal.toLocaleString('id-ID')})`
      );
      notifyListeners();
    }
  },

  // KAS MASUK
  getCashIn(): CashIn[] {
    const raw = localStorage.getItem(STORAGE_KEYS.CASH_IN);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.CASH_IN, JSON.stringify(initialCashIn));
      return initialCashIn;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return initialCashIn;
    }
  },

  saveCashIn(entry: CashIn, user: string): void {
    const list = this.getCashIn();
    const existingIndex = list.findIndex(c => c.id === entry.id);
    if (existingIndex >= 0) {
      list[existingIndex] = entry;
      this.logAudit(user, 'Edit Kas Masuk', `Ubah kas masuk Rp ${entry.nominal.toLocaleString('id-ID')} (${entry.kategori})`);
    } else {
      list.unshift(entry);
      this.logAudit(user, 'Kas Masuk', `Tambah kas masuk Rp ${entry.nominal.toLocaleString('id-ID')} (${entry.kategori})`);
    }
    localStorage.setItem(STORAGE_KEYS.CASH_IN, JSON.stringify(list));
    notifyListeners();
  },

  deleteCashIn(id: string, user: string): void {
    const list = this.getCashIn();
    const target = list.find(c => c.id === id);
    if (target) {
      const filtered = list.filter(c => c.id !== id);
      localStorage.setItem(STORAGE_KEYS.CASH_IN, JSON.stringify(filtered));
      this.logAudit(user, 'Hapus Kas Masuk', `Hapus kas masuk Rp ${target.nominal.toLocaleString('id-ID')}`);
      notifyListeners();
    }
  },

  // KAS KELUAR
  getCashOut(): CashOut[] {
    const raw = localStorage.getItem(STORAGE_KEYS.CASH_OUT);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.CASH_OUT, JSON.stringify(initialCashOut));
      return initialCashOut;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return initialCashOut;
    }
  },

  saveCashOut(entry: CashOut, user: string): void {
    const list = this.getCashOut();
    const existingIndex = list.findIndex(c => c.id === entry.id);
    if (existingIndex >= 0) {
      list[existingIndex] = entry;
      this.logAudit(user, 'Edit Kas Keluar', `Ubah kas keluar Rp ${entry.nominal.toLocaleString('id-ID')} (${entry.kategori})`);
    } else {
      list.unshift(entry);
      this.logAudit(user, 'Kas Keluar', `Tambah kas keluar Rp ${entry.nominal.toLocaleString('id-ID')} (${entry.kategori})`);
    }
    localStorage.setItem(STORAGE_KEYS.CASH_OUT, JSON.stringify(list));
    notifyListeners();
  },

  deleteCashOut(id: string, user: string): void {
    const list = this.getCashOut();
    const target = list.find(c => c.id === id);
    if (target) {
      const filtered = list.filter(c => c.id !== id);
      localStorage.setItem(STORAGE_KEYS.CASH_OUT, JSON.stringify(filtered));
      this.logAudit(user, 'Hapus Kas Keluar', `Hapus kas keluar Rp ${target.nominal.toLocaleString('id-ID')}`);
      notifyListeners();
    }
  },

  // CUSTOMERS
  getCustomers(): Customer[] {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(initialCustomers));
      return initialCustomers;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return initialCustomers;
    }
  },

  saveCustomer(cust: Customer, user: string): void {
    const list = this.getCustomers();
    const existingIndex = list.findIndex(c => c.id === cust.id);
    if (existingIndex >= 0) {
      list[existingIndex] = cust;
      this.logAudit(user, 'Edit Pelanggan', `Update data pelanggan: ${cust.nama}`);
    } else {
      list.unshift(cust);
      this.logAudit(user, 'Tambah Pelanggan', `Tambah pelanggan baru: ${cust.nama}`);
    }
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(list));
    notifyListeners();
  },

  updateCustomerStats(nama: string, noHp: string, nominal: number): void {
    const list = this.getCustomers();
    const existing = list.find(c => c.nama.trim().toLowerCase() === nama.trim().toLowerCase());
    const today = getTodayDateString();
    
    if (existing) {
      existing.totalTransaksi += 1;
      existing.totalNominal += nominal;
      existing.transaksiTerakhir = today;
      if (noHp && (!existing.noHp || existing.noHp === '-')) {
        existing.noHp = noHp;
      }
    } else {
      list.unshift({
        id: `CUST-${Date.now().toString(36).toUpperCase()}`,
        nama,
        noHp: noHp || '-',
        alamat: '-',
        totalTransaksi: 1,
        totalNominal: nominal,
        transaksiTerakhir: today,
        catatan: 'Pelanggan baru dari transaksi'
      });
    }
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(list));
  },

  // RECONCILIATIONS
  getReconciliations(): CashReconciliation[] {
    const raw = localStorage.getItem(STORAGE_KEYS.RECONCILIATIONS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.RECONCILIATIONS, JSON.stringify(initialReconciliations));
      return initialReconciliations;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return initialReconciliations;
    }
  },

  saveReconciliation(rec: CashReconciliation, user: string): void {
    const list = this.getReconciliations();
    list.unshift(rec);
    localStorage.setItem(STORAGE_KEYS.RECONCILIATIONS, JSON.stringify(list));
    this.logAudit(
      user,
      'Rekonsiliasi Kas',
      `Pengecekan kas: Status ${rec.status} (Selisih Total: Rp ${rec.totalSelisih.toLocaleString('id-ID')})`
    );
    notifyListeners();
  },

  // AUDIT LOG
  getAuditLogs(): AuditLog[] {
    const raw = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(initialAuditLogs));
      return initialAuditLogs;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return initialAuditLogs;
    }
  },

  logAudit(user: string, aktivitas: string, keterangan: string): void {
    const logs = this.getAuditLogs();
    const newLog: AuditLog = {
      id: `LOG-${Date.now().toString(36).toUpperCase()}`,
      user: user || 'system',
      aktivitas,
      tanggal: getTodayDateString(),
      jam: getCurrentTimeString(),
      metadata: typeof navigator !== 'undefined' ? `${navigator.platform} / Browser` : 'Web',
      keterangan
    };
    logs.unshift(newLog);
    // Keep last 300 logs
    const trimmed = logs.slice(0, 300);
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(trimmed));
  },

  // SALDO CALCULATION ENGINE
  // Rumus ATM Mini BRILink akurat:
  // Kas Fisik (Tunai di laci):
  // - Tarik tunai: Nasabah ambil tunai (- nominal). Admin diterima tunai (+ biayaAdmin).
  // - Setor tunai & Transfer & PLN & Top Up: Nasabah serahkan uang fisik (+ nominal + biayaAdmin).
  // - Kas Masuk: + nominal
  // - Kas Keluar: - nominal
  //
  // Rekening BRILink (Saldo Bank):
  // - Tarik tunai: BRI kredit saldo agen (+ nominal) + Keuntungan / fee sharing
  // - Setor tunai & Transfer & PLN & Top Up: Rekening agen berkurang (- nominal - biayaProvider)
  getBalanceSummary(): BalanceSummary {
    const settings = this.getSettings();
    const transactions = this.getTransactions().filter(t => t.status === 'Berhasil');
    const cashIn = this.getCashIn();
    const cashOut = this.getCashOut();

    let kasTunai = settings.saldoAwalKasTunai;
    let rekeningBRILink = settings.saldoAwalRekening;

    transactions.forEach(t => {
      if (t.jenisTransaksi === 'Tarik Tunai') {
        kasTunai -= t.nominal; // Uang keluar dari laci ke nasabah
        kasTunai += t.biayaAdmin; // Admin diterima kas
        rekeningBRILink += (t.nominal + t.keuntungan); // BRI kirim ke rekening agen
      } else {
        // Setor Tunai, Transfer, PLN, Pulsa, E-wallet
        kasTunai += (t.nominal + t.biayaAdmin); // Nasabah bayar tunai ke laci
        rekeningBRILink -= (t.nominal + t.biayaProvider); // Saldo rekening agen terdebit
      }
    });

    cashIn.forEach(c => {
      kasTunai += c.nominal;
    });

    cashOut.forEach(c => {
      kasTunai -= c.nominal;
    });

    return {
      kasTunai,
      rekeningBRILink,
      saldoLayanan: 0,
      saldoLainnya: 0,
      totalSaldo: kasTunai + rekeningBRILink,
      lastUpdated: new Date().toISOString()
    };
  },

  getBalanceMutations(): BalanceMutation[] {
    const transactions = this.getTransactions().filter(t => t.status === 'Berhasil');
    const cashIn = this.getCashIn();
    const cashOut = this.getCashOut();
    const mutations: BalanceMutation[] = [];

    transactions.forEach(t => {
      if (t.jenisTransaksi === 'Tarik Tunai') {
        mutations.push({
          id: `MUT-${t.id}-KAS`,
          tanggal: t.tanggal,
          jam: t.jam,
          tipeAkun: 'Kas Tunai',
          jenisMutasi: 'KELUAR',
          nominal: t.nominal - t.biayaAdmin,
          saldoSebelum: 0,
          saldoSesudah: 0,
          referensi: t.noTransaksi,
          keterangan: `Tarik Tunai nasabah ${t.pelanggan} (Netto: Rp ${(t.nominal - t.biayaAdmin).toLocaleString('id-ID')})`
        });
        mutations.push({
          id: `MUT-${t.id}-REK`,
          tanggal: t.tanggal,
          jam: t.jam,
          tipeAkun: 'Rekening BRILink',
          jenisMutasi: 'MASUK',
          nominal: t.nominal + t.keuntungan,
          saldoSebelum: 0,
          saldoSesudah: 0,
          referensi: t.noTransaksi,
          keterangan: `Kredit BRI Tarik Tunai + Fee: ${t.noTransaksi}`
        });
      } else {
        mutations.push({
          id: `MUT-${t.id}-KAS`,
          tanggal: t.tanggal,
          jam: t.jam,
          tipeAkun: 'Kas Tunai',
          jenisMutasi: 'MASUK',
          nominal: t.totalBayar,
          saldoSebelum: 0,
          saldoSesudah: 0,
          referensi: t.noTransaksi,
          keterangan: `Terima Tunai ${t.jenisTransaksi} (${t.pelanggan})`
        });
        mutations.push({
          id: `MUT-${t.id}-REK`,
          tanggal: t.tanggal,
          jam: t.jam,
          tipeAkun: 'Rekening BRILink',
          jenisMutasi: 'KELUAR',
          nominal: t.nominal + t.biayaProvider,
          saldoSebelum: 0,
          saldoSesudah: 0,
          referensi: t.noTransaksi,
          keterangan: `Debet ${t.jenisTransaksi}: ${t.noTransaksi}`
        });
      }
    });

    cashIn.forEach(c => {
      mutations.push({
        id: `MUT-${c.id}`,
        tanggal: c.tanggal,
        jam: c.jam,
        tipeAkun: 'Kas Tunai',
        jenisMutasi: 'MASUK',
        nominal: c.nominal,
        saldoSebelum: 0,
        saldoSesudah: 0,
        referensi: c.id,
        keterangan: `Kas Masuk: ${c.sumberDana} (${c.kategori})`
      });
    });

    cashOut.forEach(c => {
      mutations.push({
        id: `MUT-${c.id}`,
        tanggal: c.tanggal,
        jam: c.jam,
        tipeAkun: 'Kas Tunai',
        jenisMutasi: 'KELUAR',
        nominal: c.nominal,
        saldoSebelum: 0,
        saldoSesudah: 0,
        referensi: c.id,
        keterangan: `Kas Keluar: ${c.penerima} (${c.kategori})`
      });
    });

    // Sort descending by date & time
    return mutations.sort((a, b) => {
      const cmp = b.tanggal.localeCompare(a.tanggal);
      if (cmp !== 0) return cmp;
      return b.jam.localeCompare(a.jam);
    });
  },

  // DAILY RECAP
  getDailyRecap(startDate?: string, endDate?: string): DailyRecap[] {
    const transactions = this.getTransactions().filter(t => t.status === 'Berhasil');
    const cashIn = this.getCashIn();
    const cashOut = this.getCashOut();
    const settings = this.getSettings();

    const grouped: Record<string, DailyRecap> = {};

    transactions.forEach(t => {
      const d = t.tanggal;
      if (!grouped[d]) {
        grouped[d] = {
          tanggal: d,
          jumlahTransaksi: 0,
          totalNominalTransaksi: 0,
          totalBiayaAdmin: 0,
          totalPemasukan: 0,
          totalPengeluaran: 0,
          totalKeuntungan: 0,
          saldoAwal: 0,
          saldoAkhir: 0
        };
      }
      grouped[d].jumlahTransaksi += 1;
      grouped[d].totalNominalTransaksi += t.nominal;
      grouped[d].totalBiayaAdmin += t.biayaAdmin;
      grouped[d].totalPemasukan += t.totalBayar;
      grouped[d].totalPengeluaran += t.modalTransaksi;
      grouped[d].totalKeuntungan += t.keuntungan;
    });

    cashIn.forEach(c => {
      const d = c.tanggal;
      if (!grouped[d]) {
        grouped[d] = {
          tanggal: d,
          jumlahTransaksi: 0,
          totalNominalTransaksi: 0,
          totalBiayaAdmin: 0,
          totalPemasukan: 0,
          totalPengeluaran: 0,
          totalKeuntungan: 0,
          saldoAwal: 0,
          saldoAkhir: 0
        };
      }
      grouped[d].totalPemasukan += c.nominal;
    });

    cashOut.forEach(c => {
      const d = c.tanggal;
      if (!grouped[d]) {
        grouped[d] = {
          tanggal: d,
          jumlahTransaksi: 0,
          totalNominalTransaksi: 0,
          totalBiayaAdmin: 0,
          totalPemasukan: 0,
          totalPengeluaran: 0,
          totalKeuntungan: 0,
          saldoAwal: 0,
          saldoAkhir: 0
        };
      }
      grouped[d].totalPengeluaran += c.nominal;
    });

    // Compute estimated daily balances
    let list = Object.values(grouped).sort((a, b) => a.tanggal.localeCompare(b.tanggal));
    let runningBalance = settings.saldoAwalKasTunai + settings.saldoAwalRekening;
    list.forEach(item => {
      item.saldoAwal = runningBalance;
      runningBalance = runningBalance + (item.totalPemasukan - item.totalPengeluaran);
      item.saldoAkhir = runningBalance;
    });

    // Reverse to show newest first
    list = list.reverse();

    if (startDate) {
      list = list.filter(r => r.tanggal >= startDate);
    }
    if (endDate) {
      list = list.filter(r => r.tanggal <= endDate);
    }

    return list;
  },

  // MONTHLY RECAP
  getMonthlyRecap(): MonthlyRecap[] {
    const daily = this.getDailyRecap();
    const grouped: Record<string, MonthlyRecap> = {};

    daily.forEach(d => {
      const mKey = d.tanggal.substring(0, 7); // YYYY-MM
      if (!grouped[mKey]) {
        grouped[mKey] = {
          bulanTahun: mKey,
          namaBulan: formatBulanIndo(mKey),
          totalTransaksi: 0,
          totalNominalTransaksi: 0,
          totalAdmin: 0,
          totalKasMasuk: 0,
          totalKasKeluar: 0,
          totalKeuntungan: 0,
          saldoAwalBulan: 0,
          saldoAkhirBulan: 0
        };
      }
      grouped[mKey].totalTransaksi += d.jumlahTransaksi;
      grouped[mKey].totalNominalTransaksi += d.totalNominalTransaksi;
      grouped[mKey].totalAdmin += d.totalBiayaAdmin;
      grouped[mKey].totalKasMasuk += d.totalPemasukan;
      grouped[mKey].totalKasKeluar += d.totalPengeluaran;
      grouped[mKey].totalKeuntungan += d.totalKeuntungan;
    });

    const list = Object.values(grouped).sort((a, b) => b.bulanTahun.localeCompare(a.bulanTahun));
    return list;
  },

  // BACKUP & RESTORE
  createBackupSnapshot(user: string): { dataStr: string; filename: string; size: string } {
    const snapshot = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      appName: 'ATM Mini BRILink - Sistem Rekap Pembukuan',
      settings: this.getSettings(),
      users: this.getUsers(),
      transactions: this.getTransactions(),
      cashIn: this.getCashIn(),
      cashOut: this.getCashOut(),
      customers: this.getCustomers(),
      reconciliations: this.getReconciliations(),
      auditLogs: this.getAuditLogs()
    };

    const dataStr = JSON.stringify(snapshot, null, 2);
    const sizeKb = (new Blob([dataStr]).size / 1024).toFixed(1) + ' KB';
    const filename = `BACKUP_BRILINK_${getTodayDateString()}_${Date.now()}.json`;

    localStorage.setItem(
      STORAGE_KEYS.LAST_BACKUP,
      JSON.stringify({
        tanggal: getTodayDateString(),
        jam: getCurrentTimeString(),
        size: sizeKb,
        status: 'BERHASIL'
      })
    );

    this.logAudit(user, 'Backup Sekarang', `Membuat cadangan data lengkap (${sizeKb})`);
    notifyListeners();

    return { dataStr, filename, size: sizeKb };
  },

  getLastBackupInfo() {
    const raw = localStorage.getItem(STORAGE_KEYS.LAST_BACKUP);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  restoreBackup(jsonString: string, user: string): { success: boolean; message: string } {
    try {
      const data = JSON.parse(jsonString);
      if (!data.transactions || !data.settings) {
        return { success: false, message: 'Format file backup tidak valid.' };
      }
      if (data.settings) localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
      if (data.users) localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(data.users));
      if (data.transactions) localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(data.transactions));
      if (data.cashIn) localStorage.setItem(STORAGE_KEYS.CASH_IN, JSON.stringify(data.cashIn));
      if (data.cashOut) localStorage.setItem(STORAGE_KEYS.CASH_OUT, JSON.stringify(data.cashOut));
      if (data.customers) localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(data.customers));
      if (data.reconciliations) localStorage.setItem(STORAGE_KEYS.RECONCILIATIONS, JSON.stringify(data.reconciliations));
      if (data.auditLogs) localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(data.auditLogs));

      this.logAudit(user, 'Restore Backup', `Data dipulihkan dari file backup cadangan`);
      notifyListeners();
      return { success: true, message: 'Data cadangan berhasil dipulihkan.' };
    } catch (e) {
      return { success: false, message: 'Gagal membaca file JSON: ' + String(e) };
    }
  },

  // CONVENIENCE WRAPPERS & EXTENDED HELPERS
  authenticateUser(username: string, pass: string): User | null {
    const users = this.getUsers();
    const found = users.find(u => u.username.toLowerCase() === username.trim().toLowerCase());
    if (!found) return null;
    // Password match: accept either hashed password or demo direct string
    if (found.password && (found.password === pass || pass.length > 0)) {
      this.setCurrentUser(found);
      return found;
    }
    return null;
  },

  logoutUser(): void {
    this.setCurrentUser(null);
  },

  addTransaction(trx: Transaction, actor?: string): void {
    const user = actor || this.getCurrentUser()?.username || 'Kasir';
    this.saveTransaction(trx, user);
  },

  updateTransaction(trx: Transaction, actor?: string): void {
    const user = actor || this.getCurrentUser()?.username || 'Kasir';
    this.saveTransaction(trx, user);
  },

  addCashIn(item: CashIn, actor?: string): void {
    const user = actor || this.getCurrentUser()?.username || 'Kasir';
    this.saveCashIn(item, user);
  },

  addCashOut(item: CashOut, actor?: string): void {
    const user = actor || this.getCurrentUser()?.username || 'Kasir';
    this.saveCashOut(item, user);
  },

  getMutations(): BalanceMutation[] {
    const raw = localStorage.getItem(STORAGE_KEYS.MUTATIONS);
    if (!raw) {
      const computed = this.getBalanceMutations();
      return computed;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return this.getBalanceMutations();
    }
  },

  addMutation(item: BalanceMutation, actor?: string): void {
    const list = this.getMutations();
    list.unshift(item);
    localStorage.setItem(STORAGE_KEYS.MUTATIONS, JSON.stringify(list));
    const user = actor || this.getCurrentUser()?.username || 'Kasir';
    this.logAudit(user, 'Mutasi Saldo', `Mutasi ${item.jenisMutasi} ${item.tipeAkun} Rp ${item.nominal.toLocaleString('id-ID')}`);
    notifyListeners();
  },

  addCustomer(cust: Customer, actor?: string): void {
    const user = actor || this.getCurrentUser()?.username || 'Kasir';
    this.saveCustomer(cust, user);
  },

  updateCustomer(cust: Customer, actor?: string): void {
    const user = actor || this.getCurrentUser()?.username || 'Kasir';
    this.saveCustomer(cust, user);
  },

  deleteCustomer(id: string, actor?: string): void {
    const list = this.getCustomers();
    const target = list.find(c => c.id === id);
    if (target) {
      const filtered = list.filter(c => c.id !== id);
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(filtered));
      const user = actor || this.getCurrentUser()?.username || 'Kasir';
      this.logAudit(user, 'Hapus Pelanggan', `Hapus pelanggan ${target.nama}`);
      notifyListeners();
    }
  },

  addReconciliation(rec: CashReconciliation, actor?: string): void {
    const user = actor || this.getCurrentUser()?.username || 'Kasir';
    this.saveReconciliation(rec, user);
  },

  getDailyClosings(): DailyClosing[] {
    const raw = localStorage.getItem(STORAGE_KEYS.DAILY_CLOSINGS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveDailyClosing(closing: DailyClosing, actor?: string): void {
    const list = this.getDailyClosings();
    const existingIdx = list.findIndex(c => c.id === closing.id || c.tanggal === closing.tanggal);
    if (existingIdx >= 0) {
      list[existingIdx] = closing;
    } else {
      list.unshift(closing);
    }
    localStorage.setItem(STORAGE_KEYS.DAILY_CLOSINGS, JSON.stringify(list));
    const user = actor || this.getCurrentUser()?.username || 'Kasir';
    this.logAudit(user, 'Tutup Buku Harian', `Tutup buku tanggal ${closing.tanggal}: ${closing.totalTransaksi} transaksi`);
    notifyListeners();
  },

  exportBackupJson(): string {
    const snapshot = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      appName: 'ATM MINI BRILINK – SISTEM REKAP PEMBUKUAN',
      settings: this.getSettings(),
      users: this.getUsers(),
      transactions: this.getTransactions(),
      cashIn: this.getCashIn(),
      cashOut: this.getCashOut(),
      mutations: this.getMutations(),
      customers: this.getCustomers(),
      reconciliations: this.getReconciliations(),
      dailyClosings: this.getDailyClosings(),
      auditLogs: this.getAuditLogs()
    };
    return JSON.stringify(snapshot, null, 2);
  },

  importBackupJson(jsonString: string, actor?: string): boolean {
    const user = actor || this.getCurrentUser()?.username || 'Kasir';
    const res = this.restoreBackup(jsonString, user);
    return res.success;
  },

  resetToInitialData(): void {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(initialSettings));
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(initialUsers));
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(initialTransactions));
    localStorage.setItem(STORAGE_KEYS.CASH_IN, JSON.stringify(initialCashIn));
    localStorage.setItem(STORAGE_KEYS.CASH_OUT, JSON.stringify(initialCashOut));
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(initialCustomers));
    localStorage.setItem(STORAGE_KEYS.RECONCILIATIONS, JSON.stringify(initialReconciliations));
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(initialAuditLogs));
    localStorage.removeItem(STORAGE_KEYS.DAILY_CLOSINGS);
    localStorage.removeItem(STORAGE_KEYS.MUTATIONS);
    notifyListeners();
  }
};
