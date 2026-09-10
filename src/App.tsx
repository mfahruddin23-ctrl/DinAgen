import React, { useState, useEffect } from 'react';
import {
  User,
  Transaction,
  CashIn,
  CashOut,
  CashMutation,
  CashReconciliation,
  DailyClosing,
  Customer,
  BusinessSettings,
  BalanceSummary,
  AuditLog,
  TransactionType
} from './types';
import { StorageService } from './services/storage';
import { AppsScriptSyncService } from './services/appsScriptSync';
import { Navbar } from './components/Navbar';
import { Sidebar, NavTab } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { DashboardView } from './components/DashboardView';
import { TransactionView } from './components/TransactionView';
import { TransactionModal } from './components/TransactionModal';
import { ReceiptModal } from './components/ReceiptModal';
import { CashflowView } from './components/CashflowView';
import { ReconciliationView } from './components/ReconciliationView';
import { CashSettingsView } from './components/CashSettingsView';
import { ReportView } from './components/ReportView';
import { CustomersView } from './components/CustomersView';
import { AuditLogView } from './components/AuditLogView';
import { SettingsView } from './components/SettingsView';
import { BackupView } from './components/BackupView';
import { AppsScriptView } from './components/AppsScriptView';
import { Login } from './components/Login';
import { Toast } from './components/Toast';

