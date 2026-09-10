/**
 * Source code Google Apps Script lengkap untuk:
 * “ATM MINI BRILINK – SISTEM REKAP PEMBUKUAN”
 * 
 * Terdiri dari 10 file modular:
 * 1. Code.gs
 * 2. Config.gs
 * 3. Database.gs
 * 4. Auth.gs
 * 5. Transaction.gs
 * 6. Cashflow.gs
 * 7. Report.gs
 * 8. Dashboard.gs
 * 9. Backup.gs
 * 10. Utils.gs
 */

export interface AppsScriptFile {
  name: string;
  description: string;
  code: string;
}

export const APPS_SCRIPT_FILES: AppsScriptFile[] = [
  {
    name: 'Code.gs',
    description: 'Entry point doGet, doPost, Menu Spreadsheet dan Web App Router',
    code: `/**
 * =======================================================
 * ATM MINI BRILINK – SISTEM REKAP PEMBUKUAN
 * Entry Point: Code.gs
 * =======================================================
 */

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🏧 ATM MINI BRILINK')
    .addItem('⚙️ Setup Database Otomatis', 'setupDatabase')
    .addItem('💾 Backup Database', 'triggerManualBackup')
    .addItem('🔄 Rekalkulasi Saldo', 'recalculateAllBalances')
    .addSeparator()
    .addItem('🌐 Buka Aplikasi Web', 'openWebAppUrl')
    .addToUi();
}

function openWebAppUrl() {
  const url = ScriptApp.getService().getUrl();
  const html = HtmlService.createHtmlOutput(
    '<p>Aplikasi Web ATM Mini BRILink aktif di:</p><p><a href="' + url + '" target="_blank">' + url + '</a></p>'
  ).setWidth(400).setHeight(150);
  SpreadsheetApp.getUi().showModalDialog(html, 'Aplikasi ATM Mini BRILink');
}

/**
 * Handle HTTP GET Requests (Web App & REST API)
 */
function doGet(e) {
  // Jika parameter action ada, return JSON API
  if (e && e.parameter && e.parameter.action) {
    return handleApiGet(e.parameter);
  }
  
  // Render HTML App jika dibuka langsung di browser Apps Script
  const template = HtmlService.createTemplateFromFile('index');
  return template.evaluate()
    .setTitle('ATM Mini BRILink - Sistem Rekap Pembukuan')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Handle HTTP POST Requests (REST API for Frontend Sync)
 */
function doPost(e) {
  try {
    const postData = JSON.parse(e.postData.contents);
    const action = postData.action;
    const payload = postData.payload || {};
    const user = postData.user || 'system';

    let result = { success: false, message: 'Action not found' };

    switch (action) {
      case 'loginUser':
        result = loginUser(payload.username, payload.password);
        break;
      case 'saveTransaction':
        result = saveTransaction(payload, user);
        break;
      case 'updateTransaction':
        result = updateTransaction(payload, user);
        break;
      case 'deleteTransaction':
        result = deleteTransaction(payload.id, user);
        break;
      case 'saveCashIn':
        result = saveCashIn(payload, user);
        break;
      case 'saveCashOut':
        result = saveCashOut(payload, user);
        break;
      case 'saveCustomer':
        result = saveCustomer(payload, user);
        break;
      case 'saveSettings':
        result = saveSettings(payload, user);
        break;
      case 'createBackup':
        result = createBackup(user);
        break;
      case 'saveReconciliation':
        result = saveReconciliation(payload, user);
        break;
      case 'syncAllData':
        result = syncAllData(payload, user);
        break;
      default:
        result = { success: false, message: 'Unknown action: ' + action };
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function handleApiGet(params) {
  const action = params.action;
  let data = null;

  switch (action) {
    case 'getDashboard':
      data = getDashboard(params.filter || 'today');
      break;
    case 'getTransactions':
      data = getTransactions();
      break;
    case 'getCashIn':
      data = getCashIn();
      break;
    case 'getCashOut':
      data = getCashOut();
      break;
    case 'getBalance':
      data = getBalance();
      break;
    case 'getDailyReport':
      data = getDailyReport(params.startDate, params.endDate);
      break;
    case 'getMonthlyReport':
      data = getMonthlyReport(params.year);
      break;
    case 'getCustomers':
      data = getCustomers();
      break;
    case 'getSettings':
      data = getSettings();
      break;
    case 'getAuditLogs':
      data = getAuditLogs();
      break;
    default:
      data = { error: 'Unknown action: ' + action };
  }

  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    data: data
  })).setMimeType(ContentService.MimeType.JSON);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}`
  },
  {
    name: 'Config.gs',
    description: 'Konfigurasi nama sheet, role hak akses, dan konstanta sistem',
    code: `/**
 * =======================================================
 * Config.gs - Konstanta & Konfigurasi Global
 * =======================================================
 */

const SHEET_NAMES = {
  USERS: 'USERS',
  SETTINGS: 'SETTINGS',
  TRANSAKSI: 'TRANSAKSI',
  KAS_MASUK: 'KAS_MASUK',
  KAS_KELUAR: 'KAS_KELUAR',
  SALDO: 'SALDO',
  PELANGGAN: 'PELANGGAN',
  REKAP_HARIAN: 'REKAP_HARIAN',
  REKAP_BULANAN: 'REKAP_BULANAN',
  LOG_AKTIVITAS: 'LOG_AKTIVITAS',
  REKONSILIASI: 'REKONSILIASI'
};

const ROLES = {
  ADMIN: 'ADMIN',
  OPERATOR: 'OPERATOR',
  OWNER: 'OWNER'
};

const DEFAULT_ADMIN_FEE = 5000;
const DEFAULT_TRANSACTION_PREFIX = 'TRX';
`
  },
  {
    name: 'Database.gs',
    description: 'Inisialisasi 10 sheet database, header kolom, dan skema spreadsheet',
    code: `/**
 * =======================================================
 * Database.gs - Skema & Setup Database Otomatis
 * =======================================================
 */

function setupDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const schemas = {
    [SHEET_NAMES.USERS]: [
      'ID', 'Username', 'Nama', 'Role', 'Password_Hash', 'Status', 'Created_At'
    ],
    [SHEET_NAMES.SETTINGS]: [
      'Key', 'Value', 'Updated_At'
    ],
    [SHEET_NAMES.TRANSAKSI]: [
      'ID', 'Tanggal', 'Jam', 'No_Transaksi', 'Pelanggan', 'No_HP',
      'Jenis_Transaksi', 'No_Rekening_Tujuan', 'Nominal', 'Biaya_Admin',
      'Biaya_Provider', 'Total_Bayar', 'Keuntungan', 'Metode_Pembayaran',
      'Status', 'Petugas', 'Keterangan', 'Created_At', 'Updated_At'
    ],
    [SHEET_NAMES.KAS_MASUK]: [
      'ID', 'Tanggal', 'Jam', 'Sumber_Dana', 'Kategori', 'Nominal',
      'Keterangan', 'Petugas', 'Created_At'
    ],
    [SHEET_NAMES.KAS_KELUAR]: [
      'ID', 'Tanggal', 'Jam', 'Kategori', 'Nominal', 'Penerima',
      'Keterangan', 'Petugas', 'Created_At'
    ],
    [SHEET_NAMES.SALDO]: [
      'ID', 'Tanggal', 'Jam', 'Kas_Tunai', 'Rekening_BRILink',
      'Saldo_Layanan', 'Saldo_Lainnya', 'Total_Saldo', 'Keterangan', 'Updated_At'
    ],
    [SHEET_NAMES.PELANGGAN]: [
      'ID', 'Nama', 'No_HP', 'Alamat', 'Total_Transaksi', 'Total_Nominal',
      'Transaksi_Terakhir', 'Catatan', 'Updated_At'
    ],
    [SHEET_NAMES.REKAP_HARIAN]: [
      'Tanggal', 'Jumlah_Transaksi', 'Total_Nominal', 'Total_Biaya_Admin',
      'Total_Pemasukan', 'Total_Pengeluaran', 'Total_Keuntungan',
      'Saldo_Awal', 'Saldo_Akhir', 'Updated_At'
    ],
    [SHEET_NAMES.REKAP_BULANAN]: [
      'Bulan_Tahun', 'Total_Transaksi', 'Total_Nominal', 'Total_Admin',
      'Total_Kas_Masuk', 'Total_Kas_Keluar', 'Total_Keuntungan',
      'Saldo_Awal', 'Saldo_Akhir', 'Updated_At'
    ],
    [SHEET_NAMES.LOG_AKTIVITAS]: [
      'ID', 'User', 'Aktivitas', 'Tanggal', 'Jam', 'Metadata', 'Keterangan'
    ],
    [SHEET_NAMES.REKONSILIASI]: [
      'ID', 'Tanggal', 'Jam', 'Saldo_Sistem_Tunai', 'Saldo_Fisik_Tunai',
      'Selisih_Tunai', 'Saldo_Sistem_Rekening', 'Saldo_Fisik_Rekening',
      'Selisih_Rekening', 'Total_Selisih', 'Status', 'Petugas', 'Catatan'
    ]
  };

  // Buat sheet jika belum ada & isi header
  for (const sheetName in schemas) {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }
    const headers = schemas[sheetName];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length)
      .setBackground('#02539a')
      .setFontColor('#ffffff')
      .setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

  // Isi default user admin jika sheet USERS kosong
  const userSheet = ss.getSheetByName(SHEET_NAMES.USERS);
  if (userSheet.getLastRow() <= 1) {
    userSheet.appendRow([
      'USR-001', 'admin', 'Administrator Utama', 'ADMIN',
      hashPassword('admin123'), 'ACTIVE', new Date()
    ]);
    userSheet.appendRow([
      'USR-002', 'operator', 'Petugas Kasir BRILink', 'OPERATOR',
      hashPassword('operator123'), 'ACTIVE', new Date()
    ]);
    userSheet.appendRow([
      'USR-003', 'owner', 'Pemilik Usaha', 'OWNER',
      hashPassword('owner123'), 'ACTIVE', new Date()
    ]);
  }

  // Isi default settings
  const settingsSheet = ss.getSheetByName(SHEET_NAMES.SETTINGS);
  if (settingsSheet.getLastRow() <= 1) {
    const defaultSettings = [
      ['namaUsaha', 'ATM MINI BRILINK - BERKAH JAYA', new Date()],
      ['namaPemilik', 'Haji Ahmad Fauzi', new Date()],
      ['alamat', 'Jl. Raya Merdeka No. 88, Cibinong, Bogor', new Date()],
      ['nomorHp', '0812-8877-6655', new Date()],
      ['saldoAwalKasTunai', '15000000', new Date()],
      ['saldoAwalRekening', '45000000', new Date()],
      ['targetKeuntunganBulanan', '12000000', new Date()],
      ['defaultBiayaAdmin', '5000', new Date()],
      ['formatNomorTransaksi', 'TRX-{YYYY}{MM}{DD}-{SEQ}', new Date()]
    ];
    settingsSheet.getRange(2, 1, defaultSettings.length, 3).setValues(defaultSettings);
  }

  logActivity('SYSTEM', 'SETUP_DATABASE', 'Setup 10 sheet database berhasil dilakukan');
  SpreadsheetApp.getActiveSpreadsheet().toast('Database ATM Mini BRILink berhasil disiapkan!', 'Sukses', 5);
}

function getSheet(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    throw new Error('Sheet ' + sheetName + ' tidak ditemukan. Jalankan setupDatabase() terlebih dahulu.');
  }
  return sheet;
}

function getSheetData(sheetName) {
  const sheet = getSheet(sheetName);
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow <= 1 || lastCol === 0) return [];
  
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const rows = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  
  return rows.map(row => {
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = row[idx];
    });
    return obj;
  });
}
`
  },
  {
    name: 'Auth.gs',
    description: 'Sistem otentikasi login, hashing password aman, dan session user',
    code: `/**
 * =======================================================
 * Auth.gs - Otentikasi dan Manajemen Role User
 * =======================================================
 */

function hashPassword(plainText) {
  const rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, plainText);
  let txtHash = '';
  for (let j = 0; j < rawHash.length; j++) {
    let hashVal = rawHash[j];
    if (hashVal < 0) hashVal += 256;
    let byteString = hashVal.toString(16);
    if (byteString.length == 1) byteString = '0' + byteString;
    txtHash += byteString;
  }
  return txtHash;
}

function loginUser(username, password) {
  try {
    const users = getSheetData(SHEET_NAMES.USERS);
    const hashed = hashPassword(password);
    
    const user = users.find(u => 
      u.Username && u.Username.toString().toLowerCase() === username.toString().toLowerCase()
    );

    if (!user) {
      return { success: false, message: 'Username tidak terdaftar.' };
    }

    if (user.Status !== 'ACTIVE') {
      return { success: false, message: 'Akun dinonaktifkan. Hubungi Administrator.' };
    }

    // Support both plaintext during transition and SHA-256 hash
    if (user.Password_Hash !== hashed && user.Password_Hash !== password) {
      return { success: false, message: 'Password salah.' };
    }

    logActivity(user.Username, 'LOGIN', 'User ' + user.Username + ' berhasil login (' + user.Role + ')');

    return {
      success: true,
      user: {
        id: user.ID,
        username: user.Username,
        name: user.Nama,
        role: user.Role
      }
    };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}
`
  },
  {
    name: 'Transaction.gs',
    description: 'Pencatatan transaksi, perhitungan otomatis, dan proteksi formula injection',
    code: `/**
 * =======================================================
 * Transaction.gs - Manajemen Transaksi BRILink
 * =======================================================
 */

function getTransactions() {
  const raw = getSheetData(SHEET_NAMES.TRANSAKSI);
  return raw.map(r => ({
    id: r.ID,
    tanggal: formatDateStr(r.Tanggal),
    jam: r.Jam,
    noTransaksi: r.No_Transaksi,
    pelanggan: r.Pelanggan,
    noHp: r.No_HP ? r.No_HP.toString() : '',
    jenisTransaksi: r.Jenis_Transaksi,
    noRekeningTujuan: r.No_Rekening_Tujuan ? r.No_Rekening_Tujuan.toString() : '',
    nominal: Number(r.Nominal) || 0,
    biayaAdmin: Number(r.Biaya_Admin) || 0,
    biayaProvider: Number(r.Biaya_Provider) || 0,
    totalBayar: Number(r.Total_Bayar) || 0,
    keuntungan: Number(r.Keuntungan) || 0,
    metodePembayaran: r.Metode_Pembayaran,
    status: r.Status,
    petugas: r.Petugas,
    keterangan: r.Keterangan
  }));
}

function saveTransaction(data, operatorUser) {
  const sheet = getSheet(SHEET_NAMES.TRANSAKSI);
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    const id = data.id || 'TRX-' + Utilities.getUuid().slice(0, 8);
    const nominal = Number(data.nominal) || 0;
    const biayaAdmin = Number(data.biayaAdmin) || 0;
    const biayaProvider = Number(data.biayaProvider) || 0;
    
    // Perhitungan otomatis yang ketat tanpa dobel
    const totalBayar = nominal + biayaAdmin;
    const keuntungan = biayaAdmin - biayaProvider;

    const row = [
      sanitizeInput(id),
      data.tanggal || Utilities.formatDate(new Date(), 'GMT+7', 'yyyy-MM-dd'),
      data.jam || Utilities.formatDate(new Date(), 'GMT+7', 'HH:mm'),
      sanitizeInput(data.noTransaksi || id),
      sanitizeInput(data.pelanggan || '-'),
      sanitizeInput(data.noHp || '-'),
      data.jenisTransaksi,
      sanitizeInput(data.noRekeningTujuan || '-'),
      nominal,
      biayaAdmin,
      biayaProvider,
      totalBayar,
      keuntungan,
      data.metodePembayaran || 'Tunai',
      data.status || 'Berhasil',
      operatorUser || data.petugas || 'Kasir',
      sanitizeInput(data.keterangan || '-'),
      new Date(),
      new Date()
    ];

    sheet.appendRow(row);
    
    // Update data pelanggan jika nama diisi
    if (data.pelanggan && data.pelanggan !== '-') {
      updateCustomerStats(data.pelanggan, data.noHp, nominal);
    }

    logActivity(operatorUser, 'TAMBAH_TRANSAKSI', 'Transaksi ' + (data.noTransaksi || id) + ' nominal Rp ' + nominal);

    return { success: true, id: id, noTransaksi: data.noTransaksi };
  } finally {
    lock.releaseLock();
  }
}

function updateTransaction(data, operatorUser) {
  const sheet = getSheet(SHEET_NAMES.TRANSAKSI);
  const dataRange = sheet.getDataRange().getValues();
  
  for (let i = 1; i < dataRange.length; i++) {
    if (dataRange[i][0] === data.id || dataRange[i][3] === data.noTransaksi) {
      const nominal = Number(data.nominal) || 0;
      const biayaAdmin = Number(data.biayaAdmin) || 0;
      const biayaProvider = Number(data.biayaProvider) || 0;
      const totalBayar = nominal + biayaAdmin;
      const keuntungan = biayaAdmin - biayaProvider;

      sheet.getRange(i + 1, 5).setValue(sanitizeInput(data.pelanggan));
      sheet.getRange(i + 1, 6).setValue(sanitizeInput(data.noHp));
      sheet.getRange(i + 1, 7).setValue(data.jenisTransaksi);
      sheet.getRange(i + 1, 8).setValue(sanitizeInput(data.noRekeningTujuan));
      sheet.getRange(i + 1, 9).setValue(nominal);
      sheet.getRange(i + 1, 10).setValue(biayaAdmin);
      sheet.getRange(i + 1, 11).setValue(biayaProvider);
      sheet.getRange(i + 1, 12).setValue(totalBayar);
      sheet.getRange(i + 1, 13).setValue(keuntungan);
      sheet.getRange(i + 1, 15).setValue(data.status);
      sheet.getRange(i + 1, 17).setValue(sanitizeInput(data.keterangan));
      sheet.getRange(i + 1, 19).setValue(new Date());

      logActivity(operatorUser, 'EDIT_TRANSAKSI', 'Ubah transaksi ' + data.id);
      return { success: true };
    }
  }
  return { success: false, message: 'Transaksi tidak ditemukan' };
}

function deleteTransaction(id, operatorUser) {
  const sheet = getSheet(SHEET_NAMES.TRANSAKSI);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      sheet.deleteRow(i + 1);
      logActivity(operatorUser, 'HAPUS_TRANSAKSI', 'Hapus transaksi ID: ' + id);
      return { success: true };
    }
  }
  return { success: false, message: 'ID transaksi tidak ditemukan' };
}

function syncAllData(payload, operatorUser) {
  const result = {
    transactionsCount: 0,
    cashInCount: 0,
    cashOutCount: 0
  };

  if (payload.transactions && Array.isArray(payload.transactions)) {
    const trxSheet = getSheet(SHEET_NAMES.TRANSAKSI);
    const existingIds = new Set(trxSheet.getDataRange().getValues().slice(1).map(r => r[0]));
    
    payload.transactions.forEach(t => {
      if (!existingIds.has(t.id)) {
        saveTransaction(t, operatorUser || 'sync');
        result.transactionsCount++;
      }
    });
  }

  if (payload.cashIn && Array.isArray(payload.cashIn)) {
    payload.cashIn.forEach(c => {
      saveCashIn(c, operatorUser || 'sync');
      result.cashInCount++;
    });
  }

  if (payload.cashOut && Array.isArray(payload.cashOut)) {
    payload.cashOut.forEach(c => {
      saveCashOut(c, operatorUser || 'sync');
      result.cashOutCount++;
    });
  }

  return {
    success: true,
    message: 'Sinkronisasi selesai. Berhasil menyinkronkan data ke Google Spreadsheet.',
    details: result
  };
}
`
  },
  {
    name: 'Cashflow.gs',
    description: 'Manajemen Kas Masuk dan Kas Keluar untuk operasional agen BRILink',
    code: `/**
 * =======================================================
 * Cashflow.gs - Manajemen Arus Kas (Kas Masuk & Keluar)
 * =======================================================
 */

function getCashIn() {
  const data = getSheetData(SHEET_NAMES.KAS_MASUK);
  return data.map(r => ({
    id: r.ID,
    tanggal: formatDateStr(r.Tanggal),
    jam: r.Jam,
    sumberDana: r.Sumber_Dana,
    kategori: r.Kategori,
    nominal: Number(r.Nominal) || 0,
    keterangan: r.Keterangan,
    petugas: r.Petugas
  }));
}

function saveCashIn(payload, operatorUser) {
  const sheet = getSheet(SHEET_NAMES.KAS_MASUK);
  const id = payload.id || 'CIN-' + Utilities.getUuid().slice(0, 8);
  const nominal = Number(payload.nominal) || 0;

  sheet.appendRow([
    id,
    payload.tanggal || Utilities.formatDate(new Date(), 'GMT+7', 'yyyy-MM-dd'),
    payload.jam || Utilities.formatDate(new Date(), 'GMT+7', 'HH:mm'),
    sanitizeInput(payload.sumberDana || '-'),
    payload.kategori || 'Lainnya',
    nominal,
    sanitizeInput(payload.keterangan || '-'),
    operatorUser || payload.petugas || 'Petugas',
    new Date()
  ]);

  logActivity(operatorUser, 'KAS_MASUK', 'Kas Masuk Rp ' + nominal + ' (' + payload.kategori + ')');
  return { success: true, id: id };
}

function getCashOut() {
  const data = getSheetData(SHEET_NAMES.KAS_KELUAR);
  return data.map(r => ({
    id: r.ID,
    tanggal: formatDateStr(r.Tanggal),
    jam: r.Jam,
    kategori: r.Kategori,
    nominal: Number(r.Nominal) || 0,
    penerima: r.Penerima,
    keterangan: r.Keterangan,
    petugas: r.Petugas
  }));
}

function saveCashOut(payload, operatorUser) {
  const sheet = getSheet(SHEET_NAMES.KAS_KELUAR);
  const id = payload.id || 'COUT-' + Utilities.getUuid().slice(0, 8);
  const nominal = Number(payload.nominal) || 0;

  sheet.appendRow([
    id,
    payload.tanggal || Utilities.formatDate(new Date(), 'GMT+7', 'yyyy-MM-dd'),
    payload.jam || Utilities.formatDate(new Date(), 'GMT+7', 'HH:mm'),
    payload.kategori || 'Lainnya',
    nominal,
    sanitizeInput(payload.penerima || '-'),
    sanitizeInput(payload.keterangan || '-'),
    operatorUser || payload.petugas || 'Petugas',
    new Date()
  ]);

  logActivity(operatorUser, 'KAS_KELUAR', 'Kas Keluar Rp ' + nominal + ' (' + payload.kategori + ')');
  return { success: true, id: id };
}
`
  },
  {
    name: 'Report.gs',
    description: 'Rekap Harian, Rekap Bulanan, Laporan Keuangan, dan Mutasi Saldo',
    code: `/**
 * =======================================================
 * Report.gs - Rekap Pembukuan & Laporan Keuangan
 * =======================================================
 */

function getDailyReport(startDate, endDate) {
  const transactions = getTransactions().filter(t => t.status === 'Berhasil');
  const cashIn = getCashIn();
  const cashOut = getCashOut();

  const grouped = {};

  transactions.forEach(t => {
    const d = t.tanggal;
    if (!grouped[d]) {
      grouped[d] = {
        tanggal: d,
        jumlahTransaksi: 0,
        totalNominal: 0,
        totalBiayaAdmin: 0,
        totalKeuntungan: 0,
        totalKasMasuk: 0,
        totalKasKeluar: 0
      };
    }
    grouped[d].jumlahTransaksi += 1;
    grouped[d].totalNominal += t.nominal;
    grouped[d].totalBiayaAdmin += t.biayaAdmin;
    grouped[d].totalKeuntungan += t.keuntungan;
  });

  cashIn.forEach(c => {
    const d = c.tanggal;
    if (!grouped[d]) {
      grouped[d] = {
        tanggal: d,
        jumlahTransaksi: 0,
        totalNominal: 0,
        totalBiayaAdmin: 0,
        totalKeuntungan: 0,
        totalKasMasuk: 0,
        totalKasKeluar: 0
      };
    }
    grouped[d].totalKasMasuk += c.nominal;
  });

  cashOut.forEach(c => {
    const d = c.tanggal;
    if (!grouped[d]) {
      grouped[d] = {
        tanggal: d,
        jumlahTransaksi: 0,
        totalNominal: 0,
        totalBiayaAdmin: 0,
        totalKeuntungan: 0,
        totalKasMasuk: 0,
        totalKasKeluar: 0
      };
    }
    grouped[d].totalKasKeluar += c.nominal;
  });

  return Object.values(grouped).sort((a, b) => b.tanggal.localeCompare(a.tanggal));
}

function getMonthlyReport(year) {
  const daily = getDailyReport();
  const monthly = {};

  daily.forEach(d => {
    const monthKey = d.tanggal.substring(0, 7); // YYYY-MM
    if (!monthly[monthKey]) {
      monthly[monthKey] = {
        bulanTahun: monthKey,
        totalTransaksi: 0,
        totalNominal: 0,
        totalAdmin: 0,
        totalKasMasuk: 0,
        totalKasKeluar: 0,
        totalKeuntungan: 0
      };
    }
    monthly[monthKey].totalTransaksi += d.jumlahTransaksi;
    monthly[monthKey].totalNominal += d.totalNominal;
    monthly[monthKey].totalAdmin += d.totalBiayaAdmin;
    monthly[monthKey].totalKasMasuk += d.totalKasMasuk;
    monthly[monthKey].totalKasKeluar += d.totalKasKeluar;
    monthly[monthKey].totalKeuntungan += d.totalKeuntungan;
  });

  return Object.values(monthly).sort((a, b) => b.bulanTahun.localeCompare(a.bulanTahun));
}

function getBalance() {
  const settings = getSettings();
  const saldoAwalKas = Number(settings.saldoAwalKasTunai) || 15000000;
  const saldoAwalRekening = Number(settings.saldoAwalRekening) || 45000000;

  const transactions = getTransactions().filter(t => t.status === 'Berhasil');
  const cashIn = getCashIn();
  const cashOut = getCashOut();

  let kasTunai = saldoAwalKas;
  let rekeningBRILink = saldoAwalRekening;

  // Mutasi Tarik Tunai: Uang kas keluar ke pelanggan, Rekening agen bertambah dari BRI
  // Mutasi Setor Tunai/Transfer: Uang kas masuk dari pelanggan, Rekening agen berkurang
  transactions.forEach(t => {
    if (t.jenisTransaksi === 'Tarik Tunai') {
      kasTunai -= t.nominal; // uang fisik diberikan ke pelanggan
      rekeningBRILink += (t.nominal + t.keuntungan); // BRI mengkredit ke rekening agen
      kasTunai += t.biayaAdmin; // admin diterima tunai
    } else {
      kasTunai += (t.nominal + t.biayaAdmin); // pelanggan serahkan uang fisik
      rekeningBRILink -= (t.nominal + t.biayaProvider); // rekening terdebit
    }
  });

  cashIn.forEach(c => {
    kasTunai += c.nominal;
  });

  cashOut.forEach(c => {
    kasTunai -= c.nominal;
  });

  return {
    kasTunai: kasTunai,
    rekeningBRILink: rekeningBRILink,
    saldoLayanan: 0,
    saldoLainnya: 0,
    totalSaldo: kasTunai + rekeningBRILink,
    updatedAt: new Date()
  };
}
`
  },
  {
    name: 'Dashboard.gs',
    description: 'Data statistik realtime, perbandingan grafik, dan filter dashboard',
    code: `/**
 * =======================================================
 * Dashboard.gs - Agregasi Data Statistik Dashboard
 * =======================================================
 */

function getDashboard(filterType) {
  const transactions = getTransactions();
  const balance = getBalance();
  const cashIn = getCashIn();
  const cashOut = getCashOut();

  const todayStr = Utilities.formatDate(new Date(), 'GMT+7', 'yyyy-MM-dd');
  const thisMonthStr = todayStr.substring(0, 7);

  const trxToday = transactions.filter(t => t.tanggal === todayStr);
  const trxMonth = transactions.filter(t => t.tanggal && t.tanggal.startsWith(thisMonthStr));

  const totalTrxToday = trxToday.length;
  const totalTrxMonth = trxMonth.length;

  const successTrx = transactions.filter(t => t.status === 'Berhasil');
  const pendingTrx = transactions.filter(t => t.status === 'Pending').length;
  const cancelTrx = transactions.filter(t => t.status === 'Dibatalkan' || t.status === 'Gagal').length;

  const totalPemasukan = successTrx.reduce((acc, t) => acc + t.totalBayar, 0) +
    cashIn.reduce((acc, c) => acc + c.nominal, 0);

  const totalPengeluaran = successTrx.reduce((acc, t) => acc + t.modalTransaksi, 0) +
    cashOut.reduce((acc, c) => acc + c.nominal, 0);

  const totalBiayaAdmin = successTrx.reduce((acc, t) => acc + t.biayaAdmin, 0);
  const totalKeuntungan = successTrx.reduce((acc, t) => acc + t.keuntungan, 0);

  return {
    saldoKasTunai: balance.kasTunai,
    saldoRekeningBRILink: balance.rekeningBRILink,
    totalSaldo: balance.totalSaldo,
    totalTransaksiHariIni: totalTrxToday,
    totalTransaksiBulanIni: totalTrxMonth,
    totalPemasukan: totalPemasukan,
    totalPengeluaran: totalPengeluaran,
    totalBiayaAdmin: totalBiayaAdmin,
    totalKeuntungan: totalKeuntungan,
    jumlahSukses: successTrx.length,
    jumlahPending: pendingTrx,
    jumlahDibatalkan: cancelTrx,
    todayDate: todayStr
  };
}
`
  },
  {
    name: 'Backup.gs',
    description: 'Pencadangan spreadsheet otomatis dan trigger berkala',
    code: `/**
 * =======================================================
 * Backup.gs - Backup Data Otomatis & Manual
 * =======================================================
 */

function createBackup(user) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const folder = DriveApp.getFileById(ss.getId()).getParents().next();
  const timestamp = Utilities.formatDate(new Date(), 'GMT+7', 'yyyyMMdd_HHmmss');
  const backupName = 'BACKUP_' + ss.getName() + '_' + timestamp;

  const copy = DriveApp.getFileById(ss.getId()).makeCopy(backupName, folder);

  logActivity(user || 'ADMIN', 'BACKUP', 'Backup berhasil dibuat: ' + backupName);

  return {
    success: true,
    backupFileId: copy.getId(),
    backupUrl: copy.getUrl(),
    backupName: backupName,
    timestamp: timestamp
  };
}

function triggerManualBackup() {
  const res = createBackup('ADMIN');
  SpreadsheetApp.getUi().alert('Backup Berhasil! File tersimpan di Google Drive dengan nama: ' + res.backupName);
}
`
  },
  {
    name: 'Utils.gs',
    description: 'Audit log, sanitasi formula injection, format tanggal dan customer updater',
    code: `/**
 * =======================================================
 * Utils.gs - Log Aktivitas & Utilitas Keamanan
 * =======================================================
 */

function sanitizeInput(val) {
  if (typeof val !== 'string') return val;
  // Proteksi formula injection pada spreadsheet (=, +, -, @)
  if (/^[=+\-@]/.test(val)) {
    return "'" + val;
  }
  return val;
}

function formatDateStr(cellVal) {
  if (!cellVal) return '';
  if (cellVal instanceof Date) {
    return Utilities.formatDate(cellVal, 'GMT+7', 'yyyy-MM-dd');
  }
  return cellVal.toString();
}

function logActivity(user, aktivitas, keterangan) {
  try {
    const sheet = getSheet(SHEET_NAMES.LOG_AKTIVITAS);
    const id = 'LOG-' + Utilities.getUuid().slice(0, 6);
    const now = new Date();
    sheet.appendRow([
      id,
      user || 'system',
      aktivitas,
      Utilities.formatDate(now, 'GMT+7', 'yyyy-MM-dd'),
      Utilities.formatDate(now, 'GMT+7', 'HH:mm:ss'),
      'AppsScript/Cloud',
      sanitizeInput(keterangan)
    ]);
  } catch (e) {
    console.error('Error logging:', e);
  }
}

function getAuditLogs() {
  const data = getSheetData(SHEET_NAMES.LOG_AKTIVITAS);
  return data.slice(-100).reverse().map(r => ({
    id: r.ID,
    user: r.User,
    aktivitas: r.Aktivitas,
    tanggal: formatDateStr(r.Tanggal),
    jam: r.Jam,
    metadata: r.Metadata,
    keterangan: r.Keterangan
  }));
}

function getSettings() {
  const data = getSheetData(SHEET_NAMES.SETTINGS);
  const settings = {};
  data.forEach(r => {
    settings[r.Key] = r.Value;
  });
  return settings;
}

function saveSettings(settingsObj, user) {
  const sheet = getSheet(SHEET_NAMES.SETTINGS);
  sheet.clearContents();
  sheet.getRange(1, 1, 1, 3).setValues([['Key', 'Value', 'Updated_At']]);

  const rows = [];
  for (const key in settingsObj) {
    rows.push([key, settingsObj[key], new Date()]);
  }

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, 3).setValues(rows);
  }

  logActivity(user, 'PERUBAHAN_SETTING', 'Pengaturan usaha diperbarui');
  return { success: true };
}

function getCustomers() {
  const data = getSheetData(SHEET_NAMES.PELANGGAN);
  return data.map(r => ({
    id: r.ID,
    nama: r.Nama,
    noHp: r.No_HP ? r.No_HP.toString() : '',
    alamat: r.Alamat,
    totalTransaksi: Number(r.Total_Transaksi) || 0,
    totalNominal: Number(r.Total_Nominal) || 0,
    transaksiTerakhir: formatDateStr(r.Transaksi_Terakhir),
    catatan: r.Catatan
  }));
}

function saveCustomer(payload, user) {
  const sheet = getSheet(SHEET_NAMES.PELANGGAN);
  const id = payload.id || 'CUST-' + Utilities.getUuid().slice(0, 6);
  sheet.appendRow([
    id,
    sanitizeInput(payload.nama),
    sanitizeInput(payload.noHp),
    sanitizeInput(payload.alamat || '-'),
    Number(payload.totalTransaksi) || 0,
    Number(payload.totalNominal) || 0,
    payload.transaksiTerakhir || Utilities.formatDate(new Date(), 'GMT+7', 'yyyy-MM-dd'),
    sanitizeInput(payload.catatan || '-'),
    new Date()
  ]);
  logActivity(user, 'TAMBAH_PELANGGAN', 'Tambah pelanggan: ' + payload.nama);
  return { success: true, id: id };
}

function updateCustomerStats(nama, noHp, nominal) {
  try {
    const sheet = getSheet(SHEET_NAMES.PELANGGAN);
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][1] && data[i][1].toString().toLowerCase() === nama.toString().toLowerCase()) {
        const curTrx = Number(data[i][4]) || 0;
        const curNom = Number(data[i][5]) || 0;
        sheet.getRange(i + 1, 5).setValue(curTrx + 1);
        sheet.getRange(i + 1, 6).setValue(curNom + nominal);
        sheet.getRange(i + 1, 7).setValue(Utilities.formatDate(new Date(), 'GMT+7', 'yyyy-MM-dd'));
        sheet.getRange(i + 1, 9).setValue(new Date());
        return;
      }
    }
    // Jika pelanggan baru, auto buat
    saveCustomer({
      nama: nama,
      noHp: noHp,
      alamat: '-',
      totalTransaksi: 1,
      totalNominal: nominal,
      transaksiTerakhir: Utilities.formatDate(new Date(), 'GMT+7', 'yyyy-MM-dd'),
      catatan: 'Pelanggan otomatis dibuat dari transaksi'
    }, 'SYSTEM');
  } catch (e) {
    console.error('Error updateCustomerStats:', e);
  }
}
`
  }
];
