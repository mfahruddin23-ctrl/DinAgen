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

  saveUser(user: User, currentActor: string): { success: boolean; message: string } {
    const users = this.getUsers();
    const trimmedUsername = user.username.trim().toLowerCase();

    // Check duplicate username
    const duplicate = users.find(
      u => u.username.toLowerCase() === trimmedUsername && u.id !== user.id
    );
    if (duplicate) {
      return {
        success: false,
        message: `Username "${user.username}" sudah dipakai oleh ${duplicate.name}. Gunakan username lain.`
      };
    }

    const cleanUser: User = {
      ...user,
      username: trimmedUsername,
      name: user.name.trim(),
      updatedAt: new Date().toISOString()
    } as User;

    const existingIdx = users.findIndex(u => u.id === cleanUser.id);
    if (existingIdx >= 0) {
      users[existingIdx] = cleanUser;
      this.logAudit(
        currentActor,
        'Edit User',
        `Update profil pengguna ${cleanUser.username} (${cleanUser.name}, Role: ${cleanUser.role}, Status: ${cleanUser.status})`
      );
    } else {
      cleanUser.createdAt = cleanUser.createdAt || new Date().toISOString();
      users.push(cleanUser);
      this.logAudit(
        currentActor,
        'Tambah User',
        `Tambah pengguna baru ${cleanUser.username} (${cleanUser.name}, Role: ${cleanUser.role})`
      );
    }

    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    // If current logged in user is the one being updated, refresh current user state
    const current = this.getCurrentUser();
    if (current && current.id === cleanUser.id) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(cleanUser));
    }

    notifyListeners();
    return {
      success: true,
      message: existingIdx >= 0 ? 'Data pengguna berhasil diperbarui.' : 'Pengguna baru berhasil ditambahkan.'
    };
  },

  deleteUser(userId: string, currentActor: string): { success: boolean; message: string } {
    const users = this.getUsers();
    const target = users.find(u => u.id === userId);
    if (!target) {
      return { success: false, message: 'Pengguna tidak ditemukan.' };
    }

    const current = this.getCurrentUser();
    if (current && current.id === userId) {
      return {
        success: false,
        message: 'Anda tidak dapat menghapus akun yang sedang aktif digunakan saat ini.'
      };
    }

    const adminCount = users.filter(
      u => (u.role === 'ADMIN' || u.role === 'OWNER') && u.status === 'ACTIVE'
    ).length;

    if ((target.role === 'ADMIN' || target.role === 'OWNER') && adminCount <= 1) {
      return {
        success: false,
        message: 'Tidak dapat menghapus akun Administrator/Owner terakhir yang aktif.'
      };
    }

    const filtered = users.filter(u => u.id !== userId);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(filtered));
    this.logAudit(
      currentActor,
      'Hapus User',
      `Menghapus akun pengguna ${target.username} (${target.name}, Role: ${target.role})`
    );
    notifyListeners();
    return { success: true, message: `Akun ${target.username} (${target.name}) berhasil dihapus.` };
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

    // Perhitungkan mutasi transfer langsung antar akun (Kas Laci <-> Rekening Bank) jika ada
    const storedMutationsRaw = localStorage.getItem(STORAGE_KEYS.MUTATIONS);
    if (storedMutationsRaw) {
      try {
        const storedMutations: BalanceMutation[] = JSON.parse(storedMutationsRaw);
        storedMutations.forEach(m => {
          if (m.dariAkun === 'Kas Tunai' && m.keAkun === 'Rekening BRILink') {
            kasTunai -= m.nominal;
            rekeningBRILink += m.nominal;
          } else if (m.dariAkun === 'Rekening BRILink' && m.keAkun === 'Kas Tunai') {
            rekeningBRILink -= m.nominal;
            kasTunai += m.nominal;
          }
        });
      } catch {
        // ignore
      }
    }

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
    const res = this.loginCheck(username, pass);
    return res.user || null;
  },

  loginCheck(username: string, pass: string): { success: boolean; user?: User; error?: string } {
    const trimmedUsername = username.trim().toLowerCase();
    if (!trimmedUsername || !pass) {
      return { success: false, error: 'Username dan password wajib diisi.' };
    }

    const users = this.getUsers();
    const found = users.find(u => u.username.toLowerCase() === trimmedUsername);
    if (!found) {
      return { success: false, error: 'Username tidak ditemukan dalam sistem.' };
    }

    if (found.status === 'INACTIVE') {
      return {
        success: false,
        error: 'Akun ini sedang dinonaktifkan. Silakan hubungi Administrator atau Owner.'
      };
    }

    // Check exact password
    if (found.password !== pass) {
      return { success: false, error: 'Password yang Anda masukkan salah.' };
    }

    this.setCurrentUser(found);
    return { success: true, user: found };
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

  // CASH MANAGEMENT & CASH RESET METHODS
  saveCashSettings(
    cashConfig: {
      saldoAwalKasTunai: number;
      saldoAwalRekening: number;
      minKasTunaiLaci?: number;
      maxKasTunaiLaci?: number;
      minSaldoRekening?: number;
    },
    actor?: string
  ): void {
    const user = actor || this.getCurrentUser()?.username || 'Kasir';
    const settings = this.getSettings();
    const updated: BusinessSettings = {
      ...settings,
      saldoAwalKasTunai: cashConfig.saldoAwalKasTunai,
      saldoAwalRekening: cashConfig.saldoAwalRekening,
      minKasTunaiLaci: cashConfig.minKasTunaiLaci ?? settings.minKasTunaiLaci ?? 3000000,
      maxKasTunaiLaci: cashConfig.maxKasTunaiLaci ?? settings.maxKasTunaiLaci ?? 25000000,
      minSaldoRekening: cashConfig.minSaldoRekening ?? settings.minSaldoRekening ?? 5000000,
    };
    this.saveSettings(updated, user);
    this.logAudit(
      user,
      'Pengaturan Kas',
      `Ubah parameter kas: Modal Awal Kas Rp ${cashConfig.saldoAwalKasTunai.toLocaleString('id-ID')}, Modal Awal Bank Rp ${cashConfig.saldoAwalRekening.toLocaleString('id-ID')}`
    );
    notifyListeners();
  },

  /**
   * Sesuaikan / Kalibrasi Saldo Kas Fisik vs Sistem
   * - baseline: Langsung sesuaikan modal awal sistem sehingga saldo berjalan tepat sesuai target
   * - transaction: Buat transaksi Kas Masuk / Kas Keluar otomatis agar selisih tercatat di pembukuan
   */
  adjustCashBalance(params: {
    targetKasTunai?: number;
    targetRekening?: number;
    mode: 'baseline' | 'transaction';
    reason: string;
    actor?: string;
  }): { success: boolean; message: string; diffTunai: number; diffRekening: number } {
    const user = params.actor || this.getCurrentUser()?.username || 'Kasir';
    const currentBalance = this.getBalanceSummary();
    const settings = this.getSettings();

    let diffTunai = 0;
    let diffRekening = 0;

    if (params.targetKasTunai !== undefined) {
      diffTunai = params.targetKasTunai - currentBalance.kasTunai;
    }
    if (params.targetRekening !== undefined) {
      diffRekening = params.targetRekening - currentBalance.rekeningBRILink;
    }

    if (diffTunai === 0 && diffRekening === 0) {
      return {
        success: true,
        message: 'Saldo kas fisik dan rekening sudah sama persis dengan sistem, tidak ada perubahan yang diperlukan.',
        diffTunai: 0,
        diffRekening: 0
      };
    }

    const todayDate = getTodayDateString();
    const nowTime = getCurrentTimeString();

    if (params.mode === 'baseline') {
      // Ubah baseline saldo awal secara matematis
      const updatedSettings: BusinessSettings = {
        ...settings,
        saldoAwalKasTunai: settings.saldoAwalKasTunai + diffTunai,
        saldoAwalRekening: settings.saldoAwalRekening + diffRekening,
        lastCashResetDate: `${todayDate} ${nowTime}`,
        lastCashResetBy: user,
        lastCashResetNote: params.reason || 'Kalibrasi saldo langsung'
      };
      this.saveSettings(updatedSettings, user);
      this.logAudit(
        user,
        'Kalibrasi Saldo Kas (Baseline)',
        `Penyesuaian baseline modal: Kas Fisik ${diffTunai >= 0 ? '+' : ''}Rp ${diffTunai.toLocaleString('id-ID')}, Rekening ${diffRekening >= 0 ? '+' : ''}Rp ${diffRekening.toLocaleString('id-ID')}. Alasan: ${params.reason}`
      );
    } else {
      // Mode Transaksi: Catat selisih ke Kas Masuk / Kas Keluar & Mutasi
      if (diffTunai > 0) {
        this.addCashIn(
          {
            id: `CIN-ADJ-${Date.now().toString(36).toUpperCase()}`,
            tanggal: todayDate,
            jam: nowTime,
            sumber: 'Modal Usaha',
            kategori: 'Modal Usaha',
            nominal: diffTunai,
            diterimaDari: user,
            metodePenerimaan: 'Tunai',
            keterangan: `[Penyesuaian Kas Laci] ${params.reason || 'Selisih kas fisik lebih'}`,
            petugas: user,
            createdAt: new Date().toISOString()
          },
          user
        );
      } else if (diffTunai < 0) {
        this.addCashOut(
          {
            id: `COT-ADJ-${Date.now().toString(36).toUpperCase()}`,
            tanggal: todayDate,
            jam: nowTime,
            kategori: 'Operasional',
            nominal: Math.abs(diffTunai),
            diberikanKepada: 'Penyesuaian Laci',
            metodePembayaran: 'Tunai',
            keterangan: `[Penyesuaian Kas Laci] ${params.reason || 'Selisih kas fisik kurang'}`,
            petugas: user,
            createdAt: new Date().toISOString()
          },
          user
        );
      }

      if (diffRekening !== 0) {
        this.addMutation(
          {
            id: `MUT-ADJ-${Date.now().toString(36).toUpperCase()}`,
            tanggal: todayDate,
            jam: nowTime,
            tipeAkun: 'Rekening BRILink',
            jenisMutasi: diffRekening > 0 ? 'MASUK' : 'KELUAR',
            nominal: Math.abs(diffRekening),
            dariAkun: diffRekening > 0 ? 'Koreksi Bank' : 'Rekening BRILink',
            keAkun: diffRekening > 0 ? 'Rekening BRILink' : 'Koreksi Bank',
            alasan: `[Penyesuaian Rekening] ${params.reason || 'Koreksi saldo bank'}`,
            petugas: user,
            createdAt: new Date().toISOString()
          },
          user
        );
      }

      const updatedSettings: BusinessSettings = {
        ...settings,
        lastCashResetDate: `${todayDate} ${nowTime}`,
        lastCashResetBy: user,
        lastCashResetNote: params.reason
      };
      this.saveSettings(updatedSettings, user);
      this.logAudit(
        user,
        'Penyesuaian Kas (Transaksi)',
        `Catat penyesuaian: Kas Tunai ${diffTunai >= 0 ? '+' : ''}Rp ${diffTunai.toLocaleString('id-ID')}, Rekening ${diffRekening >= 0 ? '+' : ''}Rp ${diffRekening.toLocaleString('id-ID')}`
      );
    }

    notifyListeners();
    return {
      success: true,
      message: `Saldo kas berhasil disesuaikan. (Selisih Kas Tunai: Rp ${diffTunai.toLocaleString('id-ID')}, Selisih Rekening: Rp ${diffRekening.toLocaleString('id-ID')})`,
      diffTunai,
      diffRekening
    };
  },

  /**
   * Reset Kas Shift / Tutup Shift Harian
   * Menetapkan modal kas tunai laci untuk shift baru (misal modal float Rp 5.000.000)
   * dan sisa uang kas tunai dicatat sebagai Setor Pemilik / Brankas
   */
  resetDailyShiftCash(params: {
    newKasTunai: number;
    note: string;
    actor?: string;
  }): { success: boolean; message: string; selisihKas: number } {
    const user = params.actor || this.getCurrentUser()?.username || 'Kasir';
    const currentBalance = this.getBalanceSummary();
    const todayDate = getTodayDateString();
    const nowTime = getCurrentTimeString();
    const currentKas = currentBalance.kasTunai;
    const sisaUangDisetor = currentKas - params.newKasTunai;

    if (sisaUangDisetor > 0) {
      // Kelebihan kas di atas modal shift ditarik / disetor ke pemilik
      this.addCashOut(
        {
          id: `COT-SFT-${Date.now().toString(36).toUpperCase()}`,
          tanggal: todayDate,
          jam: nowTime,
          kategori: 'Penarikan modal',
          nominal: sisaUangDisetor,
          diberikanKepada: 'Pemilik / Brankas Toko',
          metodePembayaran: 'Tunai',
          keterangan: `[Tutup Shift] Setor sisa kas ke pemilik/brankas. Sisa modal shift baru: Rp ${params.newKasTunai.toLocaleString('id-ID')}. ${params.note}`,
          petugas: user,
          createdAt: new Date().toISOString()
        },
        user
      );
    } else if (sisaUangDisetor < 0) {
      // Kas kurang dari modal shift, perlu tambahan modal
      const injeksi = Math.abs(sisaUangDisetor);
      this.addCashIn(
        {
          id: `CIN-SFT-${Date.now().toString(36).toUpperCase()}`,
          tanggal: todayDate,
          jam: nowTime,
          sumber: 'Modal usaha',
          kategori: 'Modal usaha',
          nominal: injeksi,
          diterimaDari: 'Pemilik Usaha',
          metodePenerimaan: 'Tunai',
          keterangan: `[Awal Shift] Tambahan modal kas laci dari pemilik untuk modal shift baru Rp ${params.newKasTunai.toLocaleString('id-ID')}. ${params.note}`,
          petugas: user,
          createdAt: new Date().toISOString()
        },
        user
      );
    }

    const settings = this.getSettings();
    const updatedSettings: BusinessSettings = {
      ...settings,
      lastCashResetDate: `${todayDate} ${nowTime}`,
      lastCashResetBy: user,
      lastCashResetNote: `Tutup shift: Kas disetel ke Rp ${params.newKasTunai.toLocaleString('id-ID')}`
    };
    this.saveSettings(updatedSettings, user);

    this.logAudit(
      user,
      'Reset Kas Shift',
      `Serah terima / reset shift: Kas sebelum Rp ${currentKas.toLocaleString('id-ID')}, Kas shift baru disetel Rp ${params.newKasTunai.toLocaleString('id-ID')}`
    );

    notifyListeners();
    return {
      success: true,
      message: `Reset kas shift berhasil! Saldo kas laci kini siap untuk shift berikutnya sebesar Rp ${params.newKasTunai.toLocaleString('id-ID')}.`,
      selisihKas: sisaUangDisetor
    };
  },

  /**
   * Pembersihan / Reset Data Kas & Transaksi (Emergency / Maintenance Purge)
   * Menyediakan backup otomatis sebelum eksekusi
   */
  clearCashData(options: {
    resetType: 'cashflow_only' | 'all_transactions' | 'reconciliations_only' | 'full_factory_reset';
    newInitialCash?: number;
    newInitialBank?: number;
    actor?: string;
  }): { success: boolean; message: string } {
    const user = options.actor || this.getCurrentUser()?.username || 'Kasir';

    // 1. Buat cadangan data otomatis sebelum direset!
    this.createBackupSnapshot(user);

    if (options.resetType === 'cashflow_only') {
      // Kosongkan riwayat kas masuk & kas keluar saja
      localStorage.setItem(STORAGE_KEYS.CASH_IN, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.CASH_OUT, JSON.stringify([]));
      this.logAudit(user, 'Reset Arus Kas', 'Mengosongkan seluruh riwayat kas masuk dan kas keluar');
      notifyListeners();
      return {
        success: true,
        message: 'Riwayat arus kas masuk dan kas keluar berhasil dikosongkan. Cadangan otomatis telah dibuat.'
      };
    }

    if (options.resetType === 'reconciliations_only') {
      localStorage.setItem(STORAGE_KEYS.RECONCILIATIONS, JSON.stringify([]));
      this.logAudit(user, 'Reset Rekonsiliasi', 'Mengosongkan seluruh riwayat rekonsiliasi kas');
      notifyListeners();
      return {
        success: true,
        message: 'Riwayat rekonsiliasi kas berhasil dibersihkan.'
      };
    }

    if (options.resetType === 'all_transactions') {
      // Kosongkan transaksi pembukuan, arus kas, mutasi, tutup buku
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.CASH_IN, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.CASH_OUT, JSON.stringify([]));
      localStorage.removeItem(STORAGE_KEYS.MUTATIONS);
      localStorage.removeItem(STORAGE_KEYS.DAILY_CLOSINGS);
      localStorage.setItem(STORAGE_KEYS.RECONCILIATIONS, JSON.stringify([]));

      // Atur saldo modal awal baru jika diisi
      const settings = this.getSettings();
      const updated: BusinessSettings = {
        ...settings,
        saldoAwalKasTunai: options.newInitialCash !== undefined ? options.newInitialCash : settings.saldoAwalKasTunai,
        saldoAwalRekening: options.newInitialBank !== undefined ? options.newInitialBank : settings.saldoAwalRekening,
        lastCashResetDate: `${getTodayDateString()} ${getCurrentTimeString()}`,
        lastCashResetBy: user,
        lastCashResetNote: 'Reset seluruh transaksi (buku kas baru)'
      };
      this.saveSettings(updated, user);

      this.logAudit(
        user,
        'Reset Buku Transaksi',
        `Mulai pembukuan baru: Saldo Kas Awal Rp ${updated.saldoAwalKasTunai.toLocaleString('id-ID')}, Saldo Bank Awal Rp ${updated.saldoAwalRekening.toLocaleString('id-ID')}`
      );
      notifyListeners();
      return {
        success: true,
        message: 'Seluruh transaksi dan arus kas berhasil dikosongkan. Pembukuan baru dimulai dengan aman!'
      };
    }

    if (options.resetType === 'full_factory_reset') {
      this.resetToInitialData();
      return {
        success: true,
        message: 'Seluruh data aplikasi telah dikembalikan ke kondisi awal bawaan pabrik.'
      };
    }

    return { success: false, message: 'Tipe reset tidak dikenali.' };
  },

  // QUICK ACTIONS
  quickCashInjection(amount: number, note: string, actor?: string): void {
    const user = actor || this.getCurrentUser()?.username || 'Kasir';
    this.addCashIn(
      {
        id: `CIN-INJ-${Date.now().toString(36).toUpperCase()}`,
        tanggal: getTodayDateString(),
        jam: getCurrentTimeString(),
        sumber: 'Modal usaha',
        kategori: 'Modal usaha',
        nominal: amount,
        diterimaDari: 'Pemilik Usaha',
        metodePenerimaan: 'Tunai',
        keterangan: note || 'Tambah Modal Kas Tunai Laci',
        petugas: user,
        createdAt: new Date().toISOString()
      },
      user
    );
  },

  quickCashWithdrawal(amount: number, note: string, actor?: string): void {
    const user = actor || this.getCurrentUser()?.username || 'Kasir';
    this.addCashOut(
      {
        id: `COT-WDR-${Date.now().toString(36).toUpperCase()}`,
        tanggal: getTodayDateString(),
        jam: getCurrentTimeString(),
        kategori: 'Penarikan modal',
        nominal: amount,
        diberikanKepada: 'Pemilik Usaha',
        metodePembayaran: 'Tunai',
        keterangan: note || 'Tarik Modal Kas Tunai / Setor Bank',
        petugas: user,
        createdAt: new Date().toISOString()
      },
      user
    );
  },

  transferCashToBank(amount: number, note: string, actor?: string): void {
    const user = actor || this.getCurrentUser()?.username || 'Kasir';
    this.addMutation(
      {
        id: `MUT-CTB-${Date.now().toString(36).toUpperCase()}`,
        tanggal: getTodayDateString(),
        jam: getCurrentTimeString(),
        tipeAkun: 'Setor Kas ke Rekening',
        jenisMutasi: 'TRANSFER',
        nominal: amount,
        dariAkun: 'Kas Tunai',
        keAkun: 'Rekening BRILink',
        alasan: note || 'Setor uang fisik kas laci ke rekening bank BRILink',
        petugas: user,
        createdAt: new Date().toISOString()
      },
      user
    );
  },

  transferBankToCash(amount: number, note: string, actor?: string): void {
    const user = actor || this.getCurrentUser()?.username || 'Kasir';
    this.addMutation(
      {
        id: `MUT-BTC-${Date.now().toString(36).toUpperCase()}`,
        tanggal: getTodayDateString(),
        jam: getCurrentTimeString(),
        tipeAkun: 'Tarik Rekening ke Kas Tunai',
        jenisMutasi: 'TRANSFER',
        nominal: amount,
        dariAkun: 'Rekening BRILink',
        keAkun: 'Kas Tunai',
        alasan: note || 'Tarik tunai dari rekening bank untuk isi modal kas laci',
        petugas: user,
        createdAt: new Date().toISOString()
      },
      user
    );
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