export default function App() {
  // Authentication state
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    return StorageService.getCurrentUser();
  });

  // Dark Mode state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('ATM_BRILINK_DARK_MODE') === 'true';
  });

  // Current Active Tab
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');

  // Core Data States loaded from StorageService
  const [transactions, setTransactions] = useState<Transaction[]>(() => StorageService.getTransactions());
  const [cashInList, setCashInList] = useState<CashIn[]>(() => StorageService.getCashIn());
  const [cashOutList, setCashOutList] = useState<CashOut[]>(() => StorageService.getCashOut());
  const [mutations, setMutations] = useState<CashMutation[]>(() => StorageService.getMutations());
  const [reconciliations, setReconciliations] = useState<CashReconciliation[]>(() => StorageService.getReconciliations());
  const [dailyClosings, setDailyClosings] = useState<DailyClosing[]>(() => StorageService.getDailyClosings());
  const [customers, setCustomers] = useState<Customer[]>(() => StorageService.getCustomers());
  const [settings, setSettings] = useState<BusinessSettings>(() => StorageService.getSettings());
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => StorageService.getAuditLogs());
  const [allUsers, setAllUsers] = useState<User[]>(() => StorageService.getUsers());
  const [balance, setBalance] = useState<BalanceSummary>(() => StorageService.getBalanceSummary());

  // Modal & Toast states
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [presetTransactionType, setPresetTransactionType] = useState<TransactionType | undefined>(undefined);
  const [receiptModalTransaction, setReceiptModalTransaction] = useState<Transaction | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Sync Dark Mode class to <html> element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('ATM_BRILINK_DARK_MODE', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('ATM_BRILINK_DARK_MODE', 'false');
    }
  }, [darkMode]);

  // Sync balance whenever transactions or cash movements update
  const refreshAppData = () => {
    setTransactions(StorageService.getTransactions());
    setCashInList(StorageService.getCashIn());
    setCashOutList(StorageService.getCashOut());
    setMutations(StorageService.getMutations());
    setReconciliations(StorageService.getReconciliations());
    setDailyClosings(StorageService.getDailyClosings());
    setCustomers(StorageService.getCustomers());
    setSettings(StorageService.getSettings());
    setAuditLogs(StorageService.getAuditLogs());
    setAllUsers(StorageService.getUsers());
    setBalance(StorageService.getBalanceSummary());
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  // Auth Handlers
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    StorageService.setCurrentUser(user);
    refreshAppData();
    showToast(`Selamat datang, ${user.name} (${user.role})!`);
  };

  const handleLogout = () => {
    StorageService.logoutUser();
    setCurrentUser(null);
    showToast('Anda telah berhasil keluar dari sistem.', 'info');
  };

  const handleSwitchUser = (user: User) => {
    setCurrentUser(user);
    StorageService.setCurrentUser(user);
    showToast(`Beralih akun ke: ${user.name} (${user.role})`);
  };

  // Transaction Handlers
  const handleOpenNewTransaction = (preset?: TransactionType) => {
    setEditingTransaction(null);
    setPresetTransactionType(preset);
    setIsTransactionModalOpen(true);
  };

  const handleOpenEditTransaction = (trx: Transaction) => {
    setEditingTransaction(trx);
    setIsTransactionModalOpen(true);
  };

  const handleSaveTransaction = (trx: Transaction) => {
    const operator = currentUser?.name || currentUser?.username || 'Kasir';
    if (editingTransaction) {
      StorageService.updateTransaction(trx, operator);
      showToast(`Transaksi ${trx.noTransaksi} berhasil diperbarui.`);
      // Realtime push to Google Spreadsheet
      AppsScriptSyncService.syncUpdateTransaction(trx, operator).then(res => {
        if (res.success && AppsScriptSyncService.getEndpointUrl()) {
          showToast(`⚡ Transaksi ${trx.noTransaksi} terkirim ke Google Spreadsheet!`, 'success');
        }
      });
    } else {
      StorageService.addTransaction(trx, operator);
      showToast(`Transaksi ${trx.noTransaksi} berhasil dicatat.`);
      // Realtime push to Google Spreadsheet
      AppsScriptSyncService.syncTransaction(trx, operator).then(res => {
        if (res.success && AppsScriptSyncService.getEndpointUrl()) {
          showToast(`⚡ Transaksi ${trx.noTransaksi} otomatis masuk ke Google Spreadsheet!`, 'success');
        }
      });
    }
    refreshAppData();
  };

  const handleDeleteTransaction = (id: string) => {
    const operator = currentUser?.username || 'Kasir';
    StorageService.deleteTransaction(id, operator);
    AppsScriptSyncService.syncDeleteTransaction(id, operator);
    refreshAppData();
    showToast('Transaksi telah berhasil dihapus.', 'info');
  };

  // Cashflow Handlers
  const handleAddCashIn = (item: CashIn) => {
    const operator = currentUser?.username || 'Kasir';
    StorageService.addCashIn(item, operator);
    AppsScriptSyncService.syncCashIn(item, operator);
    refreshAppData();
    showToast(`Kas masuk sebesar Rp ${item.nominal.toLocaleString('id-ID')} berhasil dicatat.`);
  };

  const handleDeleteCashIn = (id: string) => {
    StorageService.deleteCashIn(id, currentUser?.username || 'Kasir');
    refreshAppData();
    showToast('Catatan kas masuk dihapus.', 'info');
  };

  const handleAddCashOut = (item: CashOut) => {
    const operator = currentUser?.username || 'Kasir';
    StorageService.addCashOut(item, operator);
    AppsScriptSyncService.syncCashOut(item, operator);
    refreshAppData();
    showToast(`Kas keluar sebesar Rp ${item.nominal.toLocaleString('id-ID')} berhasil dicatat.`);
  };

  const handleDeleteCashOut = (id: string) => {
    StorageService.deleteCashOut(id, currentUser?.username || 'Kasir');
    refreshAppData();
    showToast('Catatan kas keluar dihapus.', 'info');
  };

  const handleAddMutation = (item: CashMutation) => {
    StorageService.addMutation(item);
    refreshAppData();
    showToast(`Mutasi saldo ${item.jenisMutasi} berhasil dieksekusi.`);
  };

  // Reconciliation & Closing Handlers
  const handleSaveReconciliation = (rec: CashReconciliation) => {
    const operator = currentUser?.username || 'Kasir';
    StorageService.addReconciliation(rec, operator);
    AppsScriptSyncService.syncReconciliation(rec, operator);
    refreshAppData();
    showToast('Hasil rekonsiliasi kas fisik berhasil disimpan.');
  };

  const handleSaveDailyClosing = (closing: DailyClosing) => {
    StorageService.saveDailyClosing(closing);
    refreshAppData();
    showToast(`Tutup buku harian tanggal ${closing.tanggal} berhasil disimpan!`);
  };

  // Customer Handlers
  const handleAddCustomer = (c: Customer) => {
    StorageService.addCustomer(c);
    refreshAppData();
    showToast(`Pelanggan ${c.nama} berhasil ditambahkan.`);
  };

  const handleUpdateCustomer = (c: Customer) => {
    StorageService.updateCustomer(c);
    refreshAppData();
    showToast(`Data pelanggan ${c.nama} diperbarui.`);
  };

  const handleDeleteCustomer = (id: string) => {
    StorageService.deleteCustomer(id);
    refreshAppData();
    showToast('Data pelanggan telah dihapus.', 'info');
  };

  // Settings Handler
  const handleSaveSettings = (newSettings: BusinessSettings) => {
    const url = (newSettings.gasWebAppUrl || newSettings.googleAppsScriptUrl || '').trim();
    const updated = {
      ...newSettings,
      gasWebAppUrl: url,
      googleAppsScriptUrl: url
    };
    StorageService.saveSettings(updated, currentUser?.username || 'admin');
    AppsScriptSyncService.setConfiguration(updated.googleSpreadsheetId, url);
    refreshAppData();
    showToast('Pengaturan profil usaha & Google Spreadsheet berhasil disimpan.');
  };

  // If not logged in, render Login Screen
  if (!currentUser) {
    return <Login onLoginSuccess={handleLoginSuccess} allUsers={allUsers} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-150">
      {/* Navbar Header */}
      <Navbar
        currentUser={currentUser}
        settings={settings}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onLogout={handleLogout}
        onSwitchUser={handleSwitchUser}
        allUsers={allUsers}
        onOpenAppsScriptModal={() => setCurrentTab('apps-script')}
        onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
      />

      {/* Main Body Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex">
        {/* Sidebar Navigation (Desktop & Mobile Drawer) */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          userRole={currentUser.role}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          onQuickNewTransaction={() => handleOpenNewTransaction()}
        />

        {/* Dynamic Content Views */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-12 min-w-0 overflow-x-hidden">
          {currentTab === 'dashboard' && (
            <DashboardView
              transactions={transactions}
              cashIn={cashInList}
              cashOut={cashOutList}
              balance={balance}
              settings={settings}
              onNewTransaction={handleOpenNewTransaction}
              onViewAllTransactions={() => setCurrentTab('transaksi')}
              onPrintReceipt={setReceiptModalTransaction}
              onSelectTab={setCurrentTab}
            />
          )}

          {currentTab === 'transaksi' && (
            <TransactionView
              transactions={transactions}
              userRole={currentUser.role}
              settings={settings}
              currentUser={currentUser}
              onNewTransaction={() => handleOpenNewTransaction()}
              onEditTransaction={handleOpenEditTransaction}
              onDeleteTransaction={handleDeleteTransaction}
              onPrintReceipt={setReceiptModalTransaction}
            />
          )}

          {currentTab === 'kas-masuk' && (
            <CashflowView
              type="in"
              cashInList={cashInList}
              cashOutList={cashOutList}
              mutationsList={mutations}
              balance={balance}
              currentUser={currentUser}
              onAddCashIn={handleAddCashIn}
              onDeleteCashIn={handleDeleteCashIn}
              onAddCashOut={handleAddCashOut}
              onDeleteCashOut={handleDeleteCashOut}
              onAddMutation={handleAddMutation}
              onSelectTab={setCurrentTab}
            />
          )}

          {currentTab === 'kas-keluar' && (
            <CashflowView
              type="out"
              cashInList={cashInList}
              cashOutList={cashOutList}
              mutationsList={mutations}
              balance={balance}
              currentUser={currentUser}
              onAddCashIn={handleAddCashIn}
              onDeleteCashIn={handleDeleteCashIn}
              onAddCashOut={handleAddCashOut}
              onDeleteCashOut={handleDeleteCashOut}
              onAddMutation={handleAddMutation}
              onSelectTab={setCurrentTab}
            />
          )}

          {currentTab === 'mutasi-saldo' && (
            <CashflowView
              type="mutation"
              cashInList={cashInList}
              cashOutList={cashOutList}
              mutationsList={mutations}
              balance={balance}
              currentUser={currentUser}
              onAddCashIn={handleAddCashIn}
              onDeleteCashIn={handleDeleteCashIn}
              onAddCashOut={handleAddCashOut}
              onDeleteCashOut={handleDeleteCashOut}
              onAddMutation={handleAddMutation}
              onSelectTab={setCurrentTab}
            />
          )}

          {currentTab === 'rekonsiliasi' && (
            <ReconciliationView
              balance={balance}
              reconciliationHistory={reconciliations}
              currentUser={currentUser}
              settings={settings}
              onSaveReconciliation={handleSaveReconciliation}
            />
          )}

          {currentTab === 'pengaturan-kas' && (
            <CashSettingsView
              settings={settings}
              balance={balance}
              userRole={currentUser?.role || 'KASIR'}
              currentUsername={currentUser?.username || 'Kasir'}
              onSaveSettings={handleSaveSettings}
              onDataMutated={refreshAppData}
              onSelectTab={setCurrentTab}
            />
          )}

          {currentTab === 'rekap-harian' && (
            <ReportView
              mode="harian"
              transactions={transactions}
              cashInList={cashInList}
              cashOutList={cashOutList}
              dailyClosings={dailyClosings}
              balance={balance}
              settings={settings}
              currentUser={currentUser}
              onSaveDailyClosing={handleSaveDailyClosing}
            />
          )}

          {currentTab === 'rekap-bulanan' && (
            <ReportView
              mode="bulanan"
              transactions={transactions}
              cashInList={cashInList}
              cashOutList={cashOutList}
              dailyClosings={dailyClosings}
              balance={balance}
              settings={settings}
              currentUser={currentUser}
              onSaveDailyClosing={handleSaveDailyClosing}
            />
          )}

          {currentTab === 'laporan' && (
            <ReportView
              mode="laporan"
              transactions={transactions}
              cashInList={cashInList}
              cashOutList={cashOutList}
              dailyClosings={dailyClosings}
              balance={balance}
              settings={settings}
              currentUser={currentUser}
              onSaveDailyClosing={handleSaveDailyClosing}
            />
          )}

          {currentTab === 'pelanggan' && (
            <CustomersView
              customers={customers}
              transactions={transactions}
              onAddCustomer={handleAddCustomer}
              onUpdateCustomer={handleUpdateCustomer}
              onDeleteCustomer={handleDeleteCustomer}
            />
          )}

          {currentTab === 'apps-script' && <AppsScriptView />}

          {currentTab === 'audit-log' && <AuditLogView logs={auditLogs} />}

          {currentTab === 'settings' && (
            <SettingsView
              settings={settings}
              onSaveSettings={handleSaveSettings}
              onOpenAppsScriptCodeModal={() => setCurrentTab('apps-script')}
              onSelectTab={setCurrentTab}
            />
          )}

          {currentTab === 'backup' && <BackupView onDataRestored={refreshAppData} />}
        </main>
      </div>

      {/* Bottom Navigation for Mobile Devices */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onQuickNewTransaction={() => handleOpenNewTransaction()}
        onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
      />

      {/* Modal Input Transaksi */}
      <TransactionModal
        isOpen={isTransactionModalOpen}
        initialData={
          editingTransaction ||
          (presetTransactionType
            ? { jenisTransaksi: presetTransactionType } as Transaction
            : null)
        }
        settings={settings}
        currentUser={currentUser}
        customers={customers}
        totalTransactionCount={transactions.length}
        onClose={() => setIsTransactionModalOpen(false)}
        onSave={handleSaveTransaction}
        onShowReceipt={setReceiptModalTransaction}
      />

      {/* Modal Cetak Struk Thermal */}
      {receiptModalTransaction && (
        <ReceiptModal
          transaction={receiptModalTransaction}
          settings={settings}
          onClose={() => setReceiptModalTransaction(null)}
        />
      )}

      {/* System Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
